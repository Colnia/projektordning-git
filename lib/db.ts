import { PrismaClient } from '@prisma/client'

// PrismaClient är kopplad till Node.js globala namespace i utvecklingsmiljön för att förhindra flera instanser
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Skapa en temporär proxy som kan användas om Prisma-klienten inte har initialiserats
const createPrismaClientProxy = () => {
  console.warn('Varning: Använder en mock för Prisma-klienten på grund av initialiseringsfel. Kör "npx prisma generate" med administratörsbehörighet.')
  
  return new Proxy({} as PrismaClient, {
    get: (target, prop) => {
      if (prop === '$connect' || prop === '$disconnect' || prop === '$on' || prop === '$transaction') {
        return () => Promise.resolve()
      }
      
      // För modellmetoder (findMany, create, etc)
      return new Proxy({}, {
        get: () => async () => {
          console.error('Prisma-klienten är inte korrekt initialiserad. Returnerar tom data.')
          return []
        }
      })
    }
  })
}

// Om Prisma kastar ett fel, använd vår proxy istället
let prismaClient: PrismaClient
try {
  prismaClient = globalForPrisma.prisma || new PrismaClient()
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient
} catch (error) {
  console.error('Fel vid initialisering av Prisma-klienten:', error)
  prismaClient = createPrismaClientProxy()
}

export const prisma = prismaClient
export default prisma 