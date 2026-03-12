import { prisma } from "../lib/prisma.js";
import { httpClient } from "../lib/http.js";
import { Worker } from "bullmq";
import { redisConfiguration } from "../lib/redis.js";

export const notificationWorkerProcessor = async (job: any) => {
  const { monitorName, status, userId, url, incidentId } = job.data;
  let incidentDetails = "";
  if (incidentId) {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (incident) {
      incidentDetails = `\n "Unknown Error"}\n**Started at:** ${incident.startedAt.toLocaleString()}`;
    }
  }

  const channels = await prisma.notificationChannel.findMany({
    where: { userId, isEnabled: true },
  });

  for (const channel of channels) {
    try {
      if (channel.type === "DISCORD") {
        const isUp = status === "UP";

        await httpClient.post(channel.value, {
          embeds: [
            {
              title: isUp ? "✅ Monitor Back Up" : "🚨 Monitor Down",
              // Include incident details in the description if available
              description: `**${monitorName}** is currently **${status}** (User: ${userId}).${incidentDetails}`,
              color: isUp ? 3066993 : 15158332,
              fields: [
                { name: "Target URL", value: url, inline: false },
                {
                  name: "Status Change",
                  value: isUp ? "🔴 ➜ 🟢" : "🟢 ➜ 🔴",
                  inline: true,
                },
                {
                  name: "Recorded At",
                  value: new Date().toLocaleString(),
                  inline: true,
                },
              ],
              footer: { text: "Distributed Uptime Monitor" },
            },
          ],
        });
      }
    } catch (err) {
      console.error(
        `Failed to send ${channel.type} notification to user ${userId}`,
        err,
      );
    }
  }
};
const worker = new Worker("notification-pings", notificationWorkerProcessor, {
  connection: redisConfiguration,
});
