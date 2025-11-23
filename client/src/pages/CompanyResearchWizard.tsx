import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CompanyResearchStatusBadge } from "@/components/CompanyResearchStatusBadge";

type ResearchStatus = "not_started" | "in_progress" | "completed";

type FormValues = {
  companyName: string;
  companyId?: string;
  status: ResearchStatus;
  q1Overview: string;
  q2BusinessModel: string;
  q3Strengths: string;
  q4DesiredPosition: string;
  q5RoleExpectations: string;
  q6PersonalStrengths: string;
  q7SelectionFlow: string;
  q8InterviewCount: string;
  q9EvaluationPoints: string;
  q10Motivation: string;
  q11WhyThisCompany: string;
  q12ValuesFit: string;
  q13Concerns: string;
  q14ResolutionPlan: string;
};

const sections = [
  {
    id: "A",
    title: "セクションA：企業概要",
    description: "事業内容やビジネスモデルを整理して、面接前のインプットに。",
    fields: [
      { name: "q1Overview", label: "Q1. この企業は何をやっている企業か？", required: true, placeholder: "主要事業や提供サービスを簡潔に" },
      { name: "q2BusinessModel", label: "Q2. ビジネスモデルは？", required: false, placeholder: "誰に・何を・どうやって届けているか" },
      { name: "q3Strengths", label: "Q3. 同業他社と比べた特徴・強みは？", required: false, placeholder: "技術力・顧客基盤・スピード感など" },
    ],
  },
  {
    id: "B",
    title: "セクションB：ポジション・働き方",
    description: "自分がどこで貢献するかを明確にする。",
    fields: [
      { name: "q4DesiredPosition", label: "Q4. 希望するポジションはどこか？", required: true, placeholder: "例: エンジニア / コンサル / 営業" },
      { name: "q5RoleExpectations", label: "Q5. そのポジションで想定する業務は？", required: false, placeholder: "担当業務や役割を具体的に" },
      { name: "q6PersonalStrengths", label: "Q6. そのポジションで活かせる自分の強みは？", required: false, placeholder: "経験・スキル・価値観" },
    ],
  },
  {
    id: "C",
    title: "セクションC：選考プロセス",
    description: "選考フローを押さえて準備漏れを防ぐ。",
    fields: [
      { name: "q7SelectionFlow", label: "Q7. 選考フロー（回数・順番）は？", required: false, placeholder: "例: ES → Webテスト → 1次 → 最終" },
      { name: "q8InterviewCount", label: "Q8. 面接は何回あるか？", required: true, placeholder: "回数や形式をメモ" },
      { name: "q9EvaluationPoints", label: "Q9. 想定される質問・評価ポイントは？", required: false, placeholder: "頻出質問や評価軸" },
    ],
  },
  {
    id: "D",
    title: "セクションD：志望理由・フィット感",
    description: "なぜこの会社で働きたいのかを言語化する。",
    fields: [
      { name: "q10Motivation", label: "Q10. なぜこの企業に興味を持ったのか？", required: false, placeholder: "出会いのきっかけや魅力" },
      { name: "q11WhyThisCompany", label: "Q11. 他社ではなくこの企業でなければならない理由は？", required: false, placeholder: "唯一性・決め手" },
      { name: "q12ValuesFit", label: "Q12. 価値観やキャリアプランと一致する点は？", required: false, placeholder: "文化・ミッションとのフィット" },
    ],
  },
  {
    id: "E",
    title: "セクションE：リスク・懸念点",
    description: "不安点を先に洗い出し、解消プランを準備。",
    fields: [
      { name: "q13Concerns", label: "Q13. 不安に思っている点・確認したい点は？", required: false, placeholder: "働き方・事業リスクなど" },
      { name: "q14ResolutionPlan", label: "Q14. それをどのように解消・確認する予定か？", required: false, placeholder: "面接で聞く・OBOG訪問など" },
    ],
  },
] as const;

const defaultValues: FormValues = {
  companyName: "",
  companyId: "",
  status: "in_progress",
  q1Overview: "",
  q2BusinessModel: "",
  q3Strengths: "",
  q4DesiredPosition: "",
  q5RoleExpectations: "",
  q6PersonalStrengths: "",
  q7SelectionFlow: "",
  q8InterviewCount: "",
  q9EvaluationPoints: "",
  q10Motivation: "",
  q11WhyThisCompany: "",
  q12ValuesFit: "",
  q13Concerns: "",
  q14ResolutionPlan: "",
};

export default function CompanyResearchWizard() {
  const [location, setLocation] = useLocation();
  const [isEditMatch, editParams] = useRoute("/research/:id/edit");
  const [isNewMatch] = useRoute("/research/new");
  const researchId = isEditMatch && editParams?.id ? Number(editParams.id) : null;

  const searchParams = useMemo(() => {
    const [, queryString] = location.split("?");
    return new URLSearchParams(queryString);
  }, [location]);

  const [currentStep, setCurrentStep] = useState(0);
  const [registerCompany, setRegisterCompany] = useState(false);
  const noneOption = "none";

  const form = useForm<FormValues>({
    defaultValues,
  });

  const utils = trpc.useUtils();
  const { data: companies } = trpc.companies.list.useQuery();

  const { data: existingResearch, isLoading: isLoadingResearch } = trpc.companyResearches.getById.useQuery(
    { id: researchId || 0 },
    { enabled: !!researchId },
  );

  useEffect(() => {
    if (existingResearch) {
      form.reset({
        companyName: existingResearch.companyName,
        companyId: existingResearch.companyId ? String(existingResearch.companyId) : "",
        status: existingResearch.status,
        q1Overview: existingResearch.q1Overview || "",
        q2BusinessModel: existingResearch.q2BusinessModel || "",
        q3Strengths: existingResearch.q3Strengths || "",
        q4DesiredPosition: existingResearch.q4DesiredPosition || "",
        q5RoleExpectations: existingResearch.q5RoleExpectations || "",
        q6PersonalStrengths: existingResearch.q6PersonalStrengths || "",
        q7SelectionFlow: existingResearch.q7SelectionFlow || "",
        q8InterviewCount: existingResearch.q8InterviewCount || "",
        q9EvaluationPoints: existingResearch.q9EvaluationPoints || "",
        q10Motivation: existingResearch.q10Motivation || "",
        q11WhyThisCompany: existingResearch.q11WhyThisCompany || "",
        q12ValuesFit: existingResearch.q12ValuesFit || "",
        q13Concerns: existingResearch.q13Concerns || "",
        q14ResolutionPlan: existingResearch.q14ResolutionPlan || "",
      });
    } else if (isNewMatch) {
      const companyNameParam = searchParams.get("companyName");
      const companyIdParam = searchParams.get("companyId");
      if (companyNameParam) {
        form.setValue("companyName", companyNameParam);
      }
      if (companyIdParam) {
        form.setValue("companyId", companyIdParam);
      }
    }
  }, [existingResearch, form, isNewMatch, searchParams]);

  const createMutation = trpc.companyResearches.create.useMutation({
    onSuccess: async () => {
      await utils.companyResearches.list.invalidate();
    },
  });
  const updateMutation = trpc.companyResearches.update.useMutation({
    onSuccess: async () => {
      await utils.companyResearches.list.invalidate();
    },
  });
  const createCompanyMutation = trpc.companies.create.useMutation({
    onSuccess: async () => {
      await utils.companies.list.invalidate();
    },
  });

  const isEdit = !!researchId;
  const currentSection = sections[currentStep];
  const progressValue = ((currentStep + 1) / sections.length) * 100;

  const checkRequired = (values: FormValues) => {
    const missing: string[] = [];
    if (!values.q1Overview.trim()) missing.push("企業概要");
    if (!values.q4DesiredPosition.trim()) missing.push("希望ポジション");
    if (!values.q7SelectionFlow.trim() && !values.q8InterviewCount.trim()) {
      missing.push("選考フロー（Q7 or Q8）");
    }
    return missing;
  };

  const selectedCompanyId = form.watch("companyId") || noneOption;

  const handleSave = async (asCompleted: boolean) => {
    const values = form.getValues();
    if (!values.companyName.trim()) {
      toast.error("企業名を入力してください");
      return;
    }

    const missing = checkRequired(values);
    if (asCompleted && missing.length > 0) {
      toast.error(`必須項目が未入力です: ${missing.join(" / ")}`);
      return;
    }

    let companyId: number | null = values.companyId ? Number(values.companyId) : null;
    if (!companyId && registerCompany) {
      try {
        const res = await createCompanyMutation.mutateAsync({
          name: values.companyName,
          status: "未応募",
        });
        const inserted = (res as any)?.insertId ?? (res as any)?.result?.insertId;
        if (inserted) {
          companyId = Number(inserted);
        }
      } catch (error: any) {
        toast.error("企業一覧への登録に失敗しました: " + error?.message);
        return;
      }
    }

    const targetStatus: ResearchStatus = asCompleted ? "completed" : "in_progress";
    form.setValue("status", targetStatus);

    const payload = {
      ...values,
      companyId,
      status: targetStatus,
    };

    try {
      if (isEdit && researchId) {
        await updateMutation.mutateAsync({ id: researchId, ...payload });
        toast.success("企業研究を更新しました");
        setLocation(`/research/${researchId}`);
      } else {
        const res = await createMutation.mutateAsync(payload);
        const insertId = (res as any)?.insertId ?? (res as any)?.result?.insertId;
        toast.success("企業研究を作成しました");
        setLocation(insertId ? `/research/${insertId}` : "/research");
      }
    } catch (error: any) {
      toast.error("保存に失敗しました: " + error?.message);
    }
  };

  if (isLoadingResearch) {
    return <div className="text-center py-12 text-muted-foreground">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation(isEdit ? `/research/${researchId}` : "/research")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <p className="text-sm font-medium text-primary">企業研究ウィザード</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {isEdit ? "企業研究を編集" : "企業研究を作成"}
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                セクションごとに回答して、自分専用の企業研究ノートを完成させましょう。
              </p>
            </div>
            <CompanyResearchStatusBadge status={form.watch("status")} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-foreground">企業情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-foreground">
                企業名 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.watch("companyName")}
                onChange={(e) => form.setValue("companyName", e.target.value)}
                placeholder="企業名を入力"
                className="bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">企業一覧と紐づけ</Label>
              <Select
                value={selectedCompanyId}
                onValueChange={(value) => {
                  if (value === noneOption) {
                    form.setValue("companyId", "");
                  } else {
                    form.setValue("companyId", value);
                  }
                  setRegisterCompany(false);
                }}
              >
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="既存企業を選択（任意）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={noneOption}>紐づけなし</SelectItem>
                  {companies?.map((company) => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {!form.watch("companyId") && (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3">
              <Switch checked={registerCompany} onCheckedChange={setRegisterCompany} id="registerCompany" />
              <div className="flex flex-col">
                <label htmlFor="registerCompany" className="text-sm font-medium text-foreground">
                  企業一覧にも登録する
                </label>
                <p className="text-xs text-muted-foreground">
                  紐づけ先が未選択の場合、保存時に企業一覧へも追加します。
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">{currentSection.title}</CardTitle>
            <span className="text-sm text-muted-foreground">
              {currentStep + 1}/{sections.length} セクション
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{currentSection.description}</p>
          <Progress value={progressValue} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {currentSection.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label className="text-foreground">
                {field.label} {field.required && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                value={form.watch(field.name as keyof FormValues) as string}
                onChange={(e) => form.setValue(field.name as keyof FormValues, e.target.value)}
                placeholder={field.placeholder}
                rows={4}
                className="bg-background text-foreground"
              />
            </div>
          ))}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
              disabled={currentStep === 0}
            >
              前へ
            </Button>
            <div className="flex gap-2">
              {currentStep < sections.length - 1 ? (
                <Button onClick={() => setCurrentStep((prev) => Math.min(prev + 1, sections.length - 1))}>
                  次へ
                </Button>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  最終セクション
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          必須: 企業概要 / 希望ポジション / 選考フロー（Q7 または Q8）
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            下書き保存
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Send className="mr-2 h-4 w-4" />
            完了として保存
          </Button>
        </div>
      </div>
    </div>
  );
}
