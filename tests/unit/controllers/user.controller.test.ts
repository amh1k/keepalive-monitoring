import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../singleton"; // Path to your Vitest Prisma singleton
import {
  registerUser,
  loginUser,
  logoutUser,
} from "../../../src/controllers/user.controller";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
vi.mock("../../../src/lib/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(),
  },
}));

describe("User Controller Unit Tests", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {},
      cookies: {},
      header: vi.fn(),
      user: null,
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
    };
  });

  describe("registerUser", () => {
    it("should return 400 if email or password is missing", async () => {
      req.body = { email: "test@example.com" }; // Missing password
      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Email and password are required",
        }),
      );
    });

    it("should return 400 if user already exists", async () => {
      req.body = { email: "exists@test.com", password: "password123" };
      prismaMock.user.findUnique.mockResolvedValue({
        id: "1",
        email: "exists@test.com",
      } as any);

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Email already in use",
        }),
      );
    });

    it("should register successfully and return 201", async () => {
      req.body = { email: "new@test.com", password: "password123" };
      prismaMock.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue("hashed_pass");
      prismaMock.user.create.mockResolvedValue({
        id: "new-uid",
        email: "new@test.com",
      } as any);

      await registerUser(req, res);

      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "new-uid",
        }),
      );
    });
  });

  describe("loginUser", () => {
    it("should return 404 if user is not found", async () => {
      req.body = { email: "unknown@test.com", password: "password" };
      prismaMock.user.findUnique.mockResolvedValue(null);

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User does not exist",
        }),
      );
    });

    it("should return 401 for invalid password", async () => {
      req.body = { email: "user@test.com", password: "wrong_password" };
      prismaMock.user.findUnique.mockResolvedValue({
        id: "1",
        password: "hashed_password",
      } as any);
      (bcrypt.compare as any).mockResolvedValue(false);

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid user credentials",
        }),
      );
    });

    it("should login successfully, set cookies, and return 200", async () => {
      req.body = { email: "user@test.com", password: "correct_password" };
      const mockUser = {
        id: "user-1",
        email: "user@test.com",
        password: "hashed_password",
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any).mockReturnValue("mocked_token");
      prismaMock.user.update.mockResolvedValue(mockUser as any);

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User logged in successfully",
        }),
      );
    });
  });
  describe("logoutUser", () => {
    it("should update user in DB and clear cookies", async () => {
      req.user = { id: "user-logout-123" };
      prismaMock.user.update.mockResolvedValue({
        id: "user-logout-123",
        refreshToken: null,
      } as any);

      await logoutUser(req, res);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: "user-logout-123" },
        data: { refreshToken: null },
      });
      expect(res.clearCookie).toHaveBeenCalledWith(
        "accessToken",
        expect.any(Object),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 401 if user context is missing from request", async () => {
      req.user = undefined;
      await logoutUser(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
