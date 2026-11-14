import { afterEach, expect, it, vi } from 'vitest'
import { windowsWindowMaterialSupported } from '../src/windows-material.ts'

afterEach(() => { vi.unstubAllGlobals() })

it.each([
  ['win32', '10.0.22631', true],
  ['win32', '10.0.22621', true],
  ['win32', '10.0.22000', false],
  ['win32', '10.0.19045', false],
  ['darwin', '10.0.22631', false],
  ['linux', '10.0.22631', false],
] as const)('gates the system material on %s build %s', (platform, version, supported) => {
  vi.stubGlobal('process', { ...process, platform, getSystemVersion: () => version })
  expect(windowsWindowMaterialSupported()).toBe(supported)
})

it('treats an unparsable system version as unsupported', () => {
  vi.stubGlobal('process', { ...process, platform: 'win32', getSystemVersion: () => '10.0' })
  expect(windowsWindowMaterialSupported()).toBe(false)
})

it('treats a host without the Electron version API as unsupported', () => {
  vi.stubGlobal('process', { ...process, platform: 'win32', getSystemVersion: undefined })
  expect(windowsWindowMaterialSupported()).toBe(false)
})
