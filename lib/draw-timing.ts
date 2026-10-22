/** One timeline shared by winner commitment and the award-show presentation. */
export const DRAW_DURATION_MS = 8200;
export const ANTICIPATION_MS = 3200;
export const ENVELOPE_OPEN_MS = ANTICIPATION_MS + 3000;
// Give the flap and letter time to settle before fading into the winner reveal.
export const REVEAL_TRANSITION_MS = DRAW_DURATION_MS - 600;
