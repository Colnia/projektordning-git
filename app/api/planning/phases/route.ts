import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';

const prismaClient = new PrismaClient();

// GET /api/planning/phases
// Hämta alla faser eller filtrera efter projektId
export async function GET(request: Request) {
  try {
    // Analysera URL-parametrar
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    const whereClause = projectId ? { projectId } : {};
    
    const phases = await prismaClient.phase.findMany({
      where: whereClause,
      orderBy: {
        startDate: 'asc'
      }
    });
    
    console.log(`Hämtade ${phases.length} faser${projectId ? ` för projekt ${projectId}` : ''}`);
    
    return NextResponse.json({
      phases,
      count: phases.length
    });
  } catch (error) {
    console.error('Fel vid hämtning av faser:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta faser: ' + (error instanceof Error ? error.message : 'Okänt fel') },
      { status: 500 }
    );
  }
}

// PUT /api/planning/phases
// Uppdatera en befintlig fas
export async function PUT(request: Request) {
  try {
    const phase = await request.json();
    console.log('Mottagen fasdata för uppdatering:', phase);

    if (!phase.id) {
      console.log('Fasen saknar ID:', phase);
      return NextResponse.json({ error: 'Fasen måste ha ett ID' }, { status: 400 });
    }

    const existingPhase = await prismaClient.phase.findUnique({
      where: { id: phase.id }
    });

    if (!existingPhase) {
      console.log('Kunde inte hitta fas med ID', phase.id);
      return NextResponse.json({ error: 'Kunde inte hitta fasen' }, { status: 404 });
    }

    const updatedPhase = await prismaClient.phase.update({
      where: { id: phase.id },
      data: {
        name: phase.name,
        startDate: new Date(phase.startDate),
        endDate: new Date(phase.endDate),
        status: phase.status,
        color: phase.color || null,
        description: phase.description,
        completionRate: phase.completionRate || 0
      }
    });

    return NextResponse.json(updatedPhase);
  } catch (error) {
    console.error('Fel vid uppdatering av fas:', error);
    return NextResponse.json({ error: 'Kunde inte uppdatera fasen' }, { status: 500 });
  }
}

// DELETE /api/planning/phases
// Ta bort en fas och alla dess tilldelningar
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const phaseId = url.searchParams.get('id');

    if (!phaseId) {
      return NextResponse.json({ error: 'Fas-ID krävs' }, { status: 400 });
    }

    // Ta först bort alla resurstilldelningar kopplade till fasen
    await prismaClient.assignment.deleteMany({
      where: { phaseId: phaseId }
    });

    // Ta sedan bort själva fasen
    const deletedPhase = await prismaClient.phase.delete({
      where: { id: phaseId }
    });

    return NextResponse.json({ message: 'Fasen har tagits bort', phase: deletedPhase });
  } catch (error) {
    console.error('Fel vid borttagning av fas:', error);
    return NextResponse.json({ error: 'Kunde inte ta bort fasen' }, { status: 500 });
  }
} 