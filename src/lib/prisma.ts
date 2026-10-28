import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function resolveDatabaseUrl(raw: string): string {
  if (!raw.startsWith("prisma+postgres://")) return raw;
  try {
    const u = new URL(raw);
    const key = u.searchParams.get("api_key") ?? "";
    const decoded = JSON.parse(Buffer.from(key, "base64").toString()) as {
      databaseUrl?: string;
    };
    return decoded.databaseUrl ?? raw;
  } catch {
    return raw;
  }
}

function createPrisma() {
  const url = resolveDatabaseUrl(process.env.DATABASE_URL ?? "");
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
