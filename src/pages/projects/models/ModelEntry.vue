<script lang="ts" setup>
import type { DeviceModelStatistics, DeviceStatisticsDto } from "@/common/apis/statistics/projects/type"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import SOB23BSTable from "./SOB23BSTable.vue"

const props = defineProps<DeviceModelStatistics>()
const modelMap: Record<string, any> = {
  SOB23BS: SOB23BSTable
}
const router = useRouter()
const currentTable = computed(() => {
  return modelMap[props.modelNumber]
})

const onlineCount = computed(() => {
  return props.devices.filter(d => d.isOnline).length
})

const tenantContextStore = useTenantContextStore()
function handleAction(row: DeviceStatisticsDto) {
  router.push(`${tenantContextStore.currentProjectPath}/devices/${row.deviceCode}`)
}
</script>

<template>
  <div class="model-group">
    <div class="group-header">
      <div class="model-info">
        <div class="model-icon">
          <i class="fas fa-microchip" />
        </div>
        <div class="model-name">
          <h3>{{ props.displayName || props.modelName }} <span class="text-sub">({{ props.modelNumber }})</span></h3>
          <span>{{ props.description || '暂无描述' }}</span>
        </div>
      </div>
      <div class="group-stats">
        <div class="gs-item">
          数量: <strong>{{ props.devices.length }}</strong>
        </div>
        <div class="gs-item">
          状态: <strong :class="onlineCount === props.devices.length ? 'c-success' : 'c-danger'">
            {{ onlineCount }} / {{ props.devices.length }} 在线
          </strong>
        </div>
      </div>
    </div>

    <component v-if="currentTable" :is="currentTable" :devices="props.devices" @action="handleAction" />
    <div v-else class="not-adapted">
      <i class="fas fa-tools" /> 该设备型号暂未完成页面适配
    </div>

    <!-- <div v-if="props.devices.length > 0" class="group-footer-btn" @click="showAllDevices">
      查看全部 {{ props.devices.length }} 台设备 <i class="fas fa-chevron-down" />
    </div> -->
  </div>
</template>

<style lang="scss" scoped>
.model-group {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;

  .group-header {
    padding: 20px 24px;
    background: #fcfcfc;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    height: 80px;
    align-items: center;
    .model-info {
      display: flex;
      align-items: center;
      gap: 12px;
      .model-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: white;
        border: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: var(--primary);
      }
      .model-name {
        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }
        span {
          font-size: 12px;
          color: var(--text-sub);
        }
      }
    }
    .group-stats {
      display: flex;
      gap: 20px;
      font-size: 13px;
      color: var(--text-sub);
      .gs-item strong {
        color: var(--text-main);
        font-weight: 600;
      }
    }
  }

  .not-adapted {
    padding: 15px;
    text-align: center;
    color: var(--text-sub);
    font-size: 14px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    i {
      font-size: 18px;
      opacity: 0.5;
    }
  }

  .group-footer-btn {
    text-align: center;
    padding: 10px;
    font-size: 13px;
    color: var(--text-sub);
    border-top: 1px solid var(--border);
    cursor: pointer;
    background: #fcfcfc;
    &:hover {
      color: var(--primary);
    }
  }
}

.text-sub {
  color: var(--text-sub);
}

.c-success {
  color: var(--success);
}

.c-danger {
  color: var(--danger);
}

@media (max-width: 900px) {
  .model-group {
    margin-bottom: 10px;
  }
}
</style>
