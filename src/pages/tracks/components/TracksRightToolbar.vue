<script lang="ts" setup>
import { Delete, Rank } from "@element-plus/icons-vue"

const emit = defineEmits<{
  (e: "clearMap"): void
  (e: "stadiometry"): void
}>()

// 开始测距
function handleStadiometry() {
  emit("stadiometry")
}
// 清除所有标记
function handleClearMap() {
  emit("clearMap")
}
</script>

<template>
  <!-- 右边工具栏 -->
  <div class="right-toolbar">
    <div class="glass-panel" style="padding: 5px; display: flex; flex-direction: column; gap: 5px;">
      <!-- <div class="btn-icon" :class="{ active: activeSubPanel === 'marker' }" @click="toggleSubPanel('marker')" title="地图标注">
        <el-icon><Location /></el-icon>
      </div> -->
      <!-- <div class="btn-icon" :class="{ active: activeSubPanel === 'layer' }" @click="toggleSubPanel('layer')" title="图层切换">
        <el-icon><CopyDocument /></el-icon>
      </div> -->
      <div class="btn-icon" title="测距" @click="handleStadiometry">
        <el-icon><Rank /></el-icon>
      </div>
      <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 2px 0;" />
      <div class="btn-icon" @click="handleClearMap" title="清除所有标记">
        <el-icon color="#f43f5e">
          <Delete />
        </el-icon>
      </div>
    </div>
  </div>

  <!-- 标注设置 -->
  <!-- <div class="glass-panel sub-panel" :class="{ active: activeSubPanel === 'marker' }">
    <h4>
      <el-icon style="margin-right: 6px;">
        <Location />
      </el-icon> 新增标注
    </h4>

    <label class="form-label">标注名称</label>
    <input type="text" :value="markerForm.name" @input="$emit('update:markerForm', { ...markerForm, name: ($event.target as HTMLInputElement).value })" class="form-input" placeholder="输入位置名称...">

    <label class="form-label">坐标位置 (Lat, Lng)</label>
    <div style="display: flex; gap: 5px;">
      <input type="text" :value="markerForm.lat" class="form-input" placeholder="纬度" style="font-family: Consolas;" readonly>
      <input type="text" :value="markerForm.lng" class="form-input" placeholder="经度" style="font-family: Consolas;" readonly>
    </div>

    <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
      <button class="btn-text" :class="{ active: isPicking }" @click="togglePickMode">
        <el-icon><Pointer /></el-icon> 鼠标拾取
      </button>
      <span v-if="isPicking" style="font-size: 11px; color: var(--accent);">点击地图...</span>
    </div>

    <button class="btn-text btn-primary" style="width: 100%; margin-top: 15px;" @click="handleAddMarker">
      添加标注点
    </button>
  </div> -->

  <!-- Sub Panel: Layer -->
  <!-- <div class="glass-panel sub-panel" :class="{ active: activeSubPanel === 'layer' }">
    <h4>
      <el-icon style="margin-right: 6px;">
        <CopyDocument />
      </el-icon> 底图风格
    </h4>

    <div class="layer-card" :class="{ active: activeLayer === 'dark' }" @click="setLayer('dark')">
      <div class="layer-preview" style="background: linear-gradient(135deg, #1e293b, #000);" />
      <div>
        <div style="font-size: 13px;">
          深色科技 (Dark)
        </div>
        <div style="font-size: 11px; color: #666;">
          CartoDB Dark Matter
        </div>
      </div>
    </div>

    <div class="layer-card" :class="{ active: activeLayer === 'light' }" @click="setLayer('light')">
      <div class="layer-preview" style="background: linear-gradient(135deg, #e2e8f0, #fff);" />
      <div>
        <div style="font-size: 13px;">
          浅色街道 (Light)
        </div>
        <div style="font-size: 11px; color: #666;">
          OpenStreetMap
        </div>
      </div>
    </div>

    <div class="layer-card" :class="{ active: activeLayer === 'sat' }" @click="setLayer('sat')">
      <div class="layer-preview" style="background: linear-gradient(135deg, #14532d, #166534);" />
      <div>
        <div style="font-size: 13px;">
          卫星影像 (Sat)
        </div>
        <div style="font-size: 11px; color: #666;">
          Esri World Imagery
        </div>
      </div>
    </div>
  </div> -->
</template>

<style lang="scss" scoped>
.right-toolbar {
  position: absolute;
  top: 80px;
  right: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sub-panel {
  position: absolute;
  top: 80px;
  right: 80px;
  width: 260px;
  padding: 15px;
  z-index: 99;
  border-radius: var(--radius);
  opacity: 0;
  transform: translateX(20px);
  pointer-events: none;
  transition: var(--transition, all 0.3s);

  &.active {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }

  h4 {
    margin: 0 0 15px 0;
    color: var(--accent, #0ea5e9);
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 8px;
    display: flex;
    align-items: center;
  }
}

.glass-panel {
  background: var(--bg-glass, rgba(15, 23, 42, 0.85));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: var(--border-glass, 1px solid rgba(255, 255, 255, 0.1));
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
}

.btn-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-sub, #94a3b8);
  font-size: 16px;
  cursor: pointer;
  transition: var(--transition, all 0.3s);
  border-radius: var(--radius, 4px);

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
  &.active {
    color: var(--accent, #0ea5e9);
    background: rgba(14, 165, 233, 0.15);
    border-left: 2px solid var(--accent, #0ea5e9);
  }
}

.btn-text {
  padding: 6px 12px;
  font-size: 13px;
  color: var(--text-sub, #94a3b8);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  border-radius: var(--radius, 4px);
  transition: var(--transition, all 0.3s);
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover,
  &.active {
    border-color: var(--accent, #0ea5e9);
    color: var(--accent, #0ea5e9);
  }
}

.btn-primary {
  background: var(--accent, #0ea5e9);
  color: #000;
  border: none;
  font-weight: 600;
  &:hover {
    background: var(--accent-hover, #38bdf8);
    color: #000;
  }
}

.form-input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 8px;
  font-size: 13px;
  width: 100%;
  border-radius: var(--radius, 4px);
  box-sizing: border-box;
  outline: none;

  &:focus {
    border-color: var(--accent, #0ea5e9);
  }
}

.form-label {
  display: block;
  font-size: 12px;
  color: var(--text-sub, #94a3b8);
  margin-bottom: 5px;
  margin-top: 10px;
}

.layer-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid transparent;
  margin-bottom: 8px;
  cursor: pointer;
  border-radius: var(--radius, 4px);
  background: rgba(255, 255, 255, 0.02);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  &.active {
    border-color: var(--accent, #0ea5e9);
    background: rgba(14, 165, 233, 0.1);
  }
}

.layer-preview {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background: #333;
}
</style>
