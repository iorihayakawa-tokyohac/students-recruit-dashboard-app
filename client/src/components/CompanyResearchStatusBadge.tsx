import { Badge } from "@/components/ui/badge";

type ResearchStatus = "not_started" | "in_progress" | "completed";

const statusLabels: Record<ResearchStatus, string> = {
  not_started: "未着手",
  in_progress: "途中",
  completed: "完了",
};

const statusVariants: Record<ResearchStatus, "secondary" | "outline" | "default"> = {
  not_started: "secondary",
  in_progress: "outline",
  completed: "default",
};

export function CompanyResearchStatusBadge({ status }: { status: ResearchStatus }) {
  return (
    <Badge variant={statusVariants[status]} className="capitalize">
      {statusLabels[status]}
    </Badge>
  );
}
