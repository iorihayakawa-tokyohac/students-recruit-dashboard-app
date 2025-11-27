import { eq, and, desc, sql, like, or, isNotNull, gte, lte, inArray, asc, SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  companies,
  tasks,
  notes,
  InsertCompany,
  InsertTask,
  InsertNote,
  companyResearches,
  InsertCompanyResearch,
  CompanyResearch,
  events,
  InsertEvent,
  notificationPreferences,
  InsertNotificationPreference,
  selectionSteps,
  InsertSelectionStep,
  SelectionStep,
  NotificationPreference,
  students,
  InsertStudent,
  Student,
  roadmapDefinitions,
  InsertRoadmapDefinition,
  RoadmapDefinition,
  roadmapSteps,
  InsertRoadmapStep,
  RoadmapStep,
  roadmapInstances,
  InsertRoadmapInstance,
  RoadmapInstance,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const normalizedEmail = user.email?.trim().toLowerCase();
  if (normalizedEmail) {
    user.email = normalizedEmail;
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by email: database not available");
    return undefined;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

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

async function assertCompanyOwnership(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const company = await db
    .select({ id: companies.id })
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.userId, userId)))
    .limit(1);
  if (!company.length) {
    throw new Error("Company not found");
  }
}

// 企業管理関連のクエリヘルパー

// 企業関連
export async function getCompaniesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).where(eq(companies.userId, userId)).orderBy(desc(companies.updatedAt));
}

export async function getCompanyById(companyId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companies).where(and(eq(companies.id, companyId), eq(companies.userId, userId))).limit(1);
  return result[0];
}

export async function createCompany(data: InsertCompany) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(companies).values(data);
  const insertId = Array.isArray(result) ? (result[0] as any)?.insertId : (result as any)?.insertId;
  return { insertId, result };
}

export async function updateCompany(companyId: number, userId: number, data: Partial<InsertCompany>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(companies).set(data).where(and(eq(companies.id, companyId), eq(companies.userId, userId)));
}

export async function deleteCompany(companyId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(events).set({ companyId: null }).where(and(eq(events.companyId, companyId), eq(events.userId, userId)));
  await db.delete(selectionSteps).where(and(eq(selectionSteps.companyId, companyId), eq(selectionSteps.userId, userId)));
  await db.delete(companies).where(and(eq(companies.id, companyId), eq(companies.userId, userId)));
}

// タスク関連
export async function getTasksByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.dueDate));
}

export async function getTaskById(taskId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId))).limit(1);
  return result[0];
}

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(data);
  return result;
}

export async function updateTask(taskId: number, userId: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set(data).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
}

export async function deleteTask(taskId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
}

// イベント（リマインダー）関連
export async function getEventById(eventId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events).where(and(eq(events.id, eventId), eq(events.userId, userId))).limit(1);
  return result[0];
}

export async function listEventsInRange(
  userId: number,
  params: { from: Date; to: Date; companyId?: number; types?: InsertEvent["type"][] },
) {
  const db = await getDb();
  if (!db) return [];

  const filters = [eq(events.userId, userId), gte(events.startAt, params.from), lte(events.startAt, params.to)];
  if (params.companyId) {
    filters.push(eq(events.companyId, params.companyId));
  }
  if (params.types && params.types.length > 0) {
    filters.push(inArray(events.type, params.types));
  }

  return db
    .select()
    .from(events)
    .where(and(...filters))
    .orderBy(asc(events.startAt));
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.companyId) {
    await assertCompanyOwnership(data.userId, data.companyId);
  }
  const result = await db.insert(events).values(data);
  const insertId = Array.isArray(result) ? (result[0] as any)?.insertId : (result as any)?.insertId;
  return { insertId, result };
}

export async function updateEvent(eventId: number, userId: number, data: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const current = await getEventById(eventId, userId);
  if (!current) {
    throw new Error("Event not found");
  }
  if (data.companyId) {
    await assertCompanyOwnership(userId, data.companyId);
  }
  await db.update(events).set(data).where(and(eq(events.id, eventId), eq(events.userId, userId)));
}

export async function deleteEvent(eventId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(events).where(and(eq(events.id, eventId), eq(events.userId, userId)));
}

// メモ関連
export async function getNotesByCompanyId(companyId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notes).where(and(eq(notes.companyId, companyId), eq(notes.userId, userId))).orderBy(desc(notes.createdAt));
}

export async function getNoteById(noteId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(notes).where(and(eq(notes.id, noteId), eq(notes.userId, userId))).limit(1);
  return result[0];
}

export async function createNote(data: InsertNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notes).values(data);
  return result;
}

export async function updateNote(noteId: number, userId: number, data: Partial<InsertNote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notes).set(data).where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
}

export async function deleteNote(noteId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(notes).where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
}

// 通知設定
export async function getNotificationPreference(userId: number): Promise<NotificationPreference> {
  const db = await getDb();
  if (!db) {
    return { userId, emailEnabled: false, overrideEmail: null, createdAt: new Date(), updatedAt: new Date() };
  }
  const pref = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  if (pref.length) return pref[0];
  return { userId, emailEnabled: false, overrideEmail: null, createdAt: new Date(), updatedAt: new Date() };
}

export async function upsertNotificationPreference(userId: number, data: Partial<InsertNotificationPreference>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const values: InsertNotificationPreference = {
    userId,
    emailEnabled: data.emailEnabled ?? false,
    overrideEmail: data.overrideEmail ?? null,
  };
  await db
    .insert(notificationPreferences)
    .values(values)
    .onDuplicateKeyUpdate({
      set: {
        emailEnabled: data.emailEnabled ?? values.emailEnabled,
        overrideEmail: data.overrideEmail ?? values.overrideEmail,
        updatedAt: new Date(),
      },
    });
}

// 選考ステップ
export async function listSelectionStepsByCompany(companyId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  await assertCompanyOwnership(userId, companyId);
  return db
    .select()
    .from(selectionSteps)
    .where(and(eq(selectionSteps.companyId, companyId), eq(selectionSteps.userId, userId)))
    .orderBy(asc(selectionSteps.order), asc(selectionSteps.id));
}

export async function createSelectionStep(data: Omit<InsertSelectionStep, "order"> & { order?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await assertCompanyOwnership(data.userId, data.companyId);

  let orderValue = data.order;
  if (orderValue === undefined) {
    const currentMax = await db
      .select({ max: sql<number>`coalesce(max(${selectionSteps.order}), 0)` })
      .from(selectionSteps)
      .where(and(eq(selectionSteps.companyId, data.companyId), eq(selectionSteps.userId, data.userId)))
      .limit(1);
    orderValue = (currentMax[0]?.max ?? 0) + 1;
  }

  const result = await db.insert(selectionSteps).values({ ...data, order: orderValue });
  await recomputeCompanyProgress(data.companyId, data.userId);
  return result;
}

export async function updateSelectionStep(stepId: number, userId: number, data: Partial<InsertSelectionStep>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const current = await db.select().from(selectionSteps).where(and(eq(selectionSteps.id, stepId), eq(selectionSteps.userId, userId))).limit(1);
  if (!current.length) {
    throw new Error("Selection step not found");
  }
  const currentStep = current[0];
  const targetCompanyId = data.companyId ?? currentStep.companyId;
  await assertCompanyOwnership(userId, targetCompanyId);

  await db
    .update(selectionSteps)
    .set(data)
    .where(and(eq(selectionSteps.id, stepId), eq(selectionSteps.userId, userId)));

  await recomputeCompanyProgress(targetCompanyId, userId);
}

export async function deleteSelectionStep(stepId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(selectionSteps).where(and(eq(selectionSteps.id, stepId), eq(selectionSteps.userId, userId))).limit(1);
  if (!existing.length) return;
  await db.delete(selectionSteps).where(and(eq(selectionSteps.id, stepId), eq(selectionSteps.userId, userId)));
  await recomputeCompanyProgress(existing[0].companyId, userId);
}

function buildFallbackStudents(userId: number): StudentWithRoadmap[] {
  const now = new Date();
  const definition: RoadmapDefinition = { ...defaultStudentRoadmapDefinition, createdAt: now, updatedAt: now };
  const steps = defaultStudentRoadmapSteps.map(enrichStep);
  const tanaka: Student = {
    id: 101,
    userId,
    name: "田中 陽菜",
    university: "早稲田大学",
    graduationYear: 2026,
    desiredIndustry: "IT / コンサル",
    note: "成長環境を重視。まずはキャリアヒアリングを希望。",
    createdAt: now,
    updatedAt: now,
  };
  const sato: Student = {
    id: 102,
    userId,
    name: "佐藤 海斗",
    university: "京都大学",
    graduationYear: 2026,
    desiredIndustry: "メーカー / モビリティ",
    note: "プロダクト志向で、実地に近い経験を求めている。",
    createdAt: now,
    updatedAt: now,
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
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 202,
      roadmapId: definition.id,
      entityType: "student",
      entityId: sato.id,
      userId,
      currentStepId: altStep?.id ?? null,
      status: "active",
      createdAt: now,
      updatedAt: now,
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

async function ensureDefaultStudentRoadmap(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const existing = await db
    .select()
    .from(roadmapDefinitions)
    .where(eq(roadmapDefinitions.key, defaultStudentRoadmapDefinition.key))
    .limit(1);
  let definition = existing[0];

  if (!definition) {
    await db
      .insert(roadmapDefinitions)
      .values({
        key: defaultStudentRoadmapDefinition.key,
        title: defaultStudentRoadmapDefinition.title,
        description: defaultStudentRoadmapDefinition.description,
        entityType: "student",
      })
      .onDuplicateKeyUpdate({
        set: {
          title: defaultStudentRoadmapDefinition.title,
          description: defaultStudentRoadmapDefinition.description,
          entityType: "student",
          updatedAt: new Date(),
        },
      });
    const refreshed = await db
      .select()
      .from(roadmapDefinitions)
      .where(eq(roadmapDefinitions.key, defaultStudentRoadmapDefinition.key))
      .limit(1);
    definition = refreshed[0] ?? { ...defaultStudentRoadmapDefinition, createdAt: new Date(), updatedAt: new Date() };
  }

  let steps = await db.select().from(roadmapSteps).where(eq(roadmapSteps.roadmapId, definition.id));
  if (!steps.length) {
    const payload: InsertRoadmapStep[] = defaultStudentRoadmapSteps.map(step => ({
      id: step.id,
      roadmapId: definition.id,
      order: step.order,
      title: step.title,
      description: step.description,
      taskExamples: step.taskExamples,
      nextActions: step.nextActions,
    }));
    await db.insert(roadmapSteps).values(payload);
    steps = await db.select().from(roadmapSteps).where(eq(roadmapSteps.roadmapId, definition.id));
  }

  return {
    definition,
    steps: steps.map(enrichStep).sort((a, b) => a.order - b.order || a.id - b.id),
  };
}

async function seedStudentsIfEmpty(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  roadmap: { definition: RoadmapDefinition; steps: ParsedRoadmapStep[] },
) {
  const existingCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(students)
    .where(eq(students.userId, userId));
  if ((existingCount[0]?.count ?? 0) > 0) return;

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

  await db.insert(students).values(sampleStudents);

  const inserted = await db
    .select()
    .from(students)
    .where(eq(students.userId, userId))
    .orderBy(asc(students.id))
    .limit(sampleStudents.length);

  const defaultStepId = roadmap.steps.find(step => step.order === 4)?.id ?? roadmap.steps[0]?.id ?? null;
  const secondaryStepId = roadmap.steps.find(step => step.order === 3)?.id ?? defaultStepId;

  const instances: InsertRoadmapInstance[] = [];
  if (inserted[0] && defaultStepId) {
    instances.push({
      roadmapId: roadmap.definition.id,
      entityType: "student",
      entityId: inserted[0].id,
      userId,
      currentStepId: defaultStepId,
      status: "active",
    });
  }
  if (inserted[1] && secondaryStepId) {
    instances.push({
      roadmapId: roadmap.definition.id,
      entityType: "student",
      entityId: inserted[1].id,
      userId,
      currentStepId: secondaryStepId,
      status: "active",
    });
  }
  if (instances.length) {
    await db.insert(roadmapInstances).values(instances);
  }
}

async function ensureInstancesForStudents(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  studentList: Student[],
  roadmap: { definition: RoadmapDefinition; steps: ParsedRoadmapStep[] },
) {
  if (!studentList.length) return [] as RoadmapInstance[];

  const ids = studentList.map(student => student.id);
  const existingInstances = await db
    .select()
    .from(roadmapInstances)
    .where(and(eq(roadmapInstances.entityType, "student"), eq(roadmapInstances.userId, userId), inArray(roadmapInstances.entityId, ids)));

  const missingStudents = studentList.filter(student => !existingInstances.some(instance => instance.entityId === student.id));
  if (missingStudents.length) {
    const defaultStepId = roadmap.steps.find(step => step.order === 4)?.id ?? roadmap.steps[0]?.id ?? null;
    const payload: InsertRoadmapInstance[] = missingStudents
      .map(student => ({
        roadmapId: roadmap.definition.id,
        entityType: "student",
        entityId: student.id,
        userId,
        currentStepId: defaultStepId,
        status: "active",
      }))
      .filter(item => item.currentStepId !== null) as InsertRoadmapInstance[];
    if (payload.length) {
      await db.insert(roadmapInstances).values(payload);
      return db
        .select()
        .from(roadmapInstances)
        .where(and(eq(roadmapInstances.entityType, "student"), eq(roadmapInstances.userId, userId), inArray(roadmapInstances.entityId, ids)));
    }
  }

  return existingInstances;
}

export async function listStudentsWithRoadmap(userId: number): Promise<StudentWithRoadmap[]> {
  const db = await getDb();
  if (!db) {
    return buildFallbackStudents(userId);
  }

  const defaultRoadmap = await ensureDefaultStudentRoadmap(db);
  await seedStudentsIfEmpty(db, userId, defaultRoadmap);

  const studentRows = await db.select().from(students).where(eq(students.userId, userId)).orderBy(asc(students.id));
  if (!studentRows.length) {
    return buildFallbackStudents(userId);
  }

  const instances = await ensureInstancesForStudents(db, userId, studentRows, defaultRoadmap);
  const roadmapIds = Array.from(new Set(instances.map(instance => instance.roadmapId)));
  if (!roadmapIds.includes(defaultRoadmap.definition.id)) {
    roadmapIds.push(defaultRoadmap.definition.id);
  }

  const definitions = roadmapIds.length
    ? await db.select().from(roadmapDefinitions).where(inArray(roadmapDefinitions.id, roadmapIds))
    : [];
  const definitionsMap = new Map<number, RoadmapDefinition>();
  definitions.forEach(def => definitionsMap.set(def.id, def));
  if (!definitionsMap.has(defaultRoadmap.definition.id)) {
    definitionsMap.set(defaultRoadmap.definition.id, defaultRoadmap.definition);
  }

  const stepRows =
    roadmapIds.length > 0
      ? await db
          .select()
          .from(roadmapSteps)
          .where(inArray(roadmapSteps.roadmapId, roadmapIds))
      : [];

  const stepsByRoadmap = new Map<number, ParsedRoadmapStep[]>();
  roadmapIds.forEach(roadmapId => {
    const rows = stepRows.filter(step => step.roadmapId === roadmapId);
    if (rows.length) {
      stepsByRoadmap.set(
        roadmapId,
        rows.map(enrichStep).sort((a, b) => a.order - b.order || a.id - b.id),
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
}

// 企業研究関連
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
  const db = await getDb();
  if (!db) return [];

  const filters: SQL<unknown>[] = [eq(companyResearches.userId, userId)];

  if (options?.status) {
    filters.push(eq(companyResearches.status, options.status));
  }

  if (options?.onlyLinked) {
    filters.push(isNotNull(companyResearches.companyId));
  }

  if (options?.search?.trim()) {
    const pattern = `%${options.search.trim()}%`;
    const searchCondition = or(like(companyResearches.companyName, pattern), like(companies.name, pattern));
    if (searchCondition) {
      filters.push(searchCondition);
    }
  }

  const whereClause = and(...filters);
  if (!whereClause) return [];

  return db
    .select({
      id: companyResearches.id,
      userId: companyResearches.userId,
      companyId: companyResearches.companyId,
      companyName: companyResearches.companyName,
      status: companyResearches.status,
      q1Overview: companyResearches.q1Overview,
      q2BusinessModel: companyResearches.q2BusinessModel,
      q3Strengths: companyResearches.q3Strengths,
      q4DesiredPosition: companyResearches.q4DesiredPosition,
      q5RoleExpectations: companyResearches.q5RoleExpectations,
      q6PersonalStrengths: companyResearches.q6PersonalStrengths,
      q7SelectionFlow: companyResearches.q7SelectionFlow,
      q8InterviewCount: companyResearches.q8InterviewCount,
      q9EvaluationPoints: companyResearches.q9EvaluationPoints,
      q10Motivation: companyResearches.q10Motivation,
      q11WhyThisCompany: companyResearches.q11WhyThisCompany,
      q12ValuesFit: companyResearches.q12ValuesFit,
      q13Concerns: companyResearches.q13Concerns,
      q14ResolutionPlan: companyResearches.q14ResolutionPlan,
      createdAt: companyResearches.createdAt,
      updatedAt: companyResearches.updatedAt,
      linkedCompanyName: companies.name,
      companyIndustry: companies.industry,
      companyJobType: companies.jobType,
      companyStatus: companies.status,
    })
    .from(companyResearches)
    .leftJoin(
      companies,
      and(
        eq(companyResearches.companyId, companies.id),
        eq(companies.userId, userId),
      ),
    )
    .where(whereClause)
    .orderBy(desc(companyResearches.updatedAt));
}

export async function getCompanyResearchById(id: number, userId: number): Promise<CompanyResearchListItem | undefined> {
  const list = await getCompanyResearchesByUserId(userId);
  return list.find(item => item.id === id);
}

export async function getCompanyResearchByCompanyId(companyId: number, userId: number): Promise<CompanyResearchListItem | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      id: companyResearches.id,
      userId: companyResearches.userId,
      companyId: companyResearches.companyId,
      companyName: companyResearches.companyName,
      status: companyResearches.status,
      q1Overview: companyResearches.q1Overview,
      q2BusinessModel: companyResearches.q2BusinessModel,
      q3Strengths: companyResearches.q3Strengths,
      q4DesiredPosition: companyResearches.q4DesiredPosition,
      q5RoleExpectations: companyResearches.q5RoleExpectations,
      q6PersonalStrengths: companyResearches.q6PersonalStrengths,
      q7SelectionFlow: companyResearches.q7SelectionFlow,
      q8InterviewCount: companyResearches.q8InterviewCount,
      q9EvaluationPoints: companyResearches.q9EvaluationPoints,
      q10Motivation: companyResearches.q10Motivation,
      q11WhyThisCompany: companyResearches.q11WhyThisCompany,
      q12ValuesFit: companyResearches.q12ValuesFit,
      q13Concerns: companyResearches.q13Concerns,
      q14ResolutionPlan: companyResearches.q14ResolutionPlan,
      createdAt: companyResearches.createdAt,
      updatedAt: companyResearches.updatedAt,
      linkedCompanyName: companies.name,
      companyIndustry: companies.industry,
      companyJobType: companies.jobType,
      companyStatus: companies.status,
    })
    .from(companyResearches)
    .leftJoin(
      companies,
      and(
        eq(companyResearches.companyId, companies.id),
        eq(companies.userId, userId),
      ),
    )
    .where(and(eq(companyResearches.userId, userId), eq(companyResearches.companyId, companyId)))
    .limit(1);

  return result[0];
}

export async function createCompanyResearch(data: InsertCompanyResearch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(companyResearches).values(data);
  const insertId = Array.isArray(result) ? (result[0] as any)?.insertId : (result as any)?.insertId;
  return { insertId, result };
}

export async function updateCompanyResearch(id: number, userId: number, data: Partial<InsertCompanyResearch>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(companyResearches).set(data).where(and(eq(companyResearches.id, id), eq(companyResearches.userId, userId)));
}

export async function deleteCompanyResearch(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(companyResearches).where(and(eq(companyResearches.id, id), eq(companyResearches.userId, userId)));
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const steps = await db
    .select()
    .from(selectionSteps)
    .where(and(eq(selectionSteps.companyId, companyId), eq(selectionSteps.userId, userId)));

  const derived = deriveCompanyProgressFromSteps(steps);
  await db
    .update(companies)
    .set({
      status: derived.status,
      nextStep: derived.nextStep,
      nextDeadline: derived.nextDeadline,
      updatedAt: new Date(),
    })
    .where(and(eq(companies.id, companyId), eq(companies.userId, userId)));
}

// ダッシュボード統計
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const totalCompanies = await db.select({ count: sql<number>`count(*)` }).from(companies).where(eq(companies.userId, userId));
  const companiesByStatus = await db
    .select({
      status: companies.status,
      count: sql<number>`count(*)`,
    })
    .from(companies)
    .where(eq(companies.userId, userId))
    .groupBy(companies.status);

  const todayTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.status, "open")))
    .orderBy(tasks.dueDate);

  return {
    totalCompanies: totalCompanies[0]?.count || 0,
    companiesByStatus,
    todayTasks,
  };
}
