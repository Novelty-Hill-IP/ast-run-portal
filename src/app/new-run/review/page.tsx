"use client";

import { RunDetails } from "@/components/run-details";
import { RunSummary } from "@/components/run-summary";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRunData } from "@/hooks/use-run-data";
import { createFabricRun, uploadFileToBlob } from "@/lib/run-services";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// Main Component
export default function ReviewPage() {
	const router = useRouter();
	const { runData, isLoading } = useRunData();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleConfirm = async () => {
		if (!runData) return;

		setIsSubmitting(true);

		try {
			// Remove stored data first
			sessionStorage.removeItem("newRunData");

			// Upload file to blob storage
			const blobName = await uploadFileToBlob(runData);

			// Create fabric run
			await createFabricRun(runData, blobName);

			toast.success("AST Run created successfully!");
			router.replace("/dashboard");
		} catch (error) {
			console.error("Error creating run:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "An unexpected error occurred. Please try again."
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleBack = () => {
		router.push("/new-run");
	};

	if (isLoading || !runData) {
		return (
			<div className="container mx-auto py-8 max-w-4xl">
				<Card>
					<CardContent className="pt-6">
						<div className="text-center">Loading...</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8 max-w-4xl">
			<Card>
				<CardHeader>
					<CardTitle>Review AST Run</CardTitle>
					<CardDescription>
						Please review the details below before creating your AST
						run.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid gap-4">
						{/* Run Details */}
						<RunDetails runData={runData} />

						<Separator />

						{/* Excel Analysis */}
						<RunSummary runData={runData} />
					</div>

					{/* Action Buttons */}
					<div className="flex justify-end space-x-4 pt-6">
						<Button
							type="button"
							variant="outline"
							onClick={handleBack}
							disabled={isSubmitting}
						>
							Back to Edit
						</Button>
						<Button onClick={handleConfirm} disabled={isSubmitting}>
							{isSubmitting
								? "Creating Run..."
								: "Create AST Run"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
