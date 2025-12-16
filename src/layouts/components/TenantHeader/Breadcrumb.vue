<script setup lang="ts">
import { useRouter } from "vue-router"
import { useTenantBreadcrumbsStore } from "@/pinia/stores/useTenantBreadcrumbs"

const router = useRouter()
const breadcrumbStore = useTenantBreadcrumbsStore()
const { items } = storeToRefs(breadcrumbStore)

function handleClick(item: any) {
  if (item.onClick) {
    item.onClick()
  } else if (item.path) {
    router.push(item.path)
  }
}
</script>

<template>
  <div v-if="items && items.length > 1" class="breadcrumb">
    <template v-for="(item, index) in items" :key="index">
      <span
        class="bc-item"
        :class="{ 'bc-link': item.path || item.onClick, 'bc-current': index === items.length - 1 }"
        @click="handleClick(item)"
      >
        {{ item.name }}
      </span>
      <i v-if="index < items.length - 1" class="fas fa-chevron-right bc-sep" />
    </template>
  </div>
</template>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-sub);
}

.bc-item {
  display: flex;
  align-items: center;
}

.bc-link {
  cursor: pointer;
  transition: color 0.1s;
}

.bc-link:hover {
  color: var(--primary);
}

.bc-current {
  color: var(--text-main);
  font-weight: 600;
}

.bc-sep {
  color: #cbd5e1;
  font-size: 10px;
}
</style>
