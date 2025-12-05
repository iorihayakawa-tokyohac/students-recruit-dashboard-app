import type { ProfileData } from "@shared/profile";
import type { MatchingProfile } from "@shared/aiMatching";

const toSafeString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const toSafeList = <T>(value: T[] | null | undefined): T[] =>
  Array.isArray(value) ? value : [];

const ensureArray = (values: string[], placeholder = "未入力") => {
  const cleaned = values.map(v => v.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : [placeholder];
};

const splitToList = (text?: unknown) =>
  toSafeString(text)
    .split(/\r?\n|、|，|・|;|；/)
    .map(item => item.trim())
    .filter(Boolean);

const mergeNotes = (...notes: Array<unknown>) =>
  notes
    .map(note => toSafeString(note).trim())
    .filter(Boolean)
    .join(" / ");

export function toMatchingProfile(profile: ProfileData): MatchingProfile {
  const traits = toSafeList(profile.traits);
  const interests = toSafeList(profile.interests);
  const customFields = toSafeList(profile.customFields);
  const primaryName = toSafeString(profile.fullName) || toSafeString(profile.nickname) || "未入力";

  const strengths = ensureArray(
    traits
      .filter(t => t.kind === "strength")
      .map(t => toSafeString(t.label))
      .filter(Boolean),
    "強みは未入力（マイプロフィールで設定してください）",
  );

  const weaknesses = ensureArray(
    traits
      .filter(t => t.kind === "weakness")
      .map(t => toSafeString(t.label))
      .filter(Boolean),
    "弱みは未入力（マイプロフィールで設定してください）",
  );

  const favoriteSubjects = ensureArray(
    interests.map(interest => {
      const subject = toSafeString(interest.subject);
      const detail = toSafeString((interest as any).detail);
      return subject && detail ? `${subject}（${detail}）` : subject;
    }).filter(Boolean),
    "好きな科目・分野は未入力",
  );

  const skills = ensureArray(
    splitToList(toSafeString(profile.strengthsNote) || toSafeString(profile.oneLiner)),
    "スキルメモは未入力",
  );

  const activities = ensureArray(
    [
      ...splitToList(profile.interestsNote),
      ...customFields
        .filter(field => toSafeString(field.question) || toSafeString(field.answer))
        .map(field => {
          const question = toSafeString(field.question);
          const answer = toSafeString(field.answer);
          return [question, answer].filter(Boolean).join(": ").trim();
        }),
    ],
    "活動メモは未入力",
  );

  const valuesText =
    mergeNotes(profile.workStyleNote, profile.personalityNote, profile.otherNote) ||
    "価値観メモは未入力";

  const workStylePreference =
    toSafeString(profile.workStyleNote).trim() ||
    toSafeString(profile.personalityNote).trim() ||
    "働き方の希望は未入力";

  const locationPreference = toSafeString(profile.prefecture) || "希望勤務地は未入力";

  return {
    basic: {
      name: primaryName,
      nickname: toSafeString(profile.nickname),
      prefecture: toSafeString(profile.prefecture),
      university: "",
      faculty: "",
      grade: "",
    },
    personal: {
      personality: toSafeString(profile.personalityNote) || toSafeString(profile.oneLiner) || "未入力",
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
