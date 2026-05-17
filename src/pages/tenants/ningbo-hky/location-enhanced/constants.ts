// 地图图层和 source 的 id 集中放在这里，避免多个模块手写字符串后出现拼写不一致。
// 如果以后同一页面需要挂多套轨迹图层，可以从这里统一加前缀或改命名。
export const TRACK_SOURCE_ID = "nb-enhanced-track"
export const TRACK_LAYER_ID = "nb-enhanced-track-line"
export const TRACK_POINTS_SOURCE_ID = "nb-enhanced-track-points"
export const TRACK_POINTS_LAYER_ID = "nb-enhanced-track-points"
export const FENCE_SOURCE_ID = "nb-enhanced-fence"
export const FENCE_FILL_LAYER_ID = "nb-enhanced-fence-fill"
export const FENCE_LINE_LAYER_ID = "nb-enhanced-fence-line"
export const FENCE_LABEL_SOURCE_ID = "nb-enhanced-fence-label"
export const FENCE_LABEL_LAYER_ID = "nb-enhanced-fence-label"

// 预留给总览类项目的围栏显示模式：
// true 表示所有配置了围栏的浮标常驻显示，false 表示只显示当前选中的浮标围栏。
export const SHOW_ALL_FENCES = false
// 半径文字标签独立于围栏圆控制，方便只保留圆形范围而隐藏文字。
export const SHOW_FENCE_RADIUS_LABEL = false

// Marker 回放时，每两个轨迹点之间的基础动画时长；实际时长会再除以面板中的速度倍率。
export const PLAYBACK_SEGMENT_MS = 800
