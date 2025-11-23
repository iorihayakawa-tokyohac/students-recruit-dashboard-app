import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { BellRing, CalendarClock, Mail, RefreshCw, Save, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";

const eventTypeOptions = [
  { value: "es_deadline", label: "ES提出" },
  { value: "interview", label: "面接" },
  { value: "test", label: "Webテスト" },
  { value: "briefing", label: "説明会/OB訪問" },
  { value: "other", label: "その他" },
] as const;

type EventType = (typeof eventTypeOptions)[number]["value"];

const toDateTimeValue = (value?: Date | string | null) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd'T'HH:mm");
};

export default function Events() {
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "es_deadline" as EventType,
    companyId: undefined as number | undefined,
    startAt: toDateTimeValue(new Date()),
    endAt: "",
    location: "",
    memo: "",
    remindBeforeDays: 1,
    remindOnDay: true,
  });

  const range = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setDate(to.getDate() + 14);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }, []);

  const { data: companies } = trpc.companies.list.useQuery();
  const { data: events, isLoading } = trpc.events.listRange.useQuery(range);
  const { data: notificationPref } = trpc.notificationPreferences.get.useQuery();
  const [prefDraft, setPrefDraft] = useState({ emailEnabled: false, overrideEmail: "" });
  const utils = trpc.useUtils();

  useEffect(() => {
    if (notificationPref) {
      setPrefDraft({
        emailEnabled: notificationPref.emailEnabled ?? false,
        overrideEmail: notificationPref.overrideEmail ?? "",
      });
    }
  }, [notificationPref]);

  const createMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      utils.events.listRange.invalidate(range);
      resetForm();
      toast.success("イベントを登録しました");
    },
    onError: (error) => toast.error("登録に失敗しました: " + error.message),
  });

  const updateMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      utils.events.listRange.invalidate(range);
      resetForm();
      setEditingEventId(null);
      toast.success("イベントを更新しました");
    },
    onError: (error) => toast.error("更新に失敗しました: " + error.message),
  });

  const deleteMutation = trpc.events.delete.useMutation({
    onSuccess: () => {
      utils.events.listRange.invalidate(range);
      toast.success("イベントを削除しました");
    },
    onError: (error) => toast.error("削除に失敗しました: " + error.message),
  });

  const updatePrefMutation = trpc.notificationPreferences.update.useMutation({
    onSuccess: () => {
      utils.notificationPreferences.get.invalidate();
      toast.success("通知設定を更新しました");
    },
    onError: (error) => toast.error("通知設定の更新に失敗しました: " + error.message),
  });

  const resetForm = () => {
    setForm({
      title: "",
      type: "es_deadline",
      companyId: undefined,
      startAt: toDateTimeValue(new Date()),
      endAt: "",
      location: "",
      memo: "",
      remindBeforeDays: 1,
      remindOnDay: true,
    });
    setEditingEventId(null);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("イベント名を入力してください");
      return;
    }
    const startAt = new Date(form.startAt);
    if (Number.isNaN(startAt.getTime())) {
      toast.error("開始日時を正しく入力してください");
      return;
    }
    const endAt = form.endAt ? new Date(form.endAt) : undefined;
    if (form.endAt && Number.isNaN(endAt!.getTime())) {
      toast.error("終了日時を正しく入力してください");
      return;
    }

    const payload = {
      title: form.title.trim(),
      type: form.type,
      companyId: form.companyId,
      startAt,
      endAt,
      location: form.location || undefined,
      memo: form.memo || undefined,
      remindBeforeDays: form.remindBeforeDays,
      remindOnDay: form.remindOnDay,
    };

    if (editingEventId) {
      updateMutation.mutate({ id: editingEventId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (event: NonNullable<typeof events>[number]) => {
    setEditingEventId(event.id);
    setForm({
      title: event.title,
      type: event.type as EventType,
      companyId: event.companyId ?? undefined,
      startAt: toDateTimeValue(event.startAt),
      endAt: toDateTimeValue(event.endAt ?? undefined),
      location: event.location ?? "",
      memo: event.memo ?? "",
      remindBeforeDays: event.remindBeforeDays ?? 1,
      remindOnDay: event.remindOnDay ?? true,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("このイベントを削除しますか？")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSavePreference = () => {
    updatePrefMutation.mutate({
      emailEnabled: prefDraft.emailEnabled,
      overrideEmail: prefDraft.overrideEmail || undefined,
    });
  };

  const eventsList = events ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarClock className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">リマインダー・予定管理</h1>
          <p className="text-sm text-muted-foreground">ES締切、面接日時、説明会などの予定をまとめて管理します</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">{editingEventId ? "イベントを編集" : "イベントを登録"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label className="text-foreground">イベント名</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="例: XX社 ES提出 / YY社 一次面接"
                className="bg-background text-foreground"
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-foreground">種別</Label>
                <Select value={form.type} onValueChange={(value: EventType) => setForm({ ...form, type: value })}>
                  <SelectTrigger className="bg-background text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    {eventTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">企業（任意）</Label>
                <Select
                  value={form.companyId ? String(form.companyId) : ""}
                  onValueChange={(value) => setForm({ ...form, companyId: value ? Number(value) : undefined })}
                >
                  <SelectTrigger className="bg-background text-foreground">
                    <SelectValue placeholder="紐づけなし" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    <SelectItem value="">紐づけなし</SelectItem>
                    {companies?.map((company) => (
                      <SelectItem key={company.id} value={String(company.id)}>{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-foreground">開始日時</Label>
                <Input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">終了日時（任意）</Label>
                <Input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                  className="bg-background text-foreground"
                />
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-foreground">場所 / URL（任意）</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="会場名やURLを記入"
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">メモ（任意）</Label>
                <Textarea
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  rows={3}
                  className="bg-background text-foreground"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-foreground">何日前に通知</Label>
                <Select
                  value={String(form.remindBeforeDays)}
                  onValueChange={(value) => setForm({ ...form, remindBeforeDays: Number(value) })}
                >
                  <SelectTrigger className="bg-background text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    <SelectItem value="0">通知しない</SelectItem>
                    <SelectItem value="1">前日</SelectItem>
                    <SelectItem value="3">3日前</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-center gap-3">
                <div>
                  <Label className="text-foreground">当日通知</Label>
                  <p className="text-xs text-muted-foreground">当日朝のメールに含める</p>
                </div>
                <Switch
                  checked={form.remindOnDay}
                  onCheckedChange={(checked) => setForm({ ...form, remindOnDay: checked })}
                />
              </div>
              <div className="flex items-end gap-2 justify-end">
                {editingEventId && (
                  <Button variant="ghost" onClick={resetForm}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    リセット
                  </Button>
                )}
                <Button onClick={handleSubmit} className="min-w-[120px]">
                  {editingEventId ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      更新
                    </>
                  ) : (
                    "追加"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BellRing className="h-5 w-5 text-primary" />
              メール通知設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground font-medium">メールで受け取る</p>
                  <p className="text-sm text-muted-foreground">前日9:00 / 当日8:00 にまとめて送信</p>
                </div>
                <Switch
                  checked={prefDraft.emailEnabled}
                  onCheckedChange={(checked) => setPrefDraft(prev => ({ ...prev, emailEnabled: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">送信先メールアドレス（任意）</Label>
                <Input
                  value={prefDraft.overrideEmail}
                  onChange={(e) => setPrefDraft(prev => ({ ...prev, overrideEmail: e.target.value }))}
                  placeholder="未入力の場合、アカウントのメールを使用"
                  className="bg-background text-foreground"
                />
            </div>
            <Button
              onClick={handleSavePreference}
              disabled={updatePrefMutation.isPending}
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              {updatePrefMutation.isPending ? "保存中..." : "設定を保存"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CalendarClock className="h-5 w-5 text-primary" />
            今後2週間の予定
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">読み込み中...</p>
          ) : eventsList.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>予定がありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">日時</TableHead>
                    <TableHead className="text-foreground">イベント</TableHead>
                    <TableHead className="text-foreground">企業</TableHead>
                    <TableHead className="text-foreground">種別</TableHead>
                    <TableHead className="text-foreground">リマインド</TableHead>
                    <TableHead className="text-foreground text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventsList
                    .slice()
                    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
                    .map((event) => {
                      const companyName = companies?.find(c => c.id === event.companyId)?.name;
                      return (
                        <TableRow key={event.id} className="hover:bg-muted/40">
                          <TableCell className="text-foreground">
                            <div className="font-medium">{format(new Date(event.startAt), "M/d(E) HH:mm", { locale: ja })}</div>
                            {event.endAt && (
                              <p className="text-xs text-muted-foreground">
                                〜 {format(new Date(event.endAt), "M/d(E) HH:mm", { locale: ja })}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-foreground">
                            <div className="font-semibold">{event.title}</div>
                            {event.memo && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.memo}</p>}
                          </TableCell>
                          <TableCell className="text-foreground">{companyName || "紐づけなし"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-foreground">
                              {eventTypeOptions.find(opt => opt.value === event.type)?.label || event.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {event.remindBeforeDays && event.remindBeforeDays > 0 ? `${event.remindBeforeDays}日前` : "前日なし"}
                            {event.remindOnDay ? " / 当日" : ""}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
                              編集
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              削除
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
