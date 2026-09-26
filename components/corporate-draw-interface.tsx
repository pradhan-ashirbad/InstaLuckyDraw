"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Trophy, RotateCcw, Play } from "lucide-react"

interface PrizeCategory {
  id: string
  name: string
  icon: React.ReactNode
  winnerCount: number
  color: string
  image: string
  description: string
}

interface Winner {
  couponId: string
  dealerId?: string
  dealerName: string
  category: string
  timestamp: Date
}

interface CorporateDrawInterfaceProps {
  prizeCategories: PrizeCategory[]
  isDrawing: boolean
  currentWinner: Winner | null
  currentCategory: string
  onPerformDraw: (categoryId: string) => void
  onResetSystem: () => void
  getCategoryStats: (categoryId: string) => { categoryWinnerCount: number; maxWinners: number; eligibleCount: number }
}

export function CorporateDrawInterface({
  prizeCategories,
  isDrawing,
  currentWinner,
  currentCategory,
  onPerformDraw,
  onResetSystem,
  getCategoryStats,
}: CorporateDrawInterfaceProps) {
  const [selectedPrize, setSelectedPrize] = useState<PrizeCategory | null>(null)
  const [spinningText, setSpinningText] = useState<string>("")
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isDrawing) {
      const interval = setInterval(() => {
        setSpinningText(Math.random().toString(36).substring(2, 10).toUpperCase())
      }, 100)
      return () => clearInterval(interval)
    }
  }, [isDrawing])

  useEffect(() => {
    if (currentWinner && !isDrawing) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [currentWinner, isDrawing])

  const currentPrizeData = prizeCategories.find((cat) => cat.id === currentCategory)

  return (
    <div className="space-y-8">
      {/* Prize Selection Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {prizeCategories.map((prize) => {
          const stats = getCategoryStats(prize.id)
          const isComplete = stats.categoryWinnerCount >= stats.maxWinners
          const hasEligible = stats.eligibleCount > 0

          return (
            <Card
              key={prize.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                selectedPrize?.id === prize.id
                  ? "ring-4 ring-yellow-400 bg-slate-700"
                  : "bg-slate-800 hover:bg-slate-700"
              } border-slate-600`}
              onClick={() => !isDrawing && setSelectedPrize(prize)}
            >
              <CardContent className="p-4 text-center">
                <img
                  src={prize.image || "/placeholder.svg"}
                  alt={prize.name}
                  className="w-full h-24 object-cover rounded-lg mb-3"
                />
                <h3 className="text-sm font-bold text-white mb-2 line-clamp-2">{prize.name}</h3>
                <div className="space-y-2">
                  <Badge className={`${prize.color} text-white text-xs px-2 py-1`}>
                    {stats.categoryWinnerCount}/{stats.maxWinners}
                  </Badge>
                  {isComplete && (
                    <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                      Complete
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Draw Interface */}
      <div className="flex flex-col items-center space-y-8">
        {/* Selected Prize Display */}
        {selectedPrize && (
          <Card className="bg-slate-800 border-slate-600 w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-white">Selected Prize</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <img
                src={selectedPrize.image || "/placeholder.svg"}
                alt={selectedPrize.name}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedPrize.name}</h2>
                <p className="text-gray-400">{selectedPrize.description}</p>
                <Badge className={`${selectedPrize.color} text-white mt-2`}>
                  {selectedPrize.winnerCount} {selectedPrize.winnerCount === 1 ? "Winner" : "Winners"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Draw Animation Area */}
        <div className="relative">
          <div className={`transition-all duration-500 ${isDrawing ? "animate-spin" : ""}`}>
            <div className="w-64 h-64 mx-auto bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-2xl border-8 border-yellow-400">
              {isDrawing ? (
                <div className="text-center">
                  <Sparkles className="w-16 h-16 animate-pulse mb-2" />
                  <div className="text-lg font-mono">{spinningText}</div>
                </div>
              ) : currentWinner ? (
                <div className="text-center">
                  <Trophy className="w-16 h-16 text-yellow-400 mb-2" />
                  <div className="text-sm">WINNER!</div>
                </div>
              ) : (
                <div className="text-center">
                  <Play className="w-16 h-16 mb-2" />
                  <div className="text-sm">Ready to Draw</div>
                </div>
              )}
            </div>
          </div>

          {/* Confetti Effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${1 + Math.random() * 2}s`,
                  }}
                >
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Draw Button */}
        <div className="space-y-4">
          {selectedPrize && (
            <Button
              onClick={() => onPerformDraw(selectedPrize.id)}
              disabled={
                isDrawing ||
                getCategoryStats(selectedPrize.id).categoryWinnerCount >= selectedPrize.winnerCount ||
                getCategoryStats(selectedPrize.id).eligibleCount === 0
              }
              className="px-12 py-6 text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              {isDrawing ? (
                <>
                  <Sparkles className="w-8 h-8 mr-3 animate-spin" />
                  Drawing Winner...
                </>
              ) : (
                <>
                  <Trophy className="w-8 h-8 mr-3" />
                  DRAW WINNER
                </>
              )}
            </Button>
          )}

          {!selectedPrize && (
            <p className="text-xl text-gray-400 text-center">Select a prize category above to start drawing</p>
          )}
        </div>

        {/* Winner Display */}
        {currentWinner && !isDrawing && (
          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-green-400 w-full max-w-2xl">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="text-4xl font-bold text-white animate-pulse">🎉 CONGRATULATIONS! 🎉</div>
                <div className="bg-white/20 rounded-lg p-6 space-y-3">
                  <div className="text-2xl font-bold text-white">Prize: {currentPrizeData?.name}</div>
                  <div className="text-xl font-bold text-yellow-200">Coupon ID: {currentWinner.couponId}</div>
                  <div className="text-xl font-bold text-yellow-200">Winner: {currentWinner.dealerName}</div>
                  <div className="text-sm text-gray-200">Won at: {currentWinner.timestamp.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reset Button */}
        <Button onClick={onResetSystem} variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset All Draws
        </Button>
      </div>
    </div>
  )
}
