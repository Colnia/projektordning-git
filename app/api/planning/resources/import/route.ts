import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/planning/resources/import
// Importera standardresurser till databasen om de inte redan finns
export async function POST() {
  try {
    // Hämta befintliga resurser från databasen
    const existingResources = await prisma.resource.findMany();
    console.log(`Hittade ${existingResources.length} befintliga resurser i databasen`);
    
    // Standardresurser att importera om de inte finns
    const defaultResources = [
      { 
        name: 'Anna Andersson', 
        type: 'Ingenjör',
        email: 'anna.andersson@example.com',
        costRate: 750,
        capacity: 40,
        phone: '070-123 45 67',
        skills: ['Konstruktion', 'Ritningar']
      },
      { 
        name: 'Bengt Bengtsson', 
        type: 'Projektledare',
        email: 'bengt.bengtsson@example.com',
        costRate: 850,
        capacity: 40,
        phone: '070-234 56 78',
        skills: ['Planering', 'Kundkontakt']
      },
      { 
        name: 'Cecilia Carlsson', 
        type: 'Arkitekt',
        email: 'cecilia.carlsson@example.com',
        costRate: 800,
        capacity: 30,
        phone: '070-345 67 89',
        skills: ['Design', 'BIM']
      },
      { 
        name: 'David Danielsson', 
        type: 'Byggledare',
        email: 'david.danielsson@example.com',
        costRate: 700,
        capacity: 40,
        phone: '070-456 78 90',
        skills: ['Konstruktion', 'Arbetsledning']
      },
      { 
        name: 'Emma Eriksson', 
        type: 'Ingenjör',
        email: 'emma.eriksson@example.com',
        costRate: 780,
        capacity: 20,
        phone: '070-567 89 01',
        skills: ['El', 'Automation']
      }
    ];
    
    const imported = [];
    
    // Importera resurser som inte redan finns (baserat på namn och e-post)
    for (const resource of defaultResources) {
      const existing = existingResources.find(r => 
        r.name === resource.name || 
        (resource.email && r.email === resource.email)
      );
      
      if (!existing) {
        // Skapa den nya resursen
        const newResource = await prisma.resource.create({
          data: {
            name: resource.name,
            type: resource.type,
            email: resource.email,
            costRate: resource.costRate,
            capacity: resource.capacity,
            phone: resource.phone || null
          }
        });
        
        // Lägg till skills
        if (resource.skills && resource.skills.length > 0) {
          for (const skillName of resource.skills) {
            await prisma.skill.create({
              data: {
                name: skillName,
                level: 3, // Mellannivå som standard
                resourceId: newResource.id
              }
            });
          }
        }
        
        console.log(`Importerade resurs: ${newResource.name} (ID: ${newResource.id})`);
        imported.push(newResource);
      } else {
        console.log(`Resurs finns redan: ${resource.name} (ID: ${existing.id})`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Importerade ${imported.length} resurser till databasen`,
      importedResources: imported
    });
  } catch (error) {
    console.error('Fel vid import av resurser:', error);
    return NextResponse.json(
      { error: 'Kunde inte importera resurser: ' + (error instanceof Error ? error.message : 'Okänt fel') },
      { status: 500 }
    );
  }
} 