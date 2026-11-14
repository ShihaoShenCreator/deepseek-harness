/** Read and persist the shell-owned transparent-window preference for Settings. */
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { DesktopAppearanceBridge, DesktopAppearanceState } from '../types.ts'

/** Persisted preference, the running window's material state and save feedback. */
export interface DesktopTransparencySnapshot {
  appearance?: DesktopAppearanceState
  failed: boolean
  pending?: boolean
}

/** Client observation; the shell applies the material on the next launch. */
export class DesktopTransparencySource {
  /** Stable observation shared by every mounted General view. */
  readonly store = createSnapshotStore<DesktopTransparencySnapshot>({ failed: false })
  private live = true

  /** @param bridge - Isolated shell API, present only where Windows draws the material. */
  constructor(private readonly bridge: DesktopAppearanceBridge) {
    void bridge.get().then((appearance) => {
      if (this.live) this.store.set({ appearance, failed: false })
    }, () => {
      if (this.live) this.store.set({ failed: true })
    })
  }

  /**
   * Persist one explicit preference without changing the running window.
   * @param enabled - Requested transparent-window preference for the next launch.
   * @returns After the shell confirms the preference or the save fails.
   */
  async select(enabled: boolean): Promise<void> {
    if (!this.isLive() || this.store.getSnapshot().pending !== undefined) return
    const current = this.store.getSnapshot()
    if (current.appearance?.transparentWindow === enabled) return
    this.store.set({ ...current, pending: true, failed: false })
    let appearance: DesktopAppearanceState | undefined
    try {
      appearance = await this.bridge.setTransparentWindow(enabled)
    } catch (_error) {
      // A rejected IPC has no confirmed preference; the row reports the failure.
    }
    if (!this.isLive()) return
    const latest = this.store.getSnapshot()
    const { pending: _pending, ...confirmed } = latest
    this.store.set({
      ...confirmed,
      ...(appearance === undefined ? { failed: true } : { appearance, failed: false }),
    })
  }

  private isLive(): boolean { return this.live }

  /** Ignore late IPC responses. */
  dispose(): void { this.live = false }
}
