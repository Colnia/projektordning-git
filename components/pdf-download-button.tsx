"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { ReportDocument } from "./report-document"
import { toast } from "sonner"

interface PDFDownloadButtonProps {
  reportData: any
}

export function PDFDownloadButton({ reportData }: PDFDownloadButtonProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Konvertera datum-objekt till strängrepresentationer
  const processedData = {
    ...reportData,
    period: {
      start: reportData.period.start.toISOString(),
      end: reportData.period.end.toISOString(),
    },
  }

  if (!isClient) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Förbereder nedladdning...
      </Button>
    )
  }

  return (
    <PDFDownloadLink
      document={<ReportDocument data={processedData} />}
      fileName={`projektrapport-${new Date().toISOString().split("T")[0]}.pdf`}
    >
      {({ loading, error }) => {
        if (loading) {
          return (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Genererar PDF...
            </Button>
          )
        }

        if (error) {
          console.error("PDF generation error:", error)
          toast.error("Ett fel uppstod vid generering av PDF")
          return (
            <Button variant="destructive" disabled>
              Ett fel uppstod vid generering av PDF
            </Button>
          )
        }

        return (
          <Button>
            <FileDown className="mr-2 h-4 w-4" />
            Ladda ner PDF
          </Button>
        )
      }}
    </PDFDownloadLink>
  )
}

