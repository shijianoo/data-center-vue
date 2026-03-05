<script lang="ts" setup>
import type { LoginRequestData } from "../../common/apis/auth/type"
import ThemeSwitch from "@@/components/ThemeSwitch/index.vue"
import TenantSelectionDialog from "@/common/components/TenantSelectionDialog/index.vue"
import { CacheKey } from "@/common/constants/cache-key"
import { useSettingsStore } from "@/pinia/stores/settings"
import { useUserStore } from "@/pinia/stores/user"
import { getCaptchaApi, loginApi } from "../../common/apis/auth"

const route = useRoute()
const router = useRouter()

const userStore = useUserStore()
const settingsStore = useSettingsStore()

/** 登录按钮 Loading */
const loading = ref(false)

/** 验证码图片 Base64 */
const codeBase64 = ref("")

/** 租户选择弹窗 */
const tenantSelectionVisible = ref(false)

/** 是否记住账户 */
const isRememberAccount = ref<boolean>(localStorage.getItem(CacheKey.REMEMBER_ACCOUNT_KEY) === "true")

/** 登录表单数据 */
const loginFormData: LoginRequestData = reactive({
  username: localStorage.getItem(CacheKey.SAVED_USERNAME_KEY) || "",
  password: "",
  code: "",
  codeId: ""
})

/** 登录 */
function handleLogin() {
  if (!loginFormData.username || !loginFormData.password || !loginFormData.code) {
    return
  }
  loading.value = true
  loginApi(loginFormData).then(async ({ data }) => {
    userStore.setToken(data.accessToken)
    userStore.setRefreshToken(data.refreshToken)
    await userStore.getTenantInfo()
    await userStore.getInfo()
    userStore.isInit = true
    if (userStore.tenants?.length === 1) {
      if (route.query.redirect) {
        router.push(decodeURIComponent(route.query.redirect as string))
      } else {
        console.log("租户只有一个，自动切换租户:", userStore.tenants[0].name)
        router.push(`/console/${userStore.tenants[0]!.tenantCode}`)
      }
    } else {
      tenantSelectionVisible.value = true
    }
  }).catch(() => {
    createCode()
    loginFormData.password = ""
  }).finally(() => {
    loading.value = false
  })
}

/** 创建验证码 */
function createCode() {
  // 清空已输入的验证码
  loginFormData.code = ""
  // 清空验证码 Base64
  codeBase64.value = ""
  // 获取验证码图片
  getCaptchaApi().then((res) => {
    loginFormData.codeId = res.data.id
    codeBase64.value = `data:image/png;base64,${res.data.base64}`
  })
}

function handleRememberChange() {
  if (isRememberAccount.value) {
    localStorage.setItem(CacheKey.REMEMBER_ACCOUNT_KEY, "true")
    localStorage.setItem(CacheKey.SAVED_USERNAME_KEY, loginFormData.username)
  } else {
    localStorage.removeItem(CacheKey.REMEMBER_ACCOUNT_KEY)
    localStorage.removeItem(CacheKey.SAVED_USERNAME_KEY)
  }
}

// 初始化验证码
createCode()
</script>

<template>
  <div class="login-container">
    <ThemeSwitch v-if="settingsStore.showThemeSwitch" class="theme-switch" />

    <div class="login-box">
      <h2>系统登录</h2>
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label for="username">用户名</label>
          <input type="text" id="username" name="username" v-model.trim="loginFormData.username" placeholder="请输入您的用户名" required>
        </div>

        <div class="input-group">
          <label for="password">密码</label>
          <input type="password" id="password" name="password" v-model.trim="loginFormData.password" placeholder="请输入您的密码" required minlength="0" maxlength="16">
        </div>

        <div class="input-group">
          <label for="captcha">验证码</label>
          <div class="captcha-group">
            <input type="text" id="captcha" name="captcha" v-model.trim="loginFormData.code" placeholder="输入验证码" required maxlength="7">
            <img v-if="codeBase64" :src="codeBase64" @click="createCode" alt="验证码" title="点击刷新验证码" class="captcha-img">
            <div v-else class="captcha-img-placeholder" @click="createCode">
              加载中...
            </div>
          </div>
        </div>

        <div class="input-group remember-group">
          <input type="checkbox" id="remember" v-model="isRememberAccount" @change="handleRememberChange">
          <label for="remember">记住账户</label>
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="!loading">登 录</span>
          <span v-else>验证中...</span>
        </button>
      </form>
    </div>

    <TenantSelectionDialog v-model:visible="tenantSelectionVisible" />
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  background: url("@/common/assets/images/login_back.png") center/cover no-repeat;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  box-sizing: border-box;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;

  .theme-switch {
    position: fixed;
    top: 5%;
    right: 5%;
    cursor: pointer;
    z-index: 10;
  }

  /* 登录框主体 */
  .login-box {
    background-color: #ffffff;
    width: 90%; /* 移动端适配 */
    max-width: 400px; /* PC端最大宽度 */
    padding: 40px 30px;
    border-radius: 6px; /* 微微的圆角 */
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); /* 添加轻微阴影提升立体感 */

    /* 标题样式 */
    h2 {
      text-align: center;
      color: #333333;
      margin-bottom: 30px;
      font-size: 24px;
      font-weight: 600;
      margin-top: 0;
    }

    /* 表单组布局 */
    .input-group {
      margin-bottom: 20px;

      label {
        display: block;
        margin-bottom: 8px;
        color: #555555;
        font-size: 14px;
      }

      /* 输入框通用样式 */
      input[type="text"],
      input[type="password"] {
        width: 100%;
        padding: 12px;
        border: 1px solid #cccccc;
        border-radius: 4px; /* 微微的圆角 */
        font-size: 14px;
        transition: border-color 0.3s ease;
        box-sizing: border-box;

        &:focus {
          outline: none;
          border-color: #3498db;
        }
      }

      /* 验证码特殊布局 (Flexbox) */
      .captcha-group {
        display: flex;
        gap: 10px;

        input {
          flex: 1; /* 输入框占据剩余空间 */
        }

        .captcha-img {
          height: 42px;
          width: 100px;
          border-radius: 4px;
          cursor: pointer;
          border: 1px solid #cccccc;
          object-fit: cover;
        }

        .captcha-img-placeholder {
          height: 42px;
          width: 100px;
          border-radius: 4px;
          cursor: pointer;
          border: 1px solid #cccccc;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #999;
          font-size: 12px;
          background-color: #f2f2f2;
        }
      }

      /* 记住密码布局 */
      &.remember-group {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;

        label {
          margin-bottom: 0;
          cursor: pointer;
        }

        input[type="checkbox"] {
          cursor: pointer;
          width: 16px;
          height: 16px;
        }
      }
    }

    /* 登录按钮样式 */
    .login-btn {
      width: 100%;
      padding: 12px;
      background-color: #3498db; /* 经典专业蓝 */
      color: white;
      border: none;
      border-radius: 4px; /* 微微的圆角 */
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 10px;
      transition: background-color 0.3s ease;

      &:hover:not(:disabled) {
        background-color: #2980b9; /* 鼠标悬停加深颜色 */
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }
  }
}
</style>
