import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, smallint, date, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 学生テーブル
 * リクルーターが伴走する学生の基本情報を管理
 */
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  university: varchar("university", { length: 255 }),
  graduationYear: smallint("graduationYear"),
  desiredIndustry: varchar("desiredIndustry", { length: 255 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

/**
 * 企業情報テーブル
 * 就活生が応募した企業の情報を管理
 */
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  jobType: varchar("jobType", { length: 100 }),
  mypageUrl: text("mypageUrl"),
  status: varchar("status", { length: 50 }).notNull().default("未エントリー"),
  nextStep: text("nextStep"),
  nextDeadline: timestamp("nextDeadline"),
  priority: mysqlEnum("priority", ["A", "B", "C"]).default("B"),
  memo: text("memo"),
  tags: text("tags"), // JSON配列として保存
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * タスクテーブル
 * 企業に紐づくタスクや一般的なタスクを管理
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId"), // nullの場合は企業に紐づかないタスク
  title: varchar("title", { length: 255 }).notNull(),
  dueDate: timestamp("dueDate"),
  status: mysqlEnum("status", ["open", "in_progress", "done"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * メモテーブル
 * 企業に紐づく面接メモ、ESメモなどを管理
 */
export const notes = mysqlTable("notes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId").notNull(),
  type: mysqlEnum("type", ["interview", "es", "other"]).default("other").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

/**
 * 企業研究テーブル
 * 企業ごとのQ&A回答をセクション別に保存
 */
export const companyResearches = mysqlTable("company_researches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId"),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("in_progress").notNull(),
  q1Overview: text("q1Overview"),
  q2BusinessModel: text("q2BusinessModel"),
  q3Strengths: text("q3Strengths"),
  q4DesiredPosition: text("q4DesiredPosition"),
  q5RoleExpectations: text("q5RoleExpectations"),
  q6PersonalStrengths: text("q6PersonalStrengths"),
  q7SelectionFlow: text("q7SelectionFlow"),
  q8InterviewCount: text("q8InterviewCount"),
  q9EvaluationPoints: text("q9EvaluationPoints"),
  q10Motivation: text("q10Motivation"),
  q11WhyThisCompany: text("q11WhyThisCompany"),
  q12ValuesFit: text("q12ValuesFit"),
  q13Concerns: text("q13Concerns"),
  q14ResolutionPlan: text("q14ResolutionPlan"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanyResearch = typeof companyResearches.$inferSelect;
export type InsertCompanyResearch = typeof companyResearches.$inferInsert;

/**
 * 就活イベント（リマインダー用）
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId"),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["es_deadline", "interview", "test", "briefing", "other"]).notNull(),
  startAt: timestamp("startAt").notNull(),
  endAt: timestamp("endAt"),
  location: text("location"),
  memo: text("memo"),
  remindBeforeDays: smallint("remindBeforeDays").default(1).notNull(),
  remindOnDay: boolean("remindOnDay").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * メール通知設定（ユーザー単位）
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  userId: int("userId").primaryKey(),
  emailEnabled: boolean("emailEnabled").default(false).notNull(),
  overrideEmail: varchar("overrideEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * 企業ごとの選考ステップ
 */
export const selectionSteps = mysqlTable("selection_steps", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId").notNull(),
  order: smallint("order").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["not_started", "scheduled", "in_review", "passed", "failed"]).default("not_started").notNull(),
  plannedDate: date("plannedDate"),
  actualDate: date("actualDate"),
  memo: text("memo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SelectionStep = typeof selectionSteps.$inferSelect;
export type InsertSelectionStep = typeof selectionSteps.$inferInsert;

/**
 * 学生向けロードマップ定義
 */
export const roadmapDefinitions = mysqlTable("roadmap_definitions", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  entityType: mysqlEnum("entityType", ["student"]).default("student").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoadmapDefinition = typeof roadmapDefinitions.$inferSelect;
export type InsertRoadmapDefinition = typeof roadmapDefinitions.$inferInsert;

export const roadmapSteps = mysqlTable("roadmap_steps", {
  id: int("id").autoincrement().primaryKey(),
  roadmapId: int("roadmapId").notNull(),
  order: smallint("order").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  taskExamples: text("taskExamples"),
  nextActions: text("nextActions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoadmapStep = typeof roadmapSteps.$inferSelect;
export type InsertRoadmapStep = typeof roadmapSteps.$inferInsert;

export const roadmapInstances = mysqlTable("roadmap_instances", {
  id: int("id").autoincrement().primaryKey(),
  roadmapId: int("roadmapId").notNull(),
  entityType: mysqlEnum("entityType", ["student"]).default("student").notNull(),
  entityId: int("entityId").notNull(),
  userId: int("userId").notNull(),
  currentStepId: int("currentStepId"),
  status: mysqlEnum("status", ["active", "completed", "paused"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoadmapInstance = typeof roadmapInstances.$inferSelect;
export type InsertRoadmapInstance = typeof roadmapInstances.$inferInsert;
