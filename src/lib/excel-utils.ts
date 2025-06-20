import { ExcelData } from "@/types/run-data";
import * as XLSX from "xlsx";

// Excel parsing utilities
export const parseExcelFile = async (
	file: File,
	requiredSheets: readonly string[]
): Promise<ExcelData> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const data = new Uint8Array(e.target?.result as ArrayBuffer);
				const workbook = XLSX.read(data, { type: "array" });

				// Validate required sheets
				for (const sheetName of requiredSheets) {
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

export const formatFileSize = (bytes: number): string => {
	return (bytes / 1024 / 1024).toFixed(2);
};
