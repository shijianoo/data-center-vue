<script setup lang="ts">
import type { UserTenantSelection } from "@/common/apis/tenant/type"
import { ArrowRight } from "@element-plus/icons-vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/pinia/stores/user"

const props = withDefaults(defineProps<{
  closeOnClickModal?: boolean
}>(), {
  closeOnClickModal: false
})

const visible = defineModel<boolean>("visible")

const router = useRouter()
const userStore = useUserStore()
async function handleSelect(tenant: UserTenantSelection) {
  router.replace({ path: `/console/${tenant.tenantCode}` })
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    width="500px"
    :close-on-click-modal="props.closeOnClickModal"
    :close-on-press-escape="false"
    :show-close="false"
    align-center
    append-to-body
    class="tenant-selection-dialog"
  >
    <div class="tenant-list">
      <div
        v-for="tenant in userStore.tenants"
        :key="tenant.id"
        class="tenant-item"
        :class="{ 'is-system': tenant.type === 99 }"
        @click="handleSelect(tenant)"
      >
        <div class="tenant-info">
          <div class="tenant-name-row">
            <span class="tenant-name">{{ tenant.name }}</span>
            <el-tag
              v-if="tenant.type === 99"
              size="small"
              type="danger"
              effect="light"
              class="system-tag"
            >
              系统平台
            </el-tag>
          </div>
          <div class="tenant-code">
            编码: {{ tenant.tenantCode }}
            <span class="divider" v-if="tenant.memberName">|</span>
            <span class="member-name" v-if="tenant.memberName">
              <i class="fas fa-user" /> {{ tenant.memberName }}
            </span>
            <el-tag v-if="tenant.isOwner" size="small" type="warning" effect="plain" class="role-tag">
              所有者
            </el-tag>
          </div>
        </div>
        <div class="tenant-action">
          <span class="enter-text">进入</span>
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.tenant-selection-dialog {
  :deep(.el-dialog__body) {
    padding: 20px;
  }
}

.tenant-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px; // For scrollbar space

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #e0e0e0;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}

.tenant-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

    .tenant-name {
      color: var(--el-color-primary);
    }

    .enter-text {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &.is-system {
    background: linear-gradient(to right, #fff, #fdf6f6);
    border-color: #fde2e2;

    &:hover {
      border-color: #f56c6c;
      .tenant-name {
        color: #f56c6c;
      }
      .tenant-action {
        color: #f56c6c;
      }
    }
  }
}

.tenant-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tenant-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tenant-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  transition: color 0.3s ease;
}

.system-tag {
  font-weight: normal;
  height: 20px;
  line-height: 18px;
  padding: 0 6px;
}

.tenant-code {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 8px;

  .divider {
    color: #dcdfe6;
    font-size: 10px;
  }

  .member-name {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #606266;

    i {
      font-size: 10px;
      color: #909399;
    }
  }

  .role-tag {
    height: 18px;
    line-height: 16px;
    padding: 0 4px;
    font-size: 10px;
    margin-left: 4px;
  }
}

.tenant-action {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--el-color-primary);
  transition: color 0.3s ease;
}

.enter-text {
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease;
  font-weight: 500;
}
</style>
