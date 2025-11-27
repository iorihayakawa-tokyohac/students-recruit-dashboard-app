import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle2, Database, Loader2, RefreshCw, Server } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ReactNode, useMemo } from "react";

type StatusItem = {
  label: string;
  ok: boolean;
  description?: string;
  detail?: string | null;
  icon: ReactNode;
};

const formatDateTime = (value?: Date | string | null) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "yyyy/MM/dd HH:mm:ss", { locale: ja });
};

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <Badge variant="secondary" className="gap-1 text-foreground bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="h-4 w-4" />
      正常
    </Badge>
  ) : (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="h-4 w-4" />
      要確認
    </Badge>
  );
}

export default function StatusPage() {
  const { data, isLoading, isFetching, refetch } = trpc.system.status.useQuery();

  const items: StatusItem[] = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: "Firestore 読み書き",
        ok: data.firestore.ok,
        description: data.firestore.ok ? "読み取り / 書き込みともに成功" : "Firestore への読み書きに失敗しました",
        detail: data.firestore.error ?? null,
        icon: <Database className="h-5 w-5 text-primary" />,
      },
      {
        label: "サーバー時間",
        ok: true,
        description: formatDateTime(data.serverTime) || "取得できませんでした",
        detail: `Project: ${data.firebase.projectId}`,
        icon: <Server className="h-5 w-5 text-primary" />,
      },
    ];
  }, [data]);

  return (
    <div className="relative -m-4 bg-gradient-to-br from-primary/10 via-background to-background p-4 md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-8%] top-[-10%] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-12%] bottom-[-20%] h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Database className="h-4 w-4 text-primary" />
              <span>接続状況</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">ステータス確認</h1>
              <p className="text-sm text-muted-foreground">Firebase とデータベースの読み書き状況を確認できます。</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            再読み込み
          </Button>
        </div>

        <Card className="border-none bg-white/80 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
          <CardHeader className="flex flex-col gap-2">
            <CardTitle className="text-foreground flex items-center gap-2">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <CheckCircle2 className="h-5 w-5 text-primary" />}
              システムステータス
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              データベースの応答やサーバー時間を確認し、トラブルシュートに役立てます。
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                読み込み中...
              </div>
            ) : data ? (
              <div className="grid gap-4 md:grid-cols-2">
                {items.map(item => (
                  <div key={item.label} className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background/70 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <StatusBadge ok={item.ok} />
                    </div>
                    {item.detail && (
                      <>
                        <Separator className="bg-border" />
                        <p className="text-xs text-muted-foreground break-words leading-relaxed">{item.detail}</p>
                      </>
                    )}
                    {item.label === "Firestore 読み書き" && (
                      <p className="text-xs text-muted-foreground">
                        最終確認: {formatDateTime(data.firestore.lastPingAt) || "確認できませんでした"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-destructive">
                ステータスの取得に失敗しました。再読み込みしてください。
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
