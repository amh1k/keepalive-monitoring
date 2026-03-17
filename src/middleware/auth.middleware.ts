import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

interface JwtPayload {
  id: string;
}

export const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "").trim();

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized: No token provided",
      code: "TOKEN_INVALID",
    });
  }
  let decodedToken: JwtPayload;

  try {
    decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!,
    ) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: "Access token expired",
        code: "TOKEN_EXPIRED", // frontend keys off this
      });
    }
    return res.status(401).json({
      message: "Invalid access token",
      code: "TOKEN_INVALID", // frontend keys off this
    });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized: User not found",
        code: "TOKEN_INVALID",
      });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error during authentication",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
