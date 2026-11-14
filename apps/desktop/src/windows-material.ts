/** Windows version gate for Electron's system-drawn window material. */

/** Windows 11 22H2 build that introduced DWM backdrops for application windows. */
const WINDOWS_11_22H2_BUILD = 22_621

/**
 * Whether Electron can draw an acrylic backdrop behind the main window.
 * `setBackgroundMaterial` is supported only on Windows 11 22H2 and later.
 * @returns true only on a supported Windows build.
 */
export function windowsWindowMaterialSupported(): boolean {
  if (process.platform !== 'win32') return false
  // `getSystemVersion` is an Electron process API; plain Node (tests, tooling) omits it.
  const versionApi: { getSystemVersion?: () => string } = process
  const systemVersion = versionApi.getSystemVersion
  if (systemVersion === undefined) return false
  const build = Number(systemVersion().split('.')[2])
  return Number.isSafeInteger(build) && build >= WINDOWS_11_22H2_BUILD
}
