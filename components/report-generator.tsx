"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileDown } from "lucide-react"
import { useProjectStore } from "@/lib/store"
import dynamic from "next/dynamic"

const PDFDownloadButton = dynamic(() => import("./pdf-download-button").then((mod) => mod.PDFDownloadButton), {
  ssr: false,
  loading: () => <Button disabled>Laddar PDF-generator...</Button>,
})

const timeRanges = [
  { value: "thisMonth", label: "Denna månad" },
  { value: "lastMonth", label: "Förra månaden" },
  { value: "thisQuarter", label: "Detta kvartal" },
  { value: "thisYear", label: "Detta år" },
  { value: "lastYear", label: "Förra året" },
  { value: "all", label: "Hela perioden" },
]

export function ReportGenerator() {
  const [timeRange, setTimeRange] = useState("thisMonth")
  const { projects, quotes, archivedProjects, archivedQuotes } = useProjectStore()

  const filterDataByTimeRange = () => {
    const now = new Date()
    const startDate = new Date()

    switch (timeRange) {
      case "thisMonth":
        startDate.setDate(1)
        break
      case "lastMonth":
        startDate.setMonth(startDate.getMonth() - 1, 1)
        now.setDate(0)
        break
      case "thisQuarter":
        startDate.setMonth(Math.floor(startDate.getMonth() / 3) * 3, 1)
        break
      case "thisYear":
        startDate.setMonth(0, 1)
        break
      case "lastYear":
        startDate.setFullYear(startDate.getFullYear() - 1, 0, 1)
        now.setFullYear(now.getFullYear() - 1, 11, 31)
        break
      case "all":
        startDate.setFullYear(2000)
        break
      default:
        startDate.setDate(1)
    }

    const filteredProjects = projects.filter((project) => {
      const projectDate = new Date(project.startDate)
      return projectDate >= startDate && projectDate <= now
    })

    const filteredQuotes = quotes.filter((quote) => {
      const quoteDate = new Date(quote.quoteDate)
      return quoteDate >= startDate && quoteDate <= now
    })

    const filteredArchivedProjects = archivedProjects.filter((project) => {
      const projectDate = new Date(project.startDate)
      return projectDate >= startDate && projectDate <= now
    })

    const filteredArchivedQuotes = archivedQuotes.filter((quote) => {
      const quoteDate = new Date(quote.quoteDate)
      return quoteDate >= startDate && quoteDate <= now
    })

    return {
      projects: filteredProjects,
      quotes: filteredQuotes,
      archivedProjects: filteredArchivedProjects,
      archivedQuotes: filteredArchivedQuotes,
      startDate,
      endDate: now,
    }
  }

  const calculateReportData = () => {
    console.log("Calculating report data...") // Debug logging

    const { projects, quotes, archivedProjects, archivedQuotes, startDate, endDate } = filterDataByTimeRange()

    // Projektstatistik
    const activeProjects = projects.length
    // Räkna avslutade projekt från både aktiva och arkiverade projekt
    const completedProjects = [...projects, ...archivedProjects].filter((p) => p.status === "Färdigt").length
    const delayedProjects = projects.filter((p) => p.status === "Försenat").length
    const totalProjectBudget = projects.reduce((sum, p) => sum + p.budget, 0)
    const totalProjectCost = projects.reduce((sum, p) => sum + p.costToDate, 0)
    const projectMargin =
      totalProjectBudget > 0 ? ((totalProjectBudget - totalProjectCost) / totalProjectBudget) * 100 : 0

    // Offertstatistik
    const activeQuotes = quotes.length
    const acceptedQuotes = [...quotes, ...archivedQuotes].filter((q) => q.status === "Accepterad").length
    const totalQuoteValue = quotes.reduce((sum, q) => sum + q.amount, 0)
    const conversionRate =
      quotes.length + archivedQuotes.length > 0 ? (acceptedQuotes / (quotes.length + archivedQuotes.length)) * 100 : 0

    // Statusfördelning
    const projectStatusDistribution = {
      Planering: projects.filter((p) => p.status === "Planering").length,
      Pågående: projects.filter((p) => p.status === "Pågående").length,
      Färdigt: projects.filter((p) => p.status === "Färdigt").length,
      Försenat: projects.filter((p) => p.status === "Försenat").length,
    }

    const quoteStatusDistribution = {
      Skickad: quotes.filter((q) => q.status === "Skickad").length,
      "Under förhandling": quotes.filter((q) => q.status === "Under förhandling").length,
      Accepterad: [...quotes, ...archivedQuotes].filter((q) => q.status === "Accepterad").length,
      Avslagen: [...quotes, ...archivedQuotes].filter((q) => q.status === "Avslagen").length,
    }

    // Toppkunder
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

    const topCustomers = Object.entries(customerStats)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5)
      .map(([name, stats]) => ({
        name,
        value: stats.total,
        projects: stats.count,
      }))

    const reportData = {
      period: {
        start: startDate,
        end: endDate,
      },
      overview: {
        activeProjects,
        completedProjects,
        delayedProjects,
        totalProjectBudget,
        totalProjectCost,
        projectMargin,
        activeQuotes,
        acceptedQuotes,
        totalQuoteValue,
        conversionRate,
      },
      details: {
        projectStatusDistribution,
        quoteStatusDistribution,
        topCustomers,
      },
      // Lägg till fullständiga projekt- och offertlistor
      projects: [...projects, ...archivedProjects].map((project) => ({
        id: project.id,
        name: project.name,
        customer: project.customer,
        manager: project.manager,
        startDate: project.startDate,
        plannedEndDate: project.plannedEndDate,
        actualEndDate: project.actualEndDate,
        status: project.status,
        budget: project.budget,
        costToDate: project.costToDate,
        milestones: project.milestones,
      })),
      quotes: [...quotes, ...archivedQuotes].map((quote) => ({
        id: quote.id,
        projectName: quote.projectName,
        customer: quote.customer,
        salesperson: quote.salesperson,
        quoteDate: quote.quoteDate,
        deadline: quote.deadline,
        amount: quote.amount,
        status: quote.status,
        followUpDate: quote.followUpDate,
      })),
    }

    console.log("Report data:", reportData) // Debug logging
    return reportData
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <FileDown className="mr-2 h-4 w-4" />
          Generera rapport
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generera statistikrapport</DialogTitle>
          <DialogDescription>Välj tidsperiod för rapporten och klicka sedan på "Ladda ner PDF"</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger>
                <SelectValue placeholder="Välj tidsperiod" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <PDFDownloadButton reportData={calculateReportData()} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

