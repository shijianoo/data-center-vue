<script lang="ts" setup>
import { useRouter } from "vue-router"
import TenantBreadcrumb from "@/layouts/components/TenantHeader/TenantBreadcrumb.vue"

const router = useRouter()
</script>

<template>
  <div class="project-not-found-page">
    <div class="page-container">
      <TenantBreadcrumb />
      <div class="content-wrapper">
        <div class="info-card">
          <div class="warning-header">
            <i class="fas fa-exclamation-circle error-icon" />
            <h2>找不到对应的项目</h2>
            <p>请检查项目编码是否正确，或联系管理员</p>
          </div>
          <div class="actions">
            <button class="btn-normal" @click="router.back()">
              返回上一页
            </button>
            <button class="btn-primary" @click="router.push('/')">
              返回首页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.project-not-found-page {
  min-height: 100vh;
  background: var(--bg-body);
}

.page-container {
  max-width: 1280px;
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

  .actions {
    display: flex;
    justify-content: center;
    gap: 12px;
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

  .btn-primary {
    padding: 8px 20px;
    border-radius: 6px;
    border: 1px solid var(--primary);
    background: var(--primary);
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      opacity: 0.9;
    }
  }
}

@media (max-width: 600px) {
  .project-not-found-page {
    padding: 15px;
  }
  .info-card {
    padding: 24px;
  }
}
</style>
