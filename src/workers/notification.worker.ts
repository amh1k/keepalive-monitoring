import { prisma } from "../lib/prisma.js";
import { httpClient } from "../lib/http.js";
export const notificationWorkerProcessor = async (job: any) => {
  const { monitorName, status, userId, url } = job.data;
  const channels = await prisma.notificationChannel.findMany({
    where: { userId, isEnabled: true },
  });

  for (const channel of channels) {
    try {
      if (channel.type === "DISCORD") {
        await httpClient.post(channel.value, {
          content: `🚨 **Monitor ${status}**: ${monitorName} (${url})`,
        });
      }
      // Add EMAIL, SLACK, here
    } catch (err) {
      console.error(`Failed to send ${channel.type} notification`, err);
    }
  }
};
