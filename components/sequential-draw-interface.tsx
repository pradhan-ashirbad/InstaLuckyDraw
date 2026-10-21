"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  RotateCcw,
  ChevronRight,
  Volume2,
  VolumeX,
  Sparkles,
  Maximize2,
  Minimize2,
  Check,
  Ticket,
  ArrowUpRight,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { StageTheme } from "@/lib/background-themes";
import {
  DRAW_DURATION_MS,
  REEL_START_MS,
  REEL_DURATION_MS,
  ANTICIPATION_MS,
} from "@/lib/draw-timing";

interface PrizeCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  winnerCount: number;
  color: string;
  image: string;
  description: string;
  order: number;
}
interface Winner {
  couponId: string;
  dealerId?: string;
  dealerName: string;
  category: string;
  timestamp: Date;
  district?: string;
}
interface AudioSettings {
  drawingMusicEnabled: boolean;
  winnerMusicEnabled: boolean;
  volume: number;
  drawingMusicUrl: string;
  winnerMusicUrl: string;
}
interface SequentialDrawInterfaceProps {
  prizeCategories: PrizeCategory[];
  currentCategory: PrizeCategory | null;
  currentCategoryWinnerIndex: number;
  isDrawing: boolean;
  currentWinner: Winner | null;
  targetName?: string | null;
  isEventComplete: boolean;
  progress: { current: number; total: number; percentage: number };
  onPerformDraw: () => void;
  onResetSystem: () => void;
  getEligibleCoupons: (categoryId: string) => { Name: string }[];
  winners: Winner[];
  onMoveToNextCategory: () => void;
  onViewResults: () => void;
  stageTheme: StageTheme;
  audioSettings: AudioSettings;
}

const ROW_HEIGHT = 58;
const VIEW_HEIGHT = 232;
const COPIES = 5;

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
  onViewResults,
  stageTheme,
  audioSettings,
}: SequentialDrawInterfaceProps) {
  const [pool, setPool] = useState<{ names: string[]; target: number }>({
    names: [],
    target: 0,
  });
  const [phase, setPhase] = useState("preparing");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundMessage, setSoundMessage] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [displayMessage, setDisplayMessage] = useState("");
  const reelRef = useRef<HTMLDivElement>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const winnerAudioRef = useRef<HTMLAudioElement | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateFullscreen = () => {
      const active = Boolean(document.fullscreenElement);
      setFullscreen(active);
      document.documentElement.classList.toggle("event-fullscreen", active);
    };
    updateMotion();
    media.addEventListener("change", updateMotion);
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => {
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("fullscreenchange", updateFullscreen);
      document.documentElement.classList.remove("event-fullscreen");
      musicRef.current?.pause();
      winnerAudioRef.current?.pause();
      void contextRef.current?.close();
    };
  }, []);

  // Candidate names are a visual snapshot. Selection and eligibility stay in the parent.
  useEffect(() => {
    if (!isDrawing || !currentCategory) return;
    const names = getEligibleCoupons(currentCategory.id)
      .map((c) => String(c.Name))
      .filter(Boolean);
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }
    let visible = names.slice(0, 32);
    if (!visible.length) visible = [targetName || "Selecting a winner"];
    while (visible.length < 12) visible = [...visible, ...visible];
    const target = Math.floor(visible.length / 2);
    visible[target] = targetName || visible[target];
    setPool({ names: visible, target });
    setPhase("preparing");
    const timers = [
      setTimeout(() => setPhase("spinning"), REEL_START_MS),
      setTimeout(() => setPhase("anticipation"), ANTICIPATION_MS),
      setTimeout(() => setPhase("locked"), REEL_START_MS + REEL_DURATION_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isDrawing, currentCategory, targetName, getEligibleCoupons]);

  useEffect(() => {
    if (!isDrawing || !pool.names.length || reducedMotion) return;
    const startOffset =
      pool.names.length * ROW_HEIGHT + (ROW_HEIGHT - VIEW_HEIGHT) / 2;
    const finalOffset =
      ((COPIES - 2) * pool.names.length + pool.target) * ROW_HEIGHT +
      (ROW_HEIGHT - VIEW_HEIGHT) / 2;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(
        1,
        Math.max(0, (now - start - REEL_START_MS) / REEL_DURATION_MS),
      );
      const eased = 1 - Math.pow(1 - t, 3);
      if (reelRef.current)
        reelRef.current.style.transform = `translate3d(0, ${-(startOffset + (finalOffset - startOffset) * eased)}px, 0)`;
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isDrawing, pool, reducedMotion]);

  useEffect(() => {
    if (!isDrawing || !soundEnabled) musicRef.current?.pause();
    if (!soundEnabled) winnerAudioRef.current?.pause();
  }, [isDrawing, soundEnabled]);

  useEffect(() => {
    if (
      !currentWinner ||
      isDrawing ||
      !soundEnabled ||
      !audioSettings.winnerMusicEnabled ||
      !audioSettings.volume
    )
      return;
    if (audioSettings.winnerMusicUrl) {
      const audio = new Audio(audioSettings.winnerMusicUrl);
      audio.volume = audioSettings.volume / 100;
      winnerAudioRef.current = audio;
      audio
        .play()
        .catch(() =>
          setSoundMessage("Winner audio unavailable. The draw is unaffected."),
        );
      return () => audio.pause();
    }
    // A local three-note fanfare replaces the missing winner-sound.mp3 asset.
    const context = contextRef.current;
    if (context?.state === "running") {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const oscillators = notes.map((frequency, i) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const at = context.currentTime + i * 0.13;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(
          audioSettings.volume / 450,
          at + 0.025,
        );
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.8);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(at);
        oscillator.stop(at + 0.85);
        return oscillator;
      });
      return () =>
        oscillators.forEach((oscillator) => {
          try {
            oscillator.stop();
          } catch {
            /* Already stopped. */
          }
        });
    }
  }, [currentWinner, isDrawing, soundEnabled, audioSettings]);

  const startDraw = () => {
    if (!canDraw) return;
    setSoundMessage("");
    if (soundEnabled && audioSettings.volume > 0) {
      try {
        if (!contextRef.current && window.AudioContext)
          contextRef.current = new AudioContext();
        void contextRef.current
          ?.resume()
          .catch(() =>
            setSoundMessage("Audio is unavailable. The draw is unaffected."),
          );
        if (audioSettings.drawingMusicEnabled) {
          musicRef.current?.pause();
          const audio = new Audio(
            audioSettings.drawingMusicUrl || "/sounds/kbc.mp3",
          );
          audio.loop = true;
          audio.volume = audioSettings.volume / 100;
          musicRef.current = audio;
          void audio
            .play()
            .catch(() =>
              setSoundMessage(
                "Drawing audio unavailable. The draw is unaffected.",
              ),
            );
        }
      } catch {
        setSoundMessage("Audio is unavailable. The draw is unaffected.");
      }
    }
    onPerformDraw();
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setDisplayMessage("Full screen is unavailable in this browser.");
    }
  };
  const categoryWinners = currentCategory
    ? winners.filter((w) => w.category === currentCategory.name)
    : [];
  const categoryComplete = Boolean(
    currentCategory && categoryWinners.length >= currentCategory.winnerCount,
  );
  const eligibleCount = currentCategory
    ? getEligibleCoupons(currentCategory.id).length
    : 0;
  const canDraw =
    !isDrawing &&
    Boolean(currentCategory) &&
    !categoryComplete &&
    eligibleCount > 0;
  const phaseLabel =
    phase === "preparing"
      ? "The stage is yours…"
      : phase === "spinning"
        ? "One ticket. One extraordinary moment."
        : phase === "anticipation"
          ? "Who will it be?"
          : "And the winner is…";
  const resetControl = (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" disabled={isDrawing} className="reset-button">
          <RotateCcw /> Reset all draws
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Start a new celebration?</AlertDialogTitle>
        <AlertDialogDescription>
          This clears all winners and draw progress. Participant data and prizes
          are kept. Export your results first if you need a copy.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep results</AlertDialogCancel>
          <AlertDialogAction onClick={onResetSystem}>
            Reset all draws
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (isEventComplete)
    return (
      <div className="event-complete">
        <Confetti />
        <span className="winner-medallion">
          <Trophy />
        </span>
        <span className="eyebrow">Every moment, worth celebrating</span>
        <h2>
          Congratulations to
          <br />
          <em>all our winners.</em>
        </h2>
        <p>
          {winners.length} extraordinary moments. One unforgettable celebration.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button className="gold-button" onClick={onViewResults}>
            View & export results <ArrowUpRight />
          </Button>
          {resetControl}
        </div>
      </div>
    );

  return (
    <div className="draw-experience">
      <div className="section-heading draw-heading">
        <div>
          <span className="eyebrow">The main event</span>
          <h2>Let fortune take the stage.</h2>
        </div>
        <div className="stage-tools">
          <Button
            variant="outline"
            aria-pressed={soundEnabled}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 /> : <VolumeX />}
            <span>Sound {soundEnabled ? "on" : "off"}</span>
          </Button>
          <Button variant="outline" onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 /> : <Maximize2 />}
            <span>{fullscreen ? "Exit full screen" : "Full screen"}</span>
          </Button>
        </div>
      </div>
      {(soundMessage || displayMessage) && (
        <p role="status" className="stage-feedback">
          {soundMessage || displayMessage}
        </p>
      )}
      <div className="draw-grid">
        <aside className="prize-spotlight">
          <div className="panel-eyebrow">
            <span className="status-dot" /> In the spotlight
          </div>
          {currentCategory ? (
            <>
              <div className="spotlight-image">
                <img
                  key={currentCategory.id}
                  src={currentCategory.image || "/prize-placeholder.svg"}
                  alt={currentCategory.name}
                  onError={(e) => {
                    if (!e.currentTarget.src.endsWith("/prize-placeholder.svg"))
                      e.currentTarget.src = "/prize-placeholder.svg";
                  }}
                />
                <span className="prize-ordinal">
                  {String(
                    prizeCategories.findIndex(
                      (p) => p.id === currentCategory.id,
                    ) + 1,
                  ).padStart(2, "0")}
                </span>
              </div>
              <div className="spotlight-copy">
                <span className="eyebrow">{currentCategory.description}</span>
                <h3>{currentCategory.name}</h3>
                <p>
                  {currentCategory.winnerCount}{" "}
                  {currentCategory.winnerCount === 1
                    ? "lucky winner"
                    : "lucky winners"}
                </p>
              </div>
              <div className="prize-stats">
                <div>
                  <strong>
                    {categoryWinners.length}
                    <small> / {currentCategory.winnerCount}</small>
                  </strong>
                  <span>Revealed</span>
                </div>
                <div>
                  <strong>{eligibleCount.toLocaleString()}</strong>
                  <span>Eligible tickets</span>
                </div>
              </div>
              <div
                className="prize-progress"
                role="progressbar"
                aria-label="Current prize progress"
                aria-valuenow={categoryWinners.length}
                aria-valuemin={0}
                aria-valuemax={currentCategory.winnerCount}
              >
                <span
                  style={{
                    width: `${Math.min(100, (categoryWinners.length / currentCategory.winnerCount) * 100)}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <Trophy className="mx-auto mb-4" />
              <h3>No prize categories</h3>
              <p>Add a prize in Manage Prizes to begin.</p>
            </div>
          )}
        </aside>

        <section
          className={`live-stage ${isDrawing ? "is-drawing" : currentWinner ? "has-winner" : ""} phase-${phase}`}
          aria-label="Lucky draw stage"
          aria-busy={isDrawing}
          style={
            {
              "--event-glow": stageTheme.glowRgb,
              "--draw-duration": `${DRAW_DURATION_MS}ms`,
            } as React.CSSProperties
          }
        >
          <div className="stage-topline">
            <span>
              <span className={`status-dot ${isDrawing ? "is-live" : ""}`} />{" "}
              {isDrawing
                ? "DRAWING LIVE"
                : currentWinner
                  ? "A MOMENT TO REMEMBER"
                  : "YOUR MOMENT AWAITS"}
            </span>
            <span>
              {currentCategory
                ? `${Math.min(currentCategoryWinnerIndex + (isDrawing || !currentWinner ? 1 : 0), currentCategory.winnerCount)} / ${currentCategory.winnerCount}`
                : "—"}
            </span>
          </div>
          <div className="stage-atmosphere" aria-hidden="true">
            <div className="stage-orbit orbit-one" />
            <div className="stage-orbit orbit-two" />
            <div className="stage-orbit orbit-three" />
            <div className="stage-beam beam-left" />
            <div className="stage-beam beam-right" />
          </div>
          <div className="stage-body">
            {isDrawing ? (
              <div className="spin-scene">
                <span className="eyebrow anticipation-label" role="status">
                  {phaseLabel}
                </span>
                {reducedMotion ? (
                  <div className="reduced-selection">
                    <Ticket />
                    <p>Selecting your next winner…</p>
                    <small>The result will appear in a moment.</small>
                  </div>
                ) : (
                  <div className="name-reel" aria-hidden="true">
                    <div className="reel-focus">
                      <span>›</span>
                      <span>‹</span>
                    </div>
                    <div className="reel-track" ref={reelRef}>
                      {Array.from(
                        { length: pool.names.length * COPIES },
                        (_, i) => (
                          <div className="reel-row" key={i}>
                            {pool.names[i % pool.names.length]}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
                <div className="draw-timer" aria-hidden="true">
                  <span />
                </div>
                <p className="spin-caption">
                  A little anticipation. A lot to celebrate.
                </p>
              </div>
            ) : currentWinner ? (
              <div
                key={`${currentWinner.couponId}-${currentWinner.timestamp.getTime()}`}
                className="winner-scene"
              >
                <Confetti />
                <span className="reveal-ring" aria-hidden="true" />
                <span className="winner-medallion">
                  <Trophy />
                </span>
                <span className="eyebrow">The spotlight is yours</span>
                <div role="status" aria-live="polite" aria-atomic="true">
                  <p className="winner-congratulations">Congratulations,</p>
                  <h3 className="winner-name">{currentWinner.dealerName}</h3>
                  <p className="winner-district">
                    {[
                      currentWinner.district,
                      currentWinner.dealerId &&
                        `Dealer ${currentWinner.dealerId}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="winner-ticket">
                    <Ticket /> Winning coupon{" "}
                    <strong>{currentWinner.couponId}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ready-scene">
                <span className="ready-medallion">
                  <Trophy />
                </span>
                <span className="eyebrow">
                  Big rewards. Real possibilities.
                </span>
                <h3>
                  Who’s next
                  <br />
                  in the spotlight?
                </h3>
                <p>
                  {canDraw
                    ? "One click could make their day."
                    : "Your next celebration is just a ticket away."}
                </p>
              </div>
            )}
          </div>
          <div className="stage-action">
            {categoryComplete ? (
              <Button
                className="gold-button draw-button"
                onClick={onMoveToNextCategory}
              >
                {currentCategory?.id ===
                prizeCategories[prizeCategories.length - 1]?.id
                  ? "Complete event"
                  : "Next category"}
                <ChevronRight />
              </Button>
            ) : (
              <Button
                className="gold-button draw-button"
                disabled={!canDraw}
                onClick={startDraw}
              >
                {isDrawing ? (
                  <>
                    <Sparkles className="drawing-icon" /> The excitement is
                    building…
                  </>
                ) : (
                  <>
                    <Trophy />
                    {currentWinner ? "Draw next winner" : "Draw winner"}
                    <ArrowUpRight />
                  </>
                )}
              </Button>
            )}
            <p>
              {isDrawing
                ? "Please stay on this screen until the reveal."
                : categoryComplete
                  ? "All winners in this category have been revealed."
                  : eligibleCount === 0
                    ? "No eligible coupons remain for this prize. Check participant data or reset the draws."
                    : "Every eligible ticket has a chance. Every winner is unique."}
            </p>
          </div>
        </section>

        <aside className="winners-panel">
          <div className="winners-panel-header">
            <div>
              <span className="eyebrow">The lucky ones</span>
              <h3>Winner’s circle</h3>
            </div>
            <span className="count-badge">{categoryWinners.length}</span>
          </div>
          <div className="winner-feed" aria-label="Winners for this category">
            {!categoryWinners.length ? (
              <div className="winner-feed-empty">
                <span>
                  <Trophy />
                </span>
                <h4>
                  The first of many
                  <br />
                  happy moments.
                </h4>
                <p>
                  Your winners will appear here
                  <br />
                  as the celebration unfolds.
                </p>
              </div>
            ) : (
              categoryWinners
                .slice()
                .reverse()
                .map((winner, i) => (
                  <div
                    key={`${winner.couponId}-${winner.timestamp.getTime()}`}
                    className={`winner-feed-row ${i === 0 ? "latest" : ""}`}
                  >
                    <span className="winner-rank">
                      {i === 0 ? (
                        <Trophy />
                      ) : (
                        String(categoryWinners.length - i).padStart(2, "0")
                      )}
                    </span>
                    <div>
                      <strong>{winner.dealerName}</strong>
                      <span>{winner.district || "Lucky winner"}</span>
                      <small>Coupon {winner.couponId}</small>
                    </div>
                    {i === 0 && <span className="new-winner">NEW</span>}
                  </div>
                ))
            )}
          </div>
          <div className="winner-feed-footer">
            <Check /> One win per participant
          </div>
        </aside>
      </div>
      <div className="event-lineup">
        <div className="lineup-heading">
          <span className="eyebrow">The evening’s journey</span>
          <span>
            {progress.current} of {progress.total} winners revealed
          </span>
        </div>
        <div className="lineup-prizes">
          {prizeCategories.map((prize, index) => {
            const revealed = winners.filter(
              (w) => w.category === prize.name,
            ).length;
            const complete = revealed >= prize.winnerCount;
            return (
              <div
                key={prize.id}
                className={`lineup-prize ${currentCategory?.id === prize.id ? "current" : ""} ${complete ? "complete" : ""}`}
                aria-current={
                  currentCategory?.id === prize.id ? "step" : undefined
                }
              >
                <span>
                  {complete ? <Check /> : String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <strong>{prize.name}</strong>
                  <small>
                    {revealed} / {prize.winnerCount} revealed
                  </small>
                </div>
              </div>
            );
          })}
        </div>
        <div
          className="event-progress"
          role="progressbar"
          aria-label="Event progress"
          aria-valuenow={progress.current}
          aria-valuemin={0}
          aria-valuemax={progress.total}
        >
          <span style={{ width: `${Math.min(100, progress.percentage)}%` }} />
        </div>
      </div>
      <div className="draw-bottom">
        <span>
          Results stay in this session. Export them before closing or
          refreshing.
        </span>
        {resetControl}
      </div>
    </div>
  );
}

function Confetti() {
  return (
    <div className="celebration-confetti" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <i
          key={i}
          style={
            {
              left: `${(i * 37) % 100}%`,
              "--drift": `${((i * 19) % 140) - 70}px`,
              "--rotation": `${i * 47}deg`,
              backgroundColor: ["#ead29c", "#fff4db", "#b49150", "#a9c8c0"][
                i % 4
              ],
              animationDelay: `${(i % 7) * 0.09}s`,
              animationDuration: `${2.4 + (i % 5) * 0.3}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
