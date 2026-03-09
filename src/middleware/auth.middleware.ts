import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express"; // Corrected imports
import { prisma } from "../lib/prisma.js";

interface JwtPayload {
  id: string;
}
export const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "").trim();

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!,
    ) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }
    (req as any).user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired access token",
      error: error instanceof Error ? error.message : "Authentication error",
    });
  }
};
