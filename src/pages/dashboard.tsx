import { useMemo, type ReactNode } from "react";
import { differenceInCalendarDays, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import { ja } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { StudentRoadmapCard } from "@/components/StudentRoadmapCard";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Flame,
  Sparkles,
  Building2,
  FileText,
  Video,
  Trophy,
  Clock,
  GraduationCap,
} from "lucide-react";
import { useLocation } from "wouter";
import { formatDate } from "@/lib/date";

type Tone = "muted" | "warning" | "danger" | "positive";

const encouragementPhrases = [
  "一歩ずつ、着実に進もう",
  "今日の頑張りが未来をつくる",
  "焦らず、自分のペースで",
  "大丈夫、準備はできているよ",
];

const toneClasses: Record<Tone, string> = {
  muted: "text-muted-foreground",
  warning: "text-amber-600 dark:text-amber-300",
  danger: "text-destructive",
  positive: "text-emerald-600 dark:text-emerald-300",
};

const typeAccent: Record<string, string> = {
  es_deadline: "from-pink-500/20 to-orange-500/10 text-pink-600 dark:text-pink-200",
  interview: "from-blue-500/20 to-cyan-500/10 text-blue-600 dark:text-blue-200",
  test: "from-purple-500/20 to-indigo-500/10 text-purple-600 dark:text-purple-200",
  briefing: "from-emerald-500/20 to-lime-500/10 text-emerald-600 dark:text-emerald-200",
  other: "from-slate-500/20 to-slate-500/5 text-slate-600 dark:text-slate-200",
};

function asDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dueState(dueDate?: Date | string | null): { label: string; tone: Tone } {
  const date = asDate(dueDate);
  if (!date) return { label: "期限未設定", tone: "muted" };
  const diff = differenceInCalendarDays(date, new Date());
  if (isToday(date)) return { label: "今日中", tone: "warning" };
  if (diff === 1) return { label: "明日まで", tone: "warning" };
  if (diff < 0) return { label: `${Math.abs(diff)}日超過`, tone: "danger" };
  if (diff <= 3) return { label: `あと${diff}日`, tone: "warning" };
  return { label: formatDate(date, "M/d (E)"), tone: "muted" };
}

function DashboardContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: companies, isLoading: companiesLoading } = trpc.companies.list.useQuery();
  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery();
  const { data: upcomingEvents, isLoading: eventsLoading } = trpc.events.listUpcoming.useQuery({ days: 14 });
  const { data: studentRoadmaps, isLoading: studentsLoading } = trpc.students.listWithRoadmap.useQuery();

  const isLoading = statsLoading || companiesLoading || tasksLoading || eventsLoading || studentsLoading;

  const totalCompanies = stats?.totalCompanies ?? companies?.length ?? 0;
  const esSubmitted = useMemo(
    () => (companies ?? []).filter(c => c.status?.includes("ES") || c.status?.includes("提出")).length,
    [companies]
  );
  const interviewing = useMemo(
    () => (companies ?? []).filter(c => c.status?.includes("面接") || c.status?.includes("選考")).length,
    [companies]
  );
  const offers = useMemo(
    () => (companies ?? []).filter(c => c.status?.includes("内定")).length,
    [companies]
  );

  const openTasks = useMemo(
    () => (tasks ?? []).filter(t => t.status !== "done").sort((a, b) => {
      const aDate = asDate(a.dueDate);
      const bDate = asDate(b.dueDate);
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return aDate.getTime() - bDate.getTime();
    }),
    [tasks]
  );

  const upcomingEventList = useMemo(
    () =>
      (upcomingEvents ?? [])
        .slice()
        .map(evt => ({ ...evt, _startAt: asDate((evt as any).startAt) }))
        .filter(evt => evt._startAt)
        .sort((a, b) => (a._startAt as Date).getTime() - (b._startAt as Date).getTime())
        .slice(0, 6),
    [upcomingEvents]
  );

  const recentCompanies = useMemo(
    () =>
      (companies ?? [])
        .slice()
        .sort((a, b) => {
          const aDate = asDate(a.updatedAt);
          const bDate = asDate(b.updatedAt);
          if (!aDate || !bDate) return 0;
          return bDate.getTime() - aDate.getTime();
        })
        .slice(0, 6),
    [companies]
  );

  const statusBreakdown = useMemo(() => {
    const breakdown = stats?.companiesByStatus ?? [];
    const total = breakdown.reduce((sum, item) => sum + (item.count ?? 0), 0);
    return breakdown
      .slice()
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
      .map(item => ({
        ...item,
        ratio: total ? Math.round(((item.count ?? 0) / total) * 100) : 0,
      }));
  }, [stats?.companiesByStatus]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const greetingName = user?.displayName || user?.email || "あなた";
  const encouragement = encouragementPhrases[greetingName.length % encouragementPhrases.length];

  return (
    <div className="relative -m-4 bg-gradient-to-br from-primary/10 via-background to-background p-4 md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-10%] bottom-[-10%] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>ダッシュボード</span>
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {greetingName}さん、ようこそ。
              </h1>
              <p className="text-sm text-muted-foreground">
                {encouragement}。大切な予定とタスクをまとめて確認しましょう。
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge
              variant="outline"
              className="flex items-center gap-2 rounded-full border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
            >
              <Bell className="h-4 w-4" />
              直近の予定 {upcomingEventList.length} 件
            </Badge>
            <Button
              className="gap-2 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg shadow-primary/20"
              onClick={() => setLocation("/tasks#new")}
            >
              今日の進捗を追加
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InsightCard
            title="登録企業"
            value={totalCompanies}
            icon={<Building2 className="h-4 w-4" />}
            accent="from-blue-500/20 to-blue-500/5"
            helper={`${statusBreakdown.length} 種類のステータス`}
          />
          <InsightCard
            title="ES・書類提出済"
            value={esSubmitted}
            icon={<FileText className="h-4 w-4" />}
            accent="from-pink-500/20 to-amber-500/10"
            helper="書類の抜け漏れをチェック"
          />
          <InsightCard
            title="選考中・面接"
            value={interviewing}
            icon={<Video className="h-4 w-4" />}
            accent="from-purple-500/20 to-indigo-500/10"
            helper="面接準備を進めましょう"
          />
          <InsightCard
            title="内定 / オファー"
            value={offers}
            icon={<Trophy className="h-4 w-4" />}
            accent="from-emerald-500/20 to-emerald-500/5"
            helper="おめでとうございます！"
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <GraduationCap className="h-4 w-4 text-primary" />
              就活ロードマップ（学生本人向け）
            </div>
            <Badge variant="outline" className="rounded-full bg-primary/10 text-primary">
              学生 {studentRoadmaps?.length ?? 0} 名
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {studentsLoading ? (
              <>
                <StudentRoadmapSkeleton />
                <StudentRoadmapSkeleton />
              </>
            ) : studentRoadmaps && studentRoadmaps.length > 0 ? (
              studentRoadmaps.map(student => <StudentRoadmapCard key={student.id} student={student} />)
            ) : (
              <Card className="border-dashed border-border/60 bg-background/70">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center text-muted-foreground">
                  <GraduationCap className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">学生ロードマップがまだありません</p>
                    <p className="text-sm text-muted-foreground">
                      新規学生を追加すると、ここに伴走ステップが並びます
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2 border-none bg-white/70 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
            <CardHeader className="flex flex-col gap-2 border-b border-border/50 pb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                やることリスト
              </div>
              <p className="text-sm text-muted-foreground">
                期限が近い順に並べています。上から順に片付けていきましょう。
              </p>
            </CardHeader>
            <CardContent className="space-y-3 p-6">
              {openTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/70 bg-background/60 p-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  <div>
                    <p className="font-medium text-foreground">全て完了しました</p>
                    <p className="text-sm text-muted-foreground">新しいタスクを追加してみましょう</p>
                  </div>
                </div>
              )}
              {openTasks.slice(0, 5).map(task => {
                const company = companies?.find(c => c.id === task.companyId);
                const { label, tone } = dueState(task.dueDate);
                const statusLabel =
                  task.status === "in_progress" ? "進行中" : task.status === "open" ? "未着手" : "完了";
                const dueDateValue = asDate(task.dueDate);
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/70 p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                  >
                    <div
                      className={cn(
                        "mt-1 h-2 w-2 rounded-full ring-2 ring-background",
                        tone === "danger"
                          ? "bg-destructive"
                          : tone === "warning"
                            ? "bg-amber-500"
                            : tone === "positive"
                              ? "bg-emerald-500"
                              : "bg-muted-foreground/50"
                      )}
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{task.title}</p>
                        {company && (
                          <Badge variant="outline" className="rounded-full border-dashed">
                            {company.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className={cn("inline-flex items-center gap-1.5", toneClasses[tone])}>
                          <Clock className="h-3.5 w-3.5" />
                          {label}
                        </span>
                        {dueDateValue && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(dueDateValue, "M/d (E) HH:mm")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                      {statusLabel}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-none bg-white/70 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    直近の予定・締切
                  </div>
                  <p className="text-xs text-muted-foreground">2週間以内の予定を一覧で確認</p>
                </div>
                <Badge variant="outline" className="rounded-full bg-primary/10 text-primary">
                  {upcomingEventList.length} 件
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-6">
              {upcomingEventList.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/70 bg-background/60 p-6 text-center text-muted-foreground">
                  予定はありません
                </div>
              )}
              {upcomingEventList.map(event => {
                const startAt = asDate((event as any)._startAt ?? event.startAt);
                if (!startAt) return null;
                const overdue = isPast(startAt) && !isToday(startAt);
                const urgent = isToday(startAt) || isTomorrow(startAt);
                const company = companies?.find(c => c.id === event.companyId);
                const accent = typeAccent[event.type] ?? typeAccent.other;
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "relative overflow-hidden rounded-lg border border-border/70 bg-gradient-to-r p-4",
                      accent
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="rounded-full border-none bg-white/70 text-foreground">
                            {event.type === "es_deadline"
                              ? "ES締切"
                              : event.type === "interview"
                                ? "面接"
                                : event.type === "test"
                                  ? "テスト"
                                  : event.type === "briefing"
                                    ? "説明会"
                                    : "その他"}
                          </Badge>
                          <p className="font-medium text-foreground">{event.title}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(startAt, "M/d (E) HH:mm")}
                          </span>
                          {company && (
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {company.name}
                            </span>
                          )}
                          {(event.remindBeforeDays || event.remindOnDay) && (
                            <span className="inline-flex items-center gap-1">
                              <Bell className="h-3.5 w-3.5" />
                              {event.remindBeforeDays ? `${event.remindBeforeDays}日前通知` : ""}
                              {event.remindOnDay ? " / 当日" : ""}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-1",
                              overdue
                                ? "bg-destructive/10 text-destructive"
                                : urgent
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
                                  : "bg-white/50 text-foreground/80 dark:bg-slate-800/70"
                            )}
                          >
                            {overdue ? <AlertCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                            {overdue
                              ? "期限超過"
                              : urgent
                                ? isToday(startAt)
                                  ? "今日"
                                  : "明日"
                                : formatDistanceToNow(startAt, { addSuffix: true, locale: ja })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2 border-none bg-white/70 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
            <CardHeader className="flex flex-col gap-2 border-b border-border/50 pb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Flame className="h-4 w-4 text-amber-500" />
                最近更新した企業
              </div>
              <p className="text-sm text-muted-foreground">直近で触れた企業を確認して、次のアクションを明確にしましょう。</p>
            </CardHeader>
            <CardContent className="grid gap-4 p-6 md:grid-cols-2">
              {recentCompanies.length === 0 && (
                <div className="col-span-2 rounded-lg border border-dashed border-border/70 bg-background/60 p-8 text-center text-muted-foreground">
                  まだ企業が登録されていません
                </div>
              )}
              {recentCompanies.map(company => {
                const deadline = asDate(company.nextDeadline);
                const { label, tone } = dueState(company.nextDeadline);
                return (
                  <div
                    key={company.id}
                    className="flex h-full flex-col gap-3 rounded-lg border border-border/70 bg-background/70 p-4 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.12)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">#{company.id}</p>
                        <p className="text-lg font-semibold text-foreground">{company.name}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {company.industry && (
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {company.industry}
                            </span>
                          )}
                          {company.jobType && (
                            <span className="inline-flex items-center gap-1">
                              <Sparkles className="h-3.5 w-3.5" />
                              {company.jobType}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                        {company.status || "未エントリー"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {company.nextStep && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary">
                          <ArrowRight className="h-3.5 w-3.5" />
                          次: {company.nextStep}
                        </span>
                      )}
                      {deadline && (
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1", toneClasses[tone])}>
                          <CalendarDays className="h-3.5 w-3.5" />
                          {label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>最終保存 {formatDate(company.updatedAt, "M/d (E)")}</span>
                      <span className="font-medium text-foreground">{company.priority ? `志望度 ${company.priority}` : ""}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-none bg-white/70 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                ステータスの内訳
              </div>
              <p className="text-xs text-muted-foreground">登録企業 {totalCompanies} 件の進捗を俯瞰できます。</p>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {statusBreakdown.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/70 bg-background/60 p-6 text-center text-muted-foreground">
                  ステータス情報がまだありません
                </div>
              )}
              {statusBreakdown.map(item => (
                <div key={item.status} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-foreground">
                    <span>{item.status || "未設定"}</span>
                    <span className="text-muted-foreground">{item.count}件</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500"
                      style={{ width: `${item.ratio}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function StudentRoadmapSkeleton() {
  return (
    <Card className="border-none bg-white/70 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-3/4" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map(item => (
          <Card key={item}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map(item => (
          <Card key={`student-${item}`}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-3/4" />
              <Skeleton className="h-14 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map(item => (
              <Skeleton key={item} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map(item => (
              <Skeleton key={item} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(item => (
              <Skeleton key={item} className="h-28 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map(item => (
              <Skeleton key={item} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type InsightCardProps = {
  title: string;
  value: number;
  helper?: string;
  icon: ReactNode;
  accent: string;
};

function InsightCard({ title, value, helper, icon, accent }: InsightCardProps) {
  return (
    <Card className="overflow-hidden border-none bg-white/70 shadow-sm ring-1 ring-border/50 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900/70">
      <div className={cn("h-1.5 w-full bg-gradient-to-r", accent)} />
      <CardContent className="p-5 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="rounded-full bg-primary/10 p-2 text-primary">{icon}</div>
        </div>
        <div className="text-lg font-semibold tracking-tight text-foreground">{value}</div>
        {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
