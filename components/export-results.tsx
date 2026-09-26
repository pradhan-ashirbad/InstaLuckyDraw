"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Trophy } from "lucide-react"
import * as XLSX from "xlsx"

interface Winner {
  couponId: string
  dealerId?: string
  dealerName: string
  category: string
  timestamp: Date
}

interface DealerData {
  "Customer Id"?: string
  Name: string
  District?: string
  "Coupon Number": string
  "Count of Total Coupons"?: number
  "Row Number"?: number
  [key: string]: any
}

interface PrizeCategory {
  id: string
  name: string
  icon: React.ReactNode
  winnerCount: number
  color: string
}

interface ExportResultsProps {
  winners: Winner[]
  prizeCategories: PrizeCategory[]
  dealerData: DealerData[]
}

export function ExportResults({ winners, prizeCategories, dealerData }: ExportResultsProps) {
  const exportToExcel = () => {
    if (winners.length === 0) {
      alert("No winners to export!")
      return
    }

    try {
      // Prepare data for export
      const exportData = winners.map((winner, index) => ({
        "S.No": index + 1,
        "Prize Category": winner.category,
        "Coupon Number": winner.couponId,
        "Winner Name": winner.dealerName,
        "Customer ID": winner.dealerId || "N/A",
        "Draw Time": winner.timestamp.toLocaleString(),
        "Draw Date": winner.timestamp.toLocaleDateString(),
      }))

      // Create workbook with proper settings
      const wb = XLSX.utils.book_new()
      wb.Props = {
        Title: "Lucky Draw Results",
        Subject: "Winner List",
        Author: "Lucky Draw System",
        CreatedDate: new Date(),
      }

      // Add winners sheet with proper formatting
      const ws1 = XLSX.utils.json_to_sheet(exportData, {
        header: ["S.No", "Prize Category", "Coupon Number", "Winner Name", "Customer ID", "Draw Time", "Draw Date"],
      })

      // Set column widths
      ws1["!cols"] = [
        { wch: 8 }, // S.No
        { wch: 20 }, // Prize Category
        { wch: 15 }, // Coupon Number
        { wch: 25 }, // Winner Name
        { wch: 15 }, // Customer ID
        { wch: 20 }, // Draw Time
        { wch: 15 }, // Draw Date
      ]

      XLSX.utils.book_append_sheet(wb, ws1, "Winners")

      // Add summary sheet
      const summaryData = prizeCategories.map((category) => {
        const categoryWinners = winners.filter((w) => w.category === category.name)
        return {
          "Prize Category": category.name,
          "Total Winners": categoryWinners.length,
          "Max Winners": category.winnerCount,
          Status: categoryWinners.length >= category.winnerCount ? "Complete" : "Incomplete",
        }
      })

      const ws2 = XLSX.utils.json_to_sheet(summaryData, {
        header: ["Prize Category", "Total Winners", "Max Winners", "Status"],
      })

      // Set column widths for summary
      ws2["!cols"] = [
        { wch: 20 }, // Prize Category
        { wch: 15 }, // Total Winners
        { wch: 15 }, // Max Winners
        { wch: 15 }, // Status
      ]

      XLSX.utils.book_append_sheet(wb, ws2, "Summary")

      // Generate file name with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0]
      const fileName = `Lucky_Draw_Results_${timestamp}.xlsx`

      // Write file with proper options
      XLSX.writeFile(wb, fileName, {
        bookType: "xlsx",
        type: "binary",
        compression: true,
      })

      console.log("Excel file exported successfully:", fileName)
    } catch (error) {
      console.error("Export error:", error)
      alert("Error exporting to Excel. Please try again or check your browser's download settings.")
    }
  }

  const exportDetailedReport = () => {
    if (winners.length === 0) {
      alert("No winners to export!")
      return
    }

    try {
      // Create detailed report with original dealer data
      const detailedData = winners.map((winner, index) => {
        const originalData = dealerData.find((d) => d["Coupon Number"] === winner.couponId)

        // Base data
        const baseData = {
          "S.No": index + 1,
          "Prize Category": winner.category,
          "Coupon Number": winner.couponId,
          "Winner Name": winner.dealerName,
          "Customer ID": winner.dealerId || "N/A",
          District: originalData?.District || "N/A",
          "Count of Total Coupons": originalData?.["Count of Total Coupons"] || "N/A",
          "Row Number": originalData?.["Row Number"] || "N/A",
          "Draw Time": winner.timestamp.toLocaleString(),
          "Draw Date": winner.timestamp.toLocaleDateString(),
        }

        // Add any additional columns from original data
        const additionalData = Object.keys(originalData || {}).reduce(
          (acc, key) => {
            if (
              !["Customer Id", "Name", "District", "Coupon Number", "Count of Total Coupons", "Row Number"].includes(
                key,
              )
            ) {
              acc[key] = originalData?.[key] || "N/A"
            }
            return acc
          },
          {} as Record<string, any>,
        )

        return { ...baseData, ...additionalData }
      })

      // Create workbook
      const wb = XLSX.utils.book_new()
      wb.Props = {
        Title: "Lucky Draw Detailed Report",
        Subject: "Detailed Winner Report",
        Author: "Lucky Draw System",
        CreatedDate: new Date(),
      }

      const ws = XLSX.utils.json_to_sheet(detailedData)

      // Auto-size columns
      const colWidths = Object.keys(detailedData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }))
      ws["!cols"] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, "Detailed Winners Report")

      // Generate file name with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0]
      const fileName = `Lucky_Draw_Detailed_Report_${timestamp}.xlsx`

      // Write file with proper options
      XLSX.writeFile(wb, fileName, {
        bookType: "xlsx",
        type: "binary",
        compression: true,
      })

      console.log("Detailed Excel file exported successfully:", fileName)
    } catch (error) {
      console.error("Detailed export error:", error)
      alert("Error exporting detailed report. Please try again or check your browser's download settings.")
    }
  }

  const exportToCSV = () => {
    if (winners.length === 0) {
      alert("No winners to export!")
      return
    }

    try {
      // Prepare CSV data
      const csvData = winners.map((winner, index) => ({
        "S.No": index + 1,
        "Prize Category": winner.category,
        "Coupon Number": winner.couponId,
        "Winner Name": winner.dealerName,
        "Customer ID": winner.dealerId || "N/A",
        "Draw Time": winner.timestamp.toLocaleString(),
        "Draw Date": winner.timestamp.toLocaleDateString(),
      }))

      // Convert to CSV string
      const headers = Object.keys(csvData[0])
      const csvContent = [
        headers.join(","),
        ...csvData.map((row) => headers.map((header) => `"${row[header as keyof typeof row]}"`).join(",")),
      ].join("\n")

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `Lucky_Draw_Results_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log("CSV file exported successfully")
    } catch (error) {
      console.error("CSV export error:", error)
      alert("Error exporting to CSV. Please try again.")
    }
  }

  const winnersByCategory = winners.reduce(
    (acc, winner) => {
      if (!acc[winner.category]) {
        acc[winner.category] = []
      }
      acc[winner.category].push(winner)
      return acc
    },
    {} as Record<string, Winner[]>,
  )

  const totalWinners = winners.length
  const completedCategories = prizeCategories.filter(
    (cat) => (winnersByCategory[cat.name] || []).length >= cat.winnerCount,
  ).length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-white">{totalWinners}</p>
                <p className="text-sm text-orange-200">Total Winners</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Badge className="w-8 h-8 bg-orange-500" />
              <div>
                <p className="text-2xl font-bold text-white">{prizeCategories.length}</p>
                <p className="text-sm text-orange-200">Prize Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-white">{completedCategories}</p>
                <p className="text-sm text-orange-200">Completed Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Download className="w-5 h-5" />
            Export Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={exportToExcel}
              disabled={winners.length === 0}
              className="h-auto p-4 flex flex-col items-start gap-2 bg-orange-600 hover:bg-orange-700"
            >
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span className="font-medium">Export to Excel</span>
              </div>
              <span className="text-sm opacity-90">Winners list with summary in Excel format</span>
            </Button>

            <Button
              onClick={exportDetailedReport}
              disabled={winners.length === 0}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 border-orange-500 text-white hover:bg-orange-500/20 bg-transparent"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span className="font-medium">Detailed Excel Report</span>
              </div>
              <span className="text-sm opacity-70">Complete report with all original data</span>
            </Button>

            <Button
              onClick={exportToCSV}
              disabled={winners.length === 0}
              variant="secondary"
              className="h-auto p-4 flex flex-col items-start gap-2 bg-black/20 border-orange-500/50 text-white hover:bg-orange-500/20"
            >
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span className="font-medium">Export to CSV</span>
              </div>
              <span className="text-sm opacity-70">Fallback option if Excel doesn't work</span>
            </Button>
          </div>

          {winners.length === 0 && (
            <p className="text-sm text-orange-300 text-center py-4">
              Complete some draws to enable export functionality
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      {winners.length > 0 && (
        <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Draw Results Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prizeCategories.map((category) => {
                const categoryWinners = winnersByCategory[category.name] || []
                const isComplete = categoryWinners.length >= category.winnerCount

                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 border border-orange-500/30 rounded-lg bg-black/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${category.color} text-white`}>{category.icon}</div>
                      <div>
                        <h4 className="font-medium text-white">{category.name}</h4>
                        <p className="text-sm text-orange-200">
                          {categoryWinners.length}/{category.winnerCount} winners
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={isComplete ? "default" : "secondary"}
                      className={isComplete ? "bg-green-600" : "bg-gray-600"}
                    >
                      {isComplete ? "Complete" : "Incomplete"}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
