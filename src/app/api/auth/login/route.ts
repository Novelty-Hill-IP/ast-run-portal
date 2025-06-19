import { createAuthToken, verifyPassword } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { password } = await request.json();

		if (!password) {
			return NextResponse.json(
				{ error: "Password is required" },
				{ status: 400 }
			);
		}

		if (!verifyPassword(password)) {
			return NextResponse.json(
				{ error: "Invalid password" },
				{ status: 401 }
			);
		}

		// Create auth token and set cookie
		const token = createAuthToken();
		const response = NextResponse.json(
			{ success: true, message: "Authentication successful" },
			{ status: 200 }
		);

		// Set the auth cookie
		response.cookies.set("ast-auth-token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 24 * 60 * 60, // 24 hours
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
