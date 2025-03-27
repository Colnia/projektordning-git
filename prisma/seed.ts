import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Starting seeding...')
    
    // Rensa befintliga projekt för att undvika dubletter
    console.log('Rensar befintliga projekt...')
    await prisma.project.deleteMany({})
    
    // Skapa testprojekt
    console.log('Skapar nya testprojekt...')
    
    const project1 = await prisma.project.create({
      data: {
        name: 'Kontorsbyggnaden K42',
        customer: 'Företag AB',
        manager: 'Anna Andersson',
        startDate: new Date(2025, 3, 1), // April 1, 2025
        plannedEndDate: new Date(2025, 8, 30), // September 30, 2025
        status: 'Planering',
        budget: 1500000,
        costToDate: 0,
        estimatedTotalCost: 1450000,
        milestones: 'Grund: 1 maj, Stomme: 1 juni, Tak: 1 juli',
        comments: 'Ny kontorsbyggnad med fem våningar',
        isArchived: false,
      }
    })
    
    console.log('Skapat projekt 1:', project1.id)
    
    const project2 = await prisma.project.create({
      data: {
        name: 'Bostadsprojekt Sjöutsikten',
        customer: 'Bostadsbolaget',
        manager: 'Bengt Bengtsson',
        startDate: new Date(2025, 4, 15), // May 15, 2025
        plannedEndDate: new Date(2026, 4, 1), // May 1, 2026
        status: 'Planering',
        budget: 4200000,
        costToDate: 0,
        estimatedTotalCost: 4100000,
        milestones: 'Markarbete: 1 juni, Grundläggning: 1 juli, Stomresning: 1 september',
        comments: 'Flerbostadshus med 16 lägenheter',
        isArchived: false,
      }
    })
    
    console.log('Skapat projekt 2:', project2.id)
    
    // Verifiera att projekten har skapats
    const allProjects = await prisma.project.findMany()
    console.log(`Databas har nu ${allProjects.length} projekt`)
    
    console.log('Seeding complete!')
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 