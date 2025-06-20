import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { SheetAnalysisProps } from "@/types/sheet-analysis";

// Component
export const SheetAnalysis = ({
	title,
	recordCount,
	headers,
}: SheetAnalysisProps) => (
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
