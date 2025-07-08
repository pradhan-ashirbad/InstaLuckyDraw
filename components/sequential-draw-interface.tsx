"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Trophy, RotateCcw, CheckCircle, ChevronRight, Volume2, VolumeX } from "lucide-react"

interface PrizeCategory {
  id: string
  name: string
  icon: React.ReactNode
  winnerCount: number
  color: string
  image: string
  description: string
  order: number
}

interface Winner {
  couponId: string
  dealerId?: string
  dealerName: string
  category: string
  timestamp: Date
  district?: string
}

interface SequentialDrawInterfaceProps {
  prizeCategories: PrizeCategory[]
  currentCategory: PrizeCategory | null
  currentCategoryWinnerIndex: number
  isDrawing: boolean
  currentWinner: Winner | null
  isEventComplete: boolean
  progress: { current: number; total: number; percentage: number }
  onPerformDraw: () => void
  onResetSystem: () => void
  getEligibleCoupons: (categoryId: string) => any[]
  winners: Winner[]
  onMoveToNextCategory: () => void
}

export function SequentialDrawInterface({
  prizeCategories,
  currentCategory,
  currentCategoryWinnerIndex,
  isDrawing,
  currentWinner,
  isEventComplete,
  progress,
  onPerformDraw,
  onResetSystem,
  getEligibleCoupons,
  winners,
  onMoveToNextCategory,
}: SequentialDrawInterfaceProps) {
  const [spinningText, setSpinningText] = useState<string>("")
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  
  // Audio refs for different sound effects
  const drawingSoundRef = useRef<HTMLAudioElement | null>(null)
  const winnerSoundRef = useRef<HTMLAudioElement | null>(null)
  const completeSoundRef = useRef<HTMLAudioElement | null>(null)
  const buttonClickSoundRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio objects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Drawing sound - should be a looping slot machine/roulette sound
      drawingSoundRef.current = new Audio('/sounds/kbc.mp3')
      drawingSoundRef.current.loop = true
      drawingSoundRef.current.volume = 0.6
      
      // Winner sound - celebration/victory sound
      winnerSoundRef.current = new Audio('/public/sounds/winner-sound.mp3')
      winnerSoundRef.current.volume = 0.8
      
      // Complete sound - event completion fanfare
      completeSoundRef.current = new Audio('/sounds/complete-sound.mp3')
      completeSoundRef.current.volume = 0.7
      
      // Button click sound - button press feedback
      buttonClickSoundRef.current = new Audio('/sounds/button-click.mp3')
      buttonClickSoundRef.current.volume = 0.4
    }

    // Cleanup function
    return () => {
      if (drawingSoundRef.current) {
        drawingSoundRef.current.pause()
        drawingSoundRef.current = null
      }
      if (winnerSoundRef.current) {
        winnerSoundRef.current.pause()
        winnerSoundRef.current = null
      }
      if (completeSoundRef.current) {
        completeSoundRef.current.pause()
        completeSoundRef.current = null
      }
      if (buttonClickSoundRef.current) {
        buttonClickSoundRef.current.pause()
        buttonClickSoundRef.current = null
      }
    }
  }, [])

  // Handle drawing animation and sound
  useEffect(() => {
    if (isDrawing) {
      // Start spinning animation
      const interval = setInterval(() => {
        setSpinningText(Math.random().toString(36).substring(2, 10).toUpperCase())
      }, 100)

      // Start drawing sound
      if (isSoundEnabled && drawingSoundRef.current) {
        drawingSoundRef.current.currentTime = 0
        drawingSoundRef.current.play().catch(console.error)
      }

      return () => {
        clearInterval(interval)
        // Stop drawing sound when animation stops
        if (drawingSoundRef.current) {
          drawingSoundRef.current.pause()
          drawingSoundRef.current.currentTime = 0
        }
      }
    } else {
      // Stop drawing sound when isDrawing becomes false
      if (drawingSoundRef.current) {
        drawingSoundRef.current.pause()
        drawingSoundRef.current.currentTime = 0
      }
    }
  }, [isDrawing, isSoundEnabled])

  // Handle winner announcement sound
  useEffect(() => {
    if (currentWinner && !isDrawing && isSoundEnabled) {
      // Play winner sound when winner is announced
      if (winnerSoundRef.current) {
        winnerSoundRef.current.currentTime = 0
        winnerSoundRef.current.play().catch(console.error)
      }
    }
  }, [currentWinner, isDrawing, isSoundEnabled])

  // Handle event completion sound
  useEffect(() => {
    if (isEventComplete && isSoundEnabled) {
      // Play completion sound when event is complete
      if (completeSoundRef.current) {
        completeSoundRef.current.currentTime = 0
        completeSoundRef.current.play().catch(console.error)
      }
    }
  }, [isEventComplete, isSoundEnabled])

  // Play button click sound
  const playButtonSound = () => {
    if (isSoundEnabled && buttonClickSoundRef.current) {
      buttonClickSoundRef.current.currentTime = 0
      buttonClickSoundRef.current.play().catch(console.error)
    }
  }

  // Enhanced draw function with sound
  const handlePerformDraw = () => {
    playButtonSound()
    onPerformDraw()
  }

  // Enhanced next category function with sound
  const handleMoveToNextCategory = () => {
    playButtonSound()
    onMoveToNextCategory()
  }

  // Enhanced reset function with sound
  const handleResetSystem = () => {
    playButtonSound()
    // Stop all sounds
    if (drawingSoundRef.current) {
      drawingSoundRef.current.pause()
      drawingSoundRef.current.currentTime = 0
    }
    onResetSystem()
  }

  const getNextPrizeInfo = () => {
    if (!currentCategory) return null
    const remaining = currentCategory.winnerCount - currentCategoryWinnerIndex
    return {
      current: currentCategoryWinnerIndex + 1,
      total: currentCategory.winnerCount,
      remaining,
    }
  }

  const nextPrizeInfo = getNextPrizeInfo()
  const eligibleCount = currentCategory ? getEligibleCoupons(currentCategory.id).length : 0
  const currentCategoryWinners = currentCategory
    ? winners.filter((winner) => winner.category === currentCategory.name)
    : []
  const isCategoryComplete = currentCategory ? currentCategoryWinners.length >= currentCategory.winnerCount : false
  const canDraw = !isDrawing && currentCategory && !isCategoryComplete && eligibleCount > 0

  return (
    <div className="space-y-8 p-6">
      {/* Sound Control Button */}
      {/* <div className="flex justify-end">
        <Button
          onClick={() => setIsSoundEnabled(!isSoundEnabled)}
          variant="outline"
          size="sm"
          className="border-orange-500 text-white hover:bg-orange-500/20 bg-transparent"
        >
          {isSoundEnabled ? (
            <Volume2 className="w-4 h-4 mr-2" />
          ) : (
            <VolumeX className="w-4 h-4 mr-2" />
          )}
          {isSoundEnabled ? 'Sound On' : 'Sound Off'}
        </Button>
      </div> */}

      {/* Main Draw Interface - Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Current Prize Information */}
        <div className="space-y-4">
          {currentCategory && !isEventComplete ? (
            <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm h-full">
              <CardHeader className="text-center border-b border-orange-500/30 pb-4">
                <CardTitle className="text-white text-lg">Current Prize</CardTitle>
                {nextPrizeInfo && !isCategoryComplete && (
                  <div className="grid grid-cols-3 gap-2 text-sm text-orange-200 mt-2">
                    <div className="text-center">
                      <div className="font-bold text-white">{nextPrizeInfo.current}</div>
                      <div className="text-xs">of {nextPrizeInfo.total}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white">{nextPrizeInfo.remaining}</div>
                      <div className="text-xs">remaining</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white">{eligibleCount}</div>
                      <div className="text-xs">eligible coupons</div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6 text-center">
                <img
                  src={currentCategory.image || "/placeholder.svg"}
                  alt={currentCategory.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h2 className="text-xl font-bold text-white mb-2">{currentCategory.name.toUpperCase()}</h2>
              </CardContent>
            </Card>
          ) : isEventComplete ? (
            <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm h-full">
              <CardContent className="p-8 text-center flex flex-col justify-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <div className="text-2xl font-bold text-green-400 mb-2">Event Complete!</div>
                <div className="text-orange-200">All prizes have been drawn</div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm h-full">
              <CardContent className="p-8 text-center flex flex-col justify-center">
                <Trophy className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <div className="text-xl text-orange-200">Ready to Start</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Middle Column: Slot Machine Animation and Button */}
        <div className="flex flex-col items-center space-y-6">
          {/* Slot Machine Animation */}
          <div className="relative">
            <div className="w-72 h-72 bg-gradient-to-br from-orange-500 via-red-600 to-black rounded-3xl shadow-2xl border-8 border-yellow-400 overflow-hidden relative">
              {/* Slot Machine Frame */}
              <div className="absolute inset-4 bg-black rounded-xl border-4 border-orange-400 flex flex-col">
                {/* Top Display */}
                <div className="h-12 bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center rounded-t-lg">
                  <div className="text-white font-bold text-sm tracking-wider">LUCKY DRAW</div>
                </div>

                {/* Main Display Area */}
                <div className="flex-1 flex items-center justify-center p-4">
                  {isDrawing ? (
                    <div className="text-center">
                      {/* Spinning Reels Effect */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-12 h-16 bg-white rounded border-2 border-orange-400 flex items-center justify-center overflow-hidden"
                          >
                            <div className="animate-spin text-lg font-bold text-orange-600">
                              {spinningText[i] || "?"}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-orange-300 text-xs animate-pulse">Drawing Winner...</div>
                    </div>
                  ) : currentWinner ? (
                    <div className="text-center">
                      <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3 animate-bounce" />
                      <div className="text-yellow-300 text-sm font-bold px-2 break-words max-w-full">
                        {currentWinner.dealerName}
                      </div>
                    </div>
                  ) : isCategoryComplete ? (
                    <div className="text-center">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-3" />
                      <div className="text-green-300 text-lg font-bold">COMPLETE!</div>
                    </div>
                  ) : isEventComplete ? (
                    <div className="text-center">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-3" />
                      <div className="text-green-300 text-lg font-bold">ALL DONE!</div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3" />
                      <div className="text-yellow-300 text-lg font-bold">READY</div>
                    </div>
                  )}
                </div>

                {/* Bottom Lights */}
                <div className="h-8 bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center space-x-2 rounded-b-lg">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        isDrawing
                          ? "bg-yellow-400 animate-pulse"
                          : isCategoryComplete
                            ? "bg-green-400"
                            : "bg-yellow-600"
                      }`}
                      style={{ animationDelay: `${i * 0.2}s` }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Side Decorations */}
              <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-6 h-24 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full shadow-lg"></div>
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 w-6 h-24 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full shadow-lg"></div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isEventComplete ? (
            <div className="flex flex-col items-center space-y-4">
              {/* Draw Button - Show when category is not complete */}
              {!isCategoryComplete && (
                <Button
                  onClick={handlePerformDraw}
                  disabled={!canDraw}
                  className="px-8 py-4 text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 w-full max-w-xs border-2 border-yellow-400"
                >
                  {isDrawing ? (
                    <>
                      <Sparkles className="w-6 h-6 mr-3 animate-spin" />
                      Drawing...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-6 h-6 mr-3" />
                      Draw
                    </>
                  )}
                </Button>
              )}

              {/* Next Category Button - Show when category is complete */}
              {isCategoryComplete && (
                <Button
                  onClick={handleMoveToNextCategory}
                  className="px-8 py-4 text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 w-full max-w-xs border-2 border-yellow-400"
                >
                  <ChevronRight className="w-6 h-6 mr-3" />
                  Next Category
                </Button>
              )}

              {/* Status Messages */}
              {eligibleCount === 0 && currentCategory && !isCategoryComplete && (
                <div className="text-center text-red-400 text-sm">No eligible coupons remaining</div>
              )}
            </div>
          ) : (
            /* Event Complete Message */
            <div className="text-center space-y-6">
              <Card className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 border-yellow-400 w-full max-w-4xl">
                <CardContent className="p-8 text-center">
                  <div className="space-y-6">
                    <div className="text-5xl font-bold text-white animate-bounce">🎊 CONGRATULATIONS! 🎊</div>
                    <div className="text-2xl font-bold text-yellow-200">All Prize Categories Complete!</div>
                    <div className="bg-white/20 rounded-lg p-6 space-y-3">
                      <div className="text-xl text-white">Total Winners: {winners.length}</div>
                      <div className="text-lg text-yellow-200">Thank you to all participants!</div>
                      <div className="text-md text-white">The Insta Fortune Fiesta has concluded successfully.</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {prizeCategories.slice(0, 3).map((category, index) => {
                        const categoryWinnerCount = winners.filter((w) => w.category === category.name).length
                        return (
                          <div key={category.id} className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm font-bold text-yellow-200">{category.name}</div>
                            <div className="text-lg text-white">
                              {categoryWinnerCount}/{category.winnerCount} Winners
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Column: Winners List */}
        <div className="space-y-4">
          <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="w-6 h-6 text-orange-400" />
                {currentCategory ? `${currentCategory.name} Winners` : "Winners List"} ({currentCategoryWinners.length}/
                {currentCategory?.winnerCount || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80 overflow-y-auto">
              {currentCategoryWinners.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-orange-500 mx-auto mb-4 opacity-50" />
                  <p className="text-orange-200">
                    {currentCategory
                      ? `No winners yet for ${currentCategory.name}. Start drawing to see results here.`
                      : "No winners yet. Start drawing to see results here."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentCategoryWinners
                    .slice()
                    .reverse()
                    .map((winner, index) => (
                      <div
                        key={`${winner.couponId}-${winner.timestamp.getTime()}`}
                        className={`flex items-center gap-3 p-2 rounded-lg border transition-all duration-300 ${
                          index === 0 && currentWinner?.couponId === winner.couponId
                            ? "border-green-400 bg-green-400/20 animate-pulse"
                            : "border-orange-500/30 bg-black/20"
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          {index === 0 && currentWinner?.couponId === winner.couponId ? (
                            <Trophy className="w-5 h-5 text-yellow-400 animate-bounce" />
                          ) : (
                            <Trophy className="w-4 h-4 text-orange-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">
                            {winner.dealerName}
                            {winner.dealerId && ` - ${winner.dealerId}`}
                            {winner.district && ` - ${winner.district}`}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleResetSystem}
          variant="outline"
          className="border-orange-500 text-white hover:bg-orange-500/20 bg-transparent"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset All Draws
        </Button>
      </div>
    </div>
  )
}