<script setup lang="ts">
import type { Links } from "./type"

defineProps<{
  links?: Links[]
}>()
</script>

<template>
  <div v-if="links && links.length > 0" class="nav-menu">
    <router-link
      v-for="link in links"
      :key="link.path"
      :to="link.path"
      custom
      v-slot="{ navigate, isActive, isExactActive }"
    >
      <a
        @click="navigate"
        class="nav-item"
        :class="{ active: link.exact ? isExactActive : isActive }"
      >
        {{ link.name }}
      </a>
    </router-link>
  </div>
</template>

<style scoped>
.nav-menu {
  display: flex;
  gap: 10px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.nav-item {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 21px 0;
  text-align: center;
  min-width: 80px;
  border-bottom: 2px solid transparent;
  text-decoration: none;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-item:hover {
  color: white;
}

.nav-item.active {
  color: white;
  font-weight: 600;
  border-bottom-color: white;
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }
}
</style>
