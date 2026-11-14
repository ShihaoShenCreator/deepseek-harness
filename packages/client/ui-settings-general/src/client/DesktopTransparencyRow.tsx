/** General Settings control for the Windows transparent-window mode. */
import { Switch } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { DesktopTransparencySource } from './desktop-transparency-source.ts'
import css from './DesktopTransparencyRow.module.css'

/** Shell observation and explicit preference write. */
export interface DesktopTransparencyRowInjected {
  hooks: { transparency: DesktopTransparencySource['store'] }
  select(enabled: boolean): Promise<void>
}

/**
 * Render the transparent-window toggle.
 * @param props - Shell observation, writer and localized copy.
 * @returns The General Settings row.
 */
export function DesktopTransparencyRow({ useTransparency, select, t }:
  PropsRuntime<'settings.general.item'> & PropsLocale<'settings'> & InjectFace<DesktopTransparencyRowInjected>) {
  const { appearance, failed, pending } = useTransparency(value => value)
  const restart = appearance !== undefined && appearance.transparentWindow !== appearance.active
  return <div className={css.row}>
    <div>
      <div className={css.title}>{t('desktop.transparency.title')}</div>
      <div className={css.description}>{t('desktop.transparency.description')}</div>
      {restart && <div className={css.notice}>{t('desktop.transparency.restart')}</div>}
      {failed && <div role="alert">{t('desktop.transparency.error')}</div>}
    </div>
    <Switch checked={appearance?.transparentWindow === true} disabled={appearance === undefined || pending === true}
      label={t('desktop.transparency.title')} onChange={(next) => { void select(next) }} />
  </div>
}
