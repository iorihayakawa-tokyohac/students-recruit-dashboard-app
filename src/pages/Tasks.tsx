import { useState } from "react";
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
import { Plus, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";

export default function Tasks() {
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

  const filteredTasks = tasks?.filter((task) => {
    if (statusFilter === "all") return true;
    return task.status === statusFilter;
  }) || [];

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">タスク一覧</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              タスク追加
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card text-card-foreground">
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

      {/* フィルター */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] bg-card text-foreground">
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

      {/* タスクリスト */}
      <div className="space-y-3">
        {tasksLoading ? (
          <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">タスクが見つかりません</div>
        ) : (
          filteredTasks.map((task) => {
            const company = companies?.find(c => c.id === task.companyId);
            const isDone = task.status === "done";

            return (
              <Card key={task.id} className={`transition-all ${isDone ? "opacity-60" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={isDone}
                      onCheckedChange={() => handleToggleStatus(task.id, task.status)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-medium text-foreground ${isDone ? "line-through" : ""}`}>
                        {task.title}
                      </h3>
                      {company && (
                        <p className="text-sm text-muted-foreground mt-1">{company.name}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant={getStatusVariant(task.status)} className="text-foreground">
                          {getStatusLabel(task.status)}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(task.dueDate), "M月d日(E) HH:mm", { locale: ja })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(task.id)}
                    >
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
  );
}
