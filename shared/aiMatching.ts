export type FitLevel = "high" | "middle" | "low";

export type MatchingScores = {
  valuesFit: number;
  cultureFit: number;
  skillFit: number;
  motivationFit: number;
};

export type MatchingAdvice = {
  selection: string;
  research: string;
  questionsToAsk: string[];
};

export type AiMatchingResult = {
  totalScore: number;
  fitLevel: FitLevel;
  summary: string;
  scores: MatchingScores;
  strongPoints: string[];
  weakPoints: string[];
  advice: MatchingAdvice;
};

export type MatchingProfile = {
  basic: {
    name: string;
    nickname?: string;
    prefecture?: string;
    university?: string;
    faculty?: string;
    grade?: string;
  };
  personal: {
    personality: string;
    strengths: string[];
    weaknesses: string[];
    values: string;
  };
  studyAndSkill: {
    favoriteSubjects: string[];
    skills: string[];
    partTimeJobs: string[];
    activities: string[];
  };
  careerPreference: {
    interestedIndustries: string[];
    interestedJobTypes: string[];
    workStylePreference: string;
    locationPreference: string;
  };
};

export type MatchingCompanyResearch = {
  company: {
    id: string;
    name: string;
    industry?: string | null;
    businessDescription?: string | null;
    features: string[];
  };
  studentView: {
    whyInterested: string;
    attractivePoints: string[];
    concernsOrQuestions: string[];
    culturePerception: string;
    requiredPersonalityFromJD: string;
  };
};

export type AiMatchRequestInput = {
  profile: MatchingProfile;
  companyResearchId: number;
};

export const aiMatchingResultJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    totalScore: { type: "integer", minimum: 0, maximum: 100 },
    fitLevel: { type: "string", enum: ["high", "middle", "low"] },
    summary: { type: "string" },
    scores: {
      type: "object",
      additionalProperties: false,
      properties: {
        valuesFit: { type: "integer", minimum: 0, maximum: 100 },
        cultureFit: { type: "integer", minimum: 0, maximum: 100 },
        skillFit: { type: "integer", minimum: 0, maximum: 100 },
        motivationFit: { type: "integer", minimum: 0, maximum: 100 },
      },
      required: ["valuesFit", "cultureFit", "skillFit", "motivationFit"],
    },
    strongPoints: { type: "array", items: { type: "string" } },
    weakPoints: { type: "array", items: { type: "string" } },
    advice: {
      type: "object",
      additionalProperties: false,
      properties: {
        selection: { type: "string" },
        research: { type: "string" },
        questionsToAsk: { type: "array", items: { type: "string" } },
      },
      required: ["selection", "research", "questionsToAsk"],
    },
  },
  required: [
    "totalScore",
    "fitLevel",
    "summary",
    "scores",
    "strongPoints",
    "weakPoints",
    "advice",
  ],
} as const;
