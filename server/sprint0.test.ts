import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { COOKIE_NAME } from "../shared/const";

// ─── Test Helpers ──────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(
  overrides?: Partial<AuthenticatedUser>
): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-sprint0-user",
    email: "sprint0@baymora.test",
    name: "Sprint0 Tester",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ─── Tests ─────────────────────────────────────────────

describe("Sprint 0 — Navigation & Routes", () => {
  it("auth.me returns user data for authenticated context", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeTruthy();
    expect(result?.name).toBe("Sprint0 Tester");
    expect(result?.email).toBe("sprint0@baymora.test");
  });

  it("auth.me returns null for unauthenticated context", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("Sprint 0 — Profile Routes", () => {
  it("profile.getPreferences returns array for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.getPreferences();
    expect(Array.isArray(result)).toBe(true);
  });

  it("profile.getCompanions returns array for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.getCompanions();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Sprint 0 — Credits Route", () => {
  it("credits.getBalance returns balance object for authenticated user", async () => {
    const { ctx } = createAuthContext();
    // Add credits-related fields to user mock
    (ctx.user as any).credits = 100;
    (ctx.user as any).creditsRollover = 10;
    (ctx.user as any).subscriptionTier = "premium";
    (ctx.user as any).freeMessagesUsed = 0;
    const caller = appRouter.createCaller(ctx);
    const result = await caller.credits.getBalance();
    expect(result).toBeTruthy();
    expect(result.credits).toBe(100);
    expect(result.rollover).toBe(10);
    expect(result.tier).toBe("premium");
  });
});

describe("Sprint 0 — SEO Cards (Public)", () => {
  it("seo.getPublishedCards returns array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.seo.getPublishedCards({ limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Sprint 0 — Trips Route", () => {
  it("trips.getMyPlans returns array for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.trips.getMyPlans();
    expect(Array.isArray(result)).toBe(true);
  });
});
