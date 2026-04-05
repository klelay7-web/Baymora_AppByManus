import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(role: "user" | "admin" | "team" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 42,
    openId: `test-${role}-user`,
    email: `${role}@baymora.com`,
    name: `Test ${role}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("fieldReports — access control", () => {
  it("rejects unauthenticated users from getMyReports", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.fieldReports.getMyReports()).rejects.toThrow();
  });

  it("rejects regular users from getMyReports", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.fieldReports.getMyReports()).rejects.toThrow(/membres de l'équipe/);
  });

  it("allows team members to access getMyReports", async () => {
    const caller = appRouter.createCaller(createContext("team"));
    // Should not throw (may return empty array if DB is not seeded)
    const result = await caller.fieldReports.getMyReports();
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows admin to access getMyReports", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const result = await caller.fieldReports.getMyReports();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects regular users from getAll", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.fieldReports.getAll()).rejects.toThrow(/administrateurs/);
  });

  it("rejects team members from getAll (admin only)", async () => {
    const caller = appRouter.createCaller(createContext("team"));
    await expect(caller.fieldReports.getAll()).rejects.toThrow(/administrateurs/);
  });

  it("allows admin to access getAll", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const result = await caller.fieldReports.getAll();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("fieldReports — create validation", () => {
  it("rejects creation with missing required fields", async () => {
    const caller = appRouter.createCaller(createContext("team"));
    await expect(
      caller.fieldReports.create({
        establishmentName: "",
        establishmentType: "clinique",
        city: "Istanbul",
        country: "Turquie",
      })
    ).rejects.toThrow();
  });

  it("rejects creation with invalid establishment type", async () => {
    const caller = appRouter.createCaller(createContext("team"));
    await expect(
      caller.fieldReports.create({
        establishmentName: "Test",
        establishmentType: "invalid_type" as any,
        city: "Istanbul",
        country: "Turquie",
      })
    ).rejects.toThrow();
  });

  it("validates journey step types", async () => {
    const caller = appRouter.createCaller(createContext("team"));
    await expect(
      caller.fieldReports.addJourneyStep({
        fieldReportId: 1,
        stepOrder: 1,
        stepType: "invalid" as any,
        title: "Test step",
      })
    ).rejects.toThrow();
  });

  it("validates media types", async () => {
    const caller = appRouter.createCaller(createContext("team"));
    await expect(
      caller.fieldReports.addMedia({
        fieldReportId: 1,
        type: "invalid" as any,
        url: "https://example.com/photo.jpg",
      })
    ).rejects.toThrow();
  });
});
