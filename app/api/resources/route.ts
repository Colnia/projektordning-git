import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/resources - Hämta alla resurser
export async function GET() {
  try {
    const resources = await prisma.resource.findMany({
      include: {
        skills: true,
        assignments: {
          include: {
            project: true,
            phase: true
          }
        },
        availabilityExceptions: true
      }
    });
    
    return NextResponse.json(resources);
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta resurser' },
      { status: 500 }
    );
  }
}

// POST /api/resources - Skapa en ny resurs
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validera input
    if (!data.name || !data.type) {
      return NextResponse.json(
        { error: 'Namn och typ krävs för en resurs' },
        { status: 400 }
      );
    }
    
    // Skapa ny resurs
    const resource = await prisma.resource.create({
      data: {
        name: data.name,
        type: data.type,
        email: data.email,
        phone: data.phone,
        costRate: data.costRate || 0,
        capacity: data.capacity || 40,
        // Lägg till eventuella kompetenser om de skickades med
        skills: data.skills?.length 
          ? {
              create: data.skills.map((skill: any) => ({
                name: skill.name,
                level: skill.level || 1
              }))
            } 
          : undefined
      }
    });
    
    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error('Failed to create resource:', error);
    return NextResponse.json(
      { error: 'Kunde inte skapa resursen' },
      { status: 500 }
    );
  }
} 