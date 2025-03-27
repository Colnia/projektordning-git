"use client"

import { useMemo } from "react"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Project } from "@/lib/types"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// Förbättrad tooltip med formaterade siffror och mer information
const tooltipCallback = {
  label: function(context: any) {
    let label = context.dataset.label || '';
    if (label) {
      label += ': ';
    }
    if (context.parsed.y !== null) {
      label += new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(context.parsed.y);
    }
    return label;
  },
  afterLabel: function(context: any) {
    // Lägger till mer information i tooltip
    if(context.datasetIndex === 0) { // Budget dataset
      // Kontrollera att context.chart.data.projects finns och att index är giltigt
      if (context.chart.data.projects && context.dataIndex < context.chart.data.projects.length) {
        const project = context.chart.data.projects[context.dataIndex];
        return [
          `Estimerad total: ${new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(project.estimatedTotalCost)}`,
          `Status: ${project.status}`
        ];
      }
    }
    return null;
  }
}

interface BudgetPerformanceChartProps {
  projects: Project[]
}

export function BudgetPerformanceChart({ projects }: BudgetPerformanceChartProps) {
  // Filter projects with highest variance between budget and cost
  const topProjects = useMemo(() => {
    return [...projects]
      // Filter out projects with zero budget or cost
      .filter(project => project.budget > 0 && project.costToDate > 0)
      // Sort by variance percentage (cost vs budget)
      .sort((a, b) => {
        const aVariance = Math.abs((a.costToDate / a.budget) - 1);
        const bVariance = Math.abs((b.costToDate / b.budget) - 1);
        return bVariance - aVariance;
      })
      .slice(0, 6); // Show top 6 projects
  }, [projects]);

  // Projects sorted by largest budget
  const largestProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => b.budget - a.budget)
      .slice(0, 6);
  }, [projects]);

  // Prepare chart data for largest projects
  const largestProjectsData = useMemo(() => {
    return {
      labels: largestProjects.map(p => p.name),
      datasets: [
        {
          label: 'Budget',
          data: largestProjects.map(p => p.budget),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          borderColor: 'rgb(53, 162, 235)',
          borderWidth: 1,
          borderRadius: 5,
          barPercentage: 0.6,
        },
        {
          label: 'Kostnad hittills',
          data: largestProjects.map(p => p.costToDate),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
          borderRadius: 5,
          barPercentage: 0.6,
        },
        {
          label: 'Estimerad total',
          data: largestProjects.map(p => p.estimatedTotalCost),
          backgroundColor: 'rgba(255, 159, 64, 0.5)',
          borderColor: 'rgb(255, 159, 64)',
          borderWidth: 1,
          borderRadius: 5,
          barPercentage: 0.6,
        },
      ],
      projects: largestProjects // Spara projektdata för tooltips
    };
  }, [largestProjects]);

  // Prepare chart data for top variance projects
  const varianceProjectsData = useMemo(() => {
    return {
      labels: topProjects.map(p => p.name),
      datasets: [
        {
          label: 'Budget',
          data: topProjects.map(p => p.budget),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          borderColor: 'rgb(53, 162, 235)',
          borderWidth: 1,
          borderRadius: 5,
          barPercentage: 0.6,
        },
        {
          label: 'Kostnad hittills',
          data: topProjects.map(p => p.costToDate),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
          borderRadius: 5,
          barPercentage: 0.6,
        },
        {
          label: 'Estimerad total',
          data: topProjects.map(p => p.estimatedTotalCost),
          backgroundColor: 'rgba(255, 159, 64, 0.5)',
          borderColor: 'rgb(255, 159, 64)',
          borderWidth: 1,
          borderRadius: 5,
          barPercentage: 0.6,
        },
      ],
      projects: topProjects // Spara projektdata för tooltips
    };
  }, [topProjects]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: tooltipCallback,
        padding: 10,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        usePointStyle: true,
        boxPadding: 6
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('sv-SE', { 
              style: 'currency', 
              currency: 'SEK',
              notation: 'compact',
              compactDisplay: 'short'
            }).format(value);
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Budget- och kostnadsanalys</CardTitle>
        <CardDescription>Jämförelse av budget, faktisk kostnad och estimerad totalkostnad för projekt</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="largest" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="largest">Största projekt</TabsTrigger>
            <TabsTrigger value="variance">Största avvikelser</TabsTrigger>
          </TabsList>
          <TabsContent value="largest" className="space-y-4">
            <div className="h-[350px]">
              <Bar options={options} data={largestProjectsData} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {largestProjects.map(project => (
                <div key={project.id} className="rounded-lg border p-3">
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-muted-foreground">{project.customer}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div>Budget: {project.budget.toLocaleString('sv-SE')} kr</div>
                    <Badge className={
                      project.costToDate > project.budget 
                        ? "bg-destructive" 
                        : project.costToDate > project.budget * 0.9 
                          ? "bg-warning" 
                          : "bg-success"
                    }>
                      {Math.round(project.costToDate / project.budget * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="variance" className="space-y-4">
            <div className="h-[350px]">
              <Bar options={options} data={varianceProjectsData} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topProjects.map(project => {
                const variance = (project.costToDate / project.budget - 1) * 100;
                return (
                  <div key={project.id} className="rounded-lg border p-3">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">{project.customer}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div>Avvikelse:</div>
                      <Badge className={variance > 0 ? "bg-destructive" : "bg-success"}>
                        {variance > 0 ? "+" : ""}{Math.round(variance)}%
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 