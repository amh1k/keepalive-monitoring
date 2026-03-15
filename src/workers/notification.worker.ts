import { prisma } from "../lib/prisma.js";
import { httpClient } from "../lib/http.js";
import { Worker, Job } from "bullmq";
import { redisConfiguration } from "../lib/redis.js";
import { ur } from "zod/locales";

export const notificationWorkerProcessor = async (job: Job) => {
  const { monitorName, status, userId, url, incidentId } = job.data;
  // console.log(monitorName, status, userId, url);
  let incidentDetails = "";

  if (incidentId) {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (incident) {
      incidentDetails = `\n**Incident started at:** ${incident.startedAt.toLocaleString()}`;
      if (incident.cause) {
        incidentDetails += `\n**Reason:** ${incident.cause}`;
      }
    }
  }

  // 2. Find all active channels for this specific user
  const channels = await prisma.notificationChannel.findMany({
    where: { userId, isEnabled: true },
  });

  if (channels.length === 0) {
    console.warn(`No active notification channels found for user: ${userId}`);
    return { delivered: false, reason: "NO_CHANNELS" };
  }

  // 3. Dispatch Notifications
  const results = await Promise.allSettled(
    channels.map(async (channel) => {
      if (channel.type === "DISCORD") {
        const isUp = status === "UP";

        // LOG THIS to see exactly what is being sent
        console.log("Payload Check:", { monitorName, status, url });

        await httpClient.post(channel.value, {
          embeds: [
            {
              title: isUp ? "✅ Monitor Back Up" : "🚨 Monitor Down",
              // Use optional chaining or defaults to prevent empty strings
              description: `**${monitorName || "Unknown Monitor"}** is currently **${status || "UNKNOWN"}**. ${incidentDetails || ""}`,
              color: isUp ? 3066993 : 15158332,
              fields: [
                {
                  name: "Target URL",
                  value: url || "https://not-provided.com", // Discord fails if value is empty
                  inline: false,
                },
                {
                  name: "Recorded At",
                  value: new Date().toLocaleString(),
                  inline: true,
                },
              ],
              footer: { text: "Uptime Monitor Alert System" },
            },
          ],
        });
      }
    }),
  );

  return {
    delivered: true,
    channelCount: channels.length,
    failures: results.filter((r) => r.status === "rejected").length,
  };
};

// Ensure the queue name matches your Queue definition (e.g., "notification-queue")
const worker = new Worker("notification-pings", notificationWorkerProcessor, {
  connection: redisConfiguration,
});
