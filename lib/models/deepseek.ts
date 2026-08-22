import type { DeepSeekModelEntry, DeepSeekTierPricing } from "./types.ts";
import { DEEPSEEK_MODEL_ID } from "./ids.ts";

const DEEPSEEK_MODEL_IDS = [
  DEEPSEEK_MODEL_ID.V4_FLASH,
  DEEPSEEK_MODEL_ID.V4_PRO,
] as const;

type DeepSeekModelId = typeof DEEPSEEK_MODEL_IDS[number];

/**
 * Peak windows in whole UTC hours, as [startHourInclusive, endHourExclusive).
 * Seven peak hours a day; everything outside them bills at the off-peak tier,
 * which is exactly half the peak rate.
 * Source: api-docs.deepseek.com/quick_start/pricing, read 2026-08-22.
 */
const DEEPSEEK_PEAK_WINDOWS_UTC: ReadonlyArray<readonly [number, number]> = [
  [1, 4],
  [6, 10],
];

/**
 * From 2026-08-23 weekends are off-peak around the clock. DeepSeek states the
 * change in Beijing time (UTC+8); we evaluate the weekend in UTC, so requests
 * in the eight hours either side of a weekend boundary may be assigned the
 * peak tier when they were in fact billed off-peak. That errs toward
 * over-reporting cost, never under-reporting it.
 */
const DEEPSEEK_WEEKEND_OFF_PEAK_FROM = Date.UTC(2026, 7, 23);

function isDeepSeekPeakHour(at: Date): boolean {
  const day = at.getUTCDay();
  const isWeekend = day === 0 || day === 6;
  if (isWeekend && at.getTime() >= DEEPSEEK_WEEKEND_OFF_PEAK_FROM) {
    return false;
  }

  const hour = at.getUTCHours();
  return DEEPSEEK_PEAK_WINDOWS_UTC.some(
    ([start, end]) => hour >= start && hour < end,
  );
}

const DEEPSEEK_MODELS: ReadonlyArray<DeepSeekModelEntry> = [
  {
    id: DEEPSEEK_MODEL_ID.V4_FLASH,
    displayName: "DeepSeek V4 Flash",
    supportsVision: false,
    pricing: {
      peak: {
        inputCacheHit: 0.014,
        inputCacheMiss: 0.44,
        output: 1.32,
      },
      offPeak: {
        inputCacheHit: 0.007,
        inputCacheMiss: 0.22,
        output: 0.66,
      },
    },
  },
  {
    id: DEEPSEEK_MODEL_ID.V4_PRO,
    displayName: "DeepSeek V4 Pro",
    supportsVision: false,
    pricing: {
      peak: {
        inputCacheHit: 0.044,
        inputCacheMiss: 1.32,
        output: 3.96,
      },
      offPeak: {
        inputCacheHit: 0.022,
        inputCacheMiss: 0.66,
        output: 1.98,
      },
    },
  },
];

function findDeepSeekModel(modelName: string): DeepSeekModelEntry {
  const model = DEEPSEEK_MODELS.find((m) => m.id === modelName);
  if (!model) {
    throw new Error(
      `Unknown DeepSeek model: ${modelName}. Available: ${
        DEEPSEEK_MODEL_IDS.join(", ")
      }`,
    );
  }
  return model;
}

/**
 * The tier that applies to a request served at `at`. Defaults to peak when no
 * time is given, so an unknown serve time is never billed as the cheaper rate.
 */
function selectDeepSeekTier(
  model: DeepSeekModelEntry,
  at?: Date,
): DeepSeekTierPricing {
  if (at === undefined) return model.pricing.peak;
  return isDeepSeekPeakHour(at) ? model.pricing.peak : model.pricing.offPeak;
}

export {
  DEEPSEEK_MODEL_IDS,
  DEEPSEEK_MODELS,
  DEEPSEEK_PEAK_WINDOWS_UTC,
  findDeepSeekModel,
  isDeepSeekPeakHour,
  selectDeepSeekTier,
};

export type { DeepSeekModelId };
