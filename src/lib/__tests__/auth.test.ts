// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

// vi.hoisted runs before vi.mock factories, making these available inside them
const { mockCookieSet, mockCookies } = vi.hoisted(() => {
  const mockCookieSet = vi.fn();
  const mockCookies = vi.fn().mockResolvedValue({
    set: mockCookieSet,
    get: vi.fn(),
    delete: vi.fn(),
  });
  return { mockCookieSet, mockCookies };
});

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

import { createSession } from "@/lib/auth";

const DEFAULT_SECRET = new TextEncoder().encode("development-secret-key");
const COOKIE_NAME = "auth-token";

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("calls cookies().set once with the correct cookie name", async () => {
    await createSession("user-123", "test@example.com");

    expect(mockCookieSet).toHaveBeenCalledOnce();
    expect(mockCookieSet.mock.calls[0][0]).toBe(COOKIE_NAME);
  });

  test("cookie value is a valid JWT string", async () => {
    await createSession("user-123", "test@example.com");
    const token: string = mockCookieSet.mock.calls[0][1];

    expect(token.split(".")).toHaveLength(3);
  });

  test("JWT is signed with HS256", async () => {
    await createSession("user-123", "test@example.com");
    const token: string = mockCookieSet.mock.calls[0][1];

    const header = JSON.parse(
      Buffer.from(token.split(".")[0], "base64url").toString()
    );
    expect(header.alg).toBe("HS256");
  });

  test("JWT is verifiable with the default secret", async () => {
    await createSession("user-123", "test@example.com");
    const token: string = mockCookieSet.mock.calls[0][1];

    await expect(jwtVerify(token, DEFAULT_SECRET)).resolves.toBeDefined();
  });

  test("JWT payload contains userId and email", async () => {
    await createSession("user-123", "test@example.com");
    const token: string = mockCookieSet.mock.calls[0][1];

    const { payload } = await jwtVerify(token, DEFAULT_SECRET);
    expect(payload.userId).toBe("user-123");
    expect(payload.email).toBe("test@example.com");
  });

  test("cookie has httpOnly: true", async () => {
    await createSession("user-123", "test@example.com");
    const options = mockCookieSet.mock.calls[0][2];

    expect(options.httpOnly).toBe(true);
  });

  test("cookie has sameSite: lax", async () => {
    await createSession("user-123", "test@example.com");
    const options = mockCookieSet.mock.calls[0][2];

    expect(options.sameSite).toBe("lax");
  });

  test("cookie has path: /", async () => {
    await createSession("user-123", "test@example.com");
    const options = mockCookieSet.mock.calls[0][2];

    expect(options.path).toBe("/");
  });

  test("cookie secure is false outside production", async () => {
    // vitest runs with NODE_ENV=test by default
    await createSession("user-123", "test@example.com");
    const options = mockCookieSet.mock.calls[0][2];

    expect(options.secure).toBe(false);
  });

  test("cookie secure is true in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await createSession("user-123", "test@example.com");
    const options = mockCookieSet.mock.calls[0][2];

    expect(options.secure).toBe(true);
    vi.unstubAllEnvs();
  });

  test("cookie expires approximately 7 days from now", async () => {
    const before = Date.now();
    await createSession("user-123", "test@example.com");
    const after = Date.now();

    const options = mockCookieSet.mock.calls[0][2];
    const expires: Date = options.expires;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });
});
