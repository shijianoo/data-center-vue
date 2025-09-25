<script lang="ts"  setup>
import type { Device } from "@/common/apis/devices/type"
import { Picture } from "@element-plus/icons-vue"
import { LineChart } from "echarts/charts"
import {
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent
} from "echarts/components"
import * as echarts from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import VChart from "vue-echarts"
import { queryDeviceFieldData } from "@/common/apis/data-query"
import { selectDateRange } from "@/common/composables/useDateRangeSelector"
import { formatTimeLabel, saveAsImage } from "@/common/utils/echart-utils"

export interface FieldInfo {
  name: string
  label: string
}
interface Props {
  device: Device
  fields: FieldInfo[]
  defaultDays?: number
  windows: ("1m" | "10m" | "30m" | "1h" | "2h" | "6h" | "12h" | "1d" | "1w")[]
  defaultWindow: string
}
const {
  device,
  fields,
  defaultDays = 7,
  windows,
  defaultWindow
} = defineProps<Props>()

echarts.use([
  TitleComponent,
  CanvasRenderer,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  GraphicComponent,
  LineChart
])

const chart = ref()
const toolbarRef = ref()
const loading = ref(false)
const selectedField = ref<FieldInfo | null>(null)
const start = ref("")
const end = ref("")
const window = ref(defaultWindow)
const hasError = ref(false)
const hasNoData = ref(false)

// 拖动相关状态
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const toolbarPosition = ref({ x: 0, y: 0 })

// 显示提示信息
function showMessage(message: string, type: "error" | "no-data" = "no-data") {
  hasError.value = type === "error"
  hasNoData.value = type === "no-data"

  chart.value.setOption({
    graphic: {
      elements: [
        {
          type: "text",
          left: "center",
          top: "middle",
          style: {
            text: message,
            fontSize: 16,
            fill: type === "error" ? "#ff4d4f" : "#999",
            textAlign: "center"
          }
        }
      ]
    }
  })
}

// 隐藏提示信息
function hideMessage() {
  hasError.value = false
  hasNoData.value = false

  chart.value.setOption({
    graphic: {
      elements: []
    }
  })
}

// 初始化时间范围
function initTimeRange() {
  const now = new Date()
  const startDate = new Date(now.getTime() - defaultDays * 24 * 60 * 60 * 1000)
  start.value = startDate.toISOString()
  end.value = now.toISOString()
  window.value = defaultWindow
}

onMounted(async () => {
  // 设置工具栏初始位置
  nextTick(() => {
    if (toolbarRef.value) {
      const container = toolbarRef.value.parentElement
      if (container) {
        const containerRect = container.getBoundingClientRect()
        const toolbarRect = toolbarRef.value.getBoundingClientRect()
        // 初始位置：右上角，距离边缘10px
        const initialX = containerRect.width - toolbarRect.width - 10
        const initialY = 10
        toolbarPosition.value = { x: initialX, y: initialY }
        toolbarRef.value.style.transform = `translate(${initialX}px, ${initialY}px)`
      }
    }
  })

  chart.value.setOption({
    grid: {
      top: 20,
      left: 0,
      right: 0,
      bottom: 20
    },
    xAxis: {
      type: "time",
      data: [],
      axisLabel: {
        formatter(value: any) {
          return formatTimeLabel(value, chart.value)
        }
      }
    },
    yAxis: {
      type: "value",
      boundaryGap: ["0%", "10%"] // 上下各留出10%的空间
    },
    tooltip: {
      trigger: "axis"
    },
    dataZoom: [
      {
        type: "inside"
      }
    ],
    series: [{
      type: "line",
      smooth: true,
      showSymbol: false,
      data: []
    }]
  })

  initTimeRange()
  selectedField.value = fields[0]
  console.log("初始化图表", device.serialNumber)
})

// 打开时间范围选择对话框
async function handleRangeSelection() {
  const result = await selectDateRange({ useUtc: true, maxDays: 30 })
  if (result) {
    start.value = result.startDate
    end.value = result.endDate
    updateChart()
  }
}

// 监听字段和窗口变化
watch([selectedField, window], ([newField, newWindow], [oldField, oldWindow]) => {
  if (!newField) return
  if (newField !== oldField || newWindow !== oldWindow) {
    updateChart()
  }
})

// 更新图表数据
async function updateChart() {
  const params = {
    modelNumber: device.modelNumber,
    serialNumber: device.serialNumber,
    field: selectedField.value!.name,
    start: start.value,
    end: end.value,
    window: window.value,
    agg: "mean"
  }

  loading.value = true
  hideMessage()
  try {
    const { data } = await queryDeviceFieldData(params)
    const deduplicatedData = deduplicateByTime(data.items)

    // 检查是否有数据
    if (!deduplicatedData || deduplicatedData.length === 0) {
      showMessage("暂无数据", "no-data")
      return
    }

    // 恢复图表缩放
    chart.value.dispatchAction({
      type: "dataZoom",
      start: 0,
      end: 100
    })

    chart.value.setOption({
      series: [{
        name: selectedField.value!.label,
        data: deduplicatedData.map(item => [
          item.time,
          item[selectedField.value!.name] != null ? Number(item[selectedField.value!.name]).toFixed(4) : null
        ])
      }]
    })
  } catch (error) {
    console.log(error)
    showMessage("查询失败，请稍后重试", "error")
  } finally {
    loading.value = false
  }
}

/** 根据时间去重数据 */
function deduplicateByTime(items: any[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.time)) {
      return false
    }
    seen.add(item.time)
    return true
  })
}

// 保存图片功能
function handleSaveAsImage() {
  saveAsImage(chart.value, `图表_${selectedField.value?.label || "chart"}_${new Date().toISOString().slice(0, 10)}.png`)
}

// 拖动事件处理
function handleMouseDown(event: MouseEvent) {
  if (!toolbarRef.value) return

  isDragging.value = true

  // 获取当前工具栏的实际位置
  const toolbarRect = toolbarRef.value.getBoundingClientRect()
  const container = toolbarRef.value.parentElement
  if (!container) return
  const containerRect = container.getBoundingClientRect()

  // 计算相对于容器的位置
  const currentX = toolbarRect.left - containerRect.left
  const currentY = toolbarRect.top - containerRect.top

  dragStart.value = {
    x: event.clientX - currentX,
    y: event.clientY - currentY
  }

  document.addEventListener("mousemove", handleMouseMove)
  document.addEventListener("mouseup", handleMouseUp)
  event.preventDefault()
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value || !toolbarRef.value) return

  const container = toolbarRef.value.parentElement
  if (!container) return

  const containerRect = container.getBoundingClientRect()
  const toolbarRect = toolbarRef.value.getBoundingClientRect()

  let newX = event.clientX - dragStart.value.x
  let newY = event.clientY - dragStart.value.y

  // 限制在容器范围内
  newX = Math.max(0, Math.min(newX, containerRect.width - toolbarRect.width))
  newY = Math.max(0, Math.min(newY, containerRect.height - toolbarRect.height))

  toolbarPosition.value = { x: newX, y: newY }
  toolbarRef.value.style.transform = `translate(${newX}px, ${newY}px)`
}

function handleMouseUp() {
  isDragging.value = false
  document.removeEventListener("mousemove", handleMouseMove)
  document.removeEventListener("mouseup", handleMouseUp)
}
</script>

<template>
  <div class="w-full h-full relative">
    <!-- 自定义工具栏 -->
    <div class="chart-toolbar" ref="toolbarRef">
      <!-- 拖动提手 -->
      <div class="toolbar-handle" @mousedown="handleMouseDown">
        <div class="handle-dots">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <!-- 工具栏内容 -->
      <div class="toolbar-content">
        <!-- 字段选择 -->
        <el-tooltip content="选择字段">
          <el-dropdown size="small" trigger="click" placement="top-start" @command="(value) => selectedField = value">
            <el-button size="small">
              {{ selectedField?.label || '选择字段' }}
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="field in fields"
                  :key="field.name"
                  :command="field"
                  :class="{ 'is-active': field.name === selectedField?.name }"
                >
                  <span>{{ field.label }}</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-tooltip>

        <el-tooltip content="范围选择">
          <el-button
            circle
            size="small"
            @click="handleRangeSelection"
          >
            <SvgIcon name="calendar" />
          </el-button>
        </el-tooltip>

        <el-tooltip content="聚合间隔：控制数据密度，避免数据过多影响性能">
          <el-dropdown size="small" trigger="click" placement="top-start" @command="(value) => window = value">
            <el-button size="small" circle>
              {{ window }}
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="option in windows"
                  :key="option"
                  :command="option"
                  :class="{ 'is-active': option === window }"
                >
                  <span>{{ option }}</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-tooltip>

        <el-tooltip content="保存为图片">
          <el-button
            :icon="Picture"
            circle
            size="small"
            @click="handleSaveAsImage"
          />
        </el-tooltip>
      </div>
    </div>

    <VChart
      :loading="loading"
      :manual-update="true"
      ref="chart"
      autoresize
    />
  </div>
</template>

<style scoped lang="scss">
.chart-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  display: flex;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
  user-select: none;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.toolbar-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6px 0 0 6px;
  cursor: grab;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.4);
  }

  &:active {
    cursor: grabbing;
  }
}

.handle-dots {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px;

  span {
    width: 3px;
    height: 3px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 50%;
  }
}

.toolbar-content {
  display: flex;
  gap: 5px;
  padding: 4px;
}
</style>
