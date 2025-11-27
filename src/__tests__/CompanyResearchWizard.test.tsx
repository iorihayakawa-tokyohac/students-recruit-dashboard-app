/* @vitest-environment jsdom */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock wouter hooks used in the component
vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
  useRoute: (pattern: string) => [false, {}],
}));

// Mock trpc hooks used in the component to avoid network calls
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ companyResearches: { list: { invalidate: vi.fn() } }, companies: { list: { invalidate: vi.fn() } } }),
    companies: {
      list: { useQuery: () => ({ data: [{ id: 1, name: "テスト社" }], isLoading: false }) },
      create: { useMutation: () => ({ mutateAsync: async () => ({ insertId: 11 }), isPending: false }) },
    },
    companyResearches: {
      getById: { useQuery: (_args: any, opts: any) => ({ data: undefined, isLoading: false, enabled: !!opts?.enabled }) },
      create: { useMutation: () => ({ mutateAsync: async () => ({ insertId: 22 }), isPending: false }) },
      update: { useMutation: () => ({ mutateAsync: async () => ({}), isPending: false }) },
    },
  },
}));

import CompanyResearchWizard from "../pages/CompanyResearchWizard";

describe("CompanyResearchWizard (regression)", () => {
  it("renders and navigates between sections without throwing (no hooks mismatch)", async () => {
    render(<CompanyResearchWizard />);

    // Initial section A title should be visible
    expect(screen.getByText("セクションA：企業概要")).toBeTruthy();

    // Click `次へ` to go to next section
    await userEvent.click(screen.getByText("次へ"));

    // Next section B should render
    expect(screen.getByText("セクションB：ポジション・働き方")).toBeTruthy();

    // Click `前へ` to go back to section A
    await userEvent.click(screen.getByText("前へ"));

    expect(screen.getByText("セクションA：企業概要")).toBeTruthy();
  });
});
