import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("tasks API", () => {
  it("should list tasks for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const tasks = await caller.tasks.list();
    expect(Array.isArray(tasks)).toBe(true);
  });

  it("should create a new task", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.create({
      title: "テストタスク",
      status: "open",
    });

    expect(result).toBeDefined();
  });

  it("should update task status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a task
    await caller.tasks.create({
      title: "ステータス更新テスト",
      status: "open",
    });

    // Get the list to find the created task
    const tasks = await caller.tasks.list();
    const testTask = tasks.find(t => t.title === "ステータス更新テスト");

    if (testTask) {
      const result = await caller.tasks.update({
        id: testTask.id,
        status: "done",
      });

      expect(result.success).toBe(true);
    }
  });

  it("should delete a task", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a task
    await caller.tasks.create({
      title: "削除テストタスク",
      status: "open",
    });

    // Get the list to find the created task
    const tasks = await caller.tasks.list();
    const testTask = tasks.find(t => t.title === "削除テストタスク");

    if (testTask) {
      const result = await caller.tasks.delete({
        id: testTask.id,
      });

      expect(result.success).toBe(true);
    }
  });
});
