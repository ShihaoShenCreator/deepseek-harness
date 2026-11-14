import { expect, it, vi } from 'vitest'
import { DesktopTransparencySource } from '../src/client/desktop-transparency-source.ts'
import type { DesktopAppearanceState } from '../src/types.ts'

function fixture() {
  const get = Promise.withResolvers<DesktopAppearanceState>()
  const set = Promise.withResolvers<DesktopAppearanceState>()
  const save = vi.fn(() => set.promise)
  const source = new DesktopTransparencySource({ get: () => get.promise, setTransparentWindow: save })
  return { source, get, set, save }
}

const inactive: DesktopAppearanceState = { transparentWindow: false, active: false }
const pendingStart: DesktopAppearanceState = { transparentWindow: true, active: false }

it('reports the persisted preference and the running window state', async () => {
  const f = fixture()
  f.get.resolve(inactive)
  await f.get.promise
  await Promise.resolve()
  expect(f.source.store.getSnapshot()).toEqual({ appearance: inactive, failed: false })
  f.source.dispose()
})

it('persists a changed preference and exposes the restart-required state', async () => {
  const f = fixture()
  f.get.resolve(inactive)
  await f.get.promise
  await Promise.resolve()
  const pending = f.source.select(true)
  expect(f.source.store.getSnapshot()).toEqual({ appearance: inactive, failed: false, pending: true })
  f.set.resolve(pendingStart)
  await pending
  expect(f.save).toHaveBeenCalledWith(true)
  expect(f.source.store.getSnapshot()).toEqual({ appearance: pendingStart, failed: false })
  f.source.dispose()
})

it('does not submit the current preference', async () => {
  const f = fixture()
  f.get.resolve(inactive)
  await f.get.promise
  await Promise.resolve()
  await f.source.select(false)
  expect(f.save).not.toHaveBeenCalled()
  expect(f.source.store.getSnapshot()).toEqual({ appearance: inactive, failed: false })
  f.source.dispose()
})

it('reports a rejected save while keeping the confirmed preference', async () => {
  const f = fixture()
  f.get.resolve(inactive)
  await f.get.promise
  await Promise.resolve()
  const pending = f.source.select(true)
  f.set.reject(new Error('IPC closed'))
  await pending
  expect(f.source.store.getSnapshot()).toEqual({ appearance: inactive, failed: true })
  f.source.dispose()
})

it('reports a failed initial read', async () => {
  const f = fixture()
  f.get.reject(new Error('unavailable'))
  await Promise.resolve()
  expect(f.source.store.getSnapshot()).toEqual({ failed: true })
  f.source.dispose()
})

it('ignores late read and save replies after disposal', async () => {
  const f = fixture()
  f.source.dispose()
  const before = f.source.store.getSnapshot()
  f.get.resolve(inactive)
  const pending = f.source.select(true)
  f.set.resolve(pendingStart)
  await pending
  await Promise.resolve()
  expect(f.source.store.getSnapshot()).toBe(before)
})
