import { RunData } from "@/types/run-data";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Hook
export const useRunData = () => {
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
