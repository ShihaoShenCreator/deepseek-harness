/** Startup policy for optional Electron shell preferences, independent of the Host. */
import { DesktopSettingsFile, type DesktopAppearancePreferences, type DesktopUpdatePreferences } from './settings-file.ts'

/** Resolved shell preferences; channel failures do not disable valid popup or appearance preferences. */
export interface DesktopSettings {
  readonly updates: Pick<DesktopUpdatePreferences, 'allowTestAuthPopupWindow'>
  readonly appearance: DesktopAppearancePreferences
}

/**
 * Initialize the shared document explicitly at startup, then resolve the popup and window-appearance preferences.
 * @param userData - Electron userData, independent of DSH_HOME.
 * @returns Validated preferences, or their disabled or opaque defaults with a diagnostic on failure; changes require restart.
 */
export async function readDesktopSettings(userData: string): Promise<DesktopSettings> {
  const file = new DesktopSettingsFile(userData)
  const result = await file.initialize()
  const popup = result.kind === 'ready' ? result.fields.allowTestAuthPopupWindow : undefined
  const appearance = result.kind === 'ready' ? result.fields.transparentWindow : undefined
  const error = result.kind === 'error' ? result.error
    : popup?.kind === 'invalid' ? popup.error
      : appearance?.kind === 'invalid' ? appearance.error : undefined
  if (error) {
    try { console.warn(`desktop settings: ${file.path}: using defaults because settings could not be loaded`, error) } catch (_logError) {
      // Optional shell preferences remain at their defaults even when diagnostic output is unavailable.
    }
  }
  return {
    updates: { allowTestAuthPopupWindow: popup?.kind === 'valid' ? popup.value : false },
    appearance: { transparentWindow: appearance?.kind === 'valid' ? appearance.value : false },
  }
}
