"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Line, Pie, Doughnut } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { ArrowUp, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { useProjectStore } from "@/lib/store"
import { BudgetPerformanceChart } from "@/components/budget-performance-chart"
import { ProjectTimeline } from "@/components/project-timeline"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

export function Overview() {
  const [showDetailedStats, setShowDetailedStats] = useState(false)
  const { projects, archivedProjects, quotes, archivedQuotes } = useProjectStore()

  // Beräkna projektstatistik
  const projectStats = useMemo(() => {
    const activeProjects = projects.length
    const delayedProjects = projects.filter((p) => p.status === "Försenat").length
    const completedProjects = archivedProjects.filter((p) => p.status === "Färdigt").length
    const totalProjectBudget = projects.reduce((sum, p) => sum + p.budget, 0)
    const totalProjectCost = projects.reduce((sum, p) => sum + p.costToDate, 0)
    const projectMargin =
      totalProjectBudget > 0 ? ((totalProjectBudget - totalProjectCost) / totalProjectBudget) * 100 : 0

    // Beräkna genomsnittlig projekttid för avslutade projekt
    const completedProjectDurations = archivedProjects
      .filter((p) => p.status === "Färdigt" && p.actualEndDate)
      .map((p) => {
        const start = new Date(p.startDate)
        const end = new Date(p.actualEndDate!)
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30) // Månader
      })

    const averageProjectDuration =
      completedProjectDurations.length > 0
        ? Math.round(
            completedProjectDurations.reduce((sum, duration) => sum + duration, 0) / completedProjectDurations.length,
          )
        : 0

    return {
      activeProjects,
      delayedProjects,
      completedProjects,
      totalProjectBudget,
      totalProjectCost,
      projectMargin,
      averageProjectDuration,
    }
  }, [projects, archivedProjects])

  // Beräkna offertstatistik
  const quoteStats = useMemo(() => {
    const activeQuotes = quotes.length
    const totalQuoteValue = quotes.reduce((sum, q) => sum + q.amount, 0)
    const acceptedQuotes = [...quotes, ...archivedQuotes].filter((q) => q.status === "Accepterad").length
    const totalQuotes = quotes.length + archivedQuotes.length
    const conversionRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0

    return {
      activeQuotes,
      totalQuoteValue,
      acceptedQuotes,
      totalQuotes,
      conversionRate,
    }
  }, [quotes, archivedQuotes])

  // Beräkna trenddata för de senaste 6 månaderna
  const trendData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      return {
        date,
        label: date.toLocaleString("sv-SE", { month: "short" }),
      }
    }).reverse()

    const projectTrends = last6Months.map(({ date }) => ({
      active: projects.filter(
        (p) => new Date(p.startDate) <= date && (!p.actualEndDate || new Date(p.actualEndDate) > date),
      ).length,
      completed: archivedProjects.filter(
        (p) => p.status === "Färdigt" && new Date(p.actualEndDate || p.plannedEndDate) <= date,
      ).length,
    }))

    const quoteTrends = last6Months.map(({ date }) => ({
      value: quotes.filter((q) => new Date(q.quoteDate) <= date).reduce((sum, q) => sum + q.amount, 0) / 1000000, // Konvertera till MSEK
    }))

    return {
      labels: last6Months.map((m) => m.label),
      projectTrends,
      quoteTrends,
    }
  }, [projects, archivedProjects, quotes])

  // Beräkna statusfördelning för projekt
  const projectStatusData = useMemo(() => {
    const statusCounts = {
      Planering: projects.filter((p) => p.status === "Planering").length,
      Pågående: projects.filter((p) => p.status === "Pågående").length,
      Färdigt: projects.filter((p) => p.status === "Färdigt").length,
      Försenat: projects.filter((p) => p.status === "Försenat").length,
    }

    return {
      labels: Object.keys(statusCounts),
      data: Object.values(statusCounts),
    }
  }, [projects])

  // Beräkna statusfördelning för offerter
  const quoteStatusData = useMemo(() => {
    const allQuotes = [...quotes, ...archivedQuotes]
    const statusCounts = {
      Accepterad: allQuotes.filter((q) => q.status === "Accepterad").length,
      Avslagen: allQuotes.filter((q) => q.status === "Avslagen").length,
      "Under förhandling": quotes.filter((q) => q.status === "Under förhandling").length,
      Skickad: quotes.filter((q) => q.status === "Skickad").length,
    }

    return {
      labels: Object.keys(statusCounts),
      data: Object.values(statusCounts),
    }
  }, [quotes, archivedQuotes])

  // Beräkna toppkunder baserat på totalt värde
  const topCustomers = useMemo(() => {
    const customerStats = [...projects, ...archivedProjects, ...quotes, ...archivedQuotes].reduce(
      (acc, item) => {
        const customer = item.customer
        const value = "amount" in item ? item.amount : item.budget
        if (!acc[customer]) {
          acc[customer] = { total: 0, count: 0 }
        }
        acc[customer].total += value
        acc[customer].count += 1
        return acc
      },
      {} as Record<string, { total: number; count: number }>,
    )

    return Object.entries(customerStats)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 3)
      .map(([name, stats]) => ({
        name,
        value: `${(stats.total / 1000000).toFixed(1)} MSEK`,
        projects: stats.count,
      }))
  }, [projects, archivedProjects, quotes, archivedQuotes])

  // Chart data objects
  const projectTrendsChartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: "Aktiva projekt",
        data: trendData.projectTrends.map((t) => t.active),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgb(59, 130, 246, 0.2)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Avslutade projekt",
        data: trendData.projectTrends.map((t) => t.completed),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgb(34, 197, 94, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const projectStatusChartData = {
    labels: projectStatusData.labels,
    datasets: [
      {
        data: projectStatusData.data,
        backgroundColor: ["rgb(234, 179, 8)", "rgb(59, 130, 246)", "rgb(34, 197, 94)", "rgb(239, 68, 68)"],
        borderColor: [
          "rgb(234, 179, 8, 0.8)",
          "rgb(59, 130, 246, 0.8)",
          "rgb(34, 197, 94, 0.8)",
          "rgb(239, 68, 68, 0.8)",
        ],
        borderWidth: 2,
      },
    ],
  }

  const quoteTrendsChartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: "Offertvärde (MSEK)",
        data: trendData.quoteTrends.map((t) => t.value),
        backgroundColor: "rgb(99, 102, 241, 0.2)",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const quoteStatusChartData = {
    labels: quoteStatusData.labels,
    datasets: [
      {
        data: quoteStatusData.data,
        backgroundColor: ["rgb(34, 197, 94)", "rgb(239, 68, 68)", "rgb(59, 130, 246)", "rgb(234, 179, 8)"],
        borderColor: [
          "rgb(34, 197, 94, 0.8)",
          "rgb(239, 68, 68, 0.8)",
          "rgb(59, 130, 246, 0.8)",
          "rgb(234, 179, 8, 0.8)",
        ],
        borderWidth: 2,
      },
    ],
  }

  // Chart configuration options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          precision: 0
        }
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 12
          }
        },
      },
      tooltip: {
        padding: 10,
        titleFont: {
          size: 14,
          weight: "bold"
        },
        bodyFont: {
          size: 13
        },
        usePointStyle: true,
        boxPadding: 6
      }
    },
    animation: {
      duration: 1000
    },
  }

  return (
    <div className="space-y-8">
      {/* First row - KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute h-full w-1 bg-blue-500 left-0 top-0"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Projekt</CardTitle>
            <div className="rounded-full bg-blue-100 p-2 text-blue-700">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.activeProjects}</div>
            {projectStats.delayedProjects > 0 && (
              <p className="text-xs text-gray-500">
                varav <span className="text-red-500 font-medium">{projectStats.delayedProjects} försenade</span>
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute h-full w-1 bg-indigo-500 left-0 top-0"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Offerter</CardTitle>
            <div className="rounded-full bg-indigo-100 p-2 text-indigo-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quoteStats.activeQuotes}</div>
            <p className="text-xs text-gray-500">
              Värde: {(quoteStats.totalQuoteValue / 1000000).toFixed(1)} MSEK
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute h-full w-1 bg-emerald-500 left-0 top-0"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projekt Marginal</CardTitle>
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
              <ArrowUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.projectMargin.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">
              Budget kvar: {((projectStats.totalProjectBudget - projectStats.totalProjectCost) / 1000000).toFixed(1)}{" "}
              MSEK
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute h-full w-1 bg-amber-500 left-0 top-0"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offert Konvertering</CardTitle>
            <div className="rounded-full bg-amber-100 p-2 text-amber-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quoteStats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">
              {quoteStats.acceptedQuotes} / {quoteStats.totalQuotes} accepterade
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Timeline Component */}
      <ProjectTimeline projects={projects} />

      {/* Budget Performance Chart */}
      <BudgetPerformanceChart projects={projects} />

      {/* Project & Quote Tabs Section */}
      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="bg-white rounded-lg p-1 border shadow-sm">
          <TabsTrigger value="projects" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            Projektstatistik
          </TabsTrigger>
          <TabsTrigger value="quotes" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            Offertstatistik
          </TabsTrigger>
        </TabsList>
        <TabsContent value="projects" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1 md:col-span-2 border-none shadow-md">
          <CardHeader>
                <CardTitle>Projektutveckling</CardTitle>
            <CardDescription>Antal aktiva och avslutade projekt över tid</CardDescription>
          </CardHeader>
              <CardContent className="h-[300px] w-full">
                <Line options={chartOptions} data={projectTrendsChartData} />
          </CardContent>
        </Card>
            <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>Projektstatus</CardTitle>
                <CardDescription>Fördelning efter status</CardDescription>
          </CardHeader>
              <CardContent className="h-[300px] w-full">
            <Doughnut
              options={{
                    ...chartOptions,
                plugins: {
                      ...chartOptions.plugins,
                  legend: {
                        position: "right",
                    labels: {
                          boxWidth: 10,
                          font: { size: 11 },
                          padding: 15
                        }
                      } 
                    }
                  }} 
                  data={projectStatusChartData} 
                />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
        <TabsContent value="quotes" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Offertvärde över tid</CardTitle>
                    <CardDescription>Totalt offertvärde per månad</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Line data={quoteTrendsChartData} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Offertkonvertering</CardTitle>
                    <CardDescription>Status på offerter</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Pie data={quoteStatusChartData} />
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Toppkunder</CardTitle>
                    <CardDescription>Baserat på totalt värde (projekt + offerter)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topCustomers.map((customer) => (
                        <div key={customer.name} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {customer.value} ({customer.projects} projekt/offerter)
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
    </div>
  )
}

