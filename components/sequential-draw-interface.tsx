"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Trophy, RotateCcw, CheckCircle, ChevronRight, Volume2, VolumeX, Star } from "lucide-react"

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
  targetName?: string | null
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
  targetName,
  isEventComplete,
  progress,
  onPerformDraw,
  onResetSystem,
  getEligibleCoupons,
  winners,
  onMoveToNextCategory,
}: SequentialDrawInterfaceProps) {
  // The reel pool plus the index that holds the actual winner to land on
  const [reelData, setReelData] = useState<{ names: string[]; targetPos: number }>({ names: [], targetPos: 0 })
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)

  // rAF-driven name reel that spins, decelerates and lands on the winner
  const reelRef = useRef<HTMLDivElement>(null)
  const thunkRef = useRef<HTMLDivElement>(null)
  const reelRafRef = useRef<number | null>(null)
  const ROW_H = 48
  const VIEW_H = 176 // reel viewport height (matches h-44)
  const REEL_COPIES = 6
  
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
      // Snapshot real candidate names, guaranteeing the actual winner is in the
      // pool so the reel can land on them. Remember where the winner sits.
      if (currentCategory) {
        const names = getEligibleCoupons(currentCategory.id)
          .map((c: any) => c?.Name)
          .filter((n: any): n is string => Boolean(n))
        let pool = [...names].sort(() => Math.random() - 0.5).slice(0, 40)
        if (pool.length === 0) pool = [targetName || "Selecting…"]
        while (pool.length < 14) pool = [...pool, ...pool] // pad short pools for a full reel

        // Ensure the winner appears exactly once at a known landing position
        let targetPos = Math.floor(pool.length / 2)
        if (targetName) {
          const existing = pool.indexOf(targetName)
          if (existing >= 0) targetPos = existing
          else pool[targetPos] = targetName
        }
        setReelData({ names: pool, targetPos })
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

  // Drive the reel over a fixed timeline: fast spin, hard deceleration in the
  // final ~1s, landing precisely on the winner's row with a "thunk" settle.
  useEffect(() => {
    const N = reelData.names.length
    if (!isDrawing || N === 0) return
    const oneCopy = ROW_H * N
    const SPIN_MS = 3600 // settles a touch before the parent's draw completes
    const centerAdjust = ROW_H / 2 - VIEW_H / 2 // centers a row in the focus window

    // Start within an early copy (rows exist above), land the winner row inside
    // a late copy (rows exist below) so the window is never blank.
    const startRow = Math.floor(Math.random() * N)
    const startOffset = oneCopy + startRow * ROW_H + centerAdjust
    const landIndex = (REEL_COPIES - 2) * N + reelData.targetPos
    const finalOffset = landIndex * ROW_H + centerAdjust
    const dist = finalOffset - startOffset

    // easeOutQuint — near-linear early, very aggressive slowdown at the tail
    const ease = (t: number) => 1 - Math.pow(1 - t, 5)

    const start = performance.now()
    let landed = false

    const tick = (now: number) => {
      const t = Math.min((now - start) / SPIN_MS, 1)
      const offset = startOffset + dist * ease(t)
      if (reelRef.current) reelRef.current.style.transform = `translate3d(0, ${-offset}px, 0)`
      if (t < 1) {
        reelRafRef.current = requestAnimationFrame(tick)
      } else if (!landed) {
        landed = true
        if (reelRef.current) reelRef.current.style.transform = `translate3d(0, ${-finalOffset}px, 0)`
        if (thunkRef.current) {
          thunkRef.current.classList.remove("animate-reel-thunk")
          void thunkRef.current.offsetWidth // reflow so the bounce can replay
          thunkRef.current.classList.add("animate-reel-thunk")
        }
      }
    }
    reelRafRef.current = requestAnimationFrame(tick)
    return () => {
      if (reelRafRef.current) cancelAnimationFrame(reelRafRef.current)
      if (thunkRef.current) thunkRef.current.classList.remove("animate-reel-thunk")
    }
  }, [isDrawing, reelData])

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

  // Repeat the pool across several copies so the reel always has rows above and
  // below the visible window throughout the spin (no blanks).
  const reelLoop = reelData.names.length
    ? Array.from({ length: REEL_COPIES * reelData.names.length }, (_, i) => reelData.names[i % reelData.names.length])
    : []

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
      <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)_360px] gap-6 lg:gap-16 items-start">
        {/* Left Column: Current Prize Information */}
        <div className="space-y-4">
          {currentCategory && !isEventComplete ? (
            <Card className="bg-white/[0.04] border-amber-400/25 backdrop-blur-md h-full rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <span className="absolute left-4 top-4 z-10 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-amber-100/70">
                    Prize Image
                  </span>
                  <img
                    src={currentCategory.image || "/placeholder.svg"}
                    alt={currentCategory.name}
                    className="w-full h-56 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(currentCategory.name)}`
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/10" />
                  <h2 className="absolute inset-x-4 bottom-4 z-10 text-center font-display text-xl font-bold leading-snug text-white">
                    {currentCategory.name}
                  </h2>
                </div>

                <div className="space-y-4 p-5">
                  {nextPrizeInfo && !isCategoryComplete && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-amber-400/20 bg-white/[0.03] py-2.5 text-center">
                        <div className="font-display text-lg font-bold text-white">
                          {nextPrizeInfo.current} <span className="text-sm text-amber-200/60">of {nextPrizeInfo.total}</span>
                        </div>
                        <div className="mt-0.5 text-[0.58rem] uppercase tracking-[0.2em] text-amber-200/50">Current</div>
                      </div>
                      <div className="rounded-lg border border-amber-400/20 bg-white/[0.03] py-2.5 text-center">
                        <div className="font-display text-lg font-bold text-white">{nextPrizeInfo.remaining}</div>
                        <div className="mt-0.5 text-[0.58rem] uppercase tracking-[0.2em] text-amber-200/50">Remaining</div>
                      </div>
                      <div className="rounded-lg border border-amber-400/20 bg-white/[0.03] py-2.5 text-center">
                        <div className="font-display text-lg font-bold text-white">{eligibleCount}</div>
                        <div className="mt-0.5 text-[0.58rem] uppercase tracking-[0.2em] text-amber-200/50">Eligible</div>
                      </div>
                    </div>
                  )}
                  <div className="h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                      style={{
                        width: `${
                          currentCategory.winnerCount
                            ? (currentCategoryWinners.length / currentCategory.winnerCount) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
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
          {/* Cinematic Draw Stage */}
          <div className="relative">
            {/* Ambient backglow — intensifies while drawing / on win */}
            <div
              className={`absolute -inset-10 rounded-full blur-3xl transition-all duration-700 ${
                isDrawing ? "bg-amber-500/40" : currentWinner ? "bg-amber-400/35" : "bg-amber-500/15"
              }`}
            />

            {/* Symmetric rotating sunburst while drawing — 16 evenly spaced rays */}
            {isDrawing && (
              <div
                className="animate-ray absolute -inset-12 opacity-50"
                style={{
                  background:
                    "repeating-conic-gradient(from 0deg, rgba(251,191,36,0.32) 0deg, rgba(251,191,36,0.32) 5deg, transparent 5deg, transparent 22.5deg)",
                  WebkitMaskImage: "radial-gradient(circle, transparent 42%, #000 52%, #000 68%, transparent 82%)",
                  maskImage: "radial-gradient(circle, transparent 42%, #000 52%, #000 68%, transparent 82%)",
                }}
              />
            )}

            {/* Single soft ring on a fresh winner */}
            {currentWinner && !isDrawing && (
              <div
                key={`${currentWinner.couponId}-${currentWinner.timestamp.getTime()}`}
                className="pointer-events-none absolute inset-0 z-20 grid place-items-center"
              >
                <div className="animate-winner-ring h-44 w-44 rounded-full border-2 border-amber-300/70" />
              </div>
            )}

            {/* The glass stage */}
            <div className="relative z-10 aspect-square w-72 overflow-hidden rounded-[2rem] border border-amber-300/30 bg-gradient-to-b from-white/[0.07] via-white/[0.02] to-black/50 backdrop-blur-xl shadow-[0_30px_80px_-22px_rgba(245,158,11,0.55)]">
              {/* inner gold hairline */}
              <div className="pointer-events-none absolute inset-[3px] rounded-[1.7rem] ring-1 ring-amber-200/15" />

              {/* top spotlight beam */}
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-2/3 transition-opacity duration-700 ${
                  isDrawing || currentWinner ? "opacity-100" : "opacity-50"
                }`}
                style={{
                  background:
                    "radial-gradient(120% 75% at 50% 0%, rgba(251,191,36,0.32), rgba(251,191,36,0.07) 42%, transparent 70%)",
                }}
              />

              {/* eyebrow */}
              <div className="absolute inset-x-0 top-5 z-10 text-center font-display text-[0.62rem] font-semibold uppercase tracking-[0.42em] text-white">
                Grand Prize Draw
              </div>

              {/* center stage content */}
              <div className="absolute inset-x-5 top-1/2 z-10 -translate-y-1/2">
                {isDrawing ? (
                  <div className="relative h-44 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_22%,#000_78%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_22%,#000_78%,transparent)]">
                    {/* focus window */}
                    <div className="pointer-events-none absolute inset-x-1 top-1/2 z-20 h-12 -translate-y-1/2 rounded-lg border border-amber-300/55 bg-gradient-to-r from-amber-400/5 via-amber-300/15 to-amber-400/5 shadow-[0_0_30px_rgba(251,191,36,0.45)]" />
                    {/* settle/thunk layer */}
                    <div ref={thunkRef} className="absolute inset-x-0 top-0">
                      {/* momentum reel */}
                      <div ref={reelRef} className="will-change-transform [filter:blur(0.4px)]">
                        {reelLoop.map((name, i) => (
                          <div key={i} className="flex h-12 items-center justify-center px-3">
                            <span className="font-display text-base font-semibold text-amber-50/90 truncate">
                              {name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : currentWinner ? (
                  <div className="animate-winner-pop relative text-center">
                    {/* sheen sweep */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                      <div className="animate-sheen absolute -inset-y-6 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
                    </div>
                    <div className="mb-3 flex justify-center">
                      <span className="relative grid place-items-center">
                        <span className="absolute h-20 w-20 rounded-full bg-amber-400/30 blur-lg" />
                        <Trophy className="relative h-14 w-14 text-amber-300 drop-shadow-[0_0_16px_rgba(251,191,36,0.9)]" />
                      </span>
                    </div>
                    <div className="mb-1.5 text-[0.62rem] uppercase tracking-[0.42em] text-white">Winner</div>
                    <div className="font-display text-gold-gradient text-2xl font-bold leading-tight break-words">
                      {currentWinner.dealerName}
                    </div>
                    {currentWinner.district && (
                      <div className="mt-1.5 text-xs text-amber-100/55">{currentWinner.district}</div>
                    )}
                  </div>
                ) : isCategoryComplete ? (
                  <div className="text-center">
                    <CheckCircle className="mx-auto mb-3 h-14 w-14 text-emerald-400" />
                    <div className="font-display text-lg font-bold tracking-wide text-emerald-300">CATEGORY COMPLETE</div>
                  </div>
                ) : isEventComplete ? (
                  <div className="text-center">
                    <CheckCircle className="mx-auto mb-3 h-14 w-14 text-emerald-400" />
                    <div className="font-display text-lg font-bold tracking-wide text-emerald-300">ALL DONE</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border border-amber-400/40 bg-amber-400/10 glow-gold">
                      <Star className="h-7 w-7 text-amber-300" />
                    </div>
                    <div className="font-display text-xl font-bold tracking-wide text-white">READY TO DRAW</div>
                    <div className="mt-2 text-[0.62rem] uppercase tracking-[0.3em] text-amber-200/70">
                      Press the button to begin
                    </div>
                  </div>
                )}
              </div>

              {/* bottom caption while drawing */}
              {isDrawing && (
                <div className="absolute inset-x-0 bottom-5 z-10 animate-pulse text-center text-[0.6rem] uppercase tracking-[0.3em] text-amber-300/90">
                  Selecting Winner…
                </div>
              )}

              {/* vignette */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.6))]" />
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
                      Draw Winner
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
                <Star className="w-5 h-5 text-amber-300" />
                {currentCategory ? currentCategory.name : "Winners List"} ({currentCategoryWinners.length}/
                {currentCategory?.winnerCount || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80 overflow-y-auto">
              {currentCategoryWinners.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-10 h-10 text-amber-300/60 mx-auto mb-4" />
                  <p className="text-amber-100/70">
                    No winners yet. Press <span className="font-semibold text-amber-300">Draw</span> to begin.
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