import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import { ArrowRight, CheckCircle2, GraduationCap, Sparkles } from "lucide-react";
import type { AppRouter } from "../../server/routers";

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type StudentRoadmap = RouterOutputs["students"]["listWithRoadmap"][number];

type Props = {
  student: StudentRoadmap;
};

export function StudentRoadmapCard({ student }: Props) {
  const steps = student.steps ?? [];
  const currentIndexFromProgress = student.progress?.currentIndex ?? 0;
  const currentStep = student.currentStep ?? steps[currentIndexFromProgress] ?? steps[0];
  const currentIndex =
    currentStep && steps.length ? Math.max(steps.findIndex(step => step.id === currentStep.id), 0) : currentIndexFromProgress;
  const total = student.progress?.total ?? steps.length;
  const completion = total > 0 ? Math.min(100, Math.round(((currentIndex + 1) / total) * 100)) : 0;

  return (
    <Card className="h-full border-none bg-white/80 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>就活ロードマップ</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xl font-semibold text-foreground">{student.name}</p>
              <Badge variant="outline" className="rounded-full">
                {student.roadmapDefinition?.title || "就活ロードマップ"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {student.university && <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">{student.university}</Badge>}
              {student.graduationYear && <span>{student.graduationYear}年卒</span>}
              {student.desiredIndustry && (
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  {student.desiredIndustry}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-1 text-right">
            <Badge variant="secondary" className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">
              現在ステップ
            </Badge>
            <p className="text-lg font-semibold text-foreground">{currentStep?.title ?? "未設定"}</p>
            <p className="text-xs text-muted-foreground">ステップ {currentIndex + 1} / {total || steps.length}</p>
          </div>
        </div>
        {student.note && (
          <p className="text-sm text-muted-foreground">{student.note}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>ロードマップの進行度</span>
            <span className="font-medium text-foreground">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2" />
          <div className="mt-2 flex items-center gap-3 overflow-x-auto pb-1">
            {steps.map((step, idx) => {
              const reached = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <div key={step.id ?? idx} className="flex items-center gap-2 min-w-[180px]">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition",
                      reached ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                      isCurrent && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
                    )}
                  >
                    {idx + 1}
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <p className={cn("font-medium", reached ? "text-foreground" : "text-muted-foreground")}>{step.title}</p>
                    {isCurrent && step.description && (
                      <p className="text-[11px] text-muted-foreground">{step.description}</p>
                    )}
                  </div>
                  {idx < steps.length - 1 && <div className="h-px w-10 shrink-0 bg-border" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-border/60 bg-background/70 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              このステップでやること
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {currentStep?.tasks?.length ? (
                currentStep.tasks.map((task, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>{task}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground">タスクが未設定です</li>
              )}
            </ul>
          </div>
          <div className="space-y-2 rounded-lg border border-dashed border-border/70 bg-background/60 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ArrowRight className="h-4 w-4 text-primary" />
              ネクストアクション例
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {currentStep?.nextActionsList?.length ? (
                currentStep.nextActionsList.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{action}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground">次の一手がまだありません</li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
