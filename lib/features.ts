/**
 * Feature flags — controls which v5+ features are active.
 *
 * Three states:
 *   'off'    — feature hidden everywhere (migration may exist, UI does not)
 *   'admin'  — feature visible in admin only, API active, public page not rendered
 *   'public' — all surfaces active
 *
 * ENV override: set FEATURE_<KEY>=admin (or public, or off) in Vercel env vars
 * to enable a feature in production without a code deploy.
 *
 * Lifecycle: off → admin → public
 * Never skip 'admin' stage for new content features.
 */

type FeatureState = 'off' | 'admin' | 'public'

const DEFAULTS: Record<string, FeatureState> = {
  // Global admin taxonomy sections — all visible by default
  BUILD_CATEGORIES_ADMIN: 'admin',
  PART_CATEGORIES_ADMIN: 'admin',

  // Per-model v5 content tabs — canonical content model, always on
  MODEL_SPECS_TAB: 'admin',
  MODEL_FITMENT_TAB: 'admin',
  MODEL_STYLE_TAB: 'admin',
  MODEL_MODS_TAB: 'admin',

  // Future public pages (not yet built)
  CATEGORY_PAGES: 'off',
  BRAND_PAGES: 'off',

  // Site features
  GA4_TRACKING: 'off',
}

function resolveState(key: string): FeatureState {
  const envKey = `FEATURE_${key}`
  const override = process.env[envKey]
  if (override === 'off' || override === 'admin' || override === 'public') {
    return override
  }
  return DEFAULTS[key] ?? 'off'
}

/** Returns true if the feature should be shown in the admin panel */
export function isAdminEnabled(key: string): boolean {
  const state = resolveState(key)
  return state === 'admin' || state === 'public'
}

/** Returns true if the feature should be rendered on the public site */
export function isPublicEnabled(key: string): boolean {
  return resolveState(key) === 'public'
}

/** Returns the raw state for inspection */
export function featureState(key: string): FeatureState {
  return resolveState(key)
}
