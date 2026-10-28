/**
 * Money is stored as integers in minor units (e.g. paise/cents) to avoid
 * floating point drift (0.1 + 0.2 !== 0.3). The API speaks in major units
 * with up to 2 decimal places.
 */
const SCALE = 100;

export const toMinor = (amount) => Math.round(amount * SCALE);

export const fromMinor = (minor) => minor / SCALE;

export const hasAtMostTwoDecimals = (amount) =>
  Math.abs(amount * SCALE - Math.round(amount * SCALE)) < 1e-6;
