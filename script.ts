import { prisma } from "./src/lib/prisma.js";

async function main() {
  console.log("🛠️ Seeding database with monitoring data...");

  // 1. Create a User with a Monitor and a Notification Channel at once
  const user = await prisma.user.create({
    data: {
      email: "monitor-pro@example.com",
      password: "hashed_password_123",
      monitors: {
        create: {
          name: "Main API Endpoint",
          url: "https://api.myapp.com/health",
          interval: 30,
          status: "UP",
          checks: {
            create: [
              { isUp: true, statusCode: 200, latency: 45 },
              { isUp: true, statusCode: 200, latency: 50 },
            ],
          },
        },
      },
      notificationChannels: {
        create: {
          type: "EMAIL",
          value: "admin@myapp.com",
        },
      },
    },
    include: {
      monitors: {
        include: {
          checks: true,
        },
      },
      notificationChannels: true,
    },
  });

  console.log("✅ Successfully created User, Monitor, and Checks:");
  console.log(JSON.stringify(user, null, 2));

  // 2. Fetch all active monitors to verify
  const activeMonitors = await prisma.monitor.findMany({
    where: { isActive: true },
    include: { user: true },
  });

  console.log(`\n📊 Total Active Monitors: ${activeMonitors.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error running script:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
