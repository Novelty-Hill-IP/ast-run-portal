export const fileToBase64 = async (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			const base64 = result.split(",")[1];
			resolve(base64);
		};
		reader.onerror = () => {
			reject(new Error("Failed to read file"));
		};
		reader.readAsDataURL(file);
	});
};

export const base64ToFile = async (
	base64: string,
	fileName: string,
	fileType: string
): Promise<File> => {
	const response = await fetch(`data:${fileType};base64,${base64}`);
	const blob = await response.blob();
	return new File([blob], fileName, { type: fileType });
};
