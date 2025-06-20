import { Badge } from "@/components/ui/badge";
import { RunDetailsProps } from "@/types/run-details";

// Component
export const RunDetails = ({ runData }: RunDetailsProps) => (
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
