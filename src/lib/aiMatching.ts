import type { ProfileData } from "@shared/profile";
import type { MatchingProfile } from "@shared/aiMatching";

const ensureArray = (values: string[], placeholder: string) => {
  const cleaned = values.map(v => v.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : [placeholder];
};

const splitToList = (text?: string | null) =>
  (text ?? "")
    .split(/\r?\n|、|，|・|;|；/)
    .map(item => item.trim())
    .filter(Boolean);

const mergeNotes = (...notes: Array<string | undefined>) =>
  notes
    .map(note => note?.trim())
    .filter(Boolean)
    .join(" / ");

export function toMatchingProfile(profile: ProfileData): MatchingProfile {
  const strengths = ensureArray(
    profile.traits.filter(t => t.kind === "strength").map(t => t.label),
    "強みは未入力（マイプロフィールで設定してください）",
  );

  const weaknesses = ensureArray(
    profile.traits.filter(t => t.kind === "weakness").map(t => t.label),
    "弱みは未入力（マイプロフィールで設定してください）",
  );

  const favoriteSubjects = ensureArray(
    profile.interests.map(interest =>
      interest.detail ? `${interest.subject}（${interest.detail}）` : interest.subject
    ),
    "好きな科目・分野は未入力",
  );

  const skills = ensureArray(
    splitToList(profile.strengthsNote || profile.oneLiner),
    "スキルメモは未入力",
  );

  const activities = ensureArray(
    [
      ...splitToList(profile.interestsNote),
      ...profile.customFields
        .filter(field => field.question || field.answer)
        .map(field =>
          [field.question, field.answer].filter(Boolean).join(": ").trim()
        ),
    ],
    "活動メモは未入力",
  );

  const valuesText =
    mergeNotes(profile.workStyleNote, profile.personalityNote, profile.otherNote) ||
    "価値観メモは未入力";

  const workStylePreference =
    profile.workStyleNote?.trim() ||
    profile.personalityNote?.trim() ||
    "働き方の希望は未入力";

  const locationPreference = profile.prefecture || "希望勤務地は未入力";

  return {
    basic: {
      name: profile.fullName,
      nickname: profile.nickname,
      prefecture: profile.prefecture,
      university: "",
      faculty: "",
      grade: "",
    },
    personal: {
      personality: profile.personalityNote || profile.oneLiner || "未入力",
      strengths,
      weaknesses,
      values: valuesText,
    },
    studyAndSkill: {
      favoriteSubjects,
      skills,
      partTimeJobs: [],
      activities,
    },
    careerPreference: {
      interestedIndustries: [],
      interestedJobTypes: [],
      workStylePreference,
      locationPreference,
    },
  };
}
