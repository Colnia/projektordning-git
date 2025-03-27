import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE /api/planning/assignments/:id
export async function DELETE(request: Request) {
  try {
    // Extrahera tilldelnings-ID från URL:en
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const assignmentId = pathParts[pathParts.length - 1];
    
    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Tilldelnings-ID saknas' },
        { status: 400 }
      );
    }
    
    console.log(`Tar bort tilldelning med ID: ${assignmentId}`);
    
    // Ta bort tilldelningen
    await prisma.assignment.delete({
      where: { id: assignmentId }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Tilldelningen har tagits bort'
    });
    
  } catch (error) {
    console.error('Fel vid borttagning av tilldelning:', error);
    return NextResponse.json(
      { error: 'Kunde inte ta bort tilldelningen' },
      { status: 500 }
    );
  }
}

// GET /api/planning/assignments
export async function GET(request: Request) {
  try {
    // Hämta tilldelningar från databasen (valfritt projektfilter eller resursfilter)
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const resourceId = searchParams.get('resourceId');
    const phaseId = searchParams.get('phaseId');
    
    // Bygg upp filtret baserat på sökparametrar
    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (resourceId) filter.resourceId = resourceId;
    if (phaseId) filter.phaseId = phaseId;
    
    const assignments = await prisma.assignment.findMany({
      where: filter,
      include: {
        resource: true,
        project: true,
        phase: true
      }
    });
    
    return NextResponse.json({
      success: true,
      assignments
    });
    
  } catch (error) {
    console.error('Fel vid hämtning av tilldelningar:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta tilldelningar' },
      { status: 500 }
    );
  }
} 