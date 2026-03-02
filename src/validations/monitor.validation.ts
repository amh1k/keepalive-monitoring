import { z } from "zod/v3";

export const createMonitorSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be atleast 3 characters"),
    url: z.string().url("Invalid url format"),
    interval: z.number().min(10).default(60),
    userId: z.string().uuid("Invalid User Id format"),
  }),
});
