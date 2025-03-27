import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET: Hämta resurstilldelningar
export async function GET() {
  try {
    // Använd prisma för att hämta resurstilldelningar från databasen
    const assignments = await db.resourceAssignment.findMany({
      include: {
        resource: true,
        project: true,
        phase: true
      },
    });

    return NextResponse.json({ 
      success: true, 
      assignments 
    });
  } catch (error) {
    console.error('Fel vid hämtning av resurstilldelningar:', error);
    return NextResponse.json(
      { success: false, error: 'Kunde inte hämta resurstilldelningar' },
      { status: 500 }
    );
  }
}

// POST: Skapa eller uppdatera resurstilldelning
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      resourceId, 
      assignmentId, 
      projectId, 
      phaseId, 
      startDate, 
      endDate, 
      hoursPerDay 
    } = body;

    // Validera inkommande data
    if (!resourceId || !projectId || !startDate || !endDate || !hoursPerDay) {
      return NextResponse.json(
        { success: false, error: 'Ofullständig data för resurstilldelning' },
        { status: 400 }
      );
    }

    let assignment;

    // Om vi har ett assignmentId, uppdatera befintlig tilldelning
    if (assignmentId) {
      assignment = await db.resourceAssignment.update({
        where: { id: Number(assignmentId) },
        data: {
          projectId: Number(projectId),
          phaseId: phaseId ? Number(phaseId) : null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          hoursPerDay: Number(hoursPerDay)
        },
        include: {
          resource: true,
          project: true,
          phase: true
        }
      });
    } 
    // Annars skapa en ny tilldelning
    else {
      assignment = await db.resourceAssignment.create({
        data: {
          resourceId: Number(resourceId),
          projectId: Number(projectId),
          phaseId: phaseId ? Number(phaseId) : null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          hoursPerDay: Number(hoursPerDay)
        },
        include: {
          resource: true,
          project: true,
          phase: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Fel vid sparande av resurstilldelning:', error);
    return NextResponse.json(
      { success: false, error: 'Kunde inte spara resurstilldelning' },
      { status: 500 }
    );
  }
}

// DELETE: Ta bort resurstilldelning
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID saknas för borttagning' },
        { status: 400 }
      );
    }

    // Ta bort tilldelningen från databasen
    await db.resourceAssignment.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({
      success: true,
      message: 'Resurstilldelning har tagits bort'
    });
  } catch (error) {
    console.error('Fel vid borttagning av resurstilldelning:', error);
    return NextResponse.json(
      { success: false, error: 'Kunde inte ta bort resurstilldelning' },
      { status: 500 }
    );
  }
} 