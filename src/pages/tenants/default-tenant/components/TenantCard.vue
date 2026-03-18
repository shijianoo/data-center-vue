<script lang="ts" setup>
import type { Tenant } from "@/common/apis/tenant/type"
import { formatDateTime } from "@/common/utils/datetime"

const { tenant } = defineProps<{
  tenant?: Tenant
}>()

const tenantName = computed(() => {
  return tenant?.name || "-"
})

const desc = computed(() => {
  return tenant?.description
})

const contact = computed(() => {
  return tenant?.contactName
})
const expireTime = computed(() => {
  return tenant?.expireTime
})
</script>

<template>
  <div class="tenant-card">
    <div class="tenant-title">
      <div class="tenant-name">
        {{ tenantName }}
      </div>
    </div>

    <div class="tenant-description" v-if="desc">
      {{ desc }}
    </div>

    <div class="tenant-meta">
      <span class="meta-item" v-if="contact">
        <i class="far fa-user" /> 联系人: <strong>{{ contact }}</strong>
      </span>
      <span class="meta-item" v-if="expireTime">
        <i class="far fa-calendar-alt" /> 服务有效期: <strong>{{ formatDateTime(expireTime, "YYYY-MM-DD") }}</strong>
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tenant-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: white;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 30px;

  .tenant-title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;

    .tenant-name {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-main);
    }
  }

  .tenant-description {
    font-size: 14px;
    color: var(--text-sub);
    line-height: 1.5;
  }

  .tenant-meta {
    display: flex;
    flex-wrap: wrap;
    column-gap: 24px;
    row-gap: 10px;
    font-size: 13px;
    color: var(--text-sub);

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      i {
        color: #94a3b8;
      }
    }
  }
}

@media (max-width: 900px) {
  .tenant-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    .tenant-meta {
      flex-direction: column;
      gap: 10px;
    }
  }
}
</style>
