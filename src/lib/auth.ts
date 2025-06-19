import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const AUTH_COOKIE_NAME = "ast-auth-token";
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;

if (!AUTH_PASSWORD) {
	throw new Error("AUTH_PASSWORD environment variable is not set");
}

export function hashPassword(password: string): string {
	return Buffer.from(password).toString("base64");
}

export function verifyPassword(password: string): boolean {
	const hashedInput = hashPassword(password);
	const hashedExpected = hashPassword(AUTH_PASSWORD!);
	return hashedInput === hashedExpected;
}

export function createAuthToken(): string {
	const timestamp = Date.now();
	const token = Buffer.from(`${timestamp}:${AUTH_PASSWORD}`).toString(
		"base64"
	);
	return token;
}

export function verifyAuthToken(token: string): boolean {
	try {
		const decoded = Buffer.from(token, "base64").toString();
		const [timestamp, password] = decoded.split(":");

		if (!timestamp || !password) return false;

		const tokenAge = Date.now() - parseInt(timestamp);
		const maxAge = 24 * 60 * 60 * 1000;

		if (tokenAge > maxAge) return false;

		return password === AUTH_PASSWORD;
	} catch {
		return false;
	}
}

export async function getAuthToken(): Promise<string | null> {
	const cookieStore = await cookies();
	return cookieStore.get(AUTH_COOKIE_NAME)?.value || null;
}

export async function setAuthToken(token: string) {
	const cookieStore = await cookies();
	cookieStore.set(AUTH_COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 24 * 60 * 60, // 24 hours
		path: "/",
	});
}

export async function clearAuthToken() {
	const cookieStore = await cookies();
	cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function requireAuth() {
	const token = await getAuthToken();
	if (!token || !verifyAuthToken(token)) {
		redirect("/");
	}
}

export async function isAuthenticated(): Promise<boolean> {
	const token = await getAuthToken();
	return token ? verifyAuthToken(token) : false;
}
