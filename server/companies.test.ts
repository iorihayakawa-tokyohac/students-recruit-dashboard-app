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

describe("companies API", () => {
  it("should list companies for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const companies = await caller.companies.list();
    expect(Array.isArray(companies)).toBe(true);
  });

  it("should create a new company", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.companies.create({
      name: "テスト株式会社",
      industry: "IT・通信",
      jobType: "エンジニア",
      status: "未応募",
      priority: "B",
    });

    expect(result).toBeDefined();
  });

  it("should update company information", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a company
    await caller.companies.create({
      name: "更新テスト企業",
      status: "未応募",
    });

    // Get the list to find the created company
    const companies = await caller.companies.list();
    const testCompany = companies.find(c => c.name === "更新テスト企業");

    if (testCompany) {
      const result = await caller.companies.update({
        id: testCompany.id,
        status: "ES提出済み",
      });

      expect(result.success).toBe(true);
    }
  });

  it("should delete a company", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a company
    await caller.companies.create({
      name: "削除テスト企業",
      status: "未応募",
    });

    // Get the list to find the created company
    const companies = await caller.companies.list();
    const testCompany = companies.find(c => c.name === "削除テスト企業");

    if (testCompany) {
      const result = await caller.companies.delete({
        id: testCompany.id,
      });

      expect(result.success).toBe(true);
    }
  });
});
