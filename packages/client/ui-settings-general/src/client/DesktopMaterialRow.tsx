/** General Settings control for the Windows window backdrop material. */
import { useState } from 'react'
import { Menu, IconChevronDownOutlineRegular, IconLoadingOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { DesktopMaterialSource } from './desktop-material-source.ts'
import type { DesktopWindowMaterial } from '../types.ts'
import css from './DesktopMaterialRow.module.css'

/** Shell observation and explicit preference write. */
export interface DesktopMaterialRowInjected {
  hooks: { material: DesktopMaterialSource['store'] }
  select(material: DesktopWindowMaterial): Promise<void>
}

/** Material choices in display order; `none` is the opaque fallback. */
const MATERIALS: readonly DesktopWindowMaterial[] = ['none', 'mica', 'acrylic', 'tabbed']

/**
 * Render the window material selector.
 * @param props - Shell observation, writer and localized copy.
 * @returns The General Settings row.
 */
export function DesktopMaterialRow({ useMaterial, select, t }:
  PropsRuntime<'settings.general.item'> & PropsLocale<'settings'> & InjectFace<DesktopMaterialRowInjected>) {
  const { appearance, failed, pending } = useMaterial(value => value)
  const [open, setOpen] = useState(false)
  const busy = pending === true
  const restart = appearance !== undefined && appearance.windowMaterial !== appearance.active
  const material = appearance?.windowMaterial
  return <div className={css.row} role="group" aria-label={t('desktop.material.title')}>
    <div className={css.rowText}>
      <div className={css.title}>{t('desktop.material.title')}</div>
      <div className={css.description}>{t('desktop.material.description')}</div>
      {restart && <div className={css.notice}>{t('desktop.material.restart')}</div>}
      {failed && <div role="alert">{t('desktop.material.error')}</div>}
    </div>
    <Menu open={open} onClose={() => { setOpen(false) }} portal align="end"
      selectedId={material ?? ''}
      items={MATERIALS.map(value => ({ id: value, label: t(`desktop.material.${value}`) }))}
      onSelect={(id) => {
        setOpen(false)
        void select(id as DesktopWindowMaterial)
      }}
      anchor={<button type="button" className={css.selector} disabled={busy || appearance === undefined}
        aria-busy={busy} aria-label={t('desktop.material.title')} aria-haspopup="menu" aria-expanded={open}
        onClick={() => { setOpen(!open) }}>
        {material === undefined ? t('desktop.material.none') : t(`desktop.material.${material}`)}
        {busy ? <IconLoadingOutlineRegular className={css.spinner} /> : <IconChevronDownOutlineRegular className={css.chevron} />}
      </button>} />
  </div>
}
