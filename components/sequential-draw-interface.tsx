"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Trophy, RotateCcw, CheckCircle, ChevronRight, Volume2, VolumeX } from "lucide-react"

/* -------------------- Celebration confetti -------------------- */
const CONFETTI_COLORS = ["#fbbf24", "#f59e0b", "#fde68a", "#fff7cc", "#ea580c", "#fca5a5", "#facc15"]

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.6 + Math.random() * 1.8,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        drift: (Math.random() * 2 - 1) * 90,
        rot: Math.random() * 720 + 360,
      })),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.55}px`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            // custom props consumed by the confetti-fall keyframes
            ["--drift" as any]: `${p.drift}px`,
            ["--rot" as any]: `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  )
}

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
  const [reelNames, setReelNames] = useState<string[]>([])
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
      // Snapshot real candidate names to scroll through the reel
      if (currentCategory) {
        const names = getEligibleCoupons(currentCategory.id)
          .map((c: any) => c?.Name)
          .filter((n: any): n is string => Boolean(n))
        const shuffled = [...names].sort(() => Math.random() - 0.5).slice(0, 40)
        setReelNames(shuffled.length ? shuffled : ["Selecting…"])
      }

      // Start drawing sound
      if (isSoundEnabled && drawingSoundRef.current) {
        drawingSoundRef.current.currentTime = 0
        drawingSoundRef.current.play().catch(console.error)
      }

      return () => {
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

  // Duplicated list so the scrolling reel loops seamlessly
  const reelLoop = reelNames.length ? [...reelNames, ...reelNames] : []

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
            <Card className="bg-white/[0.04] border-amber-400/25 backdrop-blur-md h-full rounded-2xl">
              <CardHeader className="text-center border-b border-amber-400/20 pb-4">
                <CardTitle className="font-display text-amber-200 text-sm uppercase tracking-[0.3em]">
                  Now Presenting
                </CardTitle>
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
                <div className="overflow-hidden rounded-xl ring-1 ring-amber-400/25 mb-4">
                  <img
                    src={currentCategory.image || "/placeholder.svg"}
                    alt={currentCategory.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <h2 className="font-display text-2xl font-bold text-gold-gradient mb-2">
                  {currentCategory.name.toUpperCase()}
                </h2>
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
            {/* Ambient glow behind the machine — intensifies while drawing */}
            <div
              className={`absolute -inset-8 rounded-full blur-3xl transition-all duration-500 ${
                isDrawing
                  ? "bg-amber-500/40"
                  : currentWinner
                    ? "bg-amber-400/35"
                    : "bg-amber-500/20"
              }`}
            />

            {/* Rotating spotlight rays while drawing */}
            {isDrawing && (
              <>
                <div
                  className="animate-ray absolute -inset-10 opacity-70"
                  style={{
                    background:
                      "conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.45) 14deg, transparent 30deg, transparent 60deg, rgba(251,191,36,0.45) 74deg, transparent 90deg, transparent 120deg, rgba(251,191,36,0.45) 134deg, transparent 150deg, transparent 180deg, rgba(251,191,36,0.45) 194deg, transparent 210deg, transparent 240deg, rgba(251,191,36,0.45) 254deg, transparent 270deg, transparent 300deg, rgba(251,191,36,0.45) 314deg, transparent 330deg)",
                    WebkitMaskImage:
                      "radial-gradient(circle, transparent 34%, #000 40%, #000 60%, transparent 72%)",
                    maskImage:
                      "radial-gradient(circle, transparent 34%, #000 40%, #000 60%, transparent 72%)",
                  }}
                />
                <div className="animate-pulse-ring absolute inset-0 rounded-3xl border-2 border-amber-300/60" />
                <div
                  className="animate-pulse-ring absolute inset-0 rounded-3xl border-2 border-amber-300/40"
                  style={{ animationDelay: "0.55s" }}
                />
              </>
            )}

            {/* Confetti burst on a fresh winner */}
            {currentWinner && !isDrawing && (
              <Confetti key={`${currentWinner.couponId}-${currentWinner.timestamp.getTime()}`} />
            )}

            <div className="relative z-10 w-72 h-72 bg-gradient-to-br from-amber-500 via-orange-700 to-black rounded-3xl shadow-2xl border-8 border-amber-300 overflow-hidden glow-gold">
              {/* Slot Machine Frame */}
              <div className="absolute inset-4 bg-black rounded-xl border-4 border-amber-400/80 flex flex-col">
                {/* Top Display */}
                <div className="h-12 bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center rounded-t-lg">
                  <div className="font-display text-black font-bold text-sm tracking-[0.3em]">GRAND DRAW</div>
                </div>

                {/* Main Display Area */}
                <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                  {isDrawing ? (
                    <div className="absolute inset-0">
                      {/* Fade masks top & bottom */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black via-black/70 to-transparent z-20" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black via-black/70 to-transparent z-20" />
                      {/* Center selection window */}
                      <div className="pointer-events-none absolute inset-x-3 top-1/2 -translate-y-1/2 h-10 rounded-md border border-amber-300/70 bg-amber-400/10 shadow-[0_0_22px_rgba(251,191,36,0.55)] z-20" />
                      {/* Scrolling candidate names */}
                      <div className="animate-reel absolute inset-x-0 top-0 flex flex-col will-change-transform [filter:blur(0.6px)]">
                        {reelLoop.map((name, i) => (
                          <div key={i} className="flex h-10 items-center justify-center px-3">
                            <span className="font-display text-amber-100 font-semibold text-sm truncate">{name}</span>
                          </div>
                        ))}
                      </div>
                      {/* Status label */}
                      <div className="absolute inset-x-0 bottom-1 z-20 text-center text-[0.6rem] uppercase tracking-[0.3em] text-amber-300/90 animate-pulse">
                        Selecting Winner…
                      </div>
                    </div>
                  ) : currentWinner ? (
                    <div className="text-center animate-winner-pop px-2">
                      <div className="mb-2 flex justify-center">
                        <span className="relative grid place-items-center">
                          <span className="absolute h-16 w-16 rounded-full bg-amber-400/30 blur-md" />
                          <Trophy className="relative w-14 h-14 text-amber-300 animate-bounce drop-shadow-[0_0_14px_rgba(251,191,36,0.85)]" />
                        </span>
                      </div>
                      <div className="text-[0.6rem] uppercase tracking-[0.35em] text-amber-200/80 mb-1">★ Winner ★</div>
                      <div className="font-display text-gold-gradient text-xl font-bold px-1 break-words max-w-full leading-tight">
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
                <div className="h-8 bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center space-x-2 rounded-b-lg">
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
                  className="px-8 py-4 text-xl font-display font-bold tracking-wide bg-gradient-to-r from-amber-300 via-amber-400 to-orange-600 hover:from-amber-200 hover:to-orange-500 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed text-black rounded-full shadow-2xl shadow-amber-500/30 transform hover:scale-105 transition-all duration-300 w-full max-w-xs border-2 border-amber-200"
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
                  className="px-8 py-4 text-xl font-display font-bold tracking-wide bg-gradient-to-r from-amber-300 via-amber-400 to-orange-600 hover:from-amber-200 hover:to-orange-500 text-black rounded-full shadow-2xl shadow-amber-500/30 transform hover:scale-105 transition-all duration-300 w-full max-w-xs border-2 border-amber-200"
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
            <div className="text-center space-y-6 animate-float-up">
              <Card className="relative overflow-hidden bg-gradient-to-br from-[#1a0f06] via-black to-[#1a0f06] border-amber-300/50 w-full max-w-4xl rounded-2xl glow-gold">
                <div className="pointer-events-none absolute -top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-400/20 blur-3xl" />
                <CardContent className="relative p-8 text-center">
                  <div className="space-y-6">
                    <div className="text-3xl animate-bounce">🏆 ✨ 🏆</div>
                    <div className="font-display text-5xl font-extrabold text-gold-gradient">CONGRATULATIONS!</div>
                    <div className="font-display text-2xl font-bold text-amber-100">All Prize Categories Complete!</div>
                    <div className="bg-white/[0.05] border border-amber-400/20 rounded-xl p-6 space-y-3 backdrop-blur-sm">
                      <div className="text-xl text-white">
                        Total Winners: <span className="font-display font-bold text-amber-300">{winners.length}</span>
                      </div>
                      <div className="text-lg text-amber-100/80">Thank you to all our valued partners!</div>
                      <div className="text-md text-amber-100/60">The Insta Fortune Fiesta has concluded successfully.</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {prizeCategories.slice(0, 3).map((category, index) => {
                        const categoryWinnerCount = winners.filter((w) => w.category === category.name).length
                        return (
                          <div key={category.id} className="bg-white/[0.04] border border-amber-400/15 rounded-lg p-3">
                            <div className="text-sm font-bold text-amber-200">{category.name}</div>
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
          <Card className="bg-white/[0.04] border-amber-400/25 backdrop-blur-md h-full rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-amber-100">
                <Trophy className="w-6 h-6 text-amber-300" />
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
                        className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-300 ${
                          index === 0 && currentWinner?.couponId === winner.couponId
                            ? "border-amber-300 bg-amber-400/15 shadow-lg shadow-amber-500/20 animate-float-up"
                            : "border-amber-400/15 bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          {index === 0 && currentWinner?.couponId === winner.couponId ? (
                            <Trophy className="w-5 h-5 text-amber-300 animate-bounce" />
                          ) : (
                            <Trophy className="w-4 h-4 text-amber-400/70" />
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