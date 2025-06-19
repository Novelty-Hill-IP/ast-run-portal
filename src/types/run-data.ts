export interface RunData {
	runID: string;
	runName: string;
	client?: string;
	description?: string;
	fileName: string;
	fileSize: number;
	excelData: ExcelData;
	fileType: string;
	fileAsBase64: string;
}

export interface ExcelData {
	lotsHeaders: string[];
	patentsHeaders: string[];
	lotsCount: number;
	patentsCount: number;
}
