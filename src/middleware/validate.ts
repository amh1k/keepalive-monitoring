import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod/v3";

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: "fail",
          errors: error.errors.map((e) => ({
            path: e.path,
            message: e.message,
          })),
        });
      }
      return res
        .status(500)
        .json({ status: "errpr", message: "Internal server error" });
    }
  };
};
