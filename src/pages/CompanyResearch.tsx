import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CompanyResearchStatusBadge } from "@/components/CompanyResearchStatusBadge";
import { Filter, FolderPlus, Search } from "lucide-react";

type StatusFilter = "all" | "not_started" | "in_progress" | "completed";

export default function CompanyResearch() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyLinked, setOnlyLinked] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: researches, isLoading } = trpc.companyResearches.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    onlyLinked,
  });

  const filtered = useMemo(() => researches ?? [], [researches]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">企業研究</p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Q&Aウィザード一覧</h1>
          <p className="text-muted-foreground text-sm mt-2">
            企業理解・ポジション整理・志望理由をストックし、面接直前の見直しに活用できます。
          </p>
        </div>
        <Button onClick={() => setLocation("/research/new")} size="lg">
          <FolderPlus className="mr-2 h-4 w-4" />
          企業研究を開始
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Filter className="h-4 w-4" />
            フィルタ
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="企業名で検索"
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="md:col-span-1">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="not_started">未着手</SelectItem>
                <SelectItem value="in_progress">途中</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-3 md:col-span-1">
              <Switch id="onlyLinked" checked={onlyLinked} onCheckedChange={setOnlyLinked} />
              <label htmlFor="onlyLinked" className="text-sm text-foreground">企業一覧に登録済みのみ</label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="text-foreground">企業名</TableHead>
                  <TableHead className="text-foreground">業界</TableHead>
                  <TableHead className="text-foreground">ステータス</TableHead>
                  <TableHead className="text-foreground">更新日</TableHead>
                  <TableHead className="text-foreground text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      読み込み中...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      企業研究がありません。右上のボタンから作成してください。
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((research) => {
                    const displayName = research.linkedCompanyName || research.companyName;
                    const updatedAt = research.updatedAt ? new Date(research.updatedAt) : null;
                    return (
                      <TableRow
                        key={research.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => setLocation(`/research/${research.id}`)}
                      >
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{displayName}</span>
                            {research.linkedCompanyName && (
                              <Badge variant="outline" className="text-xs">企業登録済み</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {research.companyIndustry || "—"}
                        </TableCell>
                        <TableCell>
                          <CompanyResearchStatusBadge status={research.status} />
                        </TableCell>
                        <TableCell className="text-foreground">
                          {updatedAt ? format(updatedAt, "M/d (E) HH:mm", { locale: ja }) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setLocation(`/research/${research.id}`); }}>
                            詳細
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
