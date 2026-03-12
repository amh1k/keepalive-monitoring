import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError, ZodAny } from "zod";

export const validate = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // console.log(req.body);
    try {
      const validatedData: any = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      ``;
      req.body = validatedData.body;

      // ONLY assign if the schema actually validated them
      if (validatedData.query) req.query = validatedData.query as any;
      if (validatedData.params) req.params = validatedData.params as any;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: "fail",
          errors: error.issues.map((e) => ({
            path: e.path,
            message: e.message,
          })),
        });
      }
      return res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  };
};
