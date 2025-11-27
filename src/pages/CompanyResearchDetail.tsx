import { useLocation, useRoute } from "wouter";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, Link2, PencilLine } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CompanyResearchStatusBadge } from "@/components/CompanyResearchStatusBadge";

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

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">読み込み中...</div>;
  }

  if (!research) {
    return <div className="text-center py-12 text-muted-foreground">企業研究が見つかりません</div>;
  }

  const displayName = research.linkedCompanyName || research.companyName;

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
              最終更新: {research.updatedAt ? format(new Date(research.updatedAt), "yyyy/MM/dd HH:mm", { locale: ja }) : "—"}
            </p>
          </div>
        </div>

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
