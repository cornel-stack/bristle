// Single source for the onboarding numeric bounds (contracts §7). Plain module
// (no "use client"), so both the client islands and the server actions import the
// same values — no redeclaration, no drift. ONBOARDING_TOTAL_STEPS is 2 this
// slice (the First-Run Tour is deferred).

export const ONBOARDING_TOTAL_STEPS = 2;
export const CATEGORIES_MIN = 3;
export const CATEGORIES_MAX = 5;
export const ROLE_CUSTOM_MAX = 200;
