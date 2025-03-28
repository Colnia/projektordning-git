import GanttChart from "@/components/gantt-chart"

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="container mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Projektplaneringsverktyg</h1>
        <p className="text-muted-foreground">
          Hantera dina projekt med vårt avancerade Gantt-schema med drag-and-drop funktionalitet.
        </p>
        <GanttChart />
      </div>
    </main>
  )
}

