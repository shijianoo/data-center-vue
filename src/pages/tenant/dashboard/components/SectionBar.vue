<script lang="ts" setup>
import { ref, watch } from "vue"

withDefaults(defineProps<{
  title: string
  count?: number | string
  placeholder?: string
}>(), {
  placeholder: "按名称或 ID 搜索..."
})

const emit = defineEmits<{
  (e: "search", value: string): void
}>()

const searchText = ref("")

watch(searchText, (val) => {
  emit("search", val)
})
</script>

<template>
  <div class="section-bar">
    <div class="section-title">
      {{ title }} <span v-if="count !== undefined" class="count-badge">{{ count }}</span>
    </div>
    <div class="toolbar-right">
      <div class="search-box">
        <i class="fas fa-search" />
        <input v-model="searchText" type="text" :placeholder="placeholder">
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.section-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 15px 20px;
  border-radius: 8px;
  border: 1px solid var(--border);

  .section-title {
    font-size: 16px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;

    .count-badge {
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      color: var(--text-sub);
    }
  }

  .toolbar-right {
    display: flex;
    gap: 12px;
    align-items: center;
    .search-box {
      position: relative;
      input {
        padding: 8px 12px 8px 34px;
        border: 1px solid var(--border);
        border-radius: 6px;
        font-size: 13px;
        width: 240px;
        outline: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:focus {
          border-color: var(--primary);
          width: 320px;
        }
      }
      i {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-sub);
        font-size: 13px;
      }
    }
  }
}

// Mobile
@media (max-width: 900px) {
  .section-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
    .toolbar-right {
      justify-content: space-between;
      flex-wrap: wrap;
      .search-box {
        width: 100%;
        input {
          width: 100%;
          &:focus {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
