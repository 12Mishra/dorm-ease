import { PrismaClient } from "@prisma/client";

// Provide a clearer error when the DATABASE_URL environment variable is missing.
if (!process.env.DATABASE_URL) {
  // In development environments we prefer a clear, early exit so the developer notices.
  // Prisma will also throw later when trying to initialize, but this gives a nicer message.
  const msg =
    "Environment variable DATABASE_URL is not set. Add it to .env and restart the dev server.";
  // Log the message for visibility in server logs and throw to fail fast.
  console.error(msg);
  throw new Error(msg);
}

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
