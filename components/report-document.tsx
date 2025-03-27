"use client"

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },
  subheader: {
    fontSize: 18,
    marginBottom: 15,
    marginTop: 10,
    color: "#666666",
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
  },
  label: {
    width: "50%",
    fontSize: 12,
    color: "#666666",
  },
  value: {
    width: "50%",
    fontSize: 12,
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingVertical: 5,
  },
  tableHeader: {
    backgroundColor: "#f9fafb",
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    padding: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    color: "#666666",
    textAlign: "center",
  },
  detailedTableCell: {
    fontSize: 8,
    padding: 4,
  },
  detailedTableHeader: {
    backgroundColor: "#f9fafb",
    fontWeight: "bold",
    fontSize: 8,
    padding: 4,
  },
  statusBadge: {
    padding: 2,
    borderRadius: 2,
    fontSize: 8,
    textAlign: "center",
  },
  chart: {
    marginVertical: 10,
    height: 150,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 30,
    fontSize: 10,
    color: "#666666",
  },
  statusSection: {
    borderLeftWidth: 4,
    borderLeftColor: "#e5e7eb",
    paddingLeft: 10,
  },
})

interface ReportDocumentProps {
  data: {
    period: {
      start: string
      end: string
    }
    overview: {
      activeProjects: number
      completedProjects: number
      delayedProjects: number
      totalProjectBudget: number
      totalProjectCost: number
      projectMargin: number
      activeQuotes: number
      acceptedQuotes: number
      totalQuoteValue: number
      conversionRate: number
    }
    details: {
      projectStatusDistribution: Record<string, number>
      quoteStatusDistribution: Record<string, number>
      topCustomers: Array<{
        name: string
        value: number
        projects: number
      }>
    }
    projects: Array<{
      id: string
      name: string
      customer: string
      manager: string
      startDate: string
      plannedEndDate: string
      actualEndDate?: string
      status: string
      budget: number
      costToDate: number
      milestones: string
    }>
    quotes: Array<{
      id: string
      projectName: string
      customer: string
      salesperson: string
      quoteDate: string
      deadline: string
      amount: number
      status: string
      followUpDate: string
    }>
  }
}

export function ReportDocument({ data }: ReportDocumentProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sv-SE")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pågående":
        return "#3b82f6"
      case "Försenat":
        return "#ef4444"
      case "Färdigt":
        return "#22c55e"
      case "Planering":
        return "#eab308"
      case "Accepterad":
        return "#22c55e"
      case "Avslagen":
        return "#ef4444"
      case "Under förhandling":
        return "#3b82f6"
      case "Skickad":
        return "#eab308"
      default:
        return "#666666"
    }
  }

  return (
    <Document>
      {/* Översiktssida */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Projektstatistik</Text>
        <Text style={[styles.subheader, { fontSize: 14 }]}>
          Period: {formatDate(data.period.start)} - {formatDate(data.period.end)}
        </Text>

        <View style={styles.section}>
          <Text style={styles.subheader}>Projektöversikt</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Aktiva projekt:</Text>
            <Text style={styles.value}>{data.overview.activeProjects}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Avslutade projekt:</Text>
            <Text style={styles.value}>{data.overview.completedProjects}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Försenade projekt:</Text>
            <Text style={styles.value}>{data.overview.delayedProjects}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total projektbudget:</Text>
            <Text style={styles.value}>{formatCurrency(data.overview.totalProjectBudget)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total projektkostnad:</Text>
            <Text style={styles.value}>{formatCurrency(data.overview.totalProjectCost)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Projektmarginal:</Text>
            <Text style={styles.value}>{formatPercent(data.overview.projectMargin)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheader}>Projektstatistik per status</Text>

          {/* Planering */}
          <View style={[styles.statusSection, { marginBottom: 15 }]}>
            <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 5 }}>Planering</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Antal projekt:</Text>
              <Text style={styles.value}>{data.projects.filter((p) => p.status === "Planering").length}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total budget:</Text>
              <Text style={styles.value}>
                {formatCurrency(
                  data.projects.filter((p) => p.status === "Planering").reduce((sum, p) => sum + p.budget, 0),
                )}
              </Text>
            </View>
          </View>

          {/* Pågående */}
          <View style={[styles.statusSection, { marginBottom: 15 }]}>
            <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 5 }}>Pågående</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Antal projekt:</Text>
              <Text style={styles.value}>{data.projects.filter((p) => p.status === "Pågående").length}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total budget:</Text>
              <Text style={styles.value}>
                {formatCurrency(
                  data.projects.filter((p) => p.status === "Pågående").reduce((sum, p) => sum + p.budget, 0),
                )}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total kostnad hittills:</Text>
              <Text style={styles.value}>
                {formatCurrency(
                  data.projects.filter((p) => p.status === "Pågående").reduce((sum, p) => sum + p.costToDate, 0),
                )}
              </Text>
            </View>
          </View>

          {/* Färdigt */}
          <View style={[styles.statusSection, { marginBottom: 15 }]}>
            <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 5 }}>Färdigt</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Antal projekt:</Text>
              <Text style={styles.value}>{data.projects.filter((p) => p.status === "Färdigt").length}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total budget:</Text>
              <Text style={styles.value}>
                {formatCurrency(
                  data.projects.filter((p) => p.status === "Färdigt").reduce((sum, p) => sum + p.budget, 0),
                )}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total slutkostnad:</Text>
              <Text style={styles.value}>
                {formatCurrency(
                  data.projects.filter((p) => p.status === "Färdigt").reduce((sum, p) => sum + p.costToDate, 0),
                )}
              </Text>
            </View>
          </View>

          {/* Försenat */}
          <View style={[styles.statusSection, { marginBottom: 15 }]}>
            <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 5 }}>Försenat</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Antal projekt:</Text>
              <Text style={styles.value}>{data.projects.filter((p) => p.status === "Försenat").length}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total budget:</Text>
              <Text style={styles.value}>
                {formatCurrency(
                  data.projects.filter((p) => p.status === "Försenat").reduce((sum, p) => sum + p.budget, 0),
                )}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total kostnad hittills:</Text>
              <Text style={styles.value}>
                {formatCurrency(
                  data.projects.filter((p) => p.status === "Försenat").reduce((sum, p) => sum + p.costToDate, 0),
                )}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheader}>Offertöversikt</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Aktiva offerter:</Text>
            <Text style={styles.value}>{data.overview.activeQuotes}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Accepterade offerter:</Text>
            <Text style={styles.value}>{data.overview.acceptedQuotes}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Totalt offertvärde:</Text>
            <Text style={styles.value}>{formatCurrency(data.overview.totalQuoteValue)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Konverteringsgrad:</Text>
            <Text style={styles.value}>{formatPercent(data.overview.conversionRate)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>Sida 1/4 • Rapport genererad: {new Date().toLocaleString("sv-SE")}</Text>
      </Page>

      {/* Detaljerad statistik */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Detaljerad statistik</Text>

        <View style={styles.section}>
          <Text style={styles.subheader}>Projektstatusfördelning</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Status</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Antal</Text>
            </View>
            {Object.entries(data.details.projectStatusDistribution).map(([status, count], index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{status}</Text>
                <Text style={styles.tableCell}>{count}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheader}>Offertstatusfördelning</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Status</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Antal</Text>
            </View>
            {Object.entries(data.details.quoteStatusDistribution).map(([status, count], index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{status}</Text>
                <Text style={styles.tableCell}>{count}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheader}>Toppkunder</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Kund</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Totalt värde</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Antal projekt/offerter</Text>
            </View>
            {data.details.topCustomers.map((customer, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{customer.name}</Text>
                <Text style={styles.tableCell}>{formatCurrency(customer.value)}</Text>
                <Text style={styles.tableCell}>{customer.projects}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>Sida 2/4 • Rapport genererad: {new Date().toLocaleString("sv-SE")}</Text>
      </Page>

      {/* Projektdetaljer */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Projektdetaljer</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.detailedTableHeader, { width: "10%" }]}>ID</Text>
            <Text style={[styles.detailedTableHeader, { width: "20%" }]}>Namn</Text>
            <Text style={[styles.detailedTableHeader, { width: "15%" }]}>Kund</Text>
            <Text style={[styles.detailedTableHeader, { width: "15%" }]}>Projektledare</Text>
            <Text style={[styles.detailedTableHeader, { width: "10%" }]}>Status</Text>
            <Text style={[styles.detailedTableHeader, { width: "10%" }]}>Budget</Text>
            <Text style={[styles.detailedTableHeader, { width: "10%" }]}>Kostnad</Text>
            <Text style={[styles.detailedTableHeader, { width: "10%" }]}>Marginal</Text>
          </View>
          {data.projects.map((project, index) => {
            const margin = project.budget > 0 ? ((project.budget - project.costToDate) / project.budget) * 100 : 0

            return (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.detailedTableCell, { width: "10%" }]}>{project.id}</Text>
                <Text style={[styles.detailedTableCell, { width: "20%" }]}>{project.name}</Text>
                <Text style={[styles.detailedTableCell, { width: "15%" }]}>{project.customer}</Text>
                <Text style={[styles.detailedTableCell, { width: "15%" }]}>{project.manager}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      width: "10%",
                      backgroundColor: getStatusColor(project.status) + "20",
                      color: getStatusColor(project.status),
                    },
                  ]}
                >
                  <Text>{project.status}</Text>
                </View>
                <Text style={[styles.detailedTableCell, { width: "10%" }]}>{formatCurrency(project.budget)}</Text>
                <Text style={[styles.detailedTableCell, { width: "10%" }]}>{formatCurrency(project.costToDate)}</Text>
                <Text style={[styles.detailedTableCell, { width: "10%" }]}>{formatPercent(margin)}</Text>
              </View>
            )
          })}
        </View>

        <Text style={styles.footer}>Sida 3/4 • Rapport genererad: {new Date().toLocaleString("sv-SE")}</Text>
      </Page>

      {/* Offertdetaljer */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Offertdetaljer</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.detailedTableHeader, { width: "10%" }]}>ID</Text>
            <Text style={[styles.detailedTableHeader, { width: "20%" }]}>Projektnamn</Text>
            <Text style={[styles.detailedTableHeader, { width: "15%" }]}>Kund</Text>
            <Text style={[styles.detailedTableHeader, { width: "15%" }]}>Säljare</Text>
            <Text style={[styles.detailedTableHeader, { width: "10%" }]}>Status</Text>
            <Text style={[styles.detailedTableHeader, { width: "10%" }]}>Belopp</Text>
            <Text style={[styles.detailedTableHeader, { width: "10%" }]}>Deadline</Text>
            <Text style={[styles.detailedTableHeader, { width: "10%" }]}>Uppföljning</Text>
          </View>
          {data.quotes.map((quote, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.detailedTableCell, { width: "10%" }]}>{quote.id}</Text>
              <Text style={[styles.detailedTableCell, { width: "20%" }]}>{quote.projectName}</Text>
              <Text style={[styles.detailedTableCell, { width: "15%" }]}>{quote.customer}</Text>
              <Text style={[styles.detailedTableCell, { width: "15%" }]}>{quote.salesperson}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    width: "10%",
                    backgroundColor: getStatusColor(quote.status) + "20",
                    color: getStatusColor(quote.status),
                  },
                ]}
              >
                <Text>{quote.status}</Text>
              </View>
              <Text style={[styles.detailedTableCell, { width: "10%" }]}>{formatCurrency(quote.amount)}</Text>
              <Text style={[styles.detailedTableCell, { width: "10%" }]}>{formatDate(quote.deadline)}</Text>
              <Text style={[styles.detailedTableCell, { width: "10%" }]}>{formatDate(quote.followUpDate)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>Sida 4/4 • Rapport genererad: {new Date().toLocaleString("sv-SE")}</Text>
      </Page>
    </Document>
  )
}

