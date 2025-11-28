import { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ExternalLink, FileQuestion, NotebookPen, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CompanyResearchStatusBadge } from "@/components/CompanyResearchStatusBadge";
import { formatDate } from "@/lib/date";

export default function CompanyDetail() {
  const [, params] = useRoute("/companies/:id");
  const [, setLocation] = useLocation();
  const companyId = params?.id ? parseInt(params.id) : 0;

  const companyStatusOptions = [
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
  const selectionStatusOptions: SelectionStatusOption[] = [
    { value: "not_started", label: "未着手" },
    { value: "scheduled", label: "予定あり" },
    { value: "in_review", label: "選考中" },
    { value: "passed", label: "合格" },
    { value: "failed", label: "不合格" },
  ] as const;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [newNote, setNewNote] = useState({ type: "other" as "interview" | "es" | "other", content: "" });

  const { data: company, isLoading } = trpc.companies.getById.useQuery({ id: companyId });
  const { data: notes } = trpc.notes.listByCompany.useQuery({ companyId });
  const { data: research, isLoading: isResearchLoading } = trpc.companyResearches.getByCompanyId.useQuery(
    { companyId },
    { enabled: !!companyId },
  );
  const { data: selectionSteps, isLoading: stepsLoading } = trpc.selectionSteps.listByCompany.useQuery(
    { companyId },
    { enabled: !!companyId },
  );
  const utils = trpc.useUtils();
  const [newStep, setNewStep] = useState({ name: "", plannedDate: "", status: "not_started" as const });
  const [suppressStepToast, setSuppressStepToast] = useState(false);

  const updateMutation = trpc.companies.update.useMutation({
    onSuccess: () => {
      utils.companies.getById.invalidate({ id: companyId });
      utils.companies.list.invalidate();
      setIsEditing(false);
      toast.success("企業情報を更新しました");
    },
    onError: (error) => {
      toast.error("更新に失敗しました: " + error.message);
    },
  });

  const createStepMutation = trpc.selectionSteps.create.useMutation({
    onSuccess: () => {
      utils.selectionSteps.listByCompany.invalidate({ companyId });
      utils.companies.getById.invalidate({ id: companyId });
      if (!suppressStepToast) {
        toast.success("ステップを追加しました");
      }
    },
    onError: (error) => toast.error("ステップの追加に失敗しました: " + error.message),
  });

  const updateStepMutation = trpc.selectionSteps.update.useMutation({
    onSuccess: () => {
      utils.selectionSteps.listByCompany.invalidate({ companyId });
      utils.companies.getById.invalidate({ id: companyId });
      toast.success("ステップを更新しました");
    },
    onError: (error) => toast.error("ステップの更新に失敗しました: " + error.message),
  });

  const deleteStepMutation = trpc.selectionSteps.delete.useMutation({
    onSuccess: () => {
      utils.selectionSteps.listByCompany.invalidate({ companyId });
      utils.companies.getById.invalidate({ id: companyId });
      toast.success("ステップを削除しました");
    },
  });

  const createNoteMutation = trpc.notes.create.useMutation({
    onSuccess: () => {
      utils.notes.listByCompany.invalidate({ companyId });
      setNewNote({ type: "other", content: "" });
      toast.success("メモを追加しました");
    },
    onError: (error) => {
      toast.error("メモの追加に失敗しました: " + error.message);
    },
  });

  const deleteNoteMutation = trpc.notes.delete.useMutation({
    onSuccess: () => {
      utils.notes.listByCompany.invalidate({ companyId });
      toast.success("メモを削除しました");
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">読み込み中...</div>;
  }

  if (!company) {
    return <div className="text-center py-12 text-muted-foreground">企業が見つかりません</div>;
  }

  const handleUpdate = () => {
    let nextDeadline: Date | undefined;
    if (editData.nextDeadline) {
      const parsed = new Date(editData.nextDeadline);
      if (Number.isNaN(parsed.getTime())) {
        toast.error("次の締切の日付が正しくありません");
        return;
      }
      nextDeadline = parsed;
    }
    updateMutation.mutate({ id: companyId, ...editData, nextDeadline });
  };

  const handleAddNote = () => {
    if (!newNote.content.trim()) {
      toast.error("メモの内容を入力してください");
      return;
    }
    createNoteMutation.mutate({ companyId, ...newNote });
  };

  const defaultSelectionTemplate = useMemo(
    () => ["ES提出", "Webテスト", "一次面接", "二次面接", "最終面接", "内定"],
    [],
  );

  const handleAddStep = () => {
    if (!newStep.name.trim()) {
      toast.error("ステップ名を入力してください");
      return;
    }
    createStepMutation.mutate({
      companyId,
      name: newStep.name.trim(),
      status: newStep.status,
      plannedDate: newStep.plannedDate ? new Date(newStep.plannedDate) : undefined,
    });
    setNewStep({ name: "", plannedDate: "", status: "not_started" });
  };

  const handleApplyTemplate = async () => {
    if (!companyId) return;
    try {
      setSuppressStepToast(true);
      let order = (selectionSteps?.length ?? 0) + 1;
      for (const name of defaultSelectionTemplate) {
        await createStepMutation.mutateAsync({ companyId, name, status: "not_started", order });
        order += 1;
      }
      toast.success("標準フローを追加しました");
    } catch (error: any) {
      toast.error("フローの追加に失敗しました: " + (error?.message || ""));
    } finally {
      setSuppressStepToast(false);
    }
  };

  const startEdit = () => {
    setEditData({
      name: company.name,
      industry: company.industry || "",
      jobType: company.jobType || "",
      mypageUrl: company.mypageUrl || "",
      status: company.status,
      nextStep: company.nextStep || "",
      nextDeadline: formatDate(company.nextDeadline, "yyyy-MM-dd'T'HH:mm", ""),
      priority: company.priority || "B",
      memo: company.memo || "",
    });
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/companies")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{company.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            {company.industry && <Badge variant="outline" className="text-foreground">{company.industry}</Badge>}
            {company.jobType && <Badge variant="outline" className="text-foreground">{company.jobType}</Badge>}
            <Badge variant="default" className="text-foreground">{company.status}</Badge>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={startEdit}>編集</Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 左カラム: 基本情報 */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-foreground">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground">企業名</Label>
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="bg-background text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">業界</Label>
                  <Input
                    value={editData.industry}
                    onChange={(e) => setEditData({ ...editData, industry: e.target.value })}
                    className="bg-background text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">職種</Label>
                  <Input
                    value={editData.jobType}
                    onChange={(e) => setEditData({ ...editData, jobType: e.target.value })}
                    className="bg-background text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">マイページURL</Label>
                  <Input
                    value={editData.mypageUrl}
                    onChange={(e) => setEditData({ ...editData, mypageUrl: e.target.value })}
                    className="bg-background text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">ステータス</Label>
                  <Select value={editData.status} onValueChange={(value) => setEditData({ ...editData, status: value })}>
                    <SelectTrigger className="bg-background text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      {companyStatusOptions.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">志望度</Label>
                  <Select value={editData.priority} onValueChange={(value) => setEditData({ ...editData, priority: value })}>
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
                <div className="space-y-2">
                  <Label className="text-foreground">次のステップ</Label>
                  <Input
                    value={editData.nextStep}
                    onChange={(e) => setEditData({ ...editData, nextStep: e.target.value })}
                    placeholder="例: ES提出"
                    className="bg-background text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">次の締切</Label>
                  <Input
                    type="datetime-local"
                    value={editData.nextDeadline}
                    onChange={(e) => setEditData({ ...editData, nextDeadline: e.target.value })}
                    className="bg-background text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">メモ</Label>
                  <Textarea
                    value={editData.memo}
                    onChange={(e) => setEditData({ ...editData, memo: e.target.value })}
                    rows={4}
                    className="bg-background text-foreground"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="flex-1">
                    {updateMutation.isPending ? "保存中..." : "保存"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                    キャンセル
                  </Button>
                </div>
              </>
            ) : (
              <>
                {company.mypageUrl && (
                  <div>
                    <Label className="text-muted-foreground">マイページ</Label>
                    <a
                      href={company.mypageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline mt-1"
                    >
                      開く <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">志望度</Label>
                  <p className="text-foreground mt-1">{company.priority || "B"}</p>
                </div>
                {company.nextStep && (
                  <div>
                    <Label className="text-muted-foreground">次のステップ</Label>
                    <p className="text-foreground mt-1">{company.nextStep}</p>
                  </div>
                )}
                {company.nextDeadline && (
                  <div>
                    <Label className="text-muted-foreground">次の締切</Label>
                    <p className="text-foreground mt-1">
                      {formatDate(company.nextDeadline, "yyyy年M月d日(E) HH:mm")}
                    </p>
                  </div>
                )}
                {company.memo && (
                  <div>
                    <Label className="text-muted-foreground">メモ</Label>
                    <p className="text-foreground mt-1 whitespace-pre-wrap">{company.memo}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* 右カラム: タブ */}
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <Tabs defaultValue="notes" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="notes">メモ</TabsTrigger>
                <TabsTrigger value="research">企業研究</TabsTrigger>
                <TabsTrigger value="timeline">選考フロー</TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">新規メモ</Label>
                    <Select value={newNote.type} onValueChange={(value: any) => setNewNote({ ...newNote, type: value })}>
                      <SelectTrigger className="bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-popover-foreground">
                        <SelectItem value="interview">面接メモ</SelectItem>
                        <SelectItem value="es">ESメモ</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      placeholder="メモの内容を入力..."
                      rows={4}
                      className="bg-background text-foreground"
                    />
                    <Button onClick={handleAddNote} disabled={createNoteMutation.isPending}>
                      <Plus className="mr-2 h-4 w-4" />
                      {createNoteMutation.isPending ? "追加中..." : "メモを追加"}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {notes?.map((note) => (
                      <Card key={note.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-foreground">
                              {note.type === "interview" ? "面接" : note.type === "es" ? "ES" : "その他"}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDate(note.createdAt, "M/d HH:mm")}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => deleteNoteMutation.mutate({ id: note.id })}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                    {(!notes || notes.length === 0) && (
                      <p className="text-center py-8 text-muted-foreground">メモはまだありません</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="research">
                {isResearchLoading ? (
                  <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
                ) : research ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <CompanyResearchStatusBadge status={research.status} />
                        <p className="text-sm text-muted-foreground">
                          最終更新: {formatDate(research.updatedAt, "M/d HH:mm")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setLocation(`/research/${research.id}`)}>
                          <FileQuestion className="mr-2 h-4 w-4" />
                          レポートを見る
                        </Button>
                        <Button onClick={() => setLocation(`/research/${research.id}/edit`)}>
                          <NotebookPen className="mr-2 h-4 w-4" />
                          編集
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <p className="text-xs text-muted-foreground mb-2">企業概要</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap min-h-[60px]">
                          {research.q1Overview?.trim() || "未入力"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <p className="text-xs text-muted-foreground mb-2">希望ポジション</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap min-h-[60px]">
                          {research.q4DesiredPosition?.trim() || "未入力"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <p className="text-xs text-muted-foreground mb-2">選考フロー</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap min-h-[60px]">
                          {research.q7SelectionFlow?.trim() || research.q8InterviewCount?.trim() || "未入力"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <p className="text-muted-foreground">この企業の企業研究はまだ作成されていません。</p>
                    <Button onClick={() => setLocation(`/research/new?companyId=${companyId}&companyName=${encodeURIComponent(company.name)}`)}>
                      <Plus className="mr-2 h-4 w-4" />
                      企業研究を開始
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                {stepsLoading ? (
                  <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                      <div className="flex-1 grid gap-3 md:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-foreground">ステップ名</Label>
                          <Input
                            value={newStep.name}
                            onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
                            placeholder="例: 一次面接"
                            className="bg-background text-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-foreground">予定日</Label>
                          <Input
                            type="date"
                            value={newStep.plannedDate}
                            onChange={(e) => setNewStep({ ...newStep, plannedDate: e.target.value })}
                            className="bg-background text-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-foreground">ステータス</Label>
                          <Select
                            value={newStep.status}
                            onValueChange={(value: any) => setNewStep({ ...newStep, status: value })}
                          >
                            <SelectTrigger className="bg-background text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover text-popover-foreground">
                              {selectionStatusOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={handleApplyTemplate} disabled={createStepMutation.isPending}>
                          標準フローを追加
                        </Button>
                        <Button onClick={handleAddStep} disabled={createStepMutation.isPending}>
                          <Plus className="mr-2 h-4 w-4" />
                          追加
                        </Button>
                      </div>
                    </div>

                    {selectionSteps && selectionSteps.length > 0 ? (
                      <div className="space-y-3">
                        {selectionSteps.map((step, index) => (
                          <SelectionStepItem
                            key={step.id}
                            step={step}
                            index={index + 1}
                            statusOptions={selectionStatusOptions}
                            onSave={(payload) => updateStepMutation.mutate({ id: step.id, ...payload })}
                            onDelete={() => {
                              if (confirm("このステップを削除しますか？")) {
                                deleteStepMutation.mutate({ id: step.id });
                              }
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 space-y-3 text-muted-foreground">
                        <p>まだステップが登録されていません。</p>
                        <Button onClick={handleApplyTemplate}>
                          <Plus className="mr-2 h-4 w-4" />
                          標準フローを追加
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type SelectionStatusValue = "not_started" | "scheduled" | "in_review" | "passed" | "failed";
type SelectionStatusOption = { value: SelectionStatusValue; label: string };

const formatDateInputValue = (value?: Date | string | null) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd");
};

type SelectionStepItemProps = {
  step: any;
  index: number;
  statusOptions: ReadonlyArray<SelectionStatusOption>;
  onSave: (data: { name?: string; status?: SelectionStatusOption["value"]; plannedDate?: Date | undefined; actualDate?: Date | undefined; memo?: string | null }) => void;
  onDelete: () => void;
};

function SelectionStepItem({ step, index, statusOptions, onSave, onDelete }: SelectionStepItemProps) {
  const [draft, setDraft] = useState<{
    name: string;
    status: SelectionStatusOption["value"];
    plannedDate: string;
    actualDate: string;
    memo: string;
  }>({
    name: step.name as string,
    status: (step.status as SelectionStatusOption["value"]) || "not_started",
    plannedDate: formatDateInputValue(step.plannedDate),
    actualDate: formatDateInputValue(step.actualDate),
    memo: step.memo ?? "",
  });

  useEffect(() => {
    setDraft({
      name: step.name as string,
      status: (step.status as SelectionStatusOption["value"]) || "not_started",
      plannedDate: formatDateInputValue(step.plannedDate),
      actualDate: formatDateInputValue(step.actualDate),
      memo: step.memo ?? "",
    });
  }, [step.id, step.name, step.status, step.plannedDate, step.actualDate, step.memo]);

  const hasChanges =
    draft.name !== step.name ||
    draft.status !== step.status ||
    draft.plannedDate !== formatDateInputValue(step.plannedDate) ||
    draft.actualDate !== formatDateInputValue(step.actualDate) ||
    (draft.memo ?? "") !== (step.memo ?? "");

  const handleSave = () => {
    const plannedDate = draft.plannedDate ? new Date(draft.plannedDate) : undefined;
    const actualDate = draft.actualDate ? new Date(draft.actualDate) : undefined;
    onSave({
      name: draft.name.trim(),
      status: draft.status,
      plannedDate,
      actualDate,
      memo: draft.memo?.trim() ? draft.memo : null,
    });
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-md bg-muted text-foreground flex items-center justify-center font-semibold shrink-0">
            {index}
          </div>
          <div className="flex-1 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-foreground">ステップ名</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">ステータス</Label>
                <Select value={draft.status} onValueChange={(value: any) => setDraft({ ...draft, status: value })}>
                  <SelectTrigger className="bg-background text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-foreground">予定日</Label>
                <Input
                  type="date"
                  value={draft.plannedDate}
                  onChange={(e) => setDraft({ ...draft, plannedDate: e.target.value })}
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-foreground">実施日</Label>
                <Input
                  type="date"
                  value={draft.actualDate}
                  onChange={(e) => setDraft({ ...draft, actualDate: e.target.value })}
                  className="bg-background text-foreground"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-foreground">メモ</Label>
              <Textarea
                value={draft.memo}
                onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
                rows={2}
                className="bg-background text-foreground"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" disabled={!hasChanges} onClick={handleSave}>
              変更を保存
            </Button>
            <Button variant="ghost" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              削除
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
