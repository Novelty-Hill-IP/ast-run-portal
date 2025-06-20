import * as z from "zod";

// Form schema for new run creation
export const createNewRunFormSchema = (allowedFileTypes: readonly string[]) =>
	z.object({
		runName: z.string().min(1, "Run name is required"),
		client: z.string().optional(),
		description: z.string().optional(),
		file: z.instanceof(File, { message: "Please select a file" }).refine(
			(file) => {
				return allowedFileTypes.some(
					(type) =>
						file.type === type ||
						file.name.toLowerCase().endsWith(type.replace(".", ""))
				);
			},
			{ message: "Please select an Excel file (.xlsx or .xls)" }
		),
	});

export type NewRunFormData = z.infer<ReturnType<typeof createNewRunFormSchema>>;
