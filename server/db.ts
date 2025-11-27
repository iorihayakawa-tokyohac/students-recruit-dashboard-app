import type {
  InsertUser,
  User,
  InsertCompany,
  Company,
  InsertTask,
  Task,
  InsertNote,
  Note,
  InsertCompanyResearch,
  CompanyResearch,
  InsertEvent,
  Event,
  InsertNotificationPreference,
  NotificationPreference,
  InsertSelectionStep,
  SelectionStep,
  InsertStudent,
  Student,
  RoadmapDefinition,
  RoadmapStep,
  RoadmapInstance,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getFirebaseAdminApp } from "./_core/firebaseAdmin";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";

type FirestoreDate = Date | Timestamp | FieldValue | null | undefined;

type CollectionName =
  | "users"
  | "companies"
  | "tasks"
  | "notes"
  | "companyResearches"
  | "events"
  | "notificationPreferences"
  | "selectionSteps"
  | "students"
  | "roadmapDefinitions"
  | "roadmapSteps"
  | "roadmapInstances";

function db() {
  return getFirestore(getFirebaseAdminApp());
}

function toDate(value: FirestoreDate): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof (value as any)?.toDate === "function") return (value as any).toDate();
  const parsed = new Date(value as any);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeDoc<T extends { id?: number; createdAt?: Date; updatedAt?: Date }>(
  doc: FirebaseFirestore.DocumentSnapshot,
): T {
  const data = doc.data() ?? {};
  const idValue = (data as any).id ?? parseInt(doc.id, 10);
  return {
    ...(data as any),
    id: Number.isFinite(idValue) ? Number(idValue) : undefined,
    createdAt: toDate((data as any).createdAt) ?? new Date(),
    updatedAt: toDate((data as any).updatedAt) ?? new Date(),
  } as T;
}

async function nextId(collection: CollectionName): Promise<number> {
  const countersRef = db().collection("_meta").doc("counters");
  return db().runTransaction(async tx => {
    const snap = await tx.get(countersRef);
    const current = (snap.data()?.[collection] as number | undefined) ?? 0;
    const next = current + 1;
    tx.set(countersRef, { [collection]: next }, { merge: true });
    return next;
  });
}

function now() {
  return new Date();
}

// Helpers
async function getDocById<T extends { id?: number }>(collection: CollectionName, id: number | string) {
  const snap = await db().collection(collection).doc(String(id)).get();
  if (!snap.exists) return undefined;
  return normalizeDoc<T>(snap);
}

async function queryByUser<T extends { id?: number }>(collection: CollectionName, userId: number) {
  const snap = await db().collection(collection).where("userId", "==", userId).get();
  return snap.docs.map(doc => normalizeDoc<T>(doc));
}

async function assertCompanyOwnership(userId: number, companyId: number) {
  const company = await getDocById<Company>("companies", companyId);
  if (!company || company.userId !== userId) {
    throw new Error("Company not found");
  }
}

// Users
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const firestore = db();
  const userRef = firestore.collection("users").doc(user.openId);
  const normalizedEmail = user.email?.trim().toLowerCase();

  const existingSnap = await userRef.get();
  let existing = existingSnap.exists ? (normalizeDoc<User>(existingSnap) as User) : null;
  let id = existing?.id;

  if (!id) {
    id = await nextId("users");
  }

  const nowValue = now();
  const values: Partial<User> = {
    id,
    openId: user.openId,
    name: user.name ?? existing?.name ?? null,
    email: normalizedEmail ?? existing?.email ?? null,
    loginMethod: user.loginMethod ?? existing?.loginMethod ?? null,
    role: user.role ?? existing?.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
    lastSignedIn: user.lastSignedIn ?? existing?.lastSignedIn ?? nowValue,
    createdAt: existing?.createdAt ?? nowValue,
    updatedAt: nowValue,
  };

  await userRef.set(values, { merge: true });
}

export async function getUserByOpenId(openId: string) {
  const snap = await db().collection("users").doc(openId).get();
  if (!snap.exists) return undefined;
  return normalizeDoc<User>(snap);
}

export async function getUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const snap = await db().collection("users").where("email", "==", normalizedEmail).limit(1).get();
  const doc = snap.docs[0];
  return doc ? normalizeDoc<User>(doc) : undefined;
}

// Companies
export async function getCompaniesByUserId(userId: number) {
  const companies = await queryByUser<Company>("companies", userId);
  return companies.sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
}

export async function getCompanyById(companyId: number, userId: number) {
  const company = await getDocById<Company>("companies", companyId);
  if (!company || company.userId !== userId) return undefined;
  return company;
}

export async function createCompany(data: InsertCompany) {
  const firestore = db();
  const id = await nextId("companies");
  const nowValue = now();
  const payload: Company = {
    ...data,
    id,
    status: data.status ?? "未エントリー",
    priority: data.priority ?? "B",
    createdAt: nowValue,
    updatedAt: nowValue,
  } as Company;
  await firestore.collection("companies").doc(String(id)).set(payload);
  return { insertId: id, result: payload };
}

export async function updateCompany(companyId: number, userId: number, data: Partial<InsertCompany>) {
  await assertCompanyOwnership(userId, companyId);
  await db()
    .collection("companies")
    .doc(String(companyId))
    .set({ ...data, updatedAt: now() }, { merge: true });
}

export async function deleteCompany(companyId: number, userId: number) {
  await assertCompanyOwnership(userId, companyId);
  const firestore = db();

  const batch = firestore.batch();
  const eventsSnap = await firestore
    .collection("events")
    .where("companyId", "==", companyId)
    .where("userId", "==", userId)
    .get();
  eventsSnap.forEach(doc => batch.update(doc.ref, { companyId: null, updatedAt: now() }));

  const stepsSnap = await firestore
    .collection("selectionSteps")
    .where("companyId", "==", companyId)
    .where("userId", "==", userId)
    .get();
  stepsSnap.forEach(doc => batch.delete(doc.ref));

  batch.delete(firestore.collection("companies").doc(String(companyId)));
  await batch.commit();
}

// Tasks
export async function getTasksByUserId(userId: number) {
  const records = await queryByUser<Task>("tasks", userId);
  return records.sort((a, b) => (toDate(b.dueDate)?.getTime() || 0) - (toDate(a.dueDate)?.getTime() || 0));
}

export async function getTaskById(taskId: number, userId: number) {
  const task = await getDocById<Task>("tasks", taskId);
  if (!task || task.userId !== userId) return undefined;
  return task;
}

export async function createTask(data: InsertTask) {
  const firestore = db();
  const id = await nextId("tasks");
  const nowValue = now();
  const payload: Task = { ...data, status: data.status ?? "open", id, createdAt: nowValue, updatedAt: nowValue } as Task;
  await firestore.collection("tasks").doc(String(id)).set(payload);
  return payload;
}

export async function updateTask(taskId: number, userId: number, data: Partial<InsertTask>) {
  const existing = await getTaskById(taskId, userId);
  if (!existing) throw new Error("Task not found");
  await db().collection("tasks").doc(String(taskId)).set({ ...data, updatedAt: now() }, { merge: true });
}

export async function deleteTask(taskId: number, userId: number) {
  const existing = await getTaskById(taskId, userId);
  if (!existing) throw new Error("Task not found");
  await db().collection("tasks").doc(String(taskId)).delete();
}

// Events
export async function getEventById(eventId: number, userId: number) {
  const event = await getDocById<Event>("events", eventId);
  if (!event || event.userId !== userId) return undefined;
  return event;
}

export async function listEventsInRange(
  userId: number,
  params: { from: Date; to: Date; companyId?: number; types?: InsertEvent["type"][] },
) {
  const events = await queryByUser<Event>("events", userId);
  return events
    .filter(evt => {
      const startAt = toDate(evt.startAt);
      if (!startAt) return false;
      if (startAt < params.from || startAt > params.to) return false;
      if (params.companyId && evt.companyId !== params.companyId) return false;
      if (params.types && params.types.length > 0 && !params.types.includes(evt.type)) return false;
      return true;
    })
    .sort((a, b) => (toDate(a.startAt)?.getTime() || 0) - (toDate(b.startAt)?.getTime() || 0));
}

export async function getUpcomingEvents(userId: number, days: number = 7) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  end.setHours(23, 59, 59, 999);
  return listEventsInRange(userId, { from: start, to: end });
}

export async function createEvent(data: InsertEvent) {
  if (data.companyId) {
    await assertCompanyOwnership(data.userId, data.companyId);
  }
  const firestore = db();
  const id = await nextId("events");
  const nowValue = now();
  const payload: Event = {
    ...data,
    id,
    remindBeforeDays: data.remindBeforeDays ?? 1,
    remindOnDay: data.remindOnDay ?? true,
    createdAt: nowValue,
    updatedAt: nowValue,
  } as Event;
  await firestore.collection("events").doc(String(id)).set(payload);
  return { insertId: id, result: payload };
}

export async function updateEvent(eventId: number, userId: number, data: Partial<InsertEvent>) {
  const current = await getEventById(eventId, userId);
  if (!current) throw new Error("Event not found");
  if (data.companyId) {
    await assertCompanyOwnership(userId, data.companyId);
  }
  await db().collection("events").doc(String(eventId)).set({ ...data, updatedAt: now() }, { merge: true });
}

export async function deleteEvent(eventId: number, userId: number) {
  const current = await getEventById(eventId, userId);
  if (!current) throw new Error("Event not found");
  await db().collection("events").doc(String(eventId)).delete();
}

// Notes
export async function getNotesByCompanyId(companyId: number, userId: number) {
  const records = await queryByUser<Note>("notes", userId);
  return records
    .filter(note => note.companyId === companyId)
    .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
}

export async function getNoteById(noteId: number, userId: number) {
  const note = await getDocById<Note>("notes", noteId);
  if (!note || note.userId !== userId) return undefined;
  return note;
}

export async function createNote(data: InsertNote) {
  const firestore = db();
  const id = await nextId("notes");
  const nowValue = now();
  const payload: Note = { ...data, id, createdAt: nowValue, updatedAt: nowValue, type: data.type ?? "other" } as Note;
  await firestore.collection("notes").doc(String(id)).set(payload);
  return payload;
}

export async function updateNote(noteId: number, userId: number, data: Partial<InsertNote>) {
  const existing = await getNoteById(noteId, userId);
  if (!existing) throw new Error("Note not found");
  await db().collection("notes").doc(String(noteId)).set({ ...data, updatedAt: now() }, { merge: true });
}

export async function deleteNote(noteId: number, userId: number) {
  const existing = await getNoteById(noteId, userId);
  if (!existing) throw new Error("Note not found");
  await db().collection("notes").doc(String(noteId)).delete();
}

// Notification Preferences
export async function getNotificationPreference(userId: number): Promise<NotificationPreference> {
  const snap = await db().collection("notificationPreferences").doc(String(userId)).get();
  if (!snap.exists) {
    return { userId, emailEnabled: false, overrideEmail: null, createdAt: now(), updatedAt: now() } as NotificationPreference;
  }
  return normalizeDoc<NotificationPreference>(snap);
}

export async function upsertNotificationPreference(userId: number, data: Partial<InsertNotificationPreference>) {
  const nowValue = now();
  const values: InsertNotificationPreference = {
    userId,
    emailEnabled: data.emailEnabled ?? false,
    overrideEmail: data.overrideEmail ?? null,
  };
  await db()
    .collection("notificationPreferences")
    .doc(String(userId))
    .set({ ...values, updatedAt: nowValue, createdAt: nowValue }, { merge: true });
}

// Selection steps
export async function listSelectionStepsByCompany(companyId: number, userId: number) {
  await assertCompanyOwnership(userId, companyId);
  const records = await queryByUser<SelectionStep>("selectionSteps", userId);
  return records
    .filter(step => step.companyId === companyId)
    .sort((a, b) => (a.order - b.order) || ((a.id ?? 0) - (b.id ?? 0)));
}

export async function createSelectionStep(data: Omit<InsertSelectionStep, "order"> & { order?: number }) {
  await assertCompanyOwnership(data.userId, data.companyId);
  const firestore = db();
  const records = await listSelectionStepsByCompany(data.companyId, data.userId);
  const orderValue = data.order ?? ((records[records.length - 1]?.order ?? 0) + 1);
  const id = await nextId("selectionSteps");
  const nowValue = now();
  const payload: SelectionStep = {
    ...data,
    order: orderValue,
    status: data.status ?? "not_started",
    id,
    createdAt: nowValue,
    updatedAt: nowValue,
  } as SelectionStep;
  await firestore.collection("selectionSteps").doc(String(id)).set(payload);
  await recomputeCompanyProgress(data.companyId, data.userId);
  return payload;
}

export async function updateSelectionStep(stepId: number, userId: number, data: Partial<InsertSelectionStep>) {
  const current = await getDocById<SelectionStep>("selectionSteps", stepId);
  if (!current || current.userId !== userId) throw new Error("Selection step not found");
  const targetCompanyId = data.companyId ?? current.companyId;
  await assertCompanyOwnership(userId, targetCompanyId);
  await db().collection("selectionSteps").doc(String(stepId)).set({ ...data, updatedAt: now() }, { merge: true });
  await recomputeCompanyProgress(targetCompanyId, userId);
}

export async function deleteSelectionStep(stepId: number, userId: number) {
  const existing = await getDocById<SelectionStep>("selectionSteps", stepId);
  if (!existing || existing.userId !== userId) return;
  await db().collection("selectionSteps").doc(String(stepId)).delete();
  await recomputeCompanyProgress(existing.companyId, userId);
}

// Roadmap helpers
const defaultStudentRoadmapDefinition: RoadmapDefinition = {
  id: 1,
  key: "student_support_default",
  title: "就活ロードマップ",
  description: "学生本人が自分の進捗を管理するための標準フロー",
  entityType: "student",
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

const defaultStudentRoadmapSteps: RoadmapStep[] = [
  {
    id: 1,
    roadmapId: 1,
    order: 1,
    title: "自己理解・キャリアの方向性決定",
    description: "自己理解を深め、将来像の仮説をつくるフェーズ",
    taskExamples: JSON.stringify(["自己分析", "ガクチカ整理", "強み弱み整理", "将来像のラフ設計"]),
    nextActions: JSON.stringify(["自己分析シートを埋める", "ガクチカを3パターン書き出す", "強み3つ/弱み3つをメモする"]),
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
  {
    id: 2,
    roadmapId: 1,
    order: 2,
    title: "業界研究・企業研究",
    description: "業界や企業を幅広く理解し、受ける候補を整理するフェーズ",
    taskExamples: JSON.stringify(["業界マップを見る", "気になる企業をストック", "受ける可能性のある企業を一覧化"]),
    nextActions: JSON.stringify(["気になる企業を5社ピックアップ", "業界比較のメモを作成"]),
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
  {
    id: 3,
    roadmapId: 1,
    order: 3,
    title: "ES・書類対策",
    description: "提出物の質を高め、締切に備えるフェーズ",
    taskExamples: JSON.stringify(["ESドラフトの作成", "自己PR／志望動機を整える", "過去応募企業のES管理"]),
    nextActions: JSON.stringify(["今週提出予定のESを登録", "志望動機テンプレートを作成"]),
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
  {
    id: 4,
    roadmapId: 1,
    order: 4,
    title: "面接・Webテスト対策",
    description: "面接・筆記に備え、アウトプットを磨くフェーズ",
    taskExamples: JSON.stringify(["模擬面接", "面接想定問答の作成", "Webテスト対策"]),
    nextActions: JSON.stringify(["想定問答を10問埋める", "模擬面接の日程を決める"]),
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
  {
    id: 5,
    roadmapId: 1,
    order: 5,
    title: "エントリー・選考管理",
    description: "エントリー先と日程・締切を整理し、抜け漏れを防ぐフェーズ",
    taskExamples: JSON.stringify(["エントリーした企業一覧", "面接日程管理", "提出期限のリマインド"]),
    nextActions: JSON.stringify(["受験企業の締切を入力", "面接日程をカレンダーに登録"]),
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
  {
    id: 6,
    roadmapId: 1,
    order: 6,
    title: "内定比較・意思決定",
    description: "内定を比較し、自分の評価軸で意思決定するフェーズ",
    taskExamples: JSON.stringify(["内定企業一覧", "評価軸を使った比較", "入社意思の決定"]),
    nextActions: JSON.stringify(["評価軸シートを作る", "意思決定期限を設定する"]),
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
  {
    id: 7,
    roadmapId: 1,
    order: 7,
    title: "入社準備",
    description: "入社前の手続き・生活準備を進めるフェーズ",
    taskExamples: JSON.stringify(["住まい・書類の準備", "提出書類の管理", "入社前にやることリスト"]),
    nextActions: JSON.stringify(["入社前TODOを洗い出す", "必要書類をリスト化"]),
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
];

type ParsedRoadmapStep = RoadmapStep & {
  tasks: string[];
  nextActionsList: string[];
};

export type StudentWithRoadmap = Student & {
  roadmapDefinition?: RoadmapDefinition;
  roadmapInstance?: RoadmapInstance;
  steps: ParsedRoadmapStep[];
  currentStep?: ParsedRoadmapStep;
  progress: {
    currentIndex: number;
    total: number;
  };
};

function parseTextArray(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(item => typeof item === "string");
    }
  } catch (error) {
    console.warn("[Database] Failed to parse roadmap step array:", error);
  }
  return [];
}

function enrichStep(step: RoadmapStep): ParsedRoadmapStep {
  return {
    ...step,
    tasks: parseTextArray(step.taskExamples),
    nextActionsList: parseTextArray(step.nextActions),
  };
}

function buildFallbackStudents(userId: number): StudentWithRoadmap[] {
  const nowValue = now();
  const definition: RoadmapDefinition = { ...defaultStudentRoadmapDefinition, createdAt: nowValue, updatedAt: nowValue };
  const steps = defaultStudentRoadmapSteps.map(enrichStep);
  const tanaka: Student = {
    id: 101,
    userId,
    name: "田中 陽菜",
    university: "早稲田大学",
    graduationYear: 2026,
    desiredIndustry: "IT / コンサル",
    note: "成長環境を重視。まずはキャリアヒアリングを希望。",
    createdAt: nowValue,
    updatedAt: nowValue,
  };
  const sato: Student = {
    id: 102,
    userId,
    name: "佐藤 海斗",
    university: "京都大学",
    graduationYear: 2026,
    desiredIndustry: "メーカー / モビリティ",
    note: "プロダクト志向で、実地に近い経験を求めている。",
    createdAt: nowValue,
    updatedAt: nowValue,
  };
  const currentStep = steps.find(step => step.order === 4) ?? steps[0];
  const altStep = steps.find(step => step.order === 3) ?? currentStep;
  const instances: RoadmapInstance[] = [
    {
      id: 201,
      roadmapId: definition.id,
      entityType: "student",
      entityId: tanaka.id,
      userId,
      currentStepId: currentStep?.id ?? null,
      status: "active",
      createdAt: nowValue,
      updatedAt: nowValue,
    },
    {
      id: 202,
      roadmapId: definition.id,
      entityType: "student",
      entityId: sato.id,
      userId,
      currentStepId: altStep?.id ?? null,
      status: "active",
      createdAt: nowValue,
      updatedAt: nowValue,
    },
  ];

  return [tanaka, sato].map(student => {
    const instance = instances.find(i => i.entityId === student.id);
    const orderedSteps = steps.slice().sort((a, b) => a.order - b.order || a.id - b.id);
    const currentStepData = orderedSteps.find(step => step.id === instance?.currentStepId) ?? orderedSteps[0];
    const currentIndex = currentStepData ? orderedSteps.findIndex(step => step.id === currentStepData.id) : -1;
    return {
      ...student,
      roadmapDefinition: definition,
      roadmapInstance: instance,
      steps: orderedSteps,
      currentStep: currentStepData,
      progress: { currentIndex: Math.max(currentIndex, 0), total: orderedSteps.length },
    };
  });
}

async function ensureDefaultStudentRoadmapFirestore() {
  const firestore = db();
  const defRef = firestore.collection("roadmapDefinitions").doc(String(defaultStudentRoadmapDefinition.id));
  const defSnap = await defRef.get();
  let definition: RoadmapDefinition;
  if (!defSnap.exists) {
    const nowValue = now();
    definition = { ...defaultStudentRoadmapDefinition, createdAt: nowValue, updatedAt: nowValue };
    await defRef.set(definition);
  } else {
    definition = normalizeDoc<RoadmapDefinition>(defSnap);
  }

  const stepsSnap = await firestore
    .collection("roadmapSteps")
    .where("roadmapId", "==", definition.id)
    .get();
  if (stepsSnap.empty) {
    const batch = firestore.batch();
    defaultStudentRoadmapSteps.forEach(step => {
      batch.set(firestore.collection("roadmapSteps").doc(String(step.id)), step);
    });
    await batch.commit();
  }
  const refreshedStepsSnap = await firestore.collection("roadmapSteps").where("roadmapId", "==", definition.id).get();
  const steps = refreshedStepsSnap.docs.map(doc => enrichStep(normalizeDoc<RoadmapStep>(doc)));
  steps.sort((a, b) => a.order - b.order || a.id - b.id);
  return { definition, steps };
}

async function seedStudentsIfEmpty(userId: number, roadmap: { definition: RoadmapDefinition; steps: ParsedRoadmapStep[] }) {
  const firestore = db();
  const existing = await firestore.collection("students").where("userId", "==", userId).limit(1).get();
  if (!existing.empty) return;

  const sampleStudents: InsertStudent[] = [
    {
      userId,
      name: "田中 陽菜",
      university: "早稲田大学",
      graduationYear: 2026,
      desiredIndustry: "IT / コンサル",
      note: "成長環境を重視。まずはキャリアヒアリングを希望。",
    },
    {
      userId,
      name: "佐藤 海斗",
      university: "京都大学",
      graduationYear: 2026,
      desiredIndustry: "メーカー / モビリティ",
      note: "プロダクト志向で、実地に近い経験を求めている。",
    },
  ];

  const batch = firestore.batch();
  const studentIds: number[] = [];
  for (const student of sampleStudents) {
    const id = await nextId("students");
    studentIds.push(id);
    const nowValue = now();
    batch.set(firestore.collection("students").doc(String(id)), {
      ...student,
      id,
      createdAt: nowValue,
      updatedAt: nowValue,
    });
  }
  await batch.commit();

  const defaultStepId = roadmap.steps.find(step => step.order === 4)?.id ?? roadmap.steps[0]?.id ?? null;
  const secondaryStepId = roadmap.steps.find(step => step.order === 3)?.id ?? defaultStepId;

  const instanceBatch = firestore.batch();
  if (studentIds[0] && defaultStepId) {
    const id = await nextId("roadmapInstances");
    instanceBatch.set(firestore.collection("roadmapInstances").doc(String(id)), {
      id,
      roadmapId: roadmap.definition.id,
      entityType: "student",
      entityId: studentIds[0],
      userId,
      currentStepId: defaultStepId,
      status: "active",
      createdAt: now(),
      updatedAt: now(),
    } as RoadmapInstance);
  }
  if (studentIds[1] && secondaryStepId) {
    const id = await nextId("roadmapInstances");
    instanceBatch.set(firestore.collection("roadmapInstances").doc(String(id)), {
      id,
      roadmapId: roadmap.definition.id,
      entityType: "student",
      entityId: studentIds[1],
      userId,
      currentStepId: secondaryStepId,
      status: "active",
      createdAt: now(),
      updatedAt: now(),
    } as RoadmapInstance);
  }
  await instanceBatch.commit();
}

async function ensureInstancesForStudents(
  userId: number,
  studentList: Student[],
  roadmap: { definition: RoadmapDefinition; steps: ParsedRoadmapStep[] },
) {
  const firestore = db();
  if (!studentList.length) return [] as RoadmapInstance[];
  const ids = studentList.map(student => student.id);
  const snap = await firestore
    .collection("roadmapInstances")
    .where("entityType", "==", "student")
    .where("userId", "==", userId)
    .get();
  const existing = snap.docs.map(doc => normalizeDoc<RoadmapInstance>(doc)).filter(instance => ids.includes(instance.entityId));

  const missing = studentList.filter(student => !existing.some(instance => instance.entityId === student.id));
  if (missing.length) {
    const defaultStepId = roadmap.steps.find(step => step.order === 4)?.id ?? roadmap.steps[0]?.id ?? null;
    const batch = firestore.batch();
    for (const student of missing) {
      if (!defaultStepId) continue;
      const id = await nextId("roadmapInstances");
      batch.set(firestore.collection("roadmapInstances").doc(String(id)), {
        id,
        roadmapId: roadmap.definition.id,
        entityType: "student",
        entityId: student.id,
        userId,
        currentStepId: defaultStepId,
        status: "active",
        createdAt: now(),
        updatedAt: now(),
      } as RoadmapInstance);
    }
    await batch.commit();
    const refreshed = await firestore
      .collection("roadmapInstances")
      .where("entityType", "==", "student")
      .where("userId", "==", userId)
      .get();
    return refreshed.docs.map(doc => normalizeDoc<RoadmapInstance>(doc)).filter(instance => ids.includes(instance.entityId));
  }

  return existing;
}

export async function listStudentsWithRoadmap(userId: number): Promise<StudentWithRoadmap[]> {
  try {
    const defaultRoadmap = await ensureDefaultStudentRoadmapFirestore();
    await seedStudentsIfEmpty(userId, defaultRoadmap);

    const studentsSnap = await db().collection("students").where("userId", "==", userId).get();
    const studentRows = studentsSnap.docs.map(doc => normalizeDoc<Student>(doc)).sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
    if (!studentRows.length) return buildFallbackStudents(userId);

    const instances = await ensureInstancesForStudents(userId, studentRows, defaultRoadmap);
    const roadmapIds = Array.from(new Set(instances.map(instance => instance.roadmapId)));
    if (!roadmapIds.includes(defaultRoadmap.definition.id)) {
      roadmapIds.push(defaultRoadmap.definition.id);
    }

    const definitionsSnap = roadmapIds.length
      ? await db().collection("roadmapDefinitions").where("id", "in", roadmapIds).get()
      : null;
    const definitions = definitionsSnap?.docs.map(doc => normalizeDoc<RoadmapDefinition>(doc)) ?? [];
    const definitionsMap = new Map<number, RoadmapDefinition>();
    definitions.forEach(def => definitionsMap.set(def.id, def));
    if (!definitionsMap.has(defaultRoadmap.definition.id)) {
      definitionsMap.set(defaultRoadmap.definition.id, defaultRoadmap.definition);
    }

    const stepsSnap = roadmapIds.length
      ? await db().collection("roadmapSteps").where("roadmapId", "in", roadmapIds).get()
      : null;
    const stepRows = stepsSnap?.docs.map(doc => enrichStep(normalizeDoc<RoadmapStep>(doc))) ?? [];
    const stepsByRoadmap = new Map<number, ParsedRoadmapStep[]>();
    roadmapIds.forEach(roadmapId => {
      const rows = stepRows.filter(step => step.roadmapId === roadmapId);
      if (rows.length) {
        stepsByRoadmap.set(
          roadmapId,
          rows.sort((a, b) => a.order - b.order || a.id - b.id),
        );
      }
    });
    if (!stepsByRoadmap.has(defaultRoadmap.definition.id)) {
      stepsByRoadmap.set(defaultRoadmap.definition.id, defaultRoadmap.steps);
    }

    return studentRows.map(student => {
      const instance = instances.find(item => item.entityId === student.id);
      const roadmapId = instance?.roadmapId ?? defaultRoadmap.definition.id;
      const steps = stepsByRoadmap.get(roadmapId) ?? defaultRoadmap.steps;
      const currentStep = steps.find(step => step.id === instance?.currentStepId) ?? steps[0];
      const currentIndex = currentStep ? steps.findIndex(step => step.id === currentStep.id) : -1;
      return {
        ...student,
        roadmapDefinition: definitionsMap.get(roadmapId) ?? defaultRoadmap.definition,
        roadmapInstance: instance,
        steps,
        currentStep,
        progress: {
          currentIndex: Math.max(currentIndex, 0),
          total: steps.length,
        },
      };
    });
  } catch (error) {
    console.warn("[Database] listStudentsWithRoadmap failed, returning fallback:", error);
    return buildFallbackStudents(userId);
  }
}

// Company research
export type CompanyResearchListItem = CompanyResearch & {
  linkedCompanyName: string | null;
  companyIndustry: string | null;
  companyJobType: string | null;
  companyStatus: string | null;
};

export async function getCompanyResearchesByUserId(
  userId: number,
  options?: { status?: CompanyResearch["status"]; search?: string; onlyLinked?: boolean },
): Promise<CompanyResearchListItem[]> {
  const researches = await queryByUser<CompanyResearch>("companyResearches", userId);
  const companies = await getCompaniesByUserId(userId);
  const companyMap = new Map<number, Company>();
  companies.forEach(company => companyMap.set(company.id!, company));

  const searchTerm = options?.search?.trim().toLowerCase();

  return researches
    .filter(item => {
      if (options?.status && item.status !== options.status) return false;
      if (options?.onlyLinked && item.companyId == null) return false;
      if (searchTerm) {
        const target = `${item.companyName} ${companyMap.get(item.companyId ?? -1)?.name ?? ""}`.toLowerCase();
        if (!target.includes(searchTerm)) return false;
      }
      return true;
    })
    .map(item => {
      const linked = item.companyId ? companyMap.get(item.companyId) : null;
      return {
        ...item,
        linkedCompanyName: linked?.name ?? null,
        companyIndustry: linked?.industry ?? null,
        companyJobType: linked?.jobType ?? null,
        companyStatus: linked?.status ?? null,
      } as CompanyResearchListItem;
    })
    .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
}

export async function getCompanyResearchById(id: number, userId: number): Promise<CompanyResearchListItem | undefined> {
  const list = await getCompanyResearchesByUserId(userId);
  return list.find(item => item.id === id);
}

export async function getCompanyResearchByCompanyId(companyId: number, userId: number): Promise<CompanyResearchListItem | undefined> {
  const list = await getCompanyResearchesByUserId(userId, { onlyLinked: true });
  return list.find(item => item.companyId === companyId);
}

export async function createCompanyResearch(data: InsertCompanyResearch) {
  const firestore = db();
  const id = await nextId("companyResearches");
  const nowValue = now();
  const payload: CompanyResearch = { ...data, status: data.status ?? "in_progress", id, createdAt: nowValue, updatedAt: nowValue } as CompanyResearch;
  await firestore.collection("companyResearches").doc(String(id)).set(payload);
  return { insertId: id, result: payload };
}

export async function updateCompanyResearch(id: number, userId: number, data: Partial<InsertCompanyResearch>) {
  const existing = await getDocById<CompanyResearch>("companyResearches", id);
  if (!existing || existing.userId !== userId) throw new Error("Company research not found");
  await db().collection("companyResearches").doc(String(id)).set({ ...data, updatedAt: now() }, { merge: true });
}

export async function deleteCompanyResearch(id: number, userId: number) {
  const existing = await getDocById<CompanyResearch>("companyResearches", id);
  if (!existing || existing.userId !== userId) throw new Error("Company research not found");
  await db().collection("companyResearches").doc(String(id)).delete();
}

function deriveCompanyProgressFromSteps(steps: SelectionStep[]) {
  if (!steps.length) {
    return { status: "未エントリー", nextStep: null, nextDeadline: null };
  }

  const sorted = [...steps].sort((a, b) => a.order - b.order || a.id - b.id);
  const failedIndex = sorted.findIndex(
    (step, idx) => step.status === "failed" && sorted.slice(idx + 1).every(next => next.status === "not_started"),
  );
  if (failedIndex >= 0) {
    return { status: "不合格", nextStep: null, nextDeadline: null };
  }

  const hasOffer = sorted.some(step => step.status === "passed" && step.name.includes("内定"));
  if (hasOffer) {
    return { status: "内定", nextStep: null, nextDeadline: null };
  }

  const firstIncomplete = sorted.find(step => step.status !== "passed");
  if (firstIncomplete) {
    return {
      status: firstIncomplete.name,
      nextStep: firstIncomplete.name,
      nextDeadline: firstIncomplete.plannedDate ?? null,
    };
  }

  const last = sorted[sorted.length - 1];
  return { status: last?.name ?? "未エントリー", nextStep: null, nextDeadline: null };
}

async function recomputeCompanyProgress(companyId: number, userId: number) {
  const steps = await listSelectionStepsByCompany(companyId, userId);
  const derived = deriveCompanyProgressFromSteps(steps);
  await db()
    .collection("companies")
    .doc(String(companyId))
    .set({
      status: derived.status,
      nextStep: derived.nextStep,
      nextDeadline: derived.nextDeadline,
      updatedAt: now(),
    }, { merge: true });
}

// Dashboard stats
export async function getDashboardStats(userId: number) {
  const companyList = await getCompaniesByUserId(userId);
  const taskList = await getTasksByUserId(userId);

  const companiesByStatusMap = new Map<string | null | undefined, number>();
  companyList.forEach(company => {
    const key = company.status ?? "未エントリー";
    companiesByStatusMap.set(key, (companiesByStatusMap.get(key) ?? 0) + 1);
  });

  const companiesByStatus = Array.from(companiesByStatusMap.entries()).map(([status, count]) => ({ status, count }));

  return {
    totalCompanies: companyList.length,
    companiesByStatus,
    todayTasks: taskList.filter(task => task.status === "open"),
  };
}
