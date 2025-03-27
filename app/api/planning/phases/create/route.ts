import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/planning/phases/create
// Skapa en ny fas
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    console.log("Mottagen fasdata för skapande:", data);
    
    if (!data.projectId) {
      console.error('Fasen måste ha projektId:', data);
      return NextResponse.json(
        { error: 'Fasen måste ha projektId' },
        { status: 400 }
      );
    }
    
    // Konvertera strängar till datum
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    // Skapa den nya fasen
    const newPhase = await prisma.phase.create({
      data: {
        name: data.name,
        description: data.description || '',
        projectId: data.projectId,
        startDate: startDate,
        endDate: endDate,
        completionRate: data.completionRate || 0,
        status: data.status || 'not started',
        color: data.color || null
      }
    });
    
    console.log('Skapad fas:', newPhase);
    
    return NextResponse.json({
      success: true,
      phase: newPhase
    });
  } catch (error) {
    console.error('Fel vid skapande av fas:', error);
    return NextResponse.json(
      { error: 'Kunde inte skapa fasen: ' + (error instanceof Error ? error.message : 'Okänt fel') },
      { status: 500 }
    );
  }
} 