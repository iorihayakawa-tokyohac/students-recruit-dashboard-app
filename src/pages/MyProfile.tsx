import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BookOpenText,
  ClipboardList,
  ListPlus,
  MapPin,
  NotebookPen,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/date";
import {
  type CustomField,
  type Interest,
  type ProfileData,
  type Trait,
  type TraitKind,
} from "@shared/profile";

type SectionKey = "basics" | "personality" | "custom";

const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
];

const traitPresets: Record<TraitKind, string[]> = {
  personality: ["好奇心旺盛", "計画的", "素直", "慎重", "ポジティブ", "聞き上手", "マイペース", "チャレンジ精神"],
  strength: ["巻き込み力", "探究心", "継続力", "リーダーシップ", "論理的思考", "柔軟性", "共感力", "数値に強い"],
  weakness: ["完璧主義", "優柔不断", "心配性", "詰め込みすぎる", "引っ込み思案", "焦りやすい"],
  work_style: ["チームプレイ", "コツコツ型", "アイデア出しが得意", "まず手を動かす", "調整役が得意", "スピード重視", "丁寧に進める"],
};

const interestPresets = ["数学", "物理", "化学", "情報工学", "デザイン", "マーケティング", "人材・組織", "国際関係"];

function createDefaultProfile(): ProfileData {
  return {
    fullName: "山田 太郎",
    nickname: "たろー",
    prefecture: "東京都",
    dateOfBirth: "2002-04-12",
    oneLiner: "新規事業づくりが好きな理系学生です。課題発見からプロトタイプ作りまで走り切るのが得意。",
    personalityNote: "好奇心旺盛ですが、動く前に計画を立てるタイプです。初対面でも話しかけることが多いです。",
    strengthsNote: "データをもとに仮説検証を回すこと、周囲を巻き込んで小さく実験する動きが得意です。",
    weaknessesNote: "完璧主義な面があり、詰め込みすぎてしまうので最近はスコープを絞るよう意識しています。",
    workStyleNote: "チームで議論しながら進めるのが好きですが、集中作業も得意。最初にTODOを洗い出して順番を決めます。",
    interestsNote: "情報工学・AI応用が好きで、数学では離散分野が得意です。将来はプロダクトとビジネスの橋渡しがしたいです。",
    otherNote: "大学ではロボコンとハッカソンに参加し、リーダーとして役割分担と振り返りを回していました。社会課題に強いプロダクトを作りたいです。",
    traits: [
      { id: "t1", kind: "personality", label: "好奇心旺盛" },
      { id: "t2", kind: "personality", label: "計画的" },
      { id: "t3", kind: "strength", label: "巻き込み力" },
      { id: "t4", kind: "strength", label: "継続力" },
      { id: "t5", kind: "weakness", label: "完璧主義" },
      { id: "t6", kind: "work_style", label: "チームプレイ" },
      { id: "t7", kind: "work_style", label: "コツコツ型" },
    ],
    interests: [
      { id: "i1", subject: "情報工学", detail: "バックエンド / AI応用" },
      { id: "i2", subject: "数学", detail: "離散数学・最適化" },
    ],
    customFields: [
      {
        id: "c1",
        question: "よく見るメディア",
        answer: "YouTubeのエンジニア系チャンネル、Xでスタートアップ界隈をフォロー。",
        order: 0,
      },
      {
        id: "c2",
        question: "挑戦したいこと",
        answer: "学生のうちに小さなSaaSをリリースし、10社に使ってもらう。",
        order: 1,
      },
    ],
  };
}

function normalizeProfileData(input?: Partial<ProfileData>): ProfileData {
  const base = createDefaultProfile();
  return {
    ...base,
    ...input,
    fullName: input?.fullName ?? base.fullName,
    nickname: input?.nickname ?? base.nickname,
    prefecture: input?.prefecture ?? base.prefecture,
    dateOfBirth: input?.dateOfBirth ?? base.dateOfBirth,
    oneLiner: input?.oneLiner ?? base.oneLiner,
    personalityNote: input?.personalityNote ?? base.personalityNote,
    strengthsNote: input?.strengthsNote ?? base.strengthsNote,
    weaknessesNote: input?.weaknessesNote ?? base.weaknessesNote,
    workStyleNote: input?.workStyleNote ?? base.workStyleNote,
    interestsNote: input?.interestsNote ?? base.interestsNote,
    otherNote: input?.otherNote ?? base.otherNote,
    traits: Array.isArray(input?.traits) ? input!.traits : base.traits,
    interests: Array.isArray(input?.interests) ? input!.interests : base.interests,
    customFields: Array.isArray(input?.customFields) ? input!.customFields : base.customFields,
  };
}

function safeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 8)}`;
}

function isFutureDate(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.getTime() > today.getTime();
}

function summarizeCompletion(profile: ProfileData) {
  const traits = Array.isArray(profile.traits) ? profile.traits : [];
  const interests = Array.isArray(profile.interests) ? profile.interests : [];
  const customFields = Array.isArray(profile.customFields) ? profile.customFields : [];
  const checkpoints = [
    !!profile.fullName,
    !!profile.prefecture,
    !!profile.dateOfBirth,
    !!profile.oneLiner,
    traits.some(t => t.kind === "personality"),
    traits.some(t => t.kind === "strength"),
    traits.some(t => t.kind === "weakness"),
    traits.some(t => t.kind === "work_style"),
    interests.length > 0,
    !!profile.otherNote,
    customFields.length > 0,
  ];
  const done = checkpoints.filter(Boolean).length;
  const percent = Math.round((done / checkpoints.length) * 100);
  return { percent, done, total: checkpoints.length };
}

export default function MyProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(() => createDefaultProfile());
  const [draft, setDraft] = useState<ProfileData>(() => createDefaultProfile());
  const [editingSection, setEditingSection] = useState<SectionKey>("basics");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [newTraitLabel, setNewTraitLabel] = useState<Record<TraitKind, string>>({
    personality: "",
    strength: "",
    weakness: "",
    work_style: "",
  });
  const [interestInput, setInterestInput] = useState({ subject: "", detail: "" });
  const [initialized, setInitialized] = useState(false);
  const profileQuery = trpc.profile.get.useQuery(undefined, {
  });
  const saveProfileMutation = trpc.profile.save.useMutation({
    onSuccess: (result) => {
      const saved = normalizeProfileData(result.profile as ProfileData);
      setProfile(saved);
      setDraft(saved);
      setLastSavedAt(result.updatedAt ? new Date(result.updatedAt) : new Date());
      toast.success("プロフィールを保存しました");
    },
    onError: (error) => {
      toast.error("プロフィールの保存に失敗しました: " + error.message);
    },
  });

  useEffect(() => {
    if (profileQuery.data && !initialized) {
      const loaded = normalizeProfileData(profileQuery.data.profile ?? undefined);
      setProfile(loaded);
      setDraft(loaded);
      setLastSavedAt(profileQuery.data.updatedAt ? new Date(profileQuery.data.updatedAt) : null);
      setInitialized(true);
    }
    if (!initialized && !profileQuery.isLoading && !profileQuery.data) {
      const fallback = createDefaultProfile();
      setProfile(fallback);
      setDraft(fallback);
      setInitialized(true);
    }
  }, [initialized, profileQuery.data, profileQuery.isLoading]);

  useEffect(() => {
    if (profileQuery.error) {
      toast.error("プロフィールの取得に失敗しました: " + profileQuery.error.message);
    }
  }, [profileQuery.error]);

  const hasUnsaved = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(profile),
    [draft, profile]
  );

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsaved) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  const completion = useMemo(() => summarizeCompletion(draft), [draft]);

  const toggleTrait = (kind: TraitKind, label: string) => {
    setDraft(prev => {
      const traits = Array.isArray(prev.traits) ? prev.traits : [];
      const exists = traits.some(t => t.kind === kind && t.label === label);
      const nextTraits = exists
        ? traits.filter(t => !(t.kind === kind && t.label === label))
        : [...traits, { id: safeId(), kind, label }];
      return { ...prev, traits: nextTraits };
    });
  };

  const addTrait = (kind: TraitKind) => {
    const label = newTraitLabel[kind].trim();
    if (!label) {
      toast.error("タグを入力してください");
      return;
    }
    toggleTrait(kind, label);
    setNewTraitLabel(prev => ({ ...prev, [kind]: "" }));
    toast.success("タグを追加しました");
  };

  const toggleInterest = (subject: string) => {
    setDraft(prev => {
      const interests = Array.isArray(prev.interests) ? prev.interests : [];
      const exists = interests.some(i => i.subject === subject);
      const nextInterests = exists
        ? interests.filter(i => i.subject !== subject)
        : [...interests, { id: safeId(), subject, detail: "" }];
      return { ...prev, interests: nextInterests };
    });
  };

  const addInterest = () => {
    const subject = interestInput.subject.trim();
    if (!subject) {
      toast.error("好きな教科・分野を入力してください");
      return;
    }
    setDraft(prev => {
      const interests = Array.isArray(prev.interests) ? prev.interests : [];
      return {
        ...prev,
        interests: [
          ...interests,
          { id: safeId(), subject, detail: interestInput.detail.trim() },
        ],
      };
    });
    setInterestInput({ subject: "", detail: "" });
    toast.success("好きな分野を追加しました");
  };

  const updateCustomField = (id: string, patch: Partial<CustomField>) => {
    setDraft(prev => ({
      ...prev,
      customFields: prev.customFields.map(field =>
        field.id === id ? { ...field, ...patch } : field
      ),
    }));
  };

  const addCustomField = () => {
    setDraft(prev => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        { id: safeId(), question: "", answer: "", order: prev.customFields.length },
      ],
    }));
  };

  const removeCustomField = (id: string) => {
    setDraft(prev => ({
      ...prev,
      customFields: prev.customFields
        .filter(field => field.id !== id)
        .map((field, idx) => ({ ...field, order: idx })),
    }));
  };

  const moveCustomField = (id: string, direction: "up" | "down") => {
    setDraft(prev => {
      const sorted = prev.customFields.slice().sort((a, b) => a.order - b.order);
      const index = sorted.findIndex(field => field.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return prev;
      const [removed] = sorted.splice(index, 1);
      sorted.splice(targetIndex, 0, removed);
      return {
        ...prev,
        customFields: sorted.map((field, idx) => ({ ...field, order: idx })),
      };
    });
  };

  const validateSection = (section: SectionKey) => {
    const errors: string[] = [];
    const traits = Array.isArray(draft.traits) ? draft.traits : [];
    const customFields = Array.isArray(draft.customFields) ? draft.customFields : [];
    if (section === "basics") {
      if (!draft.fullName.trim()) errors.push("名前は必須です");
      if (!draft.prefecture) errors.push("在住都道府県を選択してください");
      if (isFutureDate(draft.dateOfBirth)) errors.push("生年月日に未来の日付は指定できません");
    }
    if (section === "personality") {
      if (draft.oneLiner.trim().length > 200) errors.push("一言プロフィールは200文字以内にしてください");
      const longTexts = [
        draft.personalityNote,
        draft.strengthsNote,
        draft.weaknessesNote,
        draft.workStyleNote,
        draft.interestsNote,
        draft.otherNote,
      ];
      if (longTexts.some(text => text.length > 1000)) {
        errors.push("テキストは1000文字以内にしてください");
      }
      if (!traits.some(t => t.kind === "personality")) {
        errors.push("性格タグを1つ以上選んでください");
      }
      if (!traits.some(t => t.kind === "strength")) {
        errors.push("長所を1つ以上選んでください");
      }
      if (traits.some(t => t.label.length > 50)) {
        errors.push("タグは50文字以内にしてください");
      }
    }
    if (section === "custom") {
      customFields.forEach(field => {
        if ((!field.question && field.answer) || (field.question && !field.answer)) {
          errors.push("カスタム項目は質問と回答の両方を入力してください");
        }
        if (field.question.length > 100) errors.push("カスタム質問は100文字以内です");
        if (field.answer.length > 1000) errors.push("カスタム回答は1000文字以内です");
      });
    }
    return errors;
  };

  const persistProfile = async (next: ProfileData) => {
    try {
      const normalized = normalizeProfileData(next);
      await saveProfileMutation.mutateAsync({ profile: normalized });
    } catch {
      // onError handler shows toast
    }
  };

  const saveSection = async (section: SectionKey) => {
    const errors = validateSection(section);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    let next = profile;
    if (section === "basics") {
      next = {
        ...profile,
        fullName: draft.fullName.trim(),
        nickname: draft.nickname.trim(),
        prefecture: draft.prefecture,
        dateOfBirth: draft.dateOfBirth,
      };
    }
    if (section === "personality") {
      next = {
        ...profile,
        oneLiner: draft.oneLiner.trim(),
        personalityNote: draft.personalityNote,
        strengthsNote: draft.strengthsNote,
        weaknessesNote: draft.weaknessesNote,
        workStyleNote: draft.workStyleNote,
        interestsNote: draft.interestsNote,
        otherNote: draft.otherNote,
        traits: draft.traits,
        interests: draft.interests,
      };
    }
    if (section === "custom") {
      next = {
        ...profile,
        customFields: draft.customFields
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((field, idx) => ({ ...field, order: idx })),
      };
    }
    await persistProfile(next);
  };

  const saveAll = async () => {
    const allErrors = ["basics", "personality", "custom"]
      .map(section => validateSection(section as SectionKey))
      .flat();
    if (allErrors.length > 0) {
      toast.error(allErrors[0]);
      return;
    }
    await persistProfile(draft);
  };

  const resetDraft = () => {
    setDraft(profile);
    toast.message("下書きを元に戻しました");
  };

  const exportForAi = useMemo(() => {
    return {
      basics: {
        fullName: profile.fullName,
        nickname: profile.nickname,
        prefecture: profile.prefecture,
        dateOfBirth: profile.dateOfBirth,
        oneLiner: profile.oneLiner,
      },
      traits: profile.traits.map(t => ({ kind: t.kind, label: t.label, description: t.description || "" })),
      interests: profile.interests,
      notes: {
        personality: profile.personalityNote,
        strengths: profile.strengthsNote,
        weaknesses: profile.weaknessesNote,
        workStyle: profile.workStyleNote,
        interests: profile.interestsNote,
        other: profile.otherNote,
      },
      customQA: profile.customFields.map(field => ({
        question: field.question,
        answer: field.answer,
        order: field.order,
      })),
    };
  }, [profile]);

  if (profileQuery.isLoading) {
    return <div className="text-center py-12 text-muted-foreground">プロフィールを読み込み中...</div>;
  }

  return (
    <div className="relative -m-4 bg-gradient-to-br from-primary/10 via-background to-background p-4 md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-12%] top-[-20%] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-14%] bottom-[-16%] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>マイプロフィール</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {user?.displayName || "あなた"} のベースデータ
              </h1>
              <p className="text-sm text-muted-foreground">
                自己紹介・強み・好きな分野をまとめて管理。企業研究データと掛け合わせる土台を整えます。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-1 ring-1 ring-border/70">
                <ClipboardList className="h-3.5 w-3.5 text-primary" />
                進捗 {completion.percent}%（{completion.done}/{completion.total}）
              </span>
              {hasUnsaved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-100">
                  <AlertCircle className="h-3.5 w-3.5" />
                  未保存の変更あり
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={resetDraft}
              disabled={!hasUnsaved}
            >
              <RefreshCw className="h-4 w-4" />
              下書きを破棄
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg shadow-primary/20"
              onClick={() => void saveAll()}
              disabled={saveProfileMutation.isPending}
            >
              <Save className="h-4 w-4" />
              全体を保存
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <Card className="border-none bg-white/70 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
              <CardHeader className="flex flex-col gap-2 border-b border-border/50 pb-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <User className="h-4 w-4 text-primary" />
                  基本情報
                </div>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => setEditingSection("basics")}>
                  <NotebookPen className="h-4 w-4" />
                  編集
                </Button>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <InfoRow label="名前" value={profile.fullName || "未設定"} />
                <InfoRow label="ニックネーム" value={profile.nickname || "未設定"} />
                <InfoRow
                  label="在住都道府県"
                  value={
                    profile.prefecture ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary ring-1 ring-primary/20">
                        <MapPin className="h-3.5 w-3.5" />
                        {profile.prefecture}
                      </span>
                    ) : (
                      "未設定"
                    )
                  }
                />
                <InfoRow
                  label="生年月日"
                  value={
                    profile.dateOfBirth
                      ? `${formatDate(profile.dateOfBirth, "yyyy年M月d日")}`
                      : "未設定"
                  }
                />
                <div className="md:col-span-2">
                  <InfoRow label="一言プロフィール" value={profile.oneLiner || "未設定"} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-white/70 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
              <CardHeader className="flex flex-col gap-2 border-b border-border/50 pb-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  自己紹介・パーソナライズ
                </div>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => setEditingSection("personality")}>
                  <NotebookPen className="h-4 w-4" />
                  編集
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <TraitSection
                  title="性格"
                  note={profile.personalityNote}
                  traits={profile.traits.filter(t => t.kind === "personality")}
                />
                <TraitSection
                  title="長所"
                  note={profile.strengthsNote}
                  traits={profile.traits.filter(t => t.kind === "strength")}
                />
                <TraitSection
                  title="短所"
                  note={profile.weaknessesNote}
                  traits={profile.traits.filter(t => t.kind === "weakness")}
                />
                <TraitSection
                  title="仕事・活動スタイル"
                  note={profile.workStyleNote}
                  traits={profile.traits.filter(t => t.kind === "work_style")}
                />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <BookOpenText className="h-4 w-4 text-primary" />
                    好きな教科・分野
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.length === 0 && <span className="text-sm text-muted-foreground">未設定</span>}
                    {profile.interests.map(interest => (
                      <Badge key={interest.id} variant="secondary" className="rounded-full border-dashed">
                        {interest.subject}
                      </Badge>
                    ))}
                  </div>
                  {profile.interestsNote && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{profile.interestsNote}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Tag className="h-4 w-4 text-primary" />
                    その他自由記述
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {profile.otherNote || "まだ入力されていません。"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-white/70 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
              <CardHeader className="flex flex-col gap-2 border-b border-border/50 pb-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ListPlus className="h-4 w-4 text-primary" />
                  カスタム項目
                </div>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => setEditingSection("custom")}>
                  <NotebookPen className="h-4 w-4" />
                  編集
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.customFields.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/70 bg-background/60 p-6 text-center text-muted-foreground">
                    追加項目はまだありません。「編集」から質問と回答を追加できます。
                  </div>
                )}
                {profile.customFields
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map(field => (
                    <div key={field.id} className="space-y-1 rounded-lg border border-border/60 bg-background/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Q. {field.question}
                      </p>
                      <p className="text-sm leading-relaxed text-foreground">A. {field.answer}</p>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="h-full border-none bg-white/80 shadow-sm ring-1 ring-border/50 backdrop-blur dark:bg-slate-900/70">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-foreground">編集パネル</CardTitle>
                  {lastSavedAt && (
                    <span className="text-xs text-muted-foreground">
                      最終保存: {formatDate(lastSavedAt, "M/d HH:mm")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  編集内容はこの画面内で保持されます。セクション/全体の保存ボタンでサーバーに反映します。
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs value={editingSection} onValueChange={value => setEditingSection(value as SectionKey)}>
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="basics">基本情報</TabsTrigger>
                    <TabsTrigger value="personality">自己紹介</TabsTrigger>
                    <TabsTrigger value="custom">カスタム</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basics" className="pt-4 space-y-4">
                    <Field>
                      <Label className="text-sm">名前 *</Label>
                      <Input
                        value={draft.fullName}
                        onChange={e => setDraft(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="例: 山田 太郎"
                      />
                    </Field>
                    <Field>
                      <Label className="text-sm">ニックネーム</Label>
                      <Input
                        value={draft.nickname}
                        onChange={e => setDraft(prev => ({ ...prev, nickname: e.target.value }))}
                        placeholder="アプリ内で表示したい名前"
                      />
                    </Field>
                    <Field>
                      <Label className="text-sm">在住都道府県 *</Label>
                      <Select
                        value={draft.prefecture}
                        onValueChange={value => setDraft(prev => ({ ...prev, prefecture: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {PREFECTURES.map(pref => (
                            <SelectItem key={pref} value={pref}>
                              {pref}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <Label className="text-sm">生年月日</Label>
                      <Input
                        type="date"
                        value={draft.dateOfBirth ?? ""}
                        onChange={e => setDraft(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </Field>
                    <Field>
                      <div className="flex items-center justify-between text-sm">
                        <Label>一言プロフィール</Label>
                        <span className="text-xs text-muted-foreground">{draft.oneLiner.length}/200</span>
                      </div>
                      <Textarea
                        value={draft.oneLiner}
                        onChange={e => setDraft(prev => ({ ...prev, oneLiner: e.target.value }))}
                        placeholder="100〜200文字で自己紹介をまとめましょう"
                        maxLength={200}
                        rows={3}
                      />
                    </Field>
                    <Button className="w-full gap-2" onClick={() => void saveSection("basics")} disabled={saveProfileMutation.isPending}>
                      <Save className="h-4 w-4" />
                      このセクションを保存
                    </Button>
                  </TabsContent>

                  <TabsContent value="personality" className="pt-4 space-y-4">
                    <TraitEditor
                      title="性格"
                      kind="personality"
                      presets={traitPresets.personality}
                      selected={draft.traits.filter(t => t.kind === "personality").map(t => t.label)}
                      onToggle={label => toggleTrait("personality", label)}
                      newLabel={newTraitLabel.personality}
                      onNewLabelChange={value => setNewTraitLabel(prev => ({ ...prev, personality: value }))}
                      onAdd={() => addTrait("personality")}
                    />
                    <Field>
                      <div className="flex items-center justify-between text-sm">
                        <Label>性格の説明</Label>
                        <span className="text-xs text-muted-foreground">1000文字以内</span>
                      </div>
                      <Textarea
                        value={draft.personalityNote}
                        onChange={e => setDraft(prev => ({ ...prev, personalityNote: e.target.value }))}
                        rows={3}
                      />
                    </Field>

                    <TraitEditor
                      title="長所"
                      kind="strength"
                      presets={traitPresets.strength}
                      selected={draft.traits.filter(t => t.kind === "strength").map(t => t.label)}
                      onToggle={label => toggleTrait("strength", label)}
                      newLabel={newTraitLabel.strength}
                      onNewLabelChange={value => setNewTraitLabel(prev => ({ ...prev, strength: value }))}
                      onAdd={() => addTrait("strength")}
                    />
                    <Field>
                      <Label className="text-sm">長所の具体例</Label>
                      <Textarea
                        value={draft.strengthsNote}
                        onChange={e => setDraft(prev => ({ ...prev, strengthsNote: e.target.value }))}
                        rows={3}
                      />
                    </Field>

                    <TraitEditor
                      title="短所"
                      kind="weakness"
                      presets={traitPresets.weakness}
                      selected={draft.traits.filter(t => t.kind === "weakness").map(t => t.label)}
                      onToggle={label => toggleTrait("weakness", label)}
                      newLabel={newTraitLabel.weakness}
                      onNewLabelChange={value => setNewTraitLabel(prev => ({ ...prev, weakness: value }))}
                      onAdd={() => addTrait("weakness")}
                    />
                    <Field>
                      <Label className="text-sm">短所の補足</Label>
                      <Textarea
                        value={draft.weaknessesNote}
                        onChange={e => setDraft(prev => ({ ...prev, weaknessesNote: e.target.value }))}
                        rows={3}
                      />
                    </Field>

                    <TraitEditor
                      title="仕事・活動スタイル"
                      kind="work_style"
                      presets={traitPresets.work_style}
                      selected={draft.traits.filter(t => t.kind === "work_style").map(t => t.label)}
                      onToggle={label => toggleTrait("work_style", label)}
                      newLabel={newTraitLabel.work_style}
                      onNewLabelChange={value => setNewTraitLabel(prev => ({ ...prev, work_style: value }))}
                      onAdd={() => addTrait("work_style")}
                    />
                    <Field>
                      <Label className="text-sm">どんな進め方が得意か</Label>
                      <Textarea
                        value={draft.workStyleNote}
                        onChange={e => setDraft(prev => ({ ...prev, workStyleNote: e.target.value }))}
                        rows={3}
                      />
                    </Field>

                    <div className="space-y-3 rounded-lg border border-dashed border-border/70 bg-background/70 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <BookOpenText className="h-4 w-4 text-primary" />
                          好きな教科・分野
                        </div>
                        <span className="text-xs text-muted-foreground">タグ + 詳細</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {interestPresets.map(subject => {
                          const selected = draft.interests.some(i => i.subject === subject);
                          return (
                            <Toggle
                              key={subject}
                              pressed={selected}
                              onPressedChange={() => toggleInterest(subject)}
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs",
                                selected ? "border-primary bg-primary/10 text-primary" : "border-border"
                              )}
                            >
                              {subject}
                            </Toggle>
                          );
                        })}
                      </div>
                      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_auto]">
                        <Input
                          placeholder="分野・教科名を入力"
                          value={interestInput.subject}
                          onChange={e => setInterestInput(prev => ({ ...prev, subject: e.target.value }))}
                        />
                        <Input
                          placeholder="好きな理由・得意な点（任意）"
                          value={interestInput.detail}
                          onChange={e => setInterestInput(prev => ({ ...prev, detail: e.target.value }))}
                        />
                        <Button variant="secondary" className="gap-2" onClick={addInterest}>
                          <Plus className="h-4 w-4" />
                          追加
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {draft.interests.length === 0 && (
                          <span className="text-sm text-muted-foreground">追加された項目はありません</span>
                        )}
                        {draft.interests.map(interest => (
                          <Badge key={interest.id} variant="secondary" className="gap-2 rounded-full">
                            {interest.subject}
                            {interest.detail && <span className="text-[11px] text-muted-foreground">/ {interest.detail}</span>}
                            <button
                              className="ml-1 text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                setDraft(prev => ({
                                  ...prev,
                                  interests: prev.interests.filter(i => i.id !== interest.id),
                                }))
                              }
                              aria-label="削除"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Field>
                        <Label className="text-sm">好きな理由のまとめ</Label>
                        <Textarea
                          value={draft.interestsNote}
                          onChange={e => setDraft(prev => ({ ...prev, interestsNote: e.target.value }))}
                          rows={3}
                        />
                      </Field>
                    </div>

                    <Field>
                      <Label className="text-sm">その他自由記述</Label>
                      <Textarea
                        value={draft.otherNote}
                        onChange={e => setDraft(prev => ({ ...prev, otherNote: e.target.value }))}
                        placeholder="自分を表すエピソードや将来やりたいことなど"
                        rows={3}
                      />
                    </Field>

                    <Button className="w-full gap-2" onClick={() => void saveSection("personality")} disabled={saveProfileMutation.isPending}>
                      <Save className="h-4 w-4" />
                      このセクションを保存
                    </Button>
                  </TabsContent>

                  <TabsContent value="custom" className="pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">カスタム質問</p>
                        <p className="text-xs text-muted-foreground">
                          QとAのセットで保存します。表示順は上下ボタンで変更できます。
                        </p>
                      </div>
                      <Button variant="secondary" className="gap-2" onClick={addCustomField}>
                        <Plus className="h-4 w-4" />
                        項目を追加
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {draft.customFields.length === 0 && (
                        <div className="rounded-lg border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                          まだ項目がありません。
                        </div>
                      )}
                      {draft.customFields
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .map((field, index) => (
                          <div
                            key={field.id}
                            className="space-y-3 rounded-lg border border-border/70 bg-background/70 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">#{index + 1}</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => moveCustomField(field.id, "up")}
                                  disabled={index === 0}
                                  aria-label="上に移動"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => moveCustomField(field.id, "down")}
                                  disabled={index === draft.customFields.length - 1}
                                  aria-label="下に移動"
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => removeCustomField(field.id)}
                                  aria-label="削除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <Field>
                              <Label className="text-sm">質問</Label>
                              <Input
                                value={field.question}
                                onChange={e => updateCustomField(field.id, { question: e.target.value })}
                                maxLength={100}
                                placeholder="例: よく見るメディアは？"
                              />
                            </Field>
                            <Field>
                              <Label className="text-sm">回答</Label>
                              <Textarea
                                value={field.answer}
                                onChange={e => updateCustomField(field.id, { answer: e.target.value })}
                                maxLength={1000}
                                rows={3}
                              />
                            </Field>
                          </div>
                        ))}
                    </div>
                    <Button className="w-full gap-2" onClick={() => void saveSection("custom")} disabled={saveProfileMutation.isPending}>
                      <Save className="h-4 w-4" />
                      このセクションを保存
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1 rounded-lg border border-border/60 bg-background/70 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

function TraitSection({ title, traits, note }: { title: string; traits: Trait[]; note?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <div className="flex flex-wrap gap-2">
          {traits.map(trait => (
            <Badge key={trait.id} variant="secondary" className="rounded-full border-dashed">
              {trait.label}
            </Badge>
          ))}
          {traits.length === 0 && <span className="text-xs text-muted-foreground">未設定</span>}
        </div>
      </div>
      {note && <p className="text-sm text-muted-foreground leading-relaxed">{note}</p>}
    </div>
  );
}

type TraitEditorProps = {
  title: string;
  kind: TraitKind;
  presets: string[];
  selected: string[];
  onToggle: (label: string) => void;
  newLabel: string;
  onNewLabelChange: (value: string) => void;
  onAdd: () => void;
};

function TraitEditor({ title, presets, selected, onToggle, newLabel, onNewLabelChange, onAdd }: TraitEditorProps) {
  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border/70 bg-background/70 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{title}（タグ）</p>
        <span className="text-[11px] text-muted-foreground">複数選択可</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map(label => {
          const active = selected.includes(label);
          return (
            <Toggle
              key={label}
              pressed={active}
              onPressedChange={() => onToggle(label)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                active ? "border-primary bg-primary/10 text-primary" : "border-border"
              )}
            >
              {label}
            </Toggle>
          );
        })}
      </div>
      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <Input
          placeholder="自由にタグを追加"
          value={newLabel}
          onChange={e => onNewLabelChange(e.target.value)}
          maxLength={50}
        />
        <Button variant="secondary" className="gap-2" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </div>
    </div>
  );
}
