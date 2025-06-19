"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RunData } from "@/types/run-data";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Types
interface SheetAnalysisProps {
	title: string;
	recordCount: number;
	headers: string[];
}

interface RunSummaryProps {
	runData: RunData;
}

interface RunDetailsProps {
	runData: RunData;
}

// Components
const SheetAnalysis = ({ title, recordCount, headers }: SheetAnalysisProps) => (
	<Card>
		<CardHeader className="pb-3">
			<CardTitle className="text-lg">{title}</CardTitle>
			<CardDescription>{recordCount} records found</CardDescription>
		</CardHeader>
		<CardContent>
			<div className="space-y-2">
				<h4 className="text-sm font-medium">
					Headers ({headers.length} columns):
				</h4>
				<div className="grid grid-cols-2 gap-1 text-xs">
					{headers.map((header, index) => (
						<div
							key={index}
							className="p-1 bg-muted rounded text-muted-foreground truncate"
						>
							{header}
						</div>
					))}
				</div>
			</div>
		</CardContent>
	</Card>
);

const RunDetails = ({ runData }: RunDetailsProps) => (
	<div className="space-y-4">
		<div className="space-y-2">
			<h3 className="text-sm font-medium text-muted-foreground">
				Run Name
			</h3>
			<p className="text-lg font-semibold">{runData.runName}</p>
		</div>

		{runData.client && (
			<div className="space-y-2">
				<h3 className="text-sm font-medium text-muted-foreground">
					Client
				</h3>
				<p className="text-base">{runData.client}</p>
			</div>
		)}

		{runData.description && (
			<div className="space-y-2">
				<h3 className="text-sm font-medium text-muted-foreground">
					Description
				</h3>
				<p className="text-base whitespace-pre-wrap">
					{runData.description}
				</p>
			</div>
		)}

		<div className="space-y-2">
			<h3 className="text-sm font-medium text-muted-foreground">File</h3>
			<div className="flex items-center space-x-2">
				<Badge variant="secondary">{runData.fileName}</Badge>
				<span className="text-sm text-muted-foreground">
					({(runData.fileSize / 1024 / 1024).toFixed(2)} MB)
				</span>
			</div>
		</div>
	</div>
);

const RunSummary = ({ runData }: RunSummaryProps) => {
	const { lotsCount, patentsCount } = runData.excelData;
	const totalCount = lotsCount + patentsCount;

	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">Excel File Analysis</h3>

			<div className="grid md:grid-cols-2 gap-6">
				<SheetAnalysis
					title="Lots Sheet"
					recordCount={lotsCount}
					headers={runData.excelData.lotsHeaders}
				/>
				<SheetAnalysis
					title="Patents Sheet"
					recordCount={patentsCount}
					headers={runData.excelData.patentsHeaders}
				/>
			</div>

			<div className="bg-muted p-4 rounded-lg">
				<div className="flex justify-between items-center">
					<div>
						<h4 className="font-medium">Total Records</h4>
						<p className="text-sm text-muted-foreground">
							{totalCount} total records across both sheets
						</p>
					</div>
					<div className="text-right">
						<div className="text-2xl font-bold">{totalCount}</div>
						<div className="text-xs text-muted-foreground">
							records
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

// Hooks
const useRunData = () => {
	const router = useRouter();
	const [runData, setRunData] = useState<RunData | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadRunData = () => {
			try {
				const storedData = sessionStorage.getItem("newRunData");

				if (!storedData) {
					throw new Error("No run data found");
				}

				const parsedData = JSON.parse(storedData);
				setRunData(parsedData);
			} catch (error) {
				console.error("Error loading run data:", error);
				toast.error("No run data found. Please start over.");
				router.push("/new-run");
			} finally {
				setIsLoading(false);
			}
		};

		loadRunData();
	}, [router]);

	return { runData, isLoading };
};

// API functions
const uploadFileToBlob = async (runData: RunData): Promise<string> => {
	const response = await fetch("/api/blob/upload-file", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(runData),
	});

	if (!response.ok) {
		throw new Error(`Error uploading file: ${response.statusText}`);
	}

	const { blobName } = await response.json();
	return blobName;
};

const createFabricRun = async (runData: RunData, blobName: string) => {
	const params = {
		runID: runData.runID,
		runName: runData.runName,
		runDescription: runData.description,
		runClient: runData.client,
		runFileSize: runData.fileSize,
		runFileType: runData.fileType,
		runBlobName: blobName,
	};

	const response = await fetch("/api/fabric/run-notebook", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ params }),
	});

	if (!response.ok) {
		throw new Error(`Error creating run: ${response.statusText}`);
	}

	return response;
};

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
