import z from "zod";

export const notificationChannelSchema = z.object({
  body: z.object({
    // Your middleware looks for this 'body' key!
    type: z.enum(["DISCORD", "EMAIL", "SLACK"]),
    value: z.string().url(),
  }),
});
