<script lang="ts" setup>
import type { Device } from "@/common/apis/devices/type"
import { formatHybridAgo } from "@/common/utils/datetime"
import TenantBreadcrumb from "@/layouts/components/TenantHeader/TenantBreadcrumb.vue"

const { device } = defineProps<{
  device?: Device
}>()
</script>

<template>
  <div class="device-not-found-page">
    <div class="page-container">
      <TenantBreadcrumb />

      <div class="content-wrapper">
        <div v-if="device" class="info-card">
          <div class="warning-header">
            <i class="fas fa-tools warning-icon" />
            <h2>该设备型号暂未完成页面适配</h2>
            <p>您可以查看以下基础设备信息</p>
          </div>

          <div class="device-details">
            <div class="detail-item">
              <span class="label">设备名称</span>
              <span class="value">{{ device.displayName || device.deviceName || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">序列号 (SN)</span>
              <span class="value mono">{{ device.serialNumber }}</span>
            </div>
            <div class="detail-item">
              <span class="label">设备型号</span>
              <span class="value">{{ device.modelName || device.modelNumber || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">在线状态</span>
              <span class="value">
                <span class="status-tag" :class="device.isOnline ? 'online' : 'offline'">
                  {{ device.isOnline ? '在线' : '离线' }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="label">最后上报</span>
              <span class="value">{{ device.lastUploadTime ? formatHybridAgo(device.lastUploadTime) : '-' }}</span>
            </div>
          </div>
        </div>

        <div v-else class="info-card">
          <div class="warning-header">
            <i class="fas fa-exclamation-circle error-icon" />
            <h2>找不到该设备</h2>
            <p>请检查设备编号是否正确，或联系管理员</p>
          </div>
          <div class="actions">
            <button class="btn-normal" @click="$router.back()">
              返回上一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.device-not-found-page {
  min-height: 100vh;
  background: var(--bg-body);
}

.page-container {
  max-width: 1280px;
  padding: 20px;
  margin: 0 auto;
  width: 100%;
}

.content-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 150px);
}

.info-card {
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 500px;

  .warning-header {
    text-align: center;
    margin-bottom: 32px;
    i {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.8;
      &.warning-icon {
        color: var(--warning);
      }
      &.error-icon {
        color: var(--danger);
      }
    }
    h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-main);
    }
    p {
      margin: 0;
      font-size: 14px;
      color: var(--text-sub);
    }
  }

  .device-details {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      &:last-child {
        border-bottom: none;
      }

      .label {
        font-size: 13px;
        color: var(--text-sub);
      }
      .value {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-main);
      }
    }
  }

  .status-tag {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
    &.online {
      background: var(--success-bg);
      color: var(--success);
      border: 1px solid var(--success);
    }
    &.offline {
      background: var(--danger-bg);
      color: var(--danger);
      border: 1px solid var(--danger);
    }
  }

  .actions {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }

  .btn-normal {
    padding: 8px 20px;
    border-radius: 6px;
    border: 1px solid var(--primary);
    background: transparent;
    color: var(--primary);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background: var(--primary);
      color: white;
    }
  }
}

@media (max-width: 600px) {
  .page-container {
    padding: 10px;
  }
  .info-card {
    padding: 24px;
  }
}
</style>
