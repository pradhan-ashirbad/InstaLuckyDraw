"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award } from "lucide-react"

interface Winner {
  couponId: string
  dealerId?: string
  dealerName: string
  category: string
  timestamp: Date
}

interface PrizeCategory {
  id: string
  name: string
  icon: React.ReactNode
  winnerCount: number
  color: string
  image: string
  description: string
}

interface WinnersListProps {
  winners: Winner[]
  prizeCategories: PrizeCategory[]
}

export function WinnersList({ winners, prizeCategories }: WinnersListProps) {
  if (winners.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Winners List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-8">No winners yet. Start drawing to see results here.</p>
        </CardContent>
      </Card>
    )
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

  const getPositionIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-400" />
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />
    if (index === 2) return <Award className="w-5 h-5 text-orange-400" />
    return (
      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-bold">
        {index + 1}
      </div>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Winners List ({winners.length} total winners)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {prizeCategories.map((category) => {
          const categoryWinners = winnersByCategory[category.name] || []

          if (categoryWinners.length === 0) return null

          return (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{category.name}</h3>
                  <p className="text-gray-400">{category.description}</p>
                </div>
                <Badge className={`${category.color} text-white px-3 py-1`}>
                  {categoryWinners.length} winner{categoryWinners.length > 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="grid gap-3">
                {categoryWinners.map((winner, index) => (
                  <div
                    key={`${winner.couponId}-${winner.timestamp.getTime()}`}
                    className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600 hover:bg-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getPositionIcon(index)}
                      <div>
                        <div className="font-bold text-white text-lg">{winner.dealerName}</div>
                        <div className="text-sm text-gray-400">
                          Coupon: {winner.couponId}
                          {winner.dealerId && ` • ID: ${winner.dealerId}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-400">{winner.timestamp.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
