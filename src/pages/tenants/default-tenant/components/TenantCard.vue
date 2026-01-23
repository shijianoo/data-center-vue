<script lang="ts" setup>
import type { Tenant } from "@/common/apis/tenant/type"

const { tenant } = defineProps<{
  tenant?: Tenant
}>()

const tenantName = computed(() => {
  return tenant?.name || "无"
})

const desc = computed(() => {
  return tenant?.description || "无"
})
const accountId = computed(() => {
  return tenant?.tenantCode || "无"
})
const contact = computed(() => {
  return tenant?.contactName || "无"
})
const expireTime = computed(() => {
  return tenant?.expireTime || "无"
})
</script>

<template>
  <div class="tenant-card">
    <div class="tc-left">
      <div class="tc-header">
        <div class="tc-title-row">
          <div class="tc-name">
            {{ tenantName }}
          </div>
        </div>
        <div class="tc-desc">
          {{ desc }}
        </div>

        <div class="tc-info-grid">
          <div class="info-block">
            <label>Account ID</label>
            <div><i class="far fa-id-card" /> {{ accountId }}</div>
          </div>
          <div class="info-block">
            <label>主要联系人</label>
            <div><i class="far fa-user" /> {{ contact }}</div>
          </div>
          <div class="info-block">
            <label>服务有效期</label>
            <div><i class="far fa-calendar-alt" /> {{ expireTime }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="tc-right" v-if="false">
      <div class="btn btn-primary">
        编辑
      </div>
      <div class="btn btn-primary">
        编辑
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tenant-card {
  display: flex;
  justify-content: space-between;
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 30px;

  .tc-left {
    flex: 1;

    .tc-title-row {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 10px;
      .tc-name {
        font-size: 24px;
        font-weight: 800;
      }
    }
    .tc-desc {
      color: var(--text-sub);
      font-size: 14px;
      max-width: 600px;
      line-height: 1.5;
    }

    .tc-info-grid {
      display: flex;
      gap: 40px;
      margin-top: 20px;
      border-top: 1px solid var(--border);
      padding-top: 20px;
      .info-block {
        label {
          display: block;
          font-size: 12px;
          color: var(--text-sub);
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        div {
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          i {
            color: var(--text-sub);
          }
        }
      }
    }
  }

  .tc-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--border);
      background: white;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
      &:hover {
        border-color: var(--accent);
        color: var(--accent);
      }
      &.btn-primary {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
        &:hover {
          background: #1e293b;
          color: white;
        }
      }
    }
  }
}

// Mobile
@media (max-width: 900px) {
  .tenant-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    .tc-info-grid {
      flex-direction: column;
      gap: 15px;
      width: 100%;
    }
    .tc-right {
      width: 100%;
      flex-direction: row;
      .btn {
        flex: 1;
        justify-content: center;
      }
    }
  }
}
</style>
