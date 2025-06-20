import { RunSummaryProps } from "@/types/run-summary";
import { SheetAnalysis } from "./sheet-analysis";

// Component
export const RunSummary = ({ runData }: RunSummaryProps) => {
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
