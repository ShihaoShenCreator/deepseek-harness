# Agent Note: 桌面 Windows 窗口透明模式

Status: implemented

[English](2026-11-14-desktop-windows-window-transparency.md) | 中文

## 问题

macOS 主窗口使用原生侧边栏毛玻璃，而 Windows 工作区保持不透明的窗口和页面底色。Host 侧插件无法打开窗口透明：`transparent` 和 `backgroundMaterial` 是 `BrowserWindow` 的构造参数，进程外的 DWM 合成调用对 Chromium 自绘窗口没有效果。因此 Windows 用户和背景插件都无法让桌面透过窗口显示。

## 决策

Desktop 在 `userData/desktop/settings.json` 中持有可选的 `appearance.transparentWindow` 偏好，默认 `false`，在共享写锁下与更新字段独立校验。启动时主窗口读取该偏好，并使用 `backgroundColor: '#00000000'`、完全透明的标题栏 overlay 和 `backgroundMaterial: 'acrylic'` 构造。preload 接收启动参数，标记 `<html data-dsh-transparent-window>`，并上报透明标题栏颜色，让页面自身的着色占据标题栏区域。Web 壳清除页面和框架底色，侧边栏与标题栏使用侧边栏 token 的 62% 着色，中央列保持基础底色，与 macOS 的毛玻璃分层一致；“减少透明度”会将着色提高到 90%。Electron 仅在 Windows 11 22H2 及更高版本支持该材质，因此版本门槛会在其他系统隐藏设置行和 preload 桥接。

偏好在下一次启动时生效。当保存的偏好与当前运行窗口不一致时，该行提示需要重启。不尝试运行时修改材质或窗口底色，因为材质需要为它创建的窗口表面；持久化本身是壳层的约定。

## 考虑过的替代方案

**通过 `setBackgroundMaterial` 和 `setBackgroundColor` 即时应用材质。** Electron 将 `transparent` 记录为构造参数，并说明材质需要透明窗口表面。在所发布的 Electron 版本上缺少经过验证的运行时路径时，即时开关可能静默无效。带明确重启提示的启动期偏好更诚实，也可测试。

**让所有窗口都以 `transparent: true` 创建。** Windows 不支持带边框的透明窗口，而且这会改变从未启用该模式的用户的默认窗口行为。

**使用云母（mica）而非亚克力。** 云母使用壁纸着色，不模糊窗口背后的内容；亚克力与现有欢迎窗口及预期的磨砂效果一致。以后可以在不改变归属的情况下增加材质选择器。

**将整个页面清为透明。** 覆盖基础底色 token 会让文字和控件表面也变成半透明，需要单独的设计评审。壳层沿用 macOS 的分层——侧边栏和标题栏为玻璃，中央保持不透明——插件可以通过页面 token 清除更多表面。

**使用 Host 或 Cordis 设置。** 窗口构造早于 Host 启动，并且必须在 Host 不可用时工作，因此由现有的、独立于 Host 的壳层配置持有。

## 后果

仅支持 Windows 11 22H2 及更高版本；不受支持的版本保持不透明工作区，也不显示该行。修改偏好需要重启，该行会显示此状态。材质在当前进程内固定，因此主题变化只会在模式关闭时更新不透明底色。页面属性由壳层持有，背景插件可以在此基础上叠加，而无需读取设置文件。Windows 11 上的视觉验收仍需人工完成；自动化测试覆盖窗口参数、IPC、持久化、版本门槛和页面 CSS 钩子。
