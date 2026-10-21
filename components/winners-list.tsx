"use client";

import type React from "react";
import { Trophy, Ticket, Clock3 } from "lucide-react";

interface Winner {
  couponId: string;
  dealerId?: string;
  dealerName: string;
  category: string;
  timestamp: Date;
  district?: string;
}
interface PrizeCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  winnerCount: number;
  color: string;
  image: string;
  description: string;
}
interface WinnersListProps {
  winners: Winner[];
  prizeCategories: PrizeCategory[];
}

export function WinnersList({ winners, prizeCategories }: WinnersListProps) {
  if (!winners.length)
    return (
      <div className="results-empty">
        <span className="ready-medallion">
          <Trophy />
        </span>
        <h3>Your hall of celebration.</h3>
        <p>Every winner has a story. Start the live draw to see yours here.</p>
      </div>
    );

  return (
    <section className="results-list" aria-label="All winners">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Their moment in the spotlight</span>
          <h2>The winners’ collection.</h2>
        </div>
        <span className="results-total">
          {winners.length} {winners.length === 1 ? "winner" : "winners"}{" "}
          celebrated
        </span>
      </div>
      {prizeCategories.map((category) => {
        const categoryWinners = winners.filter(
          (winner) => winner.category === category.name,
        );
        if (!categoryWinners.length) return null;
        return (
          <section
            key={category.id}
            className="results-prize"
            aria-label={`${category.name} winners`}
          >
            <div className="results-prize-header">
              <span className="results-prize-icon">{category.icon}</span>
              <div>
                <span className="eyebrow">{category.description}</span>
                <h3>{category.name}</h3>
              </div>
              <span className="count-badge">{categoryWinners.length}</span>
            </div>
            <div>
              {categoryWinners.map((winner, index) => (
                <div
                  key={`${winner.couponId}-${winner.timestamp.getTime()}`}
                  className="result-row"
                >
                  <span className="result-position">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="result-person">
                    <strong>{winner.dealerName}</strong>
                    <span>
                      {[
                        winner.district,
                        winner.dealerId && `Dealer ${winner.dealerId}`,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Lucky winner"}
                    </span>
                  </div>
                  <div className="result-ticket">
                    <Ticket />
                    <span>{winner.couponId}</span>
                  </div>
                  <time dateTime={winner.timestamp.toISOString()}>
                    <Clock3 />
                    {winner.timestamp.toLocaleString()}
                  </time>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}
