"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fileToBase64 } from "@/lib/file-b64";
import { ExcelData } from "@/types/run-data";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as XLSX from "xlsx";
import * as z from "zod";

// Constants
const ALLOWED_FILE_TYPES = [
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.ms-excel",
	".xlsx",
	".xls",
] as const;

const REQUIRED_SHEETS = ["lots", "patents"] as const;

// Schema
const formSchema = z.object({
	runName: z.string().min(1, "Run name is required"),
	client: z.string().optional(),
	description: z.string().optional(),
	file: z.instanceof(File, { message: "Please select a file" }).refine(
		(file) => {
			return ALLOWED_FILE_TYPES.some(
				(type) =>
					file.type === type ||
					file.name.toLowerCase().endsWith(type.replace(".", ""))
			);
		},
		{ message: "Please select an Excel file (.xlsx or .xls)" }
	),
});

type FormData = z.infer<typeof formSchema>;

// Excel parsing utilities
const parseExcelFile = async (file: File): Promise<ExcelData> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const data = new Uint8Array(e.target?.result as ArrayBuffer);
				const workbook = XLSX.read(data, { type: "array" });

				// Validate required sheets
				for (const sheetName of REQUIRED_SHEETS) {
					if (!workbook.Sheets[sheetName]) {
						throw new Error(
							`Excel file must contain a "${sheetName}" sheet`
						);
					}
				}

				// Parse lots sheet
				const lotsSheet = workbook.Sheets["lots"];
				const lotsData = XLSX.utils.sheet_to_json(lotsSheet);
				const lotsHeaders = Object.keys(lotsData[0] || {});
				const lotsCount = lotsData.length;

				// Parse patents sheet
				const patentsSheet = workbook.Sheets["patents"];
				const patentsData = XLSX.utils.sheet_to_json(patentsSheet);
				const patentsHeaders = Object.keys(patentsData[0] || {});
				const patentsCount = patentsData.length;

				resolve({
					lotsHeaders,
					patentsHeaders,
					lotsCount,
					patentsCount,
				});
			} catch (error) {
				reject(error);
			}
		};

		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsArrayBuffer(file);
	});
};

// Component
export default function NewRunPage() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [fileError, setFileError] = useState<string | null>(null);

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			runName: "",
			client: "",
			description: "",
		},
	});

	const formatFileSize = (bytes: number): string => {
		return (bytes / 1024 / 1024).toFixed(2);
	};

	const handleCancel = () => {
		router.replace("/dashboard");
	};

	const onSubmit = async (data: FormData) => {
		setIsSubmitting(true);
		setFileError(null);

		try {
			const parsedData = await parseExcelFile(data.file);

			const runData = {
				runID: crypto.randomUUID(),
				runName: data.runName,
				client: data.client,
				description: data.description,
				fileName: data.file.name,
				fileSize: data.file.size,
				excelData: parsedData,
				fileType: data.file.type,
				fileAsBase64: await fileToBase64(data.file),
			};

			sessionStorage.setItem("newRunData", JSON.stringify(runData));
			router.push("/new-run/review");
		} catch (error) {
			console.error("Error submitting form:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Unknown error occurred while processing the file";
			setFileError(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="container mx-auto py-8 max-w-2xl">
			<Card>
				<CardHeader>
					<CardTitle>Create New AST Run</CardTitle>
					<CardDescription>
						Fill in the details below to create a new AST run.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-6"
						>
							<FormField
								control={form.control}
								name="runName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Run Name *</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter run name"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											A unique name to identify this AST
											run.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="client"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Client</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter client name (optional)"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											The client this run is for
											(optional).
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Enter description (optional)"
												className="min-h-[100px]"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Additional details about this AST
											run (optional).
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="file"
								render={({
									field: { onChange, value, ...field },
								}) => (
									<FormItem>
										<FormLabel>File *</FormLabel>
										<FormControl>
											<div className="space-y-2">
												<Input
													type="file"
													accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
													onChange={(e) => {
														const file =
															e.target.files?.[0];
														onChange(file);
														setFileError(null);
													}}
													{...field}
												/>
												{value && (
													<div className="text-sm text-muted-foreground">
														Selected: {value.name} (
														{formatFileSize(
															value.size
														)}{" "}
														MB)
													</div>
												)}
											</div>
										</FormControl>
										<FormDescription>
											Upload an Excel file (.xlsx or .xls)
											with "lots" and "patents" sheets
											containing the required schema.
										</FormDescription>
										<FormMessage />
										{fileError && (
											<div className="text-sm font-medium text-destructive">
												{fileError}
											</div>
										)}
									</FormItem>
								)}
							/>

							<div className="flex justify-end space-x-4">
								<Button
									type="button"
									variant="outline"
									onClick={handleCancel}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting
										? "Creating..."
										: "Create Run"}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
