# Projektplaneringsverktyg - Gantt-schema

## Översikt

Detta projektplaneringsverktyg är en avancerad Gantt-schema-applikation byggd med Next.js, React och Tailwind CSS. Verktyget möjliggör visualisering och hantering av projekt med hierarkiska strukturer, drag-and-drop-funktionalitet och detaljerad redigering av uppgifter.

## Funktioner

- **Hierarkisk projektstruktur**: Stöd för projekt, faser och uppgifter i en hierarkisk struktur
- **Multiprojektvy**: Möjlighet att visa och hantera flera projekt samtidigt
- **Interaktiv tidslinje**: Dynamisk tidslinje med olika tidsskalor (dag, vecka, månad, kvartal, år)
- **Drag-and-drop**: Möjlighet att dra och ändra storlek på uppgifter direkt i tidslinjen
- **Detaljerad redigering**: Omfattande redigeringsmöjligheter för uppgifter och faser
- **Resurstilldelning**: Hantering av resurser och tilldelning till uppgifter
- **Beroenden**: Visualisering och hantering av beroenden mellan uppgifter
- **Milstolpar**: Markering av viktiga milstolpar i projektet
- **Automatisk framstegberäkning**: Automatisk beräkning av framsteg för faser och projekt baserat på underliggande uppgifter
- **Kontextmedveten navigering**: Brödsmulor för enkel navigering mellan projekt, faser och uppgifter
- **Databasintegration**: Stöd för att spara och hämta data från en Prisma-databas

## Teknisk arkitektur

### Komponentstruktur

Applikationen är uppbyggd kring följande huvudkomponenter:

- **GanttChart**: Huvudkomponenten som orkestrerar hela Gantt-schemat
- **Tidslinje**: Visar datumhuvud och tidslinjerutnät
- **Uppgiftslista**: Visar hierarkisk lista över projekt, faser och uppgifter
- **Uppgiftsstaplar**: Visar uppgifter som staplar på tidslinjen
- **Redigeringsdialoger**: Modala dialoger för detaljerad redigering av uppgifter och projekt

### Datamodell

Applikationen använder följande datamodell:

```typescript
// Grundläggande typer
type TaskStatus = "not-started" | "in-progress" | "completed" | "delayed" | "cancelled"
type TaskPriority = "low" | "medium" | "high" | "critical"
type TimeScale = "day" | "week" | "month" | "quarter" | "year"
type ViewMode = "standard" | "compact" | "detailed"

// Resursmodell
interface Resource {
  id: string
  name: string
  role: string
  avatar?: string
  availability: number // percentage
  color: string
}

// Beroendemodell
interface Dependency {
  fromTaskId: string
  toTaskId: string
  type: "finish-to-start" | "start-to-start" | "finish-to-finish" | "start-to-finish"
}

// Uppgiftsmodell med hierarkiskt stöd
interface Task {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  progress: number
  status: TaskStatus
  priority: TaskPriority
  resources: string[]
  dependencies: Dependency[]
  parentId?: string
  milestoneId?: string
  color?: string
  collapsed?: boolean
  isPhase?: boolean
  subTasks?: string[]
}

// Milstolpemodell
interface Milestone {
  id: string
  name: string
  date: string
  color?: string
}

// Projektmodell
interface Project {
  id: string
  name: string
  startDate: string
  endDate: string
  tasks: Task[]
  milestones: Milestone[]
  resources: Resource[]
  color?: string
  progress?: number
  description?: string
}

