import z from "zod";

export const notificationChannelSchema = z.object({
  type: z.enum(["DISCORD", "EMAIL", "SLACK"]),
  value: z.string().url("Must be a valid URL"),
});
