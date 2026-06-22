/**
 * @ebe-orb/shared — the seam between ORB apps.
 *
 * The Universal Genome contracts (the five laws, the seven organs) are the shared
 * language every EBE ORB surface speaks. Re-export the domain types here as they
 * stabilize so the mobile app and future workers depend on one source of truth.
 */
export const FIVE_LAWS = [
  'Risk-first, not prediction-first.',
  "Edge = your number vs the world's number.",
  'Forward-validate before real stakes.',
  "Recognise + remember, don't predict.",
  'Confirm-first, never chase.'
] as const;
