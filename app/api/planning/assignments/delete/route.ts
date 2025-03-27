import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE /api/planning/assignments/delete?id=ASSIGNMENT_ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID måste anges för att ta bort en resurstilldelning' },
        { status: 400 }
      );
    }
    
    console.log(`Tar bort resurstilldelning med ID: ${id}`);
    
    // Hitta tilldelningen före borttagning för att kunna returnera information
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        resource: true,
        phase: true
      }
    });
    
    if (!assignment) {
      console.error(`Kunde inte hitta resurstilldelning med ID: ${id}`);
      return NextResponse.json(
        { error: 'Kunde inte hitta resurstilldelningen' },
        { status: 404 }
      );
    }
    
    // Ta bort resurstilldelningen
    await prisma.assignment.delete({
      where: { id }
    });
    
    console.log(`Borttagen resurstilldelning: ${assignment.resource.name} från fas ${assignment.phase?.name || 'Okänd fas'}`);
    
    return NextResponse.json({
      success: true,
      message: `Resurstilldelningen har tagits bort`,
      deletedAssignment: {
        id: assignment.id,
        resourceName: assignment.resource.name,
        phaseName: assignment.phase?.name || 'Okänd fas'
      }
    });
  } catch (error) {
    console.error('Fel vid borttagning av resurstilldelning:', error);
    return NextResponse.json(
      { error: 'Kunde inte ta bort resurstilldelningen: ' + (error instanceof Error ? error.message : 'Okänt fel') },
      { status: 500 }
    );
  }
} 