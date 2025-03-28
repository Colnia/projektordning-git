"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "./overview"
import { ProjectsTable } from "./projects-table"
import { QuotesTable } from "./quotes-table"
import { ArchivedProjectsList } from "./archived/archived-projects-list"
import { ArchivedQuotesList } from "./archived/archived-quotes-list"
import { useProjectStore } from "@/lib/store"
import { Header } from "@/components/header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download, Home, ChevronRight } from "lucide-react"
import Link from "next/link"
import { ReportGenerator } from "@/components/report-generator"
import { useSearchParams } from "next/navigation"

// Initial mockdata som kommer laddas in i store om den är tom
const initialProjects = [
  {
    id: "PRJ001",
    name: "Kylinstallation Storköp",
    customer: "Storköp AB",
    manager: "Anna Andersson",
    startDate: "2024-01-15",
    plannedEndDate: "2024-06-30",
    status: "Pågående" as const,
    budget: 1500000,
    costToDate: 750000,
    estimatedTotalCost: 1450000,
    milestones: "Installation klar 50%",
    comments: "Följer tidplan",
    changeHistory: [
      {
        timestamp: "2024-01-20T14:30:00Z",
        user: "Anna Andersson",
        changes: {
          costToDate: {
            from: 500000,
            to: 750000,
          },
          milestones: {
            from: "Installation påbörjad",
            to: "Installation klar 50%",
          },
        },
        comment: "Uppdaterat projektets framsteg",
      },
    ],
  },
]

const initialQuotes = [
  {
    id: "Q001",
    projectName: "Kylsystem Stormarknad Nord",
    customer: "Retail Solutions AB",
    salesperson: "Erik Eriksson",
    quoteDate: "2024-02-01",
    deadline: "2024-03-15",
    amount: 2500000,
    status: "Under förhandling" as const,
    comments: "Kunden önskar reviderat förslag",
    followUpDate: "2024-02-28",
    changeHistory: [
      {
        timestamp: "2024-02-01T10:00:00Z",
        user: "Erik Eriksson",
        changes: {
          status: {
            from: "Skickad",
            to: "Under förhandling",
          },
        },
        comment: "Kunden har återkommit med frågor",
      },
    ],
  },
]

export default function DashboardPage() {
  const { projects, quotes, archivedProjects, archivedQuotes, initializeStore, loadProjects } = useProjectStore()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)

  // Ladda in projekt från databasen när komponenten monteras
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Ladda in data från API
        await loadProjects();
      } catch (error) {
        console.error("Fel vid laddning av projektdata:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Fallback till exempel-data om API-anropet misslyckas
    initializeStore({
      projects: initialProjects as any,
      quotes: initialQuotes as any,
      archivedProjects: [],
      archivedQuotes: [],
    });

    // Sätt aktiv flik baserat på URL-parametern
    const tabParam = searchParams.get("tab")
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [loadProjects, initializeStore, searchParams])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto p-6 space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Link href="/" className="flex items-center hover:text-foreground">
              <Home className="h-4 w-4 mr-1" />
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-medium text-foreground">Projektöversikt</span>
          </div>
          
          {/* Sidhuvud med titel och åtgärder */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold">Projektöversikt</h1>
            <div className="flex gap-2">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nytt projekt
              </Button>
              <ReportGenerator />
            </div>
          </div>
          
          {/* Huvudinnehåll med 2/3 - 1/3 layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Huvud area (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Projekt och offerter</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid grid-cols-2 md:grid-cols-4 p-1">
                      <TabsTrigger value="overview">
                        Översikt
                      </TabsTrigger>
                      <TabsTrigger value="projects">
                        Projekt ({projects.length})
                      </TabsTrigger>
                      <TabsTrigger value="quotes">
                        Offerter ({quotes.length})
                      </TabsTrigger>
                      <TabsTrigger value="archived">
                        Arkiv ({archivedProjects.length + archivedQuotes.length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="space-y-4">
                      <Overview />
                    </TabsContent>
                    <TabsContent value="projects" className="space-y-4">
                      <ProjectsTable />
                    </TabsContent>
                    <TabsContent value="quotes" className="space-y-4">
                      <QuotesTable />
                    </TabsContent>
                    <TabsContent value="archived" className="space-y-4">
                      <div className="space-y-6">
                        <Tabs defaultValue="projects" className="space-y-4">
                          <TabsList>
                            <TabsTrigger value="projects">Arkiverade Projekt ({archivedProjects.length})</TabsTrigger>
                            <TabsTrigger value="quotes">Arkiverade Offerter ({archivedQuotes.length})</TabsTrigger>
                          </TabsList>
                          <TabsContent value="projects">
                            <ArchivedProjectsList searchTerm="" />
                          </TabsContent>
                          <TabsContent value="quotes">
                            <ArchivedQuotesList searchTerm="" />
                          </TabsContent>
                        </Tabs>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
            
            {/* Sido area (1/3) */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Projektdetaljer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium">Senast uppdaterad</div>
                    <div className="text-sm">{new Date().toLocaleDateString("sv-SE")}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium">Aktiva projekt</div>
                    <div className="text-sm">{projects.length}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium">Aktiva offerter</div>
                    <div className="text-sm">{quotes.length}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Statistik</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium">Totalt projektvärde</div>
                    <div className="text-sm">{projects.reduce((sum, project) => sum + (project.budget || 0), 0).toLocaleString("sv-SE")} kr</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium">Totalt offertvärde</div>
                    <div className="text-sm">{quotes.reduce((sum, quote) => sum + (quote.amount || 0), 0).toLocaleString("sv-SE")} kr</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium">Vanligaste kunden</div>
                    <div className="text-sm">{projects[0]?.customer || "Ingen data"}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Snabbåtgärder</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Exportera projektlista
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <footer className="py-4 border-t">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          Projektordning &copy; {new Date().getFullYear()} - Ett modernt projekthanteringssystem
        </div>
      </footer>
    </div>
  )
}

