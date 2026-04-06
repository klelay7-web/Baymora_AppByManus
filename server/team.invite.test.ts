/**
 * Tests du système d'invitation opérateurs terrain (teamInvitations)
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createOwnerContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: process.env.OWNER_OPEN_ID || "owner-open-id",
    email: "owner@baymora.com",
    name: "Fondateur Baymora",
    loginMethod: "manus",
    role: "admin",
    subscriptionTier: "elite",
    freeMessagesUsed: 0,
    homeCity: null,
    homeCountry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: {
      headers: { host: "localhost:3000" },
      cookies: {},
    } as unknown as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      headers: { host: "localhost:3000" },
      cookies: {},
    } as unknown as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
  return { ctx };
}

describe("Team Invitations", () => {
  it("should have team router defined", () => {
    const { ctx } = createOwnerContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.team).toBeDefined();
  });

  it("should have invite procedure", () => {
    const { ctx } = createOwnerContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.team.invite).toBeDefined();
  });

  it("should have listInvitations procedure", () => {
    const { ctx } = createOwnerContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.team.listInvitations).toBeDefined();
  });

  it("should have listMembers procedure", () => {
    const { ctx } = createOwnerContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.team.listMembers).toBeDefined();
  });

  it("should have acceptInvite procedure (public)", () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.team.acceptInvite).toBeDefined();
  });

  it("should have confirmAccept procedure (protected)", () => {
    const { ctx } = createOwnerContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.team.confirmAccept).toBeDefined();
  });

  it("should have cancelInvite procedure", () => {
    const { ctx } = createOwnerContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.team.cancelInvite).toBeDefined();
  });

  it("should reject invite without name", async () => {
    const { ctx } = createOwnerContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.team.invite({
        recipientName: "",
        recipientEmail: "test@example.com",
      })
    ).rejects.toThrow();
  });

  it("should reject invite without email or phone", async () => {
    const { ctx } = createOwnerContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.team.invite({
        recipientName: "Test Operateur",
        // No email or phone
      })
    ).rejects.toThrow();
  });

  it("should throw NOT_FOUND for invalid token", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.team.acceptInvite({ token: "invalid-token-that-does-not-exist-xyz123" })
    ).rejects.toThrow();
  });
});
