import { base64ToFile } from "@/lib/file-b64";
import { BlobServiceClient, BlockBlobClient } from "@azure/storage-blob";

// Configuration constants
const CONNECTION_STRING = process.env.AZURE_STORAGE_ACCOUNT_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || "input";

// Input validation
interface UploadRequest {
	fileAsBase64: string;
	fileName: string;
	fileType: string;
	runID: string;
}

function validateUploadRequest(body: UploadRequest): body is UploadRequest {
	return (
		typeof body.fileAsBase64 === "string" &&
		typeof body.fileName === "string" &&
		typeof body.fileType === "string" &&
		typeof body.runID === "string" &&
		body.fileAsBase64.length > 0 &&
		body.fileName.length > 0 &&
		body.fileType.length > 0 &&
		body.runID.length > 0
	);
}

// Helper functions
function createBlobName(fileName: string, runID: string): string {
	const fileExtension = fileName.split(".").pop() || "bin";
	return `${runID}/input-file.${fileExtension}`;
}

function createBlobServiceClient(): BlobServiceClient {
	if (!CONNECTION_STRING) {
		throw new Error("Azure Storage connection string not configured");
	}
	return BlobServiceClient.fromConnectionString(CONNECTION_STRING);
}

async function uploadFileToBlob(
	blockBlobClient: BlockBlobClient,
	arrayBuffer: ArrayBuffer,
	contentType: string
) {
	return await blockBlobClient.uploadData(arrayBuffer, {
		blobHTTPHeaders: {
			blobContentType: contentType,
		},
	});
}

export async function POST(request: Request) {
	try {
		// Parse and validate request body
		const body = await request.json();

		if (!validateUploadRequest(body)) {
			return new Response(
				JSON.stringify({
					error: "Invalid request body",
					details:
						"Missing or invalid required fields: fileAsBase64, fileName, fileType, runID",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		// Convert base64 to file
		const file = await base64ToFile(
			body.fileAsBase64,
			body.fileName,
			body.fileType
		);

		// Convert file to ArrayBuffer
		const arrayBuffer = await file.arrayBuffer();

		// Initialize Azure Blob Storage client
		const blobServiceClient = createBlobServiceClient();
		const containerClient =
			blobServiceClient.getContainerClient(CONTAINER_NAME);

		// Create blob name and client
		const blobName = createBlobName(body.fileName, body.runID);
		const blockBlobClient = containerClient.getBlockBlobClient(blobName);

		// Upload file
		const uploadResult = await uploadFileToBlob(
			blockBlobClient,
			arrayBuffer,
			body.fileType
		);

		// Return success response
		return new Response(
			JSON.stringify({
				message: "File uploaded successfully",
				blobName,
				url: blockBlobClient.url,
				etag: uploadResult.etag,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Error uploading file:", error);

		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		const statusCode =
			error instanceof Error &&
			error.message.includes("connection string")
				? 500
				: 500;

		return new Response(
			JSON.stringify({
				error: "Failed to upload file",
				details: errorMessage,
			}),
			{
				status: statusCode,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
}
