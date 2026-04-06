import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createGuestContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
  return { ctx };
}

function createAuthContext(overrides: Partial<AuthenticatedUser> = {}): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@baymora.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    subscriptionTier: "free",
    credits: 100,
    creditsRollover: 0,
    freeMessagesUsed: 0,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createAdminContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  return createAuthContext({ role: "admin" });
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const { ctx } = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test User");
    expect(result?.email).toBe("test@baymora.com");
  });
});

describe("credits.getBalance", () => {
  it("returns credit info for authenticated users", async () => {
    const { ctx } = createAuthContext({ credits: 50, creditsRollover: 10, subscriptionTier: "premium" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.credits.getBalance();
    expect(result.credits).toBe(50);
    expect(result.rollover).toBe(10);
    expect(result.tier).toBe("premium");
  });

  it("rejects unauthenticated users", async () => {
    const { ctx } = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.credits.getBalance()).rejects.toThrow();
  });
});

describe("seo.getPublishedCards", () => {
  it("accepts limit and offset parameters", async () => {
    const { ctx } = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    // Should not throw even with no DB (returns empty array)
    const result = await caller.seo.getPublishedCards({ limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin access control", () => {
  it("rejects non-admin users from admin.getStats", async () => {
    const { ctx } = createAuthContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getStats()).rejects.toThrow("Accès réservé aux administrateurs");
  });

  it("allows admin users to access admin.getStats", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.getStats();
    expect(result).toBeDefined();
    expect(typeof result.totalUsers).toBe("number");
  });
});

describe("chat.sendMessage access control", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.chat.sendMessage({ conversationId: 1, content: "Hello" })
    ).rejects.toThrow();
  });

  it("blocks free users after 15 messages", async () => {
    const { ctx } = createAuthContext({ freeMessagesUsed: 15, subscriptionTier: "free" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.chat.sendMessage({ conversationId: 1, content: "Hello" })
    ).rejects.toThrow("UPGRADE_REQUIRED");
  }, 10000);
});
