"use client"

import { GanttChart } from "@/components/gantt-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function GanttAktuellPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="text-primary hover:underline flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 mr-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Tillbaka till översikt
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Avancerat Gantt-schema</h1>
      
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <GanttChart />
        </CardContent>
      </Card>
    </div>
  )
} 