"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ password }),
			});

			const data = await response.json();

			if (response.ok) {
				router.push("/dashboard");
			} else {
				setError(data.error || "Authentication failed");
			}
		} catch {
			setError("An error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<div className="flex items-center justify-center space-x-2 mb-4">
						<Image
							src="/branding/logos/logo-dark.png"
							alt="Wireframe Logo"
							width={48}
							height={48}
						/>
						<h1 className="text-5xl font-bold text-foreground">
							AST Run Portal
						</h1>
					</div>
					<p className="text-muted-foreground">
						Internal Novelty Hill IP Tool For Creating And Managing
						AST Runs
					</p>
				</div>

				<Card>
					<CardHeader className="text-center">
						<CardTitle className="mb-1">Sign In</CardTitle>
						<CardDescription>
							Enter password to continue
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									placeholder="Enter your password"
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									required
									disabled={isLoading}
								/>
							</div>
							{error && (
								<div className="text-sm text-red-500 text-center">
									{error}
								</div>
							)}
							<Button
								type="submit"
								className="w-full"
								disabled={isLoading}
							>
								{isLoading ? "Signing In..." : "Sign In"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
