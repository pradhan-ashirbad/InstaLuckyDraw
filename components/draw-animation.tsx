"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Trophy } from "lucide-react"

// Update the Winner interface to make dealerId optional
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
}

interface DrawAnimationProps {
  isDrawing: boolean
  currentWinner: Winner | null
  currentCategory: string
  prizeCategories: PrizeCategory[]
}

export function DrawAnimation({ isDrawing, currentWinner, currentCategory, prizeCategories }: DrawAnimationProps) {
  const [spinningNumbers, setSpinningNumbers] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isDrawing) {
      const interval = setInterval(() => {
        setSpinningNumbers([
          Math.random().toString(36).substring(2, 8).toUpperCase(),
          Math.random().toString(36).substring(2, 8).toUpperCase(),
        ])
      }, 100)

      return () => clearInterval(interval)
    }
  }, [isDrawing])

  useEffect(() => {
    if (currentWinner && !isDrawing) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [currentWinner, isDrawing])

  const currentCategoryData = prizeCategories.find((cat) => cat.id === currentCategory)

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Lucky Draw
        </CardTitle>
        {currentCategoryData && (
          <Badge className={`${currentCategoryData.color} text-white`}>{currentCategoryData.name}</Badge>
        )}
      </CardHeader>
      <CardContent className="text-center space-y-6">
        {/* Spinning Animation */}
        <div className="relative">
          <div className={`transition-all duration-500 ${isDrawing ? "animate-spin" : ""}`}>
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {isDrawing ? (
                <Sparkles className="w-12 h-12 animate-pulse" />
              ) : currentWinner ? (
                <Trophy className="w-12 h-12" />
              ) : (
                "?"
              )}
            </div>
          </div>

          {/* Confetti Effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`,
                  }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Display Area */}
        {isDrawing ? (
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">Drawing winner...</p>
            <div className="space-y-1">
              <div className="text-2xl font-mono font-bold text-blue-600">Coupon: {spinningNumbers[0] || "------"}</div>
              <div className="text-2xl font-mono font-bold text-purple-600">
                Dealer: {spinningNumbers[1] || "------"}
              </div>
            </div>
          </div>
        ) : currentWinner ? (
          <div className="space-y-3">
            <div className="text-2xl font-bold text-green-600 animate-pulse">🎉 WINNER! 🎉</div>
            <div className="space-y-2 p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-xl font-bold text-gray-800">Coupon ID: {currentWinner.couponId}</div>
              <div className="text-xl font-bold text-gray-800">Dealer Name: {currentWinner.dealerName}</div>
              {currentWinner.dealerId && (
                <div className="text-lg text-gray-600">Dealer ID: {currentWinner.dealerId}</div>
              )}
              <div className="text-sm text-gray-500">Won at: {currentWinner.timestamp.toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">
            <p>Select a prize category to start the draw</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
