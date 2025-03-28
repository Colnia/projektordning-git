import prisma from "@/lib/db"
import { NextResponse } from "next/server"

// GET: Hämta alla projekt för Gantt-schemat
export async function GET() {
  console.log('Anropar GET /api/gantt');
  
  try {
    // Kontrollera att Prisma är initialiserad
    if (!prisma) {
      console.error('Prisma-klienten är inte initialiserad');
      return NextResponse.json(
        { error: 'Databasklienten är inte initialiserad. Kör npx prisma generate.' }, 
        { status: 500 }
      );
    }
    
    // Hämta aktiva projekt med faser
    console.log('Hämtar projekt från databasen...');
    const projects = await prisma.project.findMany({
      where: {
        isArchived: false
      },
      orderBy: {
        startDate: 'asc'
      },
      include: {
        phases: {
          orderBy: {
            startDate: 'asc'
          }
        }
      }
    })
    
    console.log(`Hittade ${projects.length} projekt`);

    // Formatera data för Gantt-vyn
    const formattedProjects = projects.map((project: any) => ({
      id: project.id,
      name: project.name,
      startDate: project.startDate.toISOString(),
      plannedEndDate: project.plannedEndDate.toISOString(),
      status: project.status,
      phases: project.phases.map((phase: any) => ({
        id: phase.id,
        name: phase.name,
        startDate: phase.startDate?.toISOString() || null,
        endDate: phase.endDate?.toISOString() || null,
        completionRate: phase.completionRate || 0,
        color: phase.color
      }))
    }))

    return NextResponse.json({ 
      projects: formattedProjects 
    })
  } catch (error) {
    console.error('Fel vid hämtning av projekt för Gantt-schema:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta projekt: ' + (error instanceof Error ? error.message : 'Okänt fel') }, 
      { status: 500 }
    )
  }
}

// POST: Skapa eller uppdatera en fas
export async function POST(request: Request) {
  console.log('Anropar POST /api/gantt');
  
  try {
    // Kontrollera att Prisma är initialiserad
    if (!prisma) {
      console.error('Prisma-klienten är inte initialiserad');
      return NextResponse.json(
        { error: 'Databasklienten är inte initialiserad. Kör npx prisma generate.' }, 
        { status: 500 }
      );
    }
    
    const body = await request.json()
    console.log('Request body:', body);
    
    const { type, id, name, projectId, startDate, endDate, status, completionRate, color } = body

    if (type === 'update_task') {
      console.log(`Uppdaterar fas med ID: ${id}`);
      // Uppdatera en existerande fas
      if (!id) {
        return NextResponse.json(
          { error: 'ID saknas för uppdatering' },
          { status: 400 }
        )
      }

      const updatedPhase = await prisma.phase.update({
        where: { id },
        data: {
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          completionRate: completionRate || 0,
          color: color || null
        }
      })
      
      console.log('Fas uppdaterad:', updatedPhase);

      return NextResponse.json({ success: true, phase: updatedPhase })
    } 
    else if (type === 'create_phase') {
      console.log(`Skapar ny fas för projekt: ${projectId}`);
      // Skapa en ny fas
      if (!projectId) {
        return NextResponse.json(
          { error: 'Projekt-ID saknas för ny fas' },
          { status: 400 }
        )
      }

      const newPhase = await prisma.phase.create({
        data: {
          name,
          projectId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          completionRate: completionRate || 0,
          color: color || null
        }
      })
      
      console.log('Ny fas skapad:', newPhase);

      return NextResponse.json({ success: true, phase: newPhase })
    }
    
    // Om ingen giltig åtgärdstyp angivits
    console.log(`Ogiltig åtgärdstyp: ${type}`);
    return NextResponse.json(
      { error: 'Ogiltig åtgärdstyp' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Fel vid bearbetning av Gantt-uppdatering:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera data: ' + (error instanceof Error ? error.message : 'Okänt fel') },
      { status: 500 }
    )
  }
} 