import type { MatchingProfile, MatchingCompanyResearch, AiMatchingResult } from "@shared/aiMatching";
import { aiMatchingResultJsonSchema } from "@shared/aiMatching";
import type { CompanyResearchListItem } from "../db";
import { invokeLLM } from "../_core/llm";

const ensureList = (values: string[], placeholder: string) => {
  const cleaned = values.map(v => v.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : [placeholder];
};

const splitToList = (text?: string | null) =>
  (text ?? "")
    .split(/\r?\n|、|，|・|;|；/)
    .map(item => item.trim())
    .filter(Boolean);

const mergeText = (...parts: Array<string | null | undefined>) =>
  parts
    .map(part => part?.trim())
    .filter(Boolean)
    .join(" / ");

const buildCompanyResearchPayload = (
  research: CompanyResearchListItem
): MatchingCompanyResearch => {
  const companyName = research.linkedCompanyName || research.companyName;
  const businessDescription = mergeText(research.q1Overview, research.q2BusinessModel);

  const features = ensureList(
    splitToList(research.q3Strengths),
    "特徴・強みは未入力",
  );

  const attractivePoints = ensureList(
    [
      ...splitToList(research.q11WhyThisCompany),
      ...splitToList(research.q3Strengths),
      research.q4DesiredPosition ? `希望ポジション: ${research.q4DesiredPosition}` : "",
      research.q6PersonalStrengths || "",
    ],
    "魅力に感じた点は未入力",
  );

  const concerns = [
    ...splitToList(research.q13Concerns),
    ...splitToList(research.q14ResolutionPlan).map(
      item => `確認・解消の予定: ${item}`
    ),
  ];

  const culturePerception =
    research.q12ValuesFit?.trim() || "文化や価値観に関する記述は未入力";

  const requiredPersonality =
    mergeText(research.q5RoleExpectations, research.q9EvaluationPoints) ||
    "求める人物像・評価ポイントは未入力";

  const whyInterested =
    research.q10Motivation?.trim() ||
    research.q1Overview?.trim() ||
    "興味を持った理由は未入力";

  return {
    company: {
      id: research.companyId ? `company-${research.companyId}` : `research-${research.id}`,
      name: companyName,
      industry: research.companyIndustry,
      businessDescription: businessDescription || null,
      features,
    },
    studentView: {
      whyInterested,
      attractivePoints,
      concernsOrQuestions: ensureList(concerns, "懸念・確認したい点は未入力"),
      culturePerception,
      requiredPersonalityFromJD: requiredPersonality,
    },
  };
};

const buildPrompt = (
  profileJson: MatchingProfile,
  companyResearchJson: MatchingCompanyResearch
) => {
  const profileStr = JSON.stringify(profileJson, null, 2);
  const researchStr = JSON.stringify(companyResearchJson, null, 2);

  return `あなたは「新卒就活生向けキャリアアドバイザー」です。
これから「学生のプロフィール情報」と「学生自身が行った企業研究の内容」を渡します。

目的：
- 学生と企業との相性を、多角的な観点から評価し、
- 採用可否ではなく、「学生目線でのフィット感」と「次に何をすべきか」を示すことです。

前提ルール：
- 出力は必ず JSON形式のみ とし、説明文や補足文は一切含めないこと。
- 想像で企業の実情を補わず、与えられた情報の範囲で論理的に評価すること。
- 不明点が多い場合は、その旨を「weakPoints」や「advice」に明示すること。
- 評価は「企業にとって都合がよいか」ではなく、「学生本人にとって幸せか」の観点を重視すること。
- 学生は新卒であり、完璧なスキルセットを前提としないこと。

評価の観点：
1. 価値観・ビジョンの一致度（valuesFit）
2. 組織風土・働き方とのフィット感（cultureFit）
3. スキル・得意分野と、企業が求める人物像・業務内容の一致度（skillFit）
4. 志望動機や興味の方向性の一貫性（motivationFit）

出力フォーマット：
以下のJSON構造「のみ」を出力してください。

{
  "totalScore": number,       // 0〜100の整数
  "fitLevel": "high" | "middle" | "low",
  "summary": string,
  "scores": {
    "valuesFit": number,      // 0〜100の整数
    "cultureFit": number,     // 0〜100の整数
    "skillFit": number,       // 0〜100の整数
    "motivationFit": number   // 0〜100の整数
  },
  "strongPoints": string[],
  "weakPoints": string[],
  "advice": {
    "selection": string,
    "research": string,
    "questionsToAsk": string[]
  }
}

スコアリングの基準：
- 80〜100: 「かなりフィットしている」と考えられる
- 60〜79: 「一定程度フィットしているが、確認ポイントあり」
- 40〜59: 「良い点もあるが、慎重な検討が必要」
- 0〜39: 「現時点ではミスマッチの可能性が高い」

totalScoreの決め方：
- 基本的には、各サブスコア（valuesFit, cultureFit, skillFit, motivationFit）の平均値を参考にしつつ、
  強み・弱みのバランスを踏まえて、総合的な印象として0〜100で決定してください。
- fitLevelは、totalScoreに応じておおよそ以下のように設定してください。
  - 80〜100: "high"
  - 60〜79: "middle"
  - 0〜59 : "low"

strongPoints / weakPoints / adviceの書き方：
- strongPoints: 学生と企業が特によく合っていると考えられる具体的なポイントを、1〜5個程度の箇条書きで示してください。
- weakPoints: ギャップや注意が必要な点を、1〜5個程度の箇条書きで示してください。
- advice.selection: 選考を受ける場合に、自己PRやガクチカで強調するとよいポイント、注意すべきポイントを簡潔にまとめてください。
- advice.research: 学生が追加で調べるべき観点（例：部署ごとの働き方、育成方針など）をまとめてください。
- advice.questionsToAsk: OB訪問や面接で実際に質問できる形の問いを、2〜5個程度記載してください。

---

【学生プロフィール】
${profileStr}

【企業研究（学生が入力した内容）】
${researchStr}

---
上記の情報に基づき、必ず指定したJSON形式だけを出力してください。`;
};

const parseResponseContent = (content: string | Array<{ type: string; text?: string }>) => {
  if (typeof content === "string") return content;
  return content
    .map(part => ("text" in part && part.text ? part.text : ""))
    .join("\n");
};

export async function runAiMatching(
  profileJson: MatchingProfile,
  research: CompanyResearchListItem
): Promise<AiMatchingResult> {
  const companyResearchJson = buildCompanyResearchPayload(research);
  const prompt = buildPrompt(profileJson, companyResearchJson);

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "あなたは学生の志向性と企業研究からフィット度を評価するキャリアアドバイザーです。必ずJSONのみで返答してください。" },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "AiMatchingResult",
        schema: aiMatchingResultJsonSchema as Record<string, unknown>,
        strict: true,
      },
    },
  });

  const firstChoice = response.choices?.[0];
  const messageContent = firstChoice?.message?.content;
  if (!messageContent) {
    throw new Error("LLM returned empty response");
  }

  const contentText = parseResponseContent(messageContent);
  try {
    return JSON.parse(contentText) as AiMatchingResult;
  } catch (error) {
    throw new Error(`Failed to parse AI response as JSON: ${(error as Error).message}`);
  }
}
