import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  FileText, 
  Video, 
  Trophy, 
  CheckCircle2,
  Clock,
  AlertCircle,
  CalendarClock
} from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { ja } from "date-fns/locale";
import DashboardLayout from "@/components/DashboardLayout";

function DashboardContent() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: companies, isLoading: companiesLoading } = trpc.companies.list.useQuery();
  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery();
  const { data: upcomingEvents, isLoading: eventsLoading } = trpc.events.listUpcoming.useQuery({ days: 7 });

  if (statsLoading || companiesLoading || tasksLoading || eventsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalCompanies = companies?.length || 0;
  const esSubmitted = companies?.filter(c => c.status?.includes("ES") || c.status?.includes("提出")).length || 0;
  const interviewing = companies?.filter(c => c.status?.includes("面接")).length || 0;
  const offers = companies?.filter(c => c.status?.includes("内定")).length || 0;

  const openTasks = tasks?.filter(t => t.status === "open") || [];
  const upcomingEventList =
    upcomingEvents
      ?.slice()
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 5) || [];

  const eventTypeLabels: Record<string, string> = {
    es_deadline: "ES提出",
    interview: "面接",
    test: "テスト",
    briefing: "説明会",
    other: "その他",
  };

  return (
    <div className="space-y-6">
      {/* KPIカード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">エントリー企業数</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCompanies}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ES提出済み</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{esSubmitted}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">面接中</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{interviewing}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">内定数</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{offers}</div>
          </CardContent>
        </Card>
      </div>

      {/* 2カラムレイアウト */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 今日やるべきタスク */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">今日やるべきタスク</CardTitle>
          </CardHeader>
          <CardContent>
            {openTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-accent" />
                <p>完了しました！</p>
              </div>
            ) : (
              <div className="space-y-3">
                {openTasks.slice(0, 5).map((task) => {
                  const company = companies?.find(c => c.id === task.companyId);
                  return (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{task.title}</p>
                        {company && (
                          <p className="text-sm text-muted-foreground">{company.name}</p>
                        )}
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {format(new Date(task.dueDate), "M月d日(E)", { locale: ja })}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-foreground">
                        {task.status === "open" ? "未着手" : task.status === "in_progress" ? "進行中" : "完了"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 直近の予定 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">直近の予定・締切</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEventList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2" />
                <p>予定はありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEventList.map((event) => {
                  const startAt = new Date(event.startAt);
                  const isOverdue = isPast(startAt) && !isToday(startAt);
                  const isUrgent = isToday(startAt) || isTomorrow(startAt);
                  const company = companies?.find(c => c.id === event.companyId);

                  return (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{event.title}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Badge variant="secondary" className="text-foreground">
                            {eventTypeLabels[event.type] || event.type}
                          </Badge>
                          {company ? company.name : "紐づけなし"}
                        </p>
                        <p
                          className={`text-xs mt-1 flex items-center gap-1 ${isOverdue ? "text-destructive" : isUrgent ? "text-orange-500" : "text-muted-foreground"}`}
                        >
                          {isOverdue ? <AlertCircle className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
                          {format(startAt, "M月d日(E) HH:mm", { locale: ja })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-foreground">
                        {event.remindBeforeDays && event.remindBeforeDays > 0 ? `${event.remindBeforeDays}日前` : "前日なし"}
                        {event.remindOnDay ? " / 当日" : ""}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
