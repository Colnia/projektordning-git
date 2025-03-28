# Prisma-integration för Gantt-schema

## Översikt

Detta dokument beskriver hur Gantt-schemat integreras med Prisma för att möjliggöra persistent datalagring i en relationsdatabas. Integrationen ger stöd för att spara och hämta projekt, faser, uppgifter, resurser, milstolpar och beroenden.

![Databasschema](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/database-schema-placeholder-wPtVb1YSk7OBDnFhavg76KNMsy1IOg.png)

## Innehåll

- [Databasschema](#databasschema)
- [Installation och konfiguration](#installation-och-konfiguration)
- [Server Actions](#server-actions)
- [Användning i Gantt-komponenten](#användning-i-gantt-komponenten)
- [Datamodellering](#datamodellering)
- [Optimering och prestanda](#optimering-och-prestanda)
- [Felsökning](#felsökning)

## Databasschema

Prisma-schemat definierar följande modeller:

- **Project**: Huvudentitet som representerar ett projekt
- **Task**: Representerar både faser och uppgifter i projektet
- **Milestone**: Viktiga händelser i projektet
- **Resource**: Personer eller resurser som kan tilldelas uppgifter
- **ResourceAssignment**: Kopplingstabell mellan resurser och uppgifter
- **Dependency**: Beroenden mellan uppgifter

### Schema-definition

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Kan ändras till mysql, sqlite, etc.
  url      = env("DATABASE_URL")
}

model Project {
  id          String      @id @default(cuid())
  name        String
  startDate   DateTime
  endDate     DateTime
  description String?
  color       String?
  progress    Float       @default(0)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  tasks       Task[]
  milestones  Milestone[]
  resources   Resource[]
}

model Task {
  id           String       @id @default(cuid())
  name         String
  description  String?
  startDate    DateTime
  endDate      DateTime
  progress     Float        @default(0)
  status       String       // "not-started", "in-progress", "completed", "delayed", "cancelled"
  priority     String       // "low", "medium", "high", "critical"
  color        String?
  isPhase      Boolean      @default(false)
  collapsed    Boolean      @default(false)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  
  // Relationer
  project      Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId    String
  parent       Task?        @relation("TaskToSubTask", fields: [parentId], references: [id])
  parentId     String?
  subTasks     Task[]       @relation("TaskToSubTask")
  milestone    Milestone?   @relation(fields: [milestoneId], references: [id])
  milestoneId  String?
  resources    ResourceAssignment[]
  dependenciesFrom Dependency[] @relation("FromTask")
  dependenciesTo   Dependency[] @relation("ToTask")
}

model Milestone {
  id        String   @id @default(cuid())
  name      String
  date      DateTime
  color     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationer
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId String
  tasks     Task[]
}

model Resource {
  id           String       @id @default(cuid())
  name         String
  role         String
  avatar       String?
  availability Float        @default(100)
  color        String
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  
  // Relationer
  project      Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId    String
  assignments  ResourceAssignment[]
}

model ResourceAssignment {
  id         String   @id @default(cuid())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  // Relationer
  resource   Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  resourceId String
  task       Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId     String

  @@unique([resourceId, taskId])
}

model Dependency {
  id        String   @id @default(cuid())
  type      String   // "finish-to-start", "start-to-start", "finish-to-finish", "start-to-finish"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationer
  fromTask  Task     @relation("FromTask", fields: [fromTaskId], references: [id], onDelete: Cascade)
  fromTaskId String
  toTask    Task     @relation("ToTask", fields: [toTaskId], references: [id], onDelete: Cascade)
  toTaskId  String

  @@unique([fromTaskId, toTaskId])
}

