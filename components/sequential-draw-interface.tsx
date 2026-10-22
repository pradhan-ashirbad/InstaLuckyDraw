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
  SELECTION_START_MS,
  ENVELOPE_OPEN_MS,
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
  onViewResults,
  stageTheme,
  audioSettings,
}: SequentialDrawInterfaceProps) {
  const [pool, setPool] = useState<string[]>([]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [phase, setPhase] = useState("preparing");
  const [countdown, setCountdown] = useState(3);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundMessage, setSoundMessage] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [displayMessage, setDisplayMessage] = useState("");
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

  // This sequence only presents the draw. The parent still selects and records
  // the winner, using the same eligibility rules as before.
  useEffect(() => {
    if (!isDrawing || !currentCategory) return;
    const names = getEligibleCoupons(currentCategory.id)
      .map((c) => String(c.Name))
      .filter(Boolean);
    setPool(names.slice(0, 80));
    setCandidateIndex(0);
    setPhase("preparing");
    setCountdown(3);
    const timers = [
      setTimeout(() => setPhase("spinning"), SELECTION_START_MS),
      setTimeout(() => {
        setPhase("countdown");
        setCountdown(3);
      }, ANTICIPATION_MS),
      setTimeout(() => setCountdown(2), ANTICIPATION_MS + 1000),
      setTimeout(() => setCountdown(1), ANTICIPATION_MS + 2000),
      setTimeout(() => setPhase("locked"), ENVELOPE_OPEN_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isDrawing, currentCategory, getEligibleCoupons]);

  useEffect(() => {
    if (!isDrawing || !pool.length || reducedMotion) return;
    const started = performance.now();
    let timer: ReturnType<typeof setTimeout>;
    const cycle = () => {
      const elapsed = performance.now() - started;
      if (elapsed >= ANTICIPATION_MS) return;
      setCandidateIndex((index) => (index + 1) % pool.length);
      timer = setTimeout(
        cycle,
        90 + Math.pow(elapsed / ANTICIPATION_MS, 3) * 280,
      );
    };
    timer = setTimeout(cycle, SELECTION_START_MS);
    return () => clearTimeout(timer);
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
    // A local four-note fanfare replaces the missing winner-sound.mp3 asset.
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

  return (
    <div
      className={`draw-experience gala-experience ${isDrawing ? "show-running" : ""}`}
    >
      <div className="gala-host-bar">
        <span className="gala-host-title">
          Sulphamax <i>presents</i>
        </span>
        <div className="stage-tools">
          <Button
            variant="ghost"
            aria-pressed={soundEnabled}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 /> : <VolumeX />}
            <span>Sound {soundEnabled ? "on" : "off"}</span>
          </Button>
          <Button variant="ghost" onClick={toggleFullscreen}>
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
      <section
        className={`gala-theatre phase-${phase} ${isDrawing ? "is-drawing" : ""} ${currentWinner && !isDrawing ? "has-winner" : ""} ${isEventComplete ? "is-finale" : ""}`}
        aria-label="Lucky draw stage"
        aria-busy={isDrawing}
        style={{ "--event-glow": stageTheme.glowRgb } as React.CSSProperties}
      >
        <TheatreScenery />
        <div className="gala-show-title">
          <span className="gala-title-rule" />{" "}
          <span>
            SULPHAMAX <b>SMART LUCKY DRAW</b>
          </span>
          <span className="gala-title-rule" />
        </div>
        <div className="gala-performance">
          {isEventComplete ? (
            <div className="gala-finale">
              <Confetti />
              <span className="gala-laurel" aria-hidden="true">
                ✦
              </span>
              <p className="gala-kicker">What a night. What a celebration.</p>
              <h2>
                Congratulations to
                <br />
                <em>all our winners.</em>
              </h2>
              <p>
                {winners.length} unforgettable moments. Thank you for being part
                of ours.
              </p>
            </div>
          ) : isDrawing ? (
            <div
              className={`gala-drawing ${reducedMotion ? "is-reduced" : ""}`}
            >
              <p className="gala-kicker">{currentCategory?.name}</p>
              {reducedMotion ? (
                <div className="reduced-selection">
                  <Trophy />
                  <p>Selecting your next winner…</p>
                  <small>Your winner will be announced in a moment.</small>
                </div>
              ) : (
                <>
                  <div className="gala-envelope" aria-hidden="true">
                    <div className="envelope-letter">
                      <span>SULPHAMAX</span>
                      <Trophy />
                      <i>You are extraordinary.</i>
                    </div>
                    <div className="envelope-back" />
                    <div className="envelope-pocket" />
                    <div className="envelope-flap" />
                    <div className="envelope-seal">
                      <img src="/gromor-logo.png" alt="" />
                    </div>
                  </div>
                  <div
                    className="gala-suspense-copy"
                    role="status"
                    aria-live="polite"
                  >
                    {phase === "preparing" ? (
                      <p className="gala-draw-line">A little suspense…</p>
                    ) : phase === "spinning" ? (
                      <>
                        <p className="gala-draw-line">
                          So many extraordinary partners.
                        </p>
                        <div
                          className="gala-candidate"
                          key={candidateIndex}
                          aria-hidden="true"
                        >
                          {pool[candidateIndex] || "A lucky moment awaits"}
                        </div>
                        <span>One unforgettable moment.</span>
                      </>
                    ) : phase === "countdown" ? (
                      <>
                        <span className="sr-only">
                          The winner will be revealed in {countdown}
                        </span>
                        <div
                          className="gala-countdown"
                          key={countdown}
                          aria-hidden="true"
                        >
                          {countdown}
                        </div>
                        <p className="gala-countdown-caption">
                          The moment is almost here.
                        </p>
                      </>
                    ) : (
                      <p className="gala-draw-line gala-and-winner">
                        And the winner is…
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : currentWinner ? (
            <div
              className="gala-winner-scene"
              key={`${currentWinner.couponId}-${currentWinner.timestamp.getTime()}`}
            >
              <Confetti />
              <div className="gala-reveal-bloom" aria-hidden="true" />
              <p className="gala-kicker">Let’s hear it for our winner</p>
              <div role="status" aria-live="polite" aria-atomic="true">
                <h3 className="winner-name">{currentWinner.dealerName}</h3>
                <p className="gala-winner-location">
                  {[
                    currentWinner.district,
                    currentWinner.dealerId &&
                      `Dealer ${currentWinner.dealerId}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="gala-winner-divider">
                  <span />
                  <Trophy />
                  <span />
                </div>
                <p className="gala-won-label">You’ve won</p>
                <p className="gala-won-prize">{currentWinner.category}</p>
                <div className="winner-ticket">
                  <Ticket /> Winning coupon{" "}
                  <strong>{currentWinner.couponId}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="gala-ready-scene">
              <p className="gala-kicker">
                Celebrating the people who make us extraordinary
              </p>
              <div className="gala-award" aria-hidden="true">
                <Trophy />
                <span />
                <span />
              </div>
              <h2>
                A night to remember.
                <br />
                <em>A moment to shine.</em>
              </h2>
              <p>
                {currentCategory
                  ? "Our next lucky winner could be you."
                  : "Add a prize in Manage Prizes to begin the celebration."}
              </p>
            </div>
          )}
        </div>
        {!isEventComplete && (
          <div className="gala-prize-strip prize-spotlight">
            <span className="gala-prize-label">
              {currentWinner && !isDrawing
                ? "The winning prize"
                : "Coming to the stage"}
            </span>
            <h3>{currentCategory?.name || "Your next extraordinary reward"}</h3>
            <span className="gala-prize-count">
              {currentCategory
                ? `${Math.min(currentCategoryWinnerIndex + (isDrawing || !currentWinner ? 1 : 0), currentCategory.winnerCount)} of ${currentCategory.winnerCount} winners`
                : ""}
            </span>
          </div>
        )}
        <div className="gala-stage-action">
          {isEventComplete ? (
            <Button className="gala-draw-button" onClick={onViewResults}>
              View & export results <ArrowUpRight />
            </Button>
          ) : categoryComplete ? (
            <Button className="gala-draw-button" onClick={onMoveToNextCategory}>
              {currentCategory?.id ===
              prizeCategories[prizeCategories.length - 1]?.id
                ? "Complete event"
                : "Next category"}
              <ChevronRight />
            </Button>
          ) : (
            <Button
              className="gala-draw-button"
              disabled={!canDraw}
              onClick={startDraw}
            >
              {isDrawing ? (
                <>The excitement is building…</>
              ) : (
                <>
                  <Sparkles />
                  {currentWinner ? "Draw next winner" : "Draw winner"}
                  <ArrowUpRight />
                </>
              )}
            </Button>
          )}
          {!isDrawing &&
            !isEventComplete &&
            !categoryComplete &&
            eligibleCount === 0 && (
              <p className="gala-no-tickets">
                No eligible coupons remain for this prize. Check participant
                data or reset the draws.
              </p>
            )}
        </div>
        <div className="gala-footlights" aria-hidden="true">
          {Array.from({ length: 17 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </section>
      <div className="gala-after-show">
        <div className="gala-progress">
          <span>
            {progress.current} <i>of</i> {progress.total} moments celebrated
          </span>
          <div
            role="progressbar"
            aria-label="Event progress"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.current}
          >
            <span style={{ width: `${Math.min(100, progress.percentage)}%` }} />
          </div>
        </div>
        {resetControl}
      </div>
      {categoryWinners.length > 0 && !isDrawing && !isEventComplete && (
        <div
          className="gala-honour-roll"
          aria-label="Winners for this category"
        >
          <span>Tonight’s stars</span>
          {categoryWinners
            .slice()
            .reverse()
            .map((winner) => (
              <div
                className="winner-feed-row"
                key={`${winner.couponId}-${winner.timestamp.getTime()}`}
              >
                <Trophy />
                <strong>{winner.dealerName}</strong>
                <small>{winner.couponId}</small>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function TheatreScenery() {
  return (
    <div className="gala-scenery" aria-hidden="true">
      <div className="gala-starfield">
        {Array.from({ length: 48 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 37 + 3) % 100}%`,
              top: `${(i * 23 + 7) % 83}%`,
              animationDelay: `${(i % 9) * -0.6}s`,
              width: i % 4 === 0 ? 3 : 2,
              height: i % 4 === 0 ? 3 : 2,
            }}
          />
        ))}
      </div>
      <div className="gala-arch arch-outer" />
      <div className="gala-arch arch-inner" />
      <div className="gala-curtain curtain-left" />
      <div className="gala-curtain curtain-right" />
      <div className="gala-valance" />
      <div className="gala-spotlight spotlight-left" />
      <div className="gala-spotlight spotlight-right" />
      <div className="gala-stage-floor" />
    </div>
  );
}

function Confetti() {
  return (
    <div className="gala-confetti" aria-hidden="true">
      {Array.from({ length: 64 }, (_, i) => (
        <i
          key={i}
          style={
            {
              left: `${(i * 37) % 100}%`,
              "--drift": `${((i * 19) % 240) - 120}px`,
              "--rotation": `${i * 67}deg`,
              backgroundColor: ["#f8dfa3", "#fff4db", "#bd883e", "#a43c3c"][
                i % 4
              ],
              animationDelay: `${(i % 9) * 0.13}s`,
              animationDuration: `${3.5 + (i % 5) * 0.4}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
