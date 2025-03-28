import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: {
        isArchived: false
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta projekt' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validera input
    if (!data.name || !data.customer || !data.startDate) {
      return NextResponse.json(
        { error: 'Namn, kund och startdatum krävs' },
        { status: 400 }
      );
    }
    
    // Skapa projekt
    const project = await prisma.project.create({
      data: {
        name: data.name,
        customer: data.customer,
        manager: data.manager || '',
        startDate: new Date(data.startDate),
        plannedEndDate: new Date(data.plannedEndDate || data.startDate),
        status: data.status || 'Planering',
        budget: parseFloat(data.budget) || 0,
        costToDate: parseFloat(data.costToDate) || 0,
        estimatedTotalCost: parseFloat(data.estimatedTotalCost) || 0,
        milestones: data.milestones || '',
        comments: data.comments || '',
        isArchived: false
      }
    });
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: 'Kunde inte skapa projektet' },
      { status: 500 }
    );
  }
}
