import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "ast-auth-token";
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;

function verifyAuthToken(token: string): boolean {
	try {
		const decoded = Buffer.from(token, "base64").toString();
		const [timestamp, password] = decoded.split(":");

		if (!timestamp || !password) return false;

		// Check if token is not expired (24 hours)
		const tokenAge = Date.now() - parseInt(timestamp);
		const maxAge = 24 * 60 * 60 * 1000; // 24 hours

		if (tokenAge > maxAge) return false;

		return password === AUTH_PASSWORD;
	} catch {
		return false;
	}
}

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Allow access to the login page and static assets
	if (
		pathname === "/" ||
		pathname.startsWith("/_next") ||
		pathname.startsWith("/api")
	) {
		return NextResponse.next();
	}

	// Check for authentication token
	const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

	if (!authToken || !verifyAuthToken(authToken)) {
		// Redirect to login page if not authenticated
		return NextResponse.redirect(new URL("/", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
};
