"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProjectStore } from "@/lib/store"
import { ArchivedProjectsList } from "./archived-projects-list"
import { ArchivedQuotesList } from "./archived-quotes-list"

export default function ArchivedPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const { archivedProjects, archivedQuotes } = useProjectStore()

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Arkiverade Items</h2>
          <p className="text-sm text-muted-foreground">Visa och hantera arkiverade projekt och offerter</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Sök i arkivet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Search className="text-muted-foreground" />
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Arkiverade Projekt ({archivedProjects?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="quotes">Arkiverade Offerter ({archivedQuotes?.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="projects">
          <ArchivedProjectsList searchTerm={searchTerm} />
        </TabsContent>
        <TabsContent value="quotes">
          <ArchivedQuotesList searchTerm={searchTerm} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

