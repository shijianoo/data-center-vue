<script setup lang="ts">
import { computed } from "vue"

interface Props {
  label: string
  value: string | number
  unit?: string
  trend?: string
  status?: "success" | "warning" | "danger" | "normal"
}

const props = withDefaults(defineProps<Props>(), {
  status: "normal"
})

const statusClass = computed(() => {
  switch (props.status) {
    case "success":
      return "c-success"
    case "warning":
      return "c-warn"
    case "danger":
      return "c-danger"
    default:
      return ""
  }
})

const trendClass = computed(() => {
  switch (props.status) {
    case "success":
      return "c-success"
    case "warning":
      return "c-warn"
    case "danger":
      return "c-danger"
    default:
      return "text-sub"
  }
})

const cardStyle = computed(() => {
  switch (props.status) {
    case "warning":
      return { borderLeft: "4px solid var(--el-color-warning)" }
    case "danger":
      return { borderLeft: "4px solid var(--el-color-danger)" }
    default:
      return {}
  }
})
</script>

<template>
  <div class="stat-card" :style="cardStyle">
    <div class="stat-label" :class="statusClass">
      {{ label }}
    </div>
    <div class="stat-value" :class="statusClass">
      {{ value }}
      <span v-if="unit" class="unit">{{ unit }}</span>
    </div>
    <div v-if="trend" class="stat-trend" :class="trendClass">
      <slot name="icon" />
      {{ trend }}
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background: var(--el-bg-color);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: flex-end;
  gap: 8px;
  line-height: 1;
}

.unit {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
  margin-bottom: 5px;
}

.stat-trend {
  font-size: 12px;
  font-weight: 500;
  padding-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.c-danger {
  color: var(--el-color-danger);
}

.c-warn {
  color: var(--el-color-warning);
}

.c-success {
  color: var(--el-color-success);
}

.text-sub {
  color: var(--el-text-color-secondary);
}
</style>
