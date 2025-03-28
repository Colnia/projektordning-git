import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | undefined;

// Funktion för att hämta eller skapa en Prisma-klient 
export function getPrismaClient() {
  if (!prisma) {
    try {
      prisma = new PrismaClient();
      console.log("Prisma-klient initialiserad");
    } catch (error) {
      console.error("Fel vid initialisering av Prisma-klient:", error);
      return undefined;
    }
  }
  return prisma;
}

// Funktion för att stänga Prisma-anslutning vid nedstängning av servern
export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
    console.log("Prisma-anslutning stängd");
  }
} 