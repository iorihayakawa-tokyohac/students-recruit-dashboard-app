import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { AlertTriangle, ArrowLeft, Link2, Loader2, PencilLine, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CompanyResearchStatusBadge } from "@/components/CompanyResearchStatusBadge";
import { Progress } from "@/components/ui/progress";
import type { AiMatchingResult } from "@shared/aiMatching";
import { toMatchingProfile } from "@/lib/aiMatching";
import { toast } from "sonner";
import { formatDate } from "@/lib/date";

const sections = [
  {
    id: "sectionA",
    title: "セクションA：企業概要",
    fields: [
      { key: "q1Overview", label: "Q1. この企業は何をやっている企業か？" },
      { key: "q2BusinessModel", label: "Q2. ビジネスモデルは？" },
      { key: "q3Strengths", label: "Q3. 同業他社と比べた特徴・強みは？" },
    ],
  },
  {
    id: "sectionB",
    title: "セクションB：ポジション・働き方",
    fields: [
      { key: "q4DesiredPosition", label: "Q4. 希望するポジションはどこか？" },
      { key: "q5RoleExpectations", label: "Q5. そのポジションで想定する業務は？" },
      { key: "q6PersonalStrengths", label: "Q6. そのポジションで活かせる自分の強みは？" },
    ],
  },
  {
    id: "sectionC",
    title: "セクションC：選考プロセス",
    fields: [
      { key: "q7SelectionFlow", label: "Q7. 選考フロー（回数・順番）は？" },
      { key: "q8InterviewCount", label: "Q8. 面接は何回あるか？" },
      { key: "q9EvaluationPoints", label: "Q9. 想定される質問・評価ポイントは？" },
    ],
  },
  {
    id: "sectionD",
    title: "セクションD：志望理由・フィット感",
    fields: [
      { key: "q10Motivation", label: "Q10. なぜこの企業に興味を持ったのか？" },
      { key: "q11WhyThisCompany", label: "Q11. 他社ではなくこの企業でなければならない理由は？" },
      { key: "q12ValuesFit", label: "Q12. 自分の価値観・キャリアプランと企業の一致点は？" },
    ],
  },
  {
    id: "sectionE",
    title: "セクションE：リスク・懸念点",
    fields: [
      { key: "q13Concerns", label: "Q13. 不安に思っている点・確認したい点は？" },
      { key: "q14ResolutionPlan", label: "Q14. それをどのように解消・確認する予定か？" },
    ],
  },
] as const;

export default function CompanyResearchDetail() {
  const [, params] = useRoute("/research/:id");
  const [, setLocation] = useLocation();
  const researchId = params?.id ? Number(params.id) : 0;

  const { data: research, isLoading } = trpc.companyResearches.getById.useQuery(
    { id: researchId },
    { enabled: researchId > 0 },
  );
  const { data: profileData, isLoading: isProfileLoading } = trpc.profile.get.useQuery();
  const [matchResult, setMatchResult] = useState<AiMatchingResult | null>(null);

  useEffect(() => {
    setMatchResult(null);
  }, [researchId]);

  const matchMutation = trpc.ai.matchProfileToCompany.useMutation({
    onSuccess: (result) => {
      setMatchResult(result);
      toast.success("AIマッチング結果を取得しました");
    },
    onError: (error) => {
      toast.error("AIマッチングに失敗しました: " + error.message);
    },
  });

  if (isLoading || isProfileLoading) {
    return <div className="text-center py-12 text-muted-foreground">読み込み中...</div>;
  }

  if (!research) {
    return <div className="text-center py-12 text-muted-foreground">企業研究が見つかりません</div>;
  }

  const displayName = research.linkedCompanyName || research.companyName;
  const savedProfile = profileData?.profile ?? null;

  const handleRunMatching = () => {
    if (!savedProfile) {
      toast.error("マイプロフィールを保存してください", {
        description: "プロフィールページで入力・保存するとAIマッチングに利用できます。",
      });
      return;
    }
    if (!researchId) {
      toast.error("企業研究のIDが不正です");
      return;
    }
    matchMutation.mutate({
      companyResearchId: researchId,
      profile: toMatchingProfile(savedProfile),
    });
  };

  return (
    <div className="relative -m-4 bg-gradient-to-br from-primary/10 via-background to-background p-4 md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-8%] top-[-10%] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-12%] bottom-[-20%] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>
      <div className="relative space-y-6">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/research")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">企業研究レポート</p>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{displayName}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <CompanyResearchStatusBadge status={research.status} />
                  {research.companyIndustry && (
                    <Badge variant="outline">{research.companyIndustry}</Badge>
                  )}
                  {research.companyStatus && (
                    <Badge variant="secondary">{research.companyStatus}</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {research.companyId && (
                  <Button
                    variant="outline"
                    onClick={() => setLocation(`/companies/${research.companyId}`)}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    企業詳細へ
                  </Button>
                )}
                <Button onClick={() => setLocation(`/research/${research.id}/edit`)}>
                  <PencilLine className="mr-2 h-4 w-4" />
                  編集
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              最終更新: {formatDate(research.updatedAt, "yyyy/MM/dd HH:mm")}
            </p>
          </div>
        </div>

        <Card className="border-none bg-gradient-to-r from-primary/10 via-white to-emerald-50 shadow-sm ring-1 ring-border/50 backdrop-blur dark:from-primary/5 dark:via-slate-900/60 dark:to-emerald-900/20">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/20 dark:bg-slate-900/60">
                <Sparkles className="h-4 w-4" />
                <span>AIフィット診断</span>
              </div>
              <p className="text-sm text-muted-foreground">
                保存済みのマイプロフィールとこの企業研究をもとに、フィット度と次のアクションを提案します。
              </p>
              {!savedProfile && (
                <p className="text-xs text-muted-foreground">
                  プロフィールページで基本情報を保存すると、より正確に判定できます。
                </p>
              )}
            </div>
            <Button
              onClick={handleRunMatching}
              disabled={matchMutation.isPending || !researchId}
              className="gap-2 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg shadow-primary/20"
            >
              {matchMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  AIマッチングを実行
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {matchResult ? (
              <MatchResult result={matchResult} />
            ) : (
              <div className="rounded-lg border border-dashed border-border/70 bg-white/70 p-4 text-sm text-foreground dark:bg-slate-900/60">
                <div className="flex flex-col gap-2 text-muted-foreground">
                  <span>「AIマッチングを実行」を押すと、以下の情報を元にJSON形式の診断結果を生成します。</span>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>マイプロフィール（強み・弱み・働き方の好みなど）</li>
                    <li>この企業研究の回答内容</li>
                  </ul>
                  <span className="text-xs">結果は画面上でそのまま確認できます。</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-white/80 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">企業名</span>
              <span className="text-foreground font-medium">{displayName}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">紐づき</span>
              <span className="text-foreground">
                {research.companyId ? "企業一覧に紐づいています" : "企業一覧への紐づけなし"}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {sections.map((section) => (
            <Card key={section.id} className="border-none bg-white/80 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.fields.map((field, idx) => {
                  const value = (research as any)[field.key] as string | null | undefined;
                  return (
                    <div key={field.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{field.label}</span>
                        {idx === 0 && (
                          <Separator className="flex-1 bg-border" />
                        )}
                      </div>
                      <p className="rounded-md border border-border bg-muted/30 p-3 text-sm text-foreground whitespace-pre-wrap min-h-[60px]">
                        {value?.trim() ? value : "未入力"}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchResult({ result }: { result: AiMatchingResult }) {
  const levelTheme: Record<AiMatchingResult["fitLevel"], { badge: string; label: string }> = {
    high: { badge: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "High fit" },
    middle: { badge: "bg-amber-100 text-amber-800 border-amber-200", label: "Middle fit" },
    low: { badge: "bg-rose-100 text-rose-800 border-rose-200", label: "Low fit" },
  };
  const theme = levelTheme[result.fitLevel] || levelTheme.middle;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-white/80 p-4 shadow-sm dark:bg-slate-900/60">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">総合フィット度</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-foreground">{result.totalScore}</span>
              <Badge variant="outline" className={`${theme.badge} border`}>
                {theme.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{result.summary}</p>
          </div>
          <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            モデル判定: <span className="font-semibold text-foreground uppercase">{result.fitLevel}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border/60 bg-white/80 p-4 dark:bg-slate-900/60">
          <p className="text-sm font-medium text-foreground">サブスコア</p>
          <ScoreRow label="価値観" value={result.scores.valuesFit} />
          <ScoreRow label="組織風土・働き方" value={result.scores.cultureFit} />
          <ScoreRow label="スキル・得意分野" value={result.scores.skillFit} />
          <ScoreRow label="志望動機・興味" value={result.scores.motivationFit} />
        </div>

        <div className="space-y-4 rounded-lg border border-border/60 bg-white/80 p-4 dark:bg-slate-900/60">
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-200">
              <Sparkles className="h-4 w-4" />
              マッチしているポイント
            </p>
            {result.strongPoints.length > 0 ? (
              <ul className="space-y-1 text-sm text-foreground">
                {result.strongPoints.map((point, idx) => (
                  <li key={`${point}-${idx}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">まだ特筆すべきマッチポイントはありません。</p>
            )}
          </div>
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              ギャップ・注意点
            </p>
            {result.weakPoints.length > 0 ? (
              <ul className="space-y-1 text-sm text-foreground">
                {result.weakPoints.map((point, idx) => (
                  <li key={`${point}-${idx}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">大きな懸念点の記載はありません。</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border/60 bg-white/80 p-4 dark:bg-slate-900/60">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          今後のアクション
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1 rounded-md bg-muted/50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">選考で意識すること</p>
            <p className="text-sm text-foreground leading-relaxed">{result.advice.selection}</p>
          </div>
          <div className="space-y-2 rounded-md bg-muted/50 p-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">追加リサーチ</p>
              <p className="text-sm text-foreground leading-relaxed">{result.advice.research}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">聞いてみる質問</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                {result.advice.questionsToAsk.map((q, idx) => (
                  <li key={`${q}-${idx}`}>{q}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <Progress value={value} />
    </div>
  );
}
