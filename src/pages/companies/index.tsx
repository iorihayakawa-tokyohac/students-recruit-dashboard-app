import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date";

function Companies() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const statusOptions = [
    "未エントリー",
    "情報収集中",
    "説明会参加",
    "ES作成中",
    "ES提出済",
    "書類選考中",
    "一次面接",
    "二次面接",
    "最終面接",
    "内定",
    "辞退",
    "不合格",
  ];
  const [newCompany, setNewCompany] = useState({
    name: "",
    industry: "",
    jobType: "",
    status: "未エントリー",
    priority: "B" as "A" | "B" | "C",
  });

  const { data: companies, isLoading } = trpc.companies.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.companies.create.useMutation({
    onSuccess: () => {
      utils.companies.list.invalidate();
      setIsCreateDialogOpen(false);
      setNewCompany({ name: "", industry: "", jobType: "", status: "未エントリー", priority: "B" });
      toast.success("企業を追加しました");
    },
    onError: (error) => {
      toast.error("企業の追加に失敗しました: " + error.message);
    },
  });

  const deleteMutation = trpc.companies.delete.useMutation({
    onSuccess: () => {
      utils.companies.list.invalidate();
      toast.success("企業を削除しました");
    },
    onError: (error) => {
      toast.error("企業の削除に失敗しました: " + error.message);
    },
  });

  const handleCreate = () => {
    if (!newCompany.name.trim()) {
      toast.error("企業名を入力してください");
      return;
    }
    createMutation.mutate(newCompany);
  };

  const handleDelete = (id: number) => {
    if (confirm("この企業を削除しますか?")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredCompanies = useMemo(
    () =>
      (companies || []).filter((company) => {
        const matchesSearch =
          company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.industry?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || company.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [companies, searchQuery, statusFilter]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    statusOptions.forEach((s) => (counts[s] = 0));
    (companies || []).forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return counts;
  }, [companies, statusOptions]);

  const highlightCards = useMemo(
    () => [
      {
        title: "登録企業",
        value: companies?.length ?? 0,
        helper: "すべてのステータス",
        accent: "from-primary to-blue-500",
      },
      {
        title: "選考中・面接",
        value: companies?.filter((c) => c.status?.includes("面接") || c.status?.includes("選考")).length ?? 0,
        helper: "書類/面接を進行中",
        accent: "from-purple-500 to-indigo-500",
      },
      {
        title: "内定 / オファー",
        value: companies?.filter((c) => c.status?.includes("内定")).length ?? 0,
        helper: "おめでとうございます",
        accent: "from-emerald-500 to-lime-400",
      },
    ],
    [companies]
  );

  const getPriorityColor = (priority?: string | null) => {
    switch (priority) {
      case "A":
        return "destructive";
      case "B":
        return "default";
      case "C":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="relative -m-4 bg-gradient-to-br from-primary/10 via-background to-background p-4 md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-8%] top-[-10%] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-12%] bottom-[-20%] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Search className="h-4 w-4 text-primary" />
              <span>企業管理</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">企業一覧</h1>
              <p className="text-sm text-muted-foreground">気になる企業の進捗と締切をひと目で確認できます。</p>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" />
                企業を追加
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/90 backdrop-blur text-card-foreground">
              <DialogHeader>
                <DialogTitle className="text-foreground">新規企業追加</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  応募する企業の情報を入力してください
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-foreground">企業名 *</Label>
                  <Input
                    id="name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="例: 株式会社サンプル"
                    className="bg-background text-foreground"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="industry" className="text-foreground">業界</Label>
                  <Input
                    id="industry"
                    value={newCompany.industry}
                    onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                    placeholder="例: IT・通信"
                    className="bg-background text-foreground"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="jobType" className="text-foreground">職種</Label>
                  <Input
                    id="jobType"
                    value={newCompany.jobType}
                    onChange={(e) => setNewCompany({ ...newCompany, jobType: e.target.value })}
                    placeholder="例: エンジニア"
                    className="bg-background text-foreground"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority" className="text-foreground">志望度</Label>
                  <Select
                    value={newCompany.priority}
                    onValueChange={(value: "A" | "B" | "C") => setNewCompany({ ...newCompany, priority: value })}
                  >
                    <SelectTrigger className="bg-background text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      <SelectItem value="A">A (高)</SelectItem>
                      <SelectItem value="B">B (中)</SelectItem>
                      <SelectItem value="C">C (低)</SelectItem>
                    </SelectContent>
                  </Select>
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

        <div className="grid gap-4 md:grid-cols-3">
          {highlightCards.map((card) => (
            <Card key={card.title} className="overflow-hidden border-none bg-white/70 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
              <div className={cn("h-1 bg-gradient-to-r", card.accent)} />
              <CardContent className="p-5 space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-sm font-semibold text-foreground leading-tight">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.helper}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="企業名・業界で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/80 backdrop-blur"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[220px] bg-background/80 backdrop-blur">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              <SelectItem value="all">すべて</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status} ({statusCounts[status] ?? 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="border-none bg-white/80 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
          <CardContent className="p-0">
            <div className="rounded-xl border border-border/60 bg-card/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-foreground">企業名</TableHead>
                    <TableHead className="text-foreground">業界</TableHead>
                    <TableHead className="text-foreground">職種</TableHead>
                    <TableHead className="text-foreground">ステータス</TableHead>
                    <TableHead className="text-foreground">志望度</TableHead>
                    <TableHead className="text-foreground">次の締切</TableHead>
                    <TableHead className="text-foreground text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        読み込み中...
                      </TableCell>
                    </TableRow>
                  ) : filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        企業が見つかりません
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies.map((company) => (
                      <TableRow
                        key={company.id}
                        className="group cursor-pointer transition hover:bg-primary/5"
                        onClick={() => setLocation(`/companies/${company.id}`)}
                      >
                        <TableCell className="font-medium text-foreground">{company.name}</TableCell>
                        <TableCell className="text-foreground">{company.industry || "-"}</TableCell>
                        <TableCell className="text-foreground">{company.jobType || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                            {company.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityColor(company.priority)}>
                            {company.priority || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {formatDate(company.nextDeadline, "M/d (E)", "—")}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/companies/${company.id}`);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(company.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <DashboardLayout>
      <Companies />
    </DashboardLayout>
  );
}
