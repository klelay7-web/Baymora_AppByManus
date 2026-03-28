/**
 * Client Prisma — instance unique partagée dans toute l'app
 * Prisma v7 + @prisma/adapter-pg pour PostgreSQL direct
 */

// Compatibilité CJS/ESM avec Vite
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const globalForPrisma = globalThis as unknown as { prisma: any };

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('[DB] DATABASE_URL non configurée — mode dégradé');
    return new PrismaClient({ log: ['error'] });
  }
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter, log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
