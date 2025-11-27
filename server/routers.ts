import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

const researchStatuses = ["not_started", "in_progress", "completed"] as const;
const eventTypes = ["es_deadline", "interview", "test", "briefing", "other"] as const;
const selectionStepStatuses = ["not_started", "scheduled", "in_review", "passed", "failed"] as const;

const parseDate = (value: unknown, field: string) => {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  throw new Error(`${field} must be a valid date`);
};

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 企業管理
  companies: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getCompaniesByUserId } = await import("./db");
      return getCompaniesByUserId(ctx.user.id);
    }),
    getById: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return { id: val.id };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ ctx, input }) => {
        const { getCompanyById } = await import("./db");
        return getCompanyById(input.id, ctx.user.id);
      }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "name" in val) {
          return val as { name: string; industry?: string; jobType?: string; mypageUrl?: string; status?: string; nextStep?: string; nextDeadline?: Date; priority?: "A" | "B" | "C"; memo?: string; tags?: string };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { createCompany } = await import("./db");
        return createCompany({ ...input, userId: ctx.user.id });
      }),
    update: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return val as { id: number; name?: string; industry?: string; jobType?: string; mypageUrl?: string; status?: string; nextStep?: string; nextDeadline?: Date; priority?: "A" | "B" | "C"; memo?: string; tags?: string };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { updateCompany } = await import("./db");
        const { id, ...data } = input;
        await updateCompany(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return { id: val.id };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { deleteCompany } = await import("./db");
        await deleteCompany(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // 学生・ロードマップ
  students: router({
    listWithRoadmap: protectedProcedure.query(async ({ ctx }) => {
      const { listStudentsWithRoadmap } = await import("./db");
      return listStudentsWithRoadmap(ctx.user.id);
    }),
  }),

  // タスク管理
  tasks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getTasksByUserId } = await import("./db");
      return getTasksByUserId(ctx.user.id);
    }),
    getById: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return { id: val.id };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ ctx, input }) => {
        const { getTaskById } = await import("./db");
        return getTaskById(input.id, ctx.user.id);
      }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "title" in val) {
          return val as { title: string; companyId?: number; dueDate?: Date; status?: "open" | "in_progress" | "done" };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { createTask } = await import("./db");
        return createTask({ ...input, userId: ctx.user.id });
      }),
    update: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return val as { id: number; title?: string; companyId?: number; dueDate?: Date; status?: "open" | "in_progress" | "done" };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { updateTask } = await import("./db");
        const { id, ...data } = input;
        await updateTask(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return { id: val.id };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { deleteTask } = await import("./db");
        await deleteTask(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // イベント管理（リマインダー）
  events: router({
    listRange: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const data = val as { from: unknown; to: unknown; companyId?: number; types?: (typeof eventTypes)[number][] };
        const from = parseDate(data.from, "from");
        const to = parseDate(data.to, "to");
        if (data.companyId !== undefined && data.companyId !== null && typeof data.companyId !== "number") {
          throw new Error("companyId must be a number");
        }
        if (data.types) {
          if (!Array.isArray(data.types)) throw new Error("types must be an array");
          data.types.forEach(t => {
            if (!eventTypes.includes(t)) throw new Error("Invalid event type");
          });
        }
        return { ...data, from, to };
      })
      .query(async ({ ctx, input }) => {
        const { listEventsInRange } = await import("./db");
        return listEventsInRange(ctx.user.id, input);
      }),
    listUpcoming: protectedProcedure
      .input((val: unknown) => {
        if (val === undefined || val === null) return { days: 7 };
        if (typeof val === "object") {
          const raw = (val as any).days;
          const days = typeof raw === "number" && raw > 0 ? raw : 7;
          return { days };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ ctx, input }) => {
        const { getUpcomingEvents } = await import("./db");
        return getUpcomingEvents(ctx.user.id, input.days);
      }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const data = val as {
          title: string;
          type: (typeof eventTypes)[number];
          startAt: unknown;
          endAt?: unknown;
          companyId?: number;
          location?: string;
          memo?: string;
          remindBeforeDays?: number;
          remindOnDay?: boolean;
        };
        if (!data.title || typeof data.title !== "string") throw new Error("title is required");
        if (!eventTypes.includes(data.type)) throw new Error("Invalid event type");
        const startAt = parseDate(data.startAt, "startAt");
        const endAt = data.endAt ? parseDate(data.endAt, "endAt") : undefined;
        if (data.companyId !== undefined && data.companyId !== null && typeof data.companyId !== "number") {
          throw new Error("companyId must be a number");
        }
        if (data.remindBeforeDays !== undefined && typeof data.remindBeforeDays !== "number") {
          throw new Error("remindBeforeDays must be a number");
        }
        if (data.remindOnDay !== undefined && typeof data.remindOnDay !== "boolean") {
          throw new Error("remindOnDay must be a boolean");
        }
        return { ...data, startAt, endAt };
      })
      .mutation(async ({ ctx, input }) => {
        const { createEvent } = await import("./db");
        return createEvent({
          ...input,
          userId: ctx.user.id,
        });
      }),
    update: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        if (!("id" in val) || typeof (val as any).id !== "number") throw new Error("id is required");
        const data = val as {
          id: number;
          title?: string;
          type?: (typeof eventTypes)[number];
          startAt?: unknown;
          endAt?: unknown;
          companyId?: number | null;
          location?: string | null;
          memo?: string | null;
          remindBeforeDays?: number;
          remindOnDay?: boolean;
        };
        if (data.type && !eventTypes.includes(data.type)) throw new Error("Invalid event type");
        const startAt = data.startAt ? parseDate(data.startAt, "startAt") : undefined;
        const endAt = data.endAt ? parseDate(data.endAt, "endAt") : undefined;
        if (data.companyId !== undefined && data.companyId !== null && typeof data.companyId !== "number") {
          throw new Error("companyId must be a number or null");
        }
        if (data.remindBeforeDays !== undefined && typeof data.remindBeforeDays !== "number") {
          throw new Error("remindBeforeDays must be a number");
        }
        if (data.remindOnDay !== undefined && typeof data.remindOnDay !== "boolean") {
          throw new Error("remindOnDay must be a boolean");
        }
        return { ...data, startAt, endAt };
      })
      .mutation(async ({ ctx, input }) => {
        const { updateEvent } = await import("./db");
        const { id, ...payload } = input;
        await updateEvent(id, ctx.user.id, payload);
        return { success: true };
      }),
    delete: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof (val as any).id === "number") {
          return { id: (val as any).id as number };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { deleteEvent } = await import("./db");
        await deleteEvent(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // メモ管理
  notes: router({
    listByCompany: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "companyId" in val && typeof val.companyId === "number") {
          return { companyId: val.companyId };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ ctx, input }) => {
        const { getNotesByCompanyId } = await import("./db");
        return getNotesByCompanyId(input.companyId, ctx.user.id);
      }),
    getById: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return { id: val.id };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ ctx, input }) => {
        const { getNoteById } = await import("./db");
        return getNoteById(input.id, ctx.user.id);
      }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "companyId" in val && "content" in val) {
          return val as { companyId: number; content: string; type?: "interview" | "es" | "other" };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { createNote } = await import("./db");
        return createNote({ ...input, userId: ctx.user.id });
      }),
    update: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return val as { id: number; content?: string; type?: "interview" | "es" | "other" };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { updateNote } = await import("./db");
        const { id, ...data } = input;
        await updateNote(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return { id: val.id };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { deleteNote } = await import("./db");
        await deleteNote(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // 通知設定（メール ON/OFF）
  notificationPreferences: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const { getNotificationPreference } = await import("./db");
      return getNotificationPreference(ctx.user.id);
    }),
    update: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const data = val as { emailEnabled?: boolean; overrideEmail?: string | null };
        if (data.emailEnabled !== undefined && typeof data.emailEnabled !== "boolean") {
          throw new Error("emailEnabled must be a boolean");
        }
        if (data.overrideEmail !== undefined && data.overrideEmail !== null && typeof data.overrideEmail !== "string") {
          throw new Error("overrideEmail must be a string");
        }
        return data;
      })
      .mutation(async ({ ctx, input }) => {
        const { upsertNotificationPreference } = await import("./db");
        await upsertNotificationPreference(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // 選考ステップ管理
  selectionSteps: router({
    listByCompany: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "companyId" in val && typeof val.companyId === "number") {
          return { companyId: val.companyId };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ ctx, input }) => {
        const { listSelectionStepsByCompany } = await import("./db");
        return listSelectionStepsByCompany(input.companyId, ctx.user.id);
      }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const data = val as {
          companyId: number;
          name: string;
          status?: (typeof selectionStepStatuses)[number];
          order?: number;
          plannedDate?: unknown;
          actualDate?: unknown;
          memo?: string;
        };
        if (!data.companyId || typeof data.companyId !== "number") throw new Error("companyId is required");
        if (!data.name || typeof data.name !== "string") throw new Error("name is required");
        if (data.status && !selectionStepStatuses.includes(data.status)) throw new Error("Invalid status");
        if (data.order !== undefined && typeof data.order !== "number") throw new Error("order must be a number");
        const payload: Record<string, unknown> = {
          companyId: data.companyId,
          name: data.name,
        };
        if (data.status) payload.status = data.status;
        if (data.order !== undefined) payload.order = data.order;
        if (data.memo !== undefined) payload.memo = data.memo;
        if (data.plannedDate) payload.plannedDate = parseDate(data.plannedDate, "plannedDate");
        if (data.actualDate) payload.actualDate = parseDate(data.actualDate, "actualDate");
        return payload;
      })
      .mutation(async ({ ctx, input }) => {
        const { createSelectionStep } = await import("./db");
        const payload = input as {
          companyId: number;
          name: string;
          status?: (typeof selectionStepStatuses)[number];
          order?: number;
          plannedDate?: Date;
          actualDate?: Date;
          memo?: string;
        };
        return createSelectionStep({
          ...payload,
          userId: ctx.user.id,
        });
      }),
    update: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        if (!("id" in val) || typeof (val as any).id !== "number") throw new Error("id is required");
        const data = val as {
          id: number;
          name?: string;
          status?: (typeof selectionStepStatuses)[number];
          order?: number;
          plannedDate?: unknown;
          actualDate?: unknown;
          memo?: string | null;
        };
        if (data.status && !selectionStepStatuses.includes(data.status)) throw new Error("Invalid status");
        if (data.order !== undefined && typeof data.order !== "number") throw new Error("order must be a number");
        const payload: {
          id: number;
          name?: string;
          status?: (typeof selectionStepStatuses)[number];
          order?: number;
          plannedDate?: Date;
          actualDate?: Date;
          memo?: string | null;
        } = { id: data.id };
        if (data.name) payload.name = data.name;
        if (data.status) payload.status = data.status;
        if (data.order !== undefined) payload.order = data.order;
        if (data.plannedDate) payload.plannedDate = parseDate(data.plannedDate, "plannedDate");
        if (data.actualDate) payload.actualDate = parseDate(data.actualDate, "actualDate");
        if (data.memo !== undefined) payload.memo = data.memo;
        return payload;
      })
      .mutation(async ({ ctx, input }) => {
        const { updateSelectionStep } = await import("./db");
        const { id, ...payload } = input;
        await updateSelectionStep(id, ctx.user.id, payload);
        return { success: true };
      }),
    delete: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof (val as any).id === "number") {
          return { id: (val as any).id as number };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { deleteSelectionStep } = await import("./db");
        await deleteSelectionStep(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // 企業研究
  companyResearches: router({
    list: protectedProcedure
      .input((val: unknown) => {
        if (val === undefined || val === null) return {};
        if (typeof val === "object") {
          const typed = val as { status?: (typeof researchStatuses)[number]; search?: string; onlyLinked?: boolean };
          if (typed.status && !researchStatuses.includes(typed.status)) {
            throw new Error("Invalid status");
          }
          return typed;
        }
        throw new Error("Invalid input");
      })
      .query(async ({ ctx, input }) => {
        const { getCompanyResearchesByUserId } = await import("./db");
        return getCompanyResearchesByUserId(ctx.user.id, input);
      }),
    getById: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return { id: val.id };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ ctx, input }) => {
        const { getCompanyResearchById } = await import("./db");
        return getCompanyResearchById(input.id, ctx.user.id);
      }),
    getByCompanyId: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "companyId" in val && typeof val.companyId === "number") {
          return { companyId: val.companyId };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ ctx, input }) => {
        const { getCompanyResearchByCompanyId } = await import("./db");
        return getCompanyResearchByCompanyId(input.companyId, ctx.user.id);
      }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const data = val as {
          companyName: string;
          companyId?: number | null;
          status?: (typeof researchStatuses)[number];
          q1Overview?: string;
          q2BusinessModel?: string;
          q3Strengths?: string;
          q4DesiredPosition?: string;
          q5RoleExpectations?: string;
          q6PersonalStrengths?: string;
          q7SelectionFlow?: string;
          q8InterviewCount?: string;
          q9EvaluationPoints?: string;
          q10Motivation?: string;
          q11WhyThisCompany?: string;
          q12ValuesFit?: string;
          q13Concerns?: string;
          q14ResolutionPlan?: string;
        };
        if (!data.companyName || typeof data.companyName !== "string") throw new Error("companyName is required");
        if (data.companyId !== undefined && data.companyId !== null && typeof data.companyId !== "number") throw new Error("companyId must be a number or null");
        if (data.status && !researchStatuses.includes(data.status)) throw new Error("Invalid status");
        return data;
      })
      .mutation(async ({ ctx, input }) => {
        const { createCompanyResearch } = await import("./db");
        const status = input.status ?? "in_progress";
        return createCompanyResearch({ ...input, status, userId: ctx.user.id });
      }),
    update: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        if (!("id" in val) || typeof val.id !== "number") throw new Error("id is required");
        const data = val as {
          id: number;
          companyName?: string;
          companyId?: number | null;
          status?: (typeof researchStatuses)[number];
          q1Overview?: string;
          q2BusinessModel?: string;
          q3Strengths?: string;
          q4DesiredPosition?: string;
          q5RoleExpectations?: string;
          q6PersonalStrengths?: string;
          q7SelectionFlow?: string;
          q8InterviewCount?: string;
          q9EvaluationPoints?: string;
          q10Motivation?: string;
          q11WhyThisCompany?: string;
          q12ValuesFit?: string;
          q13Concerns?: string;
          q14ResolutionPlan?: string;
        };
        if (data.status && !researchStatuses.includes(data.status)) throw new Error("Invalid status");
        if (data.companyId !== undefined && data.companyId !== null && typeof data.companyId !== "number") throw new Error("companyId must be a number or null");
        return data;
      })
      .mutation(async ({ ctx, input }) => {
        const { updateCompanyResearch } = await import("./db");
        const { id, ...data } = input;
        await updateCompanyResearch(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return { id: val.id };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ ctx, input }) => {
        const { deleteCompanyResearch } = await import("./db");
        await deleteCompanyResearch(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ダッシュボード統計
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const { getDashboardStats } = await import("./db");
      return getDashboardStats(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
