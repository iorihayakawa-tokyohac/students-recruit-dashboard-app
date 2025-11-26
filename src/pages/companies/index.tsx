import { useState } from "react";
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
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { useLocation } from "wouter";

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

  const filteredCompanies = companies?.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "A": return "destructive";
      case "B": return "default";
      case "C": return "secondary";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">企業一覧</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              企業追加
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card text-card-foreground">
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

      {/* フィルターバー */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="企業名・業界で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card text-foreground"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] bg-card text-foreground">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
        <SelectContent className="bg-popover text-popover-foreground">
          <SelectItem value="all">すべて</SelectItem>
          {statusOptions.map(status => (
            <SelectItem key={status} value={status}>{status}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      </div>

      {/* テーブル */}
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50">
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
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => setLocation(`/companies/${company.id}`)}
                >
                  <TableCell className="font-medium text-foreground">{company.name}</TableCell>
                  <TableCell className="text-foreground">{company.industry || "-"}</TableCell>
                  <TableCell className="text-foreground">{company.jobType || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-foreground">{company.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(company.priority || undefined)} className="text-foreground">
                      {company.priority || "B"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {company.nextDeadline
                      ? format(new Date(company.nextDeadline), "M/d (E)", { locale: ja })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation(`/companies/${company.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(company.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
