import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	const workspaceId = process.env.FABRIC_WORKSPACE_ID;
	const notebookId = process.env.FABRIC_NOTEBOOK_ID;

	if (!workspaceId || !notebookId) {
		return NextResponse.json(
			{ error: "Workspace ID or Notebook ID is not set" },
			{ status: 500 }
		);
	}

	try {
		const accessToken = await getFabricAccessToken();

		const notebookURL = `https://api.fabric.microsoft.com/v1/workspaces/${workspaceId}/items/${notebookId}/jobs/instances?jobType=RunNotebook`;

		const body = await request.json();

		const parameters = body.params;

		const formattedParameters = Object.fromEntries(
			Object.entries(parameters).map(([key, value]) => {
				let type = "string";
				let finalValue = value;

				if (typeof value === "boolean") {
					type = "bool";
				} else if (typeof value === "number") {
					type = Number.isInteger(value) ? "int" : "float";
				} else if (typeof value === "object") {
					finalValue = JSON.stringify(value);
				} else {
					finalValue = String(value);
				}

				return [
					key,
					{
						value: finalValue,
						type,
					},
				];
			})
		);

		console.log(
			JSON.stringify({
				executionData: {
					parameters: formattedParameters,
					configuration: {
						useStarterPool: false,
					},
				},
			})
		);

		const response = await fetch(notebookURL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				executionData: {
					parameters: formattedParameters,
					configuration: {
						useStarterPool: false,
					},
				},
			}),
		});

		if (!response.ok) {
			throw new Error(
				`Fabric API request failed: ${response.status} ${response.statusText}`
			);
		}

		const location = response.headers.get("location");
		const jobInstanceId = location?.match(
			/\/jobs\/instances\/([^/]+)$/
		)?.[1];
		const jobWorkspaceId = location?.match(/\/workspaces\/([^/]+)\//)?.[1];

		if (!location || !jobInstanceId || !jobWorkspaceId) {
			throw new Error(
				"Invalid response format from Fabric API. Missing required job information."
			);
		}

		await prisma.ASTRun.create({
			data: {
				runId: parameters.runID,
				location,
				jobInstanceId,
				jobWorkspaceId,
				parameters: JSON.stringify(parameters),
			},
		});

		return NextResponse.json(await response.text());
	} catch (error) {
		console.error("Error in Fabric API call:", error);
		return NextResponse.json(
			{ error: "Failed to execute notebook" },
			{ status: 500 }
		);
	}
}

async function getFabricAccessToken(): Promise<string> {
	const clientId = process.env.AZURE_CLIENT_ID;
	const clientSecret = process.env.AZURE_CLIENT_SECRET;
	const tenantId = process.env.AZURE_TENANT_ID;

	if (!clientId || !clientSecret || !tenantId) {
		throw new Error("Missing Azure AD service principal credentials");
	}

	const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

	const params = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		scope: "https://api.fabric.microsoft.com/.default",
		grant_type: "client_credentials",
	});

	try {
		const response = await fetch(tokenEndpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: params.toString(),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Token request failed: ${response.status} ${response.statusText} - ${errorText}`
			);
		}

		const tokenData = await response.json();

		if (!tokenData.access_token) {
			throw new Error("No access token received from Azure AD");
		}

		return tokenData.access_token;
	} catch (error) {
		console.error("Error getting Fabric access token:", error);
		throw new Error("Failed to authenticate with Azure AD");
	}
}
