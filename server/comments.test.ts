import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
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

function createAuthContext(overrides: Partial<AuthenticatedUser> = {}): { ctx: TrpcContext } {
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
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
  return { ctx };
}

function createAdminContext(): { ctx: TrpcContext } {
  return createAuthContext({ role: "admin" });
}

describe("comments.getByEstablishment", () => {
  it("is accessible as a public procedure (no auth required)", async () => {
    const { ctx } = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    // Should not throw — returns array (possibly empty if DB not connected)
    const result = await caller.comments.getByEstablishment({ establishmentId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts limit parameter", async () => {
    const { ctx } = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.comments.getByEstablishment({ establishmentId: 1, limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns empty array for non-existent establishment", async () => {
    const { ctx } = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.comments.getByEstablishment({ establishmentId: 999999 });
    expect(result).toEqual([]);
  });
});

describe("comments.getCount", () => {
  it("is accessible as a public procedure", async () => {
    const { ctx } = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.comments.getCount({ establishmentId: 1 });
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe("comments.markHelpful", () => {
  it("is accessible as a public procedure", async () => {
    const { ctx } = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    // Should succeed even if comment doesn't exist (no FK constraint enforced here)
    const result = await caller.comments.markHelpful({ commentId: 1 });
    expect(result).toEqual({ success: true });
  });
});

describe("comments.generateAI", () => {
  it("rejects non-admin users", async () => {
    const { ctx } = createAuthContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.comments.generateAI({ establishmentId: 1 })
    ).rejects.toThrow("Accès réservé aux administrateurs");
  });

  it("rejects unauthenticated users", async () => {
    const { ctx } = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.comments.generateAI({ establishmentId: 1 })
    ).rejects.toThrow();
  });
});
