"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Hämta alla projekt
export async function getProjects() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        milestones: true,
        resources: true,
      },
    })

    return { success: true, data: projects }
  } catch (error) {
    console.error("Fel vid hämtning av projekt:", error)
    return { success: false, error: "Kunde inte hämta projekt" }
  }
}

// Hämta ett specifikt projekt med alla relaterade data
export async function getProjectWithDetails(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            resources: {
              include: {
                resource: true,
              },
            },
            dependenciesFrom: {
              include: {
                toTask: true,
              },
            },
            dependenciesTo: {
              include: {
                fromTask: true,
              },
            },
          },
        },
        milestones: true,
        resources: true,
      },
    })

    if (!project) {
      return { success: false, error: "Projekt hittades inte" }
    }

    // Transformera data till det format som Gantt-schemat förväntar sig
    const transformedProject = {
      id: project.id,
      name: project.name,
      startDate: project.startDate.toISOString().split("T")[0],
      endDate: project.endDate.toISOString().split("T")[0],
      description: project.description || "",
      color: project.color || "#0891b2",
      progress: project.progress,
      tasks: project.tasks.map((task) => ({
        id: task.id,
        name: task.name,
        description: task.description || "",
        startDate: task.startDate.toISOString().split("T")[0],
        endDate: task.endDate.toISOString().split("T")[0],
        progress: task.progress,
        status: task.status as any,
        priority: task.priority as any,
        resources: task.resources.map((r) => r.resourceId),
        dependencies: task.dependenciesTo.map((dep) => ({
          fromTaskId: dep.fromTaskId,
          toTaskId: dep.toTaskId,
          type: dep.type as any,
        })),
        parentId: task.parentId || undefined,
        milestoneId: task.milestoneId || undefined,
        color: task.color || undefined,
        collapsed: task.collapsed || false,
        isPhase: task.isPhase,
        subTasks: project.tasks.filter((t) => t.parentId === task.id).map((t) => t.id),
      })),
      milestones: project.milestones.map((milestone) => ({
        id: milestone.id,
        name: milestone.name,
        date: milestone.date.toISOString().split("T")[0],
        color: milestone.color || undefined,
      })),
      resources: project.resources.map((resource) => ({
        id: resource.id,
        name: resource.name,
        role: resource.role,
        avatar: resource.avatar || undefined,
        availability: resource.availability,
        color: resource.color,
      })),
    }

    return { success: true, data: transformedProject }
  } catch (error) {
    console.error("Fel vid hämtning av projektdetaljer:", error)
    return { success: false, error: "Kunde inte hämta projektdetaljer" }
  }
}

// Skapa ett nytt projekt
const createProjectSchema = z.object({
  name: z.string().min(1, "Projektnamn krävs"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ogiltigt datumformat"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ogiltigt datumformat"),
  description: z.string().optional(),
  color: z.string().optional(),
})

export async function createProject(formData: FormData) {
  try {
    const validatedFields = createProjectSchema.parse({
      name: formData.get("name"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      description: formData.get("description"),
      color: formData.get("color"),
    })

    const project = await prisma.project.create({
      data: {
        name: validatedFields.name,
        startDate: new Date(validatedFields.startDate),
        endDate: new Date(validatedFields.endDate),
        description: validatedFields.description,
        color: validatedFields.color,
      },
    })

    revalidatePath("/") // Uppdatera cachen
    return { success: true, data: project }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }

    console.error("Fel vid skapande av projekt:", error)
    return { success: false, error: "Kunde inte skapa projekt" }
  }
}

// Uppdatera ett projekt
export async function updateProject(projectId: string, formData: FormData) {
  try {
    const validatedFields = createProjectSchema.parse({
      name: formData.get("name"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      description: formData.get("description"),
      color: formData.get("color"),
    })

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: validatedFields.name,
        startDate: new Date(validatedFields.startDate),
        endDate: new Date(validatedFields.endDate),
        description: validatedFields.description,
        color: validatedFields.color,
      },
    })

    revalidatePath("/") // Uppdatera cachen
    return { success: true, data: project }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }

    console.error("Fel vid uppdatering av projekt:", error)
    return { success: false, error: "Kunde inte uppdatera projekt" }
  }
}

// Ta bort ett projekt
export async function deleteProject(projectId: string) {
  try {
    await prisma.project.delete({
      where: { id: projectId },
    })

    revalidatePath("/") // Uppdatera cachen
    return { success: true }
  } catch (error) {
    console.error("Fel vid borttagning av projekt:", error)
    return { success: false, error: "Kunde inte ta bort projekt" }
  }
}

