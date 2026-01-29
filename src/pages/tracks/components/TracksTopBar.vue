<script lang="ts" setup>
import type { DeviceSummary } from "@/common/apis/devices/type"
import type { ProjectSummary } from "@/common/apis/projects/type"
import dayjs from "dayjs"
import { getDeviceSummaryFromProject, getDeviceSummaryFromTenant } from "@/common/apis/device-assignment"
import { getProjectSummaryApi } from "@/common/apis/projects"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

const devices = defineModel<DeviceSummary[]>("devices", { default: () => [] })
const deviceDrawerOpen = defineModel<boolean>("deviceDrawerOpen", { default: false })

const timeRangeMode = ref<"week" | "month" | "range">("week")
const timeRange = ref<[string, string]>([
  dayjs().format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD")
])

const tenantContext = useTenantContextStore()

const selectedProject = ref<ProjectSummary | null | undefined>(undefined)
const projectList = ref<ProjectSummary[]>([])

watch(() => tenantContext.currentTenant, async (tenant) => {
  if (tenant) {
    const { data } = await getProjectSummaryApi(tenant.id)
    console.log("获取租户的项目列表成功", data)
    projectList.value = data
    if (projectList.value.length === 1) {
      selectedProject.value = projectList.value[0]
    }
  }
}, { immediate: true })

watch(() => selectedProject.value, async (project) => {
  if (project) {
    const { data } = await getDeviceSummaryFromProject(project.id)
    devices.value = data
    console.log(`获取项目 ${project.name} 下全部设备成功`, devices.value)
    deviceDrawerOpen.value = true
  } else if (project === null) {
    const { data } = await getDeviceSummaryFromTenant(tenantContext.currentTenant!.id)
    devices.value = data
    console.log("获取当前租户所有设备成功", devices.value)
    deviceDrawerOpen.value = true
  }
})
</script>

<template>
  <div class="top-bar">
    <div class="bar-group">
      <div class="title">
        设备轨迹
      </div>
      <div class="divider" />

      <select class="project-select" v-model="selectedProject">
        <option :value="undefined">
          -- 选择项目 --
        </option>
        <option v-for="p in projectList" :key="p.id" :value="p">
          {{ p.name }}
        </option>
        <option :value="null">
          -- 所有项目 --
        </option>
      </select>

      <button class="btn-text" :class="{ 'btn-primary': deviceDrawerOpen }" @click="deviceDrawerOpen = !deviceDrawerOpen">
        <el-icon><List /></el-icon> 设备列表
        <span style="opacity:0.8; margin-left: 4px;">{{ devices.length }}</span>
      </button>

      <div class="bar-group" style="gap:5px;">
        <button class="btn-text" :class="{ active: timeRangeMode === 'week' }" @click="timeRangeMode = 'week'">
          近7天
        </button>
        <button class="btn-text" :class="{ active: timeRangeMode === 'month' }" @click="timeRangeMode = 'month'">
          近30天
        </button>
        <button class="btn-text" :class="{ active: timeRangeMode === 'range' }" @click="timeRangeMode = 'range'">
          自定义
        </button>
        <el-date-picker
          v-if="timeRangeMode === 'range'"
          v-model="timeRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          :clearable="false"
          popper-class="dark-date-picker"
          style="width: 240px; background-color: rgba(0,0,0,0); border: 1px solid var(--accent, #0ea5e9); box-shadow: none;"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0));
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.bar-group {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title {
  font-weight: 600;
  font-size: 18px;
  color: var(--accent);
}

.divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
}

.project-select {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 0 6px;
  height: 32px;
  font-size: 13px;
  width: 100%;
  border-radius: var(--radius, 4px);
  box-sizing: border-box;
  outline: none;
  width: 200px;
}

.form-label {
  display: block;
  font-size: 12px;
  color: var(--text-sub, #94a3b8);
  margin-bottom: 5px;
  margin-top: 10px;
}

.btn-text {
  padding: 6px 12px;
  height: 32px;
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

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<style lang="scss">
.dark-date-picker {
  background-color: #1e293b !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;

  .el-picker-panel__body {
    background-color: #1e293b;
    color: #fff;
  }

  .el-date-range-picker__time-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .el-date-range-picker__content.is-left {
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }

  .el-date-table th {
    color: #94a3b8;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .el-date-table td.in-range .el-date-table-cell {
    background-color: rgba(14, 165, 233, 0.1);
  }

  .el-date-table td.in-range .el-date-table-cell:hover {
    background-color: rgba(14, 165, 233, 0.2);
  }

  .el-date-table td.today .el-date-table-cell__text {
    color: #0ea5e9;
    font-weight: bold;
  }

  .el-date-table td.available:hover {
    color: #0ea5e9;
  }

  .el-date-table td.current:not(.disabled) .el-date-table-cell__text {
    background-color: #0ea5e9;
    color: #fff;
  }

  .el-date-table td.start-date .el-date-table-cell__text,
  .el-date-table td.end-date .el-date-table-cell__text {
    background-color: #0ea5e9;
  }

  .el-picker-panel__icon-btn {
    color: #94a3b8;
    &:hover {
      color: #fff;
    }
  }

  .el-date-picker__header-label {
    color: #fff;
    &:hover {
      color: #0ea5e9;
    }
  }

  .el-input__wrapper {
    background-color: rgba(0, 0, 0, 0.3);
    box-shadow: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .el-input__inner {
    color: #fff;
  }
}
</style>
