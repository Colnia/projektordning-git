"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Hämta alla uppgifter för ett projekt
export async function getProjectTasks(projectId: string) {
  try {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        resources: {
          include: {
            resource: true,
          },
        },
        dependenciesFrom: true,
        dependenciesTo: true,
      },
    })

    return { success: true, data: tasks }
  } catch (error) {
    console.error("Fel vid hämtning av uppgifter:", error)
    return { success: false, error: "Kunde inte hämta uppgifter" }
  }
}

// Skapa en ny uppgift
const createTaskSchema = z.object({
  name: z.string().min(1, "Uppgiftsnamn krävs"),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ogiltigt datumformat"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ogiltigt datumformat"),
  progress: z.coerce.number().min(0).max(100),
  status: z.enum(["not-started", "in-progress", "completed", "delayed", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  color: z.string().optional(),
  isPhase: z.coerce.boolean().optional(),
  parentId: z.string().optional(),
  projectId: z.string(),
  resources: z.array(z.string()).optional(),
})

export async function createTask(formData: FormData) {
  try {
    const projectId = formData.get("projectId") as string
    const parentId = (formData.get("parentId") as string) || undefined
    const resourceIds = formData.getAll("resources") as string[]

    const validatedFields = createTaskSchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      progress: formData.get("progress"),
      status: formData.get("status"),
      priority: formData.get("priority"),
      color: formData.get("color"),
      isPhase: formData.get("isPhase"),
      parentId,
      projectId,
      resources: resourceIds,
    })

    // Skapa uppgiften
    const task = await prisma.task.create({
      data: {
        name: validatedFields.name,
        description: validatedFields.description,
        startDate: new Date(validatedFields.startDate),
        endDate: new Date(validatedFields.endDate),
        progress: validatedFields.progress,
        status: validatedFields.status,
        priority: validatedFields.priority,
        color: validatedFields.color,
        isPhase: validatedFields.isPhase || false,
        parentId: validatedFields.parentId,
        projectId: validatedFields.projectId,
      },
    })

    // Tilldela resurser om det finns några
    if (validatedFields.resources && validatedFields.resources.length > 0) {
      await Promise.all(
        validatedFields.resources.map((resourceId) =>
          prisma.resourceAssignment.create({
            data: {
              taskId: task.id,
              resourceId,
            },
          }),
        ),
      )
    }

    // Om detta är en underuppgift, uppdatera föräldrauppgiften
    if (validatedFields.parentId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: validatedFields.parentId },
      })

      if (parentTask && parentTask.isPhase) {
        // Uppdatera framsteget för fasen baserat på alla underuppgifter
        const childTasks = await prisma.task.findMany({
          where: { parentId: validatedFields.parentId },
        })

        if (childTasks.length > 0) {
          const totalProgress = childTasks.reduce((sum, task) => sum + task.progress, 0)
          const averageProgress = totalProgress / childTasks.length

          await prisma.task.update({
            where: { id: validatedFields.parentId },
            data: { progress: averageProgress },
          })
        }
      }
    }

    revalidatePath(`/projects/${projectId}`) // Uppdatera cachen
    return { success: true, data: task }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }

    console.error("Fel vid skapande av uppgift:", error)
    return { success: false, error: "Kunde inte skapa uppgift" }
  }
}

// Uppdatera en uppgift
export async function updateTask(taskId: string, formData: FormData) {
  try {
    const projectId = formData.get("projectId") as string
    const resourceIds = formData.getAll("resources") as string[]

    const validatedFields = createTaskSchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      progress: formData.get("progress"),
      status: formData.get("status"),
      priority: formData.get("priority"),
      color: formData.get("color"),
      isPhase: formData.get("isPhase"),
      parentId: (formData.get("parentId") as string) || undefined,
      projectId,
      resources: resourceIds,
    })

    // Uppdatera uppgiften
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        name: validatedFields.name,
        description: validatedFields.description,
        startDate: new Date(validatedFields.startDate),
        endDate: new Date(validatedFields.endDate),
        progress: validatedFields.progress,
        status: validatedFields.status,
        priority: validatedFields.priority,
        color: validatedFields.color,
        isPhase: validatedFields.isPhase || false,
        parentId: validatedFields.parentId,
      },
    })

    // Uppdatera resurstilldelningar
    // Först ta bort alla befintliga tilldelningar
    await prisma.resourceAssignment.deleteMany({
      where: { taskId },
    })

    // Sedan lägg till de nya tilldelningarna
    if (validatedFields.resources && validatedFields.resources.length > 0) {
      await Promise.all(
        validatedFields.resources.map((resourceId) =>
          prisma.resourceAssignment.create({
            data: {
              taskId,
              resourceId,
            },
          }),
        ),
      )
    }

    // Om detta är en underuppgift, uppdatera föräldrauppgiften
    if (validatedFields.parentId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: validatedFields.parentId },
      })

      if (parentTask && parentTask.isPhase) {
        // Uppdatera framsteget för fasen baserat på alla underuppgifter
        const childTasks = await prisma.task.findMany({
          where: { parentId: validatedFields.parentId },
        })

        if (childTasks.length > 0) {
          const totalProgress = childTasks.reduce((sum, task) => sum + task.progress, 0)
          const averageProgress = totalProgress / childTasks.length

          await prisma.task.update({
            where: { id: validatedFields.parentId },
            data: { progress: averageProgress },
          })
        }
      }
    }

    revalidatePath(`/projects/${projectId}`) // Uppdatera cachen
    return { success: true, data: task }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }

    console.error("Fel vid uppdatering av uppgift:", error)
    return { success: false, error: "Kunde inte uppdatera uppgift" }
  }
}

// Ta bort en uppgift
export async function deleteTask(taskId: string, projectId: string) {
  try {
    // Hämta uppgiften för att kontrollera om den har en förälder
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      return { success: false, error: "Uppgift hittades inte" }
    }

    // Ta bort uppgiften
    await prisma.task.delete({
      where: { id: taskId },
    })

    // Om uppgiften hade en förälder, uppdatera förälderns framsteg
    if (task.parentId) {
      const childTasks = await prisma.task.findMany({
        where: { parentId: task.parentId },
      })

      if (childTasks.length > 0) {
        const totalProgress = childTasks.reduce((sum, task) => sum + task.progress, 0)
        const averageProgress = totalProgress / childTasks.length

        await prisma.task.update({
          where: { id: task.parentId },
          data: { progress: averageProgress },
        })
      }
    }

    revalidatePath(`/projects/${projectId}`) // Uppdatera cachen
    return { success: true }
  } catch (error) {
    console.error("Fel vid borttagning av uppgift:", error)
    return { success: false, error: "Kunde inte ta bort uppgift" }
  }
}

// Lägg till ett beroende mellan två uppgifter
export async function addDependency(fromTaskId: string, toTaskId: string, type: string, projectId: string) {
  try {
    await prisma.dependency.create({
      data: {
        fromTaskId,
        toTaskId,
        type,
      },
    })

    revalidatePath(`/projects/${projectId}`) // Uppdatera cachen
    return { success: true }
  } catch (error) {
    console.error("Fel vid skapande av beroende:", error)
    return { success: false, error: "Kunde inte skapa beroende" }
  }
}

// Ta bort ett beroende
export async function removeDependency(fromTaskId: string, toTaskId: string, projectId: string) {
  try {
    await prisma.dependency.deleteMany({
      where: {
        fromTaskId,
        toTaskId,
      },
    })

    revalidatePath(`/projects/${projectId}`) // Uppdatera cachen
    return { success: true }
  } catch (error) {
    console.error("Fel vid borttagning av beroende:", error)
    return { success: false, error: "Kunde inte ta bort beroende" }
  }
}

