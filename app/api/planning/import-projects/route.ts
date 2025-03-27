import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { addDays, addMonths } from 'date-fns'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectIds } = body
    
    console.log('Begärda projekt-ID för import:', projectIds);
    
    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { error: 'Ogiltiga projekt-ID' },
        { status: 400 }
      )
    }
    
    // Hämta befintliga projekt från databasen
    const projectIdsAsStrings = projectIds.map(id => String(id));
    console.log('Söker efter projekt med ID:', projectIdsAsStrings);
    
    const existingProjects = await prisma.project.findMany({
      where: {
        id: {
          in: projectIdsAsStrings
        }
      }
    })
    
    console.log(`Hittade ${existingProjects.length} projekt för import:`, 
      existingProjects.map(p => `${p.id}: ${p.name}`));
    
    if (existingProjects.length === 0) {
      console.error('Inga projekt hittades med de angivna ID:na:', projectIdsAsStrings);
      return NextResponse.json(
        { error: 'Inga giltiga projekt hittades' },
        { status: 404 }
      )
    }
    
    // Transformera projekt till planeringsformat med faser
    const importedProjects = existingProjects.map(project => {
      // Använd befintliga datum om de finns, annars skapa defaults
      const startDate = project.startDate || new Date()
      const endDate = project.plannedEndDate || addMonths(startDate, 3)
      
      // Skapa exempel på faser baserat på projektets längd och typ
      const phases = generateDefaultPhases(project, startDate, endDate)
      
      const importedProject = {
        id: String(project.id),
        name: project.name,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: project.status || 'not started',
        phases
      };
      
      console.log(`Importerat projekt: ${importedProject.id}: ${importedProject.name}`);
      return importedProject;
    })
    
    // Skapa eller uppdatera projektfaserna i databasen om det behövs
    for (const project of importedProjects) {
      // Kontrollera om projektet redan har faser
      const existingPhases = await prisma.phase.findMany({
        where: {
          projectId: project.id
        }
      });
      
      // Om inga faser finns, skapa dem
      if (existingPhases.length === 0 && project.phases.length > 0) {
        console.log(`Skapar faser för projekt ${project.id}: ${project.name}`);
        
        // Skapa faserna i databasen
        for (const phase of project.phases) {
          await prisma.phase.create({
            data: {
              name: phase.name,
              description: phase.description || '',
              projectId: project.id,
              startDate: new Date(phase.startDate),
              endDate: new Date(phase.endDate),
              completionRate: phase.completionRate || 0
            }
          });
        }
      }
    }
    
    console.log(`Importerade ${importedProjects.length} projekt till planeringen`);
    
    return NextResponse.json({
      success: true,
      importedProjects,
      count: importedProjects.length
    })
  } catch (error) {
    console.error('Error importing projects to planning:', error)
    return NextResponse.json(
      { error: 'Kunde inte importera projekt till planeringen' },
      { status: 500 }
    )
  }
}

// Hjälpfunktion för att generera standardfaser för ett projekt
function generateDefaultPhases(project: any, startDate: Date, endDate: Date) {
  const totalDuration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  const phases = []
  
  // Anpassa faser baserat på projektets namn eller typ för mer realistiska faser
  if (project.name.toLowerCase().includes('bygg') || 
      project.name.toLowerCase().includes('konstruktion')) {
    // Byggprojekt
    phases.push({
      id: Date.now() + 1,
      name: 'Planering',
      description: 'Planering och förberedelser',
      startDate: startDate.toISOString(),
      endDate: addDays(startDate, Math.floor(totalDuration * 0.2)).toISOString(),
      status: 'in progress',
      projectId: project.id,
      completionRate: 0
    })
    
    phases.push({
      id: Date.now() + 2,
      name: 'Grundläggning',
      description: 'Grundläggningsarbeten',
      startDate: addDays(startDate, Math.floor(totalDuration * 0.2) + 1).toISOString(),
      endDate: addDays(startDate, Math.floor(totalDuration * 0.4)).toISOString(),
      status: 'not started',
      projectId: project.id,
      completionRate: 0
    })
    
    phases.push({
      id: Date.now() + 3,
      name: 'Stomresning',
      description: 'Stomresning och yttertak',
      startDate: addDays(startDate, Math.floor(totalDuration * 0.4) + 1).toISOString(),
      endDate: addDays(startDate, Math.floor(totalDuration * 0.6)).toISOString(),
      status: 'not started',
      projectId: project.id,
      completionRate: 0
    })
    
    phases.push({
      id: Date.now() + 4,
      name: 'Invändiga arbeten',
      description: 'Invändiga installationer och ytskikt',
      startDate: addDays(startDate, Math.floor(totalDuration * 0.6) + 1).toISOString(),
      endDate: addDays(startDate, Math.floor(totalDuration * 0.9)).toISOString(),
      status: 'not started',
      projectId: project.id,
      completionRate: 0
    })
    
    phases.push({
      id: Date.now() + 5,
      name: 'Slutbesiktning',
      description: 'Slutbesiktning och överlämning',
      startDate: addDays(startDate, Math.floor(totalDuration * 0.9) + 1).toISOString(),
      endDate: endDate.toISOString(),
      status: 'not started',
      projectId: project.id,
      completionRate: 0
    })
  } else if (project.name.toLowerCase().includes('it') || 
             project.name.toLowerCase().includes('system')) {
    // IT-projekt
    phases.push({
      id: Date.now() + 1,
      name: 'Kravanalys',
      startDate: startDate.toISOString(),
      endDate: addDays(startDate, Math.floor(totalDuration * 0.15)).toISOString(),
      status: 'in progress',
      projectId: project.id
    })
    
    phases.push({
      id: Date.now() + 2,
      name: 'Design',
      startDate: addDays(startDate, Math.floor(totalDuration * 0.15) + 1).toISOString(),
      endDate: addDays(startDate, Math.floor(totalDuration * 0.3)).toISOString(),
      status: 'not started',
      projectId: project.id
    })
    
    phases.push({
      id: Date.now() + 3,
      name: 'Utveckling',
      startDate: addDays(startDate, Math.floor(totalDuration * 0.3) + 1).toISOString(),
      endDate: addDays(startDate, Math.floor(totalDuration * 0.7)).toISOString(),
      status: 'not started',
      projectId: project.id
    })
    
    phases.push({
      id: Date.now() + 4,
      name: 'Test',
      startDate: addDays(startDate, Math.floor(totalDuration * 0.7) + 1).toISOString(),
      endDate: addDays(startDate, Math.floor(totalDuration * 0.9)).toISOString(),
      status: 'not started',
      projectId: project.id
    })
    
    phases.push({
      id: Date.now() + 5,
      name: 'Driftsättning',
      startDate: addDays(startDate, Math.floor(totalDuration * 0.9) + 1).toISOString(),
      endDate: endDate.toISOString(),
      status: 'not started',
      projectId: project.id
    })
  } else {
    // Standardfaser för övriga projekt
    phases.push({
      id: Date.now() + 1,
      name: 'Planering',
      description: 'Projektplanering och uppstart',
      startDate: startDate.toISOString(),
      endDate: addDays(startDate, Math.floor(totalDuration * 0.25)).toISOString(),
      status: 'in progress',
      projectId: project.id,
      completionRate: 0
    })
    
    phases.push({
      id: Date.now() + 2,
      name: 'Genomförande',
      description: 'Genomförande av huvudaktiviteter',
      startDate: addDays(startDate, Math.floor(totalDuration * 0.25) + 1).toISOString(),
      endDate: addDays(startDate, Math.floor(totalDuration * 0.75)).toISOString(),
      status: 'not started',
      projectId: project.id,
      completionRate: 0
    })
    
    phases.push({
      id: Date.now() + 3,
      name: 'Avslut',
      description: 'Projektavslut och överlämning',
      startDate: addDays(startDate, Math.floor(totalDuration * 0.75) + 1).toISOString(),
      endDate: endDate.toISOString(),
      status: 'not started',
      projectId: project.id,
      completionRate: 0
    })
  }
  
  return phases
} 