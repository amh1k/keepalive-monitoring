import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: true as const,
};
export const refreshAccessToken = async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies?.refreshToken;
  if (!incomingRefreshToken) {
    return res.status(401).json({
      message: "Unauthorized: No refresh token",
      code: "TOKEN_INVALID",
    });
  }
  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
    ) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.refreshToken !== incomingRefreshToken) {
      return res.status(401).json({
        message: "Refresh token is invalid or has been used",
        code: "TOKEN_INVALID",
      });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user.id);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: true as const,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({ message: "Token refreshed successfully" });
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired refresh token",
      code: "TOKEN_INVALID",
    });
  }
};

const generateAccessAndRefreshToken = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User does not exist");
  }
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: (process.env.REFRESH_TOKEN_EXPIRY as any) || "7d" },
  );

  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: (process.env.ACCESS_TOKEN_EXPIRY as any) || "15m" },
  );

  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: refreshToken },
  });

  return { accessToken, refreshToken };
};

export const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    // Auto-login after registration — generates fresh cookies
    // clears any previously logged-in user's session from the browser
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user.id,
    );

    return res
      .status(201)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        message: "User created successfully",
        user: { id: user.id, email: user.email },
      });
  } catch (error) {
    return res.status(500).json({
      message: "Registration failed",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid user credentials" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user.id,
    );
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: true as const,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        message: "User logged in successfully",
        user: { id: user.id, email: user.email },
        accessToken,
      });
  } catch (error) {
    return res.status(500).json({
      message: "Login failed",
      error: error instanceof Error ? error.message : error,
    });
  }
};
export const logoutUser = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "user context missing" });
  }
  const userId = req.user!.id;
  const updateUser = await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "production",
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
      message: "User logged out successfully",
    });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return res.status(200).json({
    message: "User fetched successfully",
    user: req.user,
  });
};
