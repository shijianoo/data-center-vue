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
      {{ (userStore.user?.realName || userStore.user?.nickName || userStore.user?.userName || 'U')[0].toUpperCase() }}
    </div>
    <i class="fas fa-chevron-down" />

    <transition name="fade">
      <div v-show="showUserMenu" class="dropdown-menu">
        <div class="menu-header">
          <div class="header-avatar">
            {{ (userStore.user?.realName || userStore.user?.nickName || userStore.user?.userName || 'U')[0].toUpperCase() }}
          </div>
          <div class="header-info">
            <div class="name-row">
              <span class="header-name" :title="userStore.user?.realName || userStore.user?.nickName || userStore.user?.userName">
                {{ userStore.user?.realName || userStore.user?.nickName || userStore.user?.userName }}
              </span>
              <span v-if="userStore.isPlatformAdmin" class="tag-badge tag-admin" title="平台管理员"><i class="fas fa-shield-alt" /></span>
              <span v-else-if="userStore.isPlatformOps" class="tag-badge tag-ops" title="平台运维"><i class="fas fa-tools" /></span>
            </div>
            <div class="header-email" v-if="userStore.user?.email || userStore.user?.userName" :title="userStore.user?.email || userStore.user?.userName">
              {{ userStore.user?.email || userStore.user?.userName }}
            </div>
            <div class="tenant-row">
              <span class="header-tenant" v-if="userStore.activeTenant?.name" :title="userStore.activeTenant?.name">
                <i class="fas fa-building" /> {{ userStore.activeTenant?.name }}
              </span>
              <span class="header-role">
                <i class="fas fa-id-badge" /> {{ userStore.memberProfile?.memberName || '成员' }}
              </span>
            </div>
          </div>
        </div>
        <div class="dd-divider" />
        <div class="dd-item" @click="openProfile">
          <i class="fas fa-user-cog" /> 个人设置
        </div>
        <div class="dd-item" v-if="userStore.isPlatformAdmin || userStore.isPlatformOps" @click="handleInternal">
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
  padding: 12px 10px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  margin-bottom: 4px;
}

.header-avatar {
  width: 40px;
  height: 40px;
  background: #3b82f6;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
  flex-shrink: 0;
}

.header-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  overflow: hidden;
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.tag-badge {
  font-size: 10px;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tag-admin {
  background: #fef2f2;
  color: #dc2626;
}

.tag-ops {
  background: #fdf4ff;
  color: #c026d3;
}

.header-email {
  font-size: 12px;
  color: var(--text-sub);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  margin-bottom: 2px;
}

.tenant-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.header-tenant,
.header-role {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-tenant {
  background: #f1f5f9;
  color: #475569;
}

.header-role {
  background: #e0f2fe;
  color: #0284c7;
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
