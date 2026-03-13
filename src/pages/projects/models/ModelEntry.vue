<script lang="ts" setup>
import type { DeviceModelStatistics, DeviceStatisticsDto } from "@/common/apis/statistics/projects/type"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import DefaultTable from "./DefaultTable.vue"

const props = defineProps<DeviceModelStatistics>()
const router = useRouter()
const searchQuery = ref("")
const currentTable = computed(() => {
  return DefaultTable
})

const onlineCount = computed(() => {
  return props.devices.filter(d => d.isOnline).length
})

const tenantContextStore = useTenantContextStore()
function handleAction(row: DeviceStatisticsDto) {
  router.push(`${tenantContextStore.currentProjectPath}/devices/${row.deviceCode}`)
}

const isExpanded = ref(true)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="model-group" :class="{ 'is-collapsed': !isExpanded }">
    <div class="group-header" @click="toggleExpand">
      <div class="model-info">
        <div class="model-icon">
          <i class="fas fa-diagram-project" />
        </div>
        <div class="model-name">
          <h3>{{ props.displayName || props.modelName }} <span class="text-sub">({{ props.modelNumber }})</span></h3>
          <span>{{ props.description || '暂无描述' }}</span>
        </div>
      </div>
      <div class="header-right">
        <div class="group-stats">
          <div class="search-box" @click.stop>
            <el-input
              v-model="searchQuery"
              placeholder="搜索设备SN..."
              clearable
              prefix-icon="Search"
            />
          </div>
          <div class="gs-item">
            数量: <strong>{{ props.devices.length }}</strong>
          </div>
          <div class="gs-item">
            状态: <strong :class="onlineCount === props.devices.length ? 'c-success' : 'c-danger'">
              {{ onlineCount }} / {{ props.devices.length }} 在线
            </strong>
          </div>
        </div>
        <div class="toggle-icon">
          <i class="fas fa-chevron-down" :class="{ 'is-expanded': isExpanded }" />
        </div>
      </div>
    </div>

    <el-collapse-transition>
      <div v-show="isExpanded" class="group-body">
        <component v-if="currentTable" :is="currentTable" :devices="props.devices" :search-query="searchQuery" @action="handleAction" />
        <div v-else class="not-adapted">
          <i class="fas fa-tools" /> 该设备型号暂未完成页面适配
        </div>
      </div>
    </el-collapse-transition>

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
    cursor: pointer;
    transition:
      background-color 0.2s,
      border-bottom-color 0.3s;
    user-select: none;

    &:hover {
      background: #f8fafc;
    }

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
    .header-right {
      display: flex;
      align-items: center;
      gap: 24px;

      .group-stats {
        display: flex;
        align-items: center;
        gap: 20px;
        font-size: 13px;
        color: var(--text-sub);

        .search-box {
          width: 200px;
        }

        .gs-item strong {
          color: var(--text-main);
          font-weight: 600;
        }
      }

      .toggle-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--bg-body, #f1f5f9);
        color: var(--text-sub);
        transition: all 0.3s;

        i {
          transition: transform 0.3s;
          &.is-expanded {
            transform: rotate(-180deg);
          }
        }

        &:hover {
          background: #e2e8f0;
          color: var(--primary);
        }
      }
    }
  }

  &.is-collapsed {
    .group-header {
      border-bottom-color: transparent;
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

@media (max-width: 768px) {
  .model-group .group-header {
    flex-direction: column;
    height: auto;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    position: relative;

    .header-right {
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;

      .group-stats {
        width: 100%;
        flex-wrap: wrap;
        justify-content: flex-start;
        gap: 12px;

        .search-box {
          width: 100%;
          max-width: 100%;
        }
      }

      .toggle-icon {
        position: absolute;
        top: 16px;
        right: 16px;
      }
    }
  }
}
</style>
