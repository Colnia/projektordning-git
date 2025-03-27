import { PrismaClient } from '@prisma/client'

// PrismaClient är kopplad till Node.js globala namespace i utvecklingsmiljön för att förhindra flera instanser
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma 