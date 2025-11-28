import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Clock, Trash2, Sparkles, CalendarDays } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function Tasks() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newTask, setNewTask] = useState({
    title: "",
    companyId: undefined as number | undefined,
    dueDate: "",
    status: "open" as "open" | "in_progress" | "done",
  });

  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery();
  const { data: companies } = trpc.companies.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      setIsCreateDialogOpen(false);
      setNewTask({ title: "", companyId: undefined, dueDate: "", status: "open" });
      toast.success("タスクを追加しました");
    },
    onError: (error) => {
      toast.error("タスクの追加に失敗しました: " + error.message);
    },
  });

  const updateMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
    },
    onError: (error) => {
      toast.error("タスクの更新に失敗しました: " + error.message);
    },
  });

  const deleteMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      toast.success("タスクを削除しました");
    },
    onError: (error) => {
      toast.error("タスクの削除に失敗しました: " + error.message);
    },
  });

  const handleCreate = () => {
    if (!newTask.title.trim()) {
      toast.error("タスク名を入力してください");
      return;
    }
    createMutation.mutate({
      ...newTask,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
    });
  };

  const handleToggleStatus = (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "open" : "done";
    updateMutation.mutate({ id: taskId, status: newStatus as any });
  };

  const handleDelete = (id: number) => {
    if (confirm("このタスクを削除しますか?")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredTasks = useMemo(
    () =>
      (tasks || []).filter((task) => {
        if (statusFilter === "all") return true;
        return task.status === statusFilter;
      }),
    [tasks, statusFilter]
  );

  const sortedTasks = useMemo(
    () =>
      filteredTasks
        .slice()
        .sort((a, b) => {
          const aDate = toDate(a.dueDate);
          const bDate = toDate(b.dueDate);
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return aDate.getTime() - bDate.getTime();
        }),
    [filteredTasks]
  );

  const stats = useMemo(() => {
    const total = tasks?.length ?? 0;
    const open = tasks?.filter((t) => t.status === "open").length ?? 0;
    const inProgress = tasks?.filter((t) => t.status === "in_progress").length ?? 0;
    const done = tasks?.filter((t) => t.status === "done").length ?? 0;
    return { total, open, inProgress, done };
  }, [tasks]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open": return "未着手";
      case "in_progress": return "進行中";
      case "done": return "完了";
      default: return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "open": return "secondary";
      case "in_progress": return "default";
      case "done": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="relative -m-4 bg-gradient-to-br from-primary/10 via-background to-background p-4 md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-8%] top-[-10%] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-12%] bottom-[-20%] h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>タスク管理</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">やることリスト</h1>
              <p className="text-sm text-muted-foreground">締切が近い順に並べています。上から順に片付けましょう。</p>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" />
                タスク追加
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/90 backdrop-blur text-card-foreground">
              <DialogHeader>
                <DialogTitle className="text-foreground">新規タスク追加</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  やるべきタスクを登録してください
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-foreground">タスク名 *</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="例: ES提出"
                    className="bg-background text-foreground"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company" className="text-foreground">企業（任意）</Label>
                  <Select
                    value={newTask.companyId?.toString() || "none"}
                    onValueChange={(value) => setNewTask({ ...newTask, companyId: value === "none" ? undefined : parseInt(value) })}
                  >
                    <SelectTrigger className="bg-background text-foreground">
                      <SelectValue placeholder="企業を選択" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      <SelectItem value="none">企業に紐づけない</SelectItem>
                      {companies?.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate" className="text-foreground">期限</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="bg-background text-foreground"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "追加中..." : "追加"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="タスク総数" value={stats.total} accent="from-primary to-blue-500" />
          <StatCard title="未着手" value={stats.open} accent="from-amber-500 to-orange-400" />
          <StatCard title="進行中" value={stats.inProgress} accent="from-purple-500 to-indigo-500" />
          <StatCard title="完了" value={stats.done} accent="from-emerald-500 to-lime-400" />
        </div>

        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[220px] bg-background/80 backdrop-blur">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="open">未着手</SelectItem>
              <SelectItem value="in_progress">進行中</SelectItem>
              <SelectItem value="done">完了</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {tasksLoading ? (
            <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
          ) : sortedTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">タスクが見つかりません</div>
          ) : (
            sortedTasks.map((task) => {
              const company = companies?.find((c) => c.id === task.companyId);
              const isDone = task.status === "done";
              const { label, tone } = dueState(task.dueDate);

              return (
                <Card
                  key={task.id}
                  className={cn(
                    "border-none bg-white/80 shadow-sm ring-1 ring-border/50 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900/70",
                    isDone ? "opacity-60" : ""
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isDone}
                        onCheckedChange={() => handleToggleStatus(task.id, task.status)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={cn("text-lg font-medium text-foreground", isDone ? "line-through" : "")}>
                            {task.title}
                          </p>
                          {company && (
                            <Badge variant="outline" className="rounded-full border-dashed">
                              {company.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <Badge variant={getStatusVariant(task.status)} className="rounded-full bg-primary/10 text-primary">
                            {getStatusLabel(task.status)}
                          </Badge>
                          <span className={cn("inline-flex items-center gap-1 text-xs", toneClass(tone))}>
                            <Clock className="h-3.5 w-3.5" />
                            {label}
                          </span>
                          {task.dueDate && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {format(new Date(task.dueDate), "M/d (E) HH:mm", { locale: ja })}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

type Tone = "muted" | "warning" | "danger" | "positive";

function toneClass(tone: Tone) {
  if (tone === "danger") return "text-destructive";
  if (tone === "warning") return "text-amber-600 dark:text-amber-300";
  if (tone === "positive") return "text-emerald-600 dark:text-emerald-300";
  return "text-muted-foreground";
}

function toDate(value?: Date | string | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dueState(dueDate?: Date | string | null): { label: string; tone: Tone } {
  const date = toDate(dueDate);
  if (!date) return { label: "期限未設定", tone: "muted" };
  const diff = differenceInCalendarDays(date, new Date());
  if (diff < 0) return { label: `${Math.abs(diff)}日超過`, tone: "danger" };
  if (diff === 0) return { label: "今日中", tone: "warning" };
  if (diff === 1) return { label: "明日まで", tone: "warning" };
  if (diff <= 3) return { label: `あと${diff}日`, tone: "warning" };
  return { label: format(date, "M/d (E)", { locale: ja }), tone: "muted" };
}

function StatCard({ title, value, accent }: { title: string; value: number; accent: string }) {
  return (
    <Card className="overflow-hidden border-none bg-white/70 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
      <div className={cn("h-1 bg-gradient-to-r", accent)} />
      <CardContent className="p-4 space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-sm font-semibold text-foreground leading-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function TasksPage() {
  return (
    <DashboardLayout>
      <Tasks />
    </DashboardLayout>
  );
}
