"use client";

import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Dashboard() {
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const router = useRouter();

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await fetch("/api/auth/logout", {
				method: "POST",
			});
			router.replace("/");
		} catch (error) {
			console.error("Logout error:", error);
		} finally {
			setIsLoggingOut(false);
		}
	};

	return (
		<div className="min-h-screen bg-background p-4">
			<div className="max-w-7xl mx-auto">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold text-foreground">
						AST Run Portal Dashboard
					</h1>
					<div className="flex gap-3">
						<Link href="/new-run">
							<Button variant="default">
								<PlusCircleIcon /> New AST Run
							</Button>
						</Link>
						<Button
							onClick={handleLogout}
							disabled={isLoggingOut}
							variant="outline"
						>
							{isLoggingOut ? "Logging Out..." : "Logout"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
