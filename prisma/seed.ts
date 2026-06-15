import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  await prisma.governanceConfig.upsert({
    where: { id: "config" },
    create: {
      id: "config",
      cooldownMinutes: 20,
      maxQueueSize: 50,
      boostPrice: 10,
      priorityBoostPrice: 25,
      playNextPrice: 50,
      superPriorityPrice: 100,
    },
    update: {},
  });

  await prisma.platformAnalytics.upsert({
    where: { id: "platform" },
    create: { id: "platform" },
    update: {},
  });

  console.log("Seed completed");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
