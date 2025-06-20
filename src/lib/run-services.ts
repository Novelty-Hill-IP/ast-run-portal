import { RunData } from "@/types/run-data";

// API functions
export const uploadFileToBlob = async (runData: RunData): Promise<string> => {
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

export const createFabricRun = async (runData: RunData, blobName: string) => {
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
