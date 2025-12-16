<script setup lang="ts">
defineProps<{
  alwaysShowBrand?: boolean
}>()
</script>

<template>
  <div class="tenant-logo" :class="{ 'always-show-brand': alwaysShowBrand }">
    <div class="logo-box">
      <i class="fas fa-layer-group" />
    </div>
    <div class="brand">
      数据中心
    </div>
  </div>
</template>

<style scoped>
.tenant-logo {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo-box {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.brand {
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.5px;
  color: white;
}

@media (max-width: 900px) {
  .tenant-logo:not(.always-show-brand) .brand {
    display: none;
  } /* 平板隐藏 Logo 文字 */
}
</style>
