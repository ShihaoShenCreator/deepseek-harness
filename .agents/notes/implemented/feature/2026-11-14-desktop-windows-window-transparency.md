# Agent Note: Desktop Windows window transparency

Status: implemented

English | [中文](2026-11-14-desktop-windows-window-transparency.zh.md)

## Problem

macOS main windows use native sidebar vibrancy, but the Windows workspace keeps an opaque window and page base. A Host-side plugin cannot open window transparency: `transparent` and `backgroundMaterial` are `BrowserWindow` construction options, and out-of-process DWM composition calls have no effect on Chromium-drawn windows. Users and background plugins therefore cannot make the desktop show through the window on Windows.

## Decision

Desktop owns an optional `appearance.transparentWindow` preference in `userData/desktop/settings.json`, default `false`, validated independently from update fields under the shared writer lock. At startup the main window reads the preference and constructs with `backgroundColor: '#00000000'`, a fully transparent caption overlay, and `backgroundMaterial: 'acrylic'`. The preload receives a startup argument, marks `<html data-dsh-transparent-window>`, and publishes a transparent caption color so the page's own tint occupies the caption band. The Web shell clears the page and frame backgrounds and paints the sidebar and caption band with a 62% tint of the sidebar token while the centre column keeps the base fill, mirroring the macOS vibrancy layering; Reduce Transparency raises the tint to 90%. Electron supports the material only on Windows 11 22H2 and later, so the version gate hides the Settings row and the preload bridge everywhere else.

The preference applies on the next launch. The row states that a restart is required while the saved preference and the running window differ. Runtime material and background-color changes are not attempted because the material needs a window surface created for it; persistence alone is the shell contract.

## Alternatives considered

**Applying the material live through `setBackgroundMaterial` and `setBackgroundColor`.** Electron documents `transparent` as a construction option and reports that materials need a transparent window surface. Without a verified runtime path on the shipped Electron release, a live switch could silently do nothing. The startup-only preference with an explicit restart hint is honest and testable.

**Creating every window with `transparent: true`.** Transparent framed windows are unsupported on Windows and would change default window behavior for users who never enable the mode.

**Mica instead of acrylic.** Mica is wallpaper-tinted and does not blur the content behind the window; acrylic matches the existing welcome window and the intended frosted effect. A material selector can add mica later without changing this ownership.

**Clearing the whole page to transparent.** Overriding the base background token would make text and control surfaces translucent and require a design pass. The shell follows the macOS split — glass sidebar and caption, opaque centre — and plugins can clear further surfaces through page tokens.

**A Host or Cordis setting.** Window construction precedes Host startup and must work while the Host is unavailable, so the existing Host-independent shell configuration owns it.

## Consequences

Windows 11 22H2 and later only; unsupported builds keep the opaque workspace and do not show the row. Changing the preference needs a restart, and the row carries that state. The material is fixed for the process, so theme changes only update the opaque fallback while the mode is off. The page attribute is shell-owned, so background plugins can layer on it without reading the settings file. Visual acceptance on Windows 11 remains a manual QA step; automated tests cover the window options, IPC, persistence, version gate, and the page CSS hook.
