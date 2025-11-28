export type TraitKind = "personality" | "strength" | "weakness" | "work_style";

export type Trait = {
  id: string;
  kind: TraitKind;
  label: string;
  description?: string;
};

export type Interest = {
  id: string;
  subject: string;
  detail?: string;
};

export type CustomField = {
  id: string;
  question: string;
  answer: string;
  order: number;
};

export type ProfileData = {
  fullName: string;
  nickname: string;
  prefecture: string;
  dateOfBirth?: string;
  oneLiner: string;
  personalityNote: string;
  strengthsNote: string;
  weaknessesNote: string;
  workStyleNote: string;
  interestsNote: string;
  otherNote: string;
  traits: Trait[];
  interests: Interest[];
  customFields: CustomField[];
};

export type ProfileRecord = {
  id?: number;
  userId: number;
  profile: ProfileData;
  createdAt?: Date;
  updatedAt?: Date;
};
