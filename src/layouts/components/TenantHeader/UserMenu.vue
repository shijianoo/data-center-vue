<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue"
import { useRouter } from "vue-router"
import TenantSelectionDialog from "@/common/components/TenantSelectionDialog/index.vue"
import { useUserStore } from "@/pinia/stores/user"
import UserProfileDialog from "./UserProfileDialog.vue"

const userStore = useUserStore()
const router = useRouter()
const showUserMenu = ref(false)
const showProfileDialog = ref(false)
const tenantSelectionDialog = ref(false)

// 切换菜单显示
function toggleMenu() {
  showUserMenu.value = !showUserMenu.value
}

// 点击空白处关闭菜单
function closeMenu() {
  showUserMenu.value = false
}

function openProfile() {
  showProfileDialog.value = true
  showUserMenu.value = false
}

// 退出登录逻辑
function handleLogout() {
  userStore.logout()
  router.push("/login")
}

// 进入后台管理
function handleInternal() {
  router.push("/admin")
}

// 注册全局点击事件以关闭下拉菜单
onMounted(async () => {
  document.addEventListener("click", closeMenu)
})

onUnmounted(() => {
  document.removeEventListener("click", closeMenu)
})
</script>

<template>
  <div class="user-trigger" @click.stop="toggleMenu" :class="{ active: showUserMenu }">
    <div class="user-info">
      <div class="user-name">
        {{ userStore.user?.realName || userStore.user?.nickName || userStore.user?.userName }}
      </div>
      <div class="user-sub-info">
        {{ userStore.memberProfile?.memberName ?? '成员' }}
      </div>
    </div>

    <div class="avatar">
      O
    </div>
    <i class="fas fa-chevron-down" />

    <transition name="fade">
      <div v-show="showUserMenu" class="dropdown-menu">
        <div class="menu-header">
          <h4>当前身份: {{ userStore.memberProfile?.memberName || userStore.user?.realName || userStore.user?.nickName }}</h4>
          <p>{{ userStore.user?.email || userStore.user?.userName }}</p>
        </div>
        <div class="dd-divider" />
        <div class="dd-item" @click="openProfile">
          <i class="fas fa-user-cog" /> 个人设置
        </div>
        <div class="dd-item" v-if="userStore.isPlatformAdmin" @click="handleInternal">
          <i class="fas fa-user-cog" /> 进入后台管理
        </div>
        <div class="dd-divider" v-if="userStore.tenants.length > 1" />
        <div class="dd-item" v-if="userStore.tenants.length > 1" @click="tenantSelectionDialog = true">
          <i class="fas fa-user-friends" /> 切换组织
        </div>
        <div class="dd-divider" />
        <div class="dd-item text-danger" @click="handleLogout">
          <i class="fas fa-sign-out-alt" /> 退出登录
        </div>
      </div>
    </transition>
    <TenantSelectionDialog :close-on-click-modal="true" v-model:visible="tenantSelectionDialog" />
    <UserProfileDialog v-model:visible="showProfileDialog" />
  </div>
</template>

<style scoped>
.user-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;

  i {
    font-size: 12px;
    color: var(--text-sub);
  }
}
.user-trigger:hover,
.user-trigger.active {
  background: rgba(255, 255, 255, 0.1);
}

.user-info {
  text-align: right;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 4px;

  .user-name {
    display: block;
    font-size: 13px;
    font-weight: 600;
    text-align: right;
  }
  .user-sub-info {
    display: block;
    font-size: 11px;
    color: #94a3b8;
    padding: 0 2px;
    border-radius: 4px;
    width: fit-content;
    margin-left: auto;
  }
}

.avatar {
  width: 32px;
  height: 32px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  border: 2px solid #1e293b;
  flex-shrink: 0;
}

.dropdown-menu {
  position: absolute;
  top: 60px;
  right: 20px;
  width: 240px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  padding: 6px;
  color: var(--text-main);
  transform-origin: top right;
  z-index: 1003;
}

.menu-header {
  padding: 10px;

  h4 {
    margin: 0;
    font-size: 14px;
  }

  p {
    margin: 3px 0 0 0;
    font-size: 12px;
    color: var(--text-sub);
  }
}

.dd-item {
  padding: 10px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-main);
}
.dd-item:hover {
  background: #f1f5f9;
  color: var(--primary);
}
.dd-item i {
  width: 16px;
  text-align: center;
}
.dd-divider {
  height: 1px;
  background: var(--border);
  margin: 6px 0;
}
.text-danger {
  color: var(--danger);
}
.text-danger:hover {
  background: #fef2f2;
  color: var(--danger);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

@media (max-width: 600px) {
  .user-info {
    display: none;
  }

  .user-trigger i {
    display: none;
  }
}
</style>
