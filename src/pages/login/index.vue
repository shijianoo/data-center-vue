<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { LoginRequestData } from "../../common/apis/auth/type"
import ThemeSwitch from "@@/components/ThemeSwitch/index.vue"
import { Key, Loading, Lock, Picture, User } from "@element-plus/icons-vue"
import { useSettingsStore } from "@/pinia/stores/settings"
import { useUserStore } from "@/pinia/stores/user"
import { getCaptchaApi, loginApi } from "../../common/apis/auth"

const router = useRouter()

const userStore = useUserStore()

const settingsStore = useSettingsStore()

/** 登录表单元素的引用 */
const loginFormRef = useTemplateRef("loginFormRef")

/** 登录按钮 Loading */
const loading = ref(false)

/** 验证码图片 Base64 */
const codeBase64 = ref("")

/** 登录表单数据 */
const loginFormData: LoginRequestData = reactive({
  username: "admin",
  password: "sstd_admin.123!",
  code: "",
  codeId: ""
})

/** 登录表单校验规则 */
const loginFormRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" }
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 16, message: "长度在 8 到 16 个字符", trigger: "blur" }
  ],
  code: [
    { required: true, message: "请输入验证码", trigger: "blur" }
  ]
}

/** 登录 */
function handleLogin() {
  loginFormRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    loginApi(loginFormData).then(({ data }) => {
      userStore.setToken(data.accessToken)
      userStore.setRefreshToken(data.refreshToken)
      router.push("/")
    }).catch(() => {
      createCode()
      loginFormData.password = ""
    }).finally(() => {
      loading.value = false
    })
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

// 初始化验证码
createCode()
</script>

<template>
  <div class="login-container">
    <ThemeSwitch v-if="settingsStore.showThemeSwitch" class="theme-switch" />

    <div class="login-box">
      <div class="login-left">
        <div class="image-container">
          <img src="@@/assets/images/layouts/login-bg.jpeg" alt="地球数据监测" class="ocean-image">
        </div>
      </div>
      <div class="login-right">
        <div class="form-header">
          <h1 class="system-title">
            浅海科技-海洋数据中心
          </h1>
          <p class="system-slogan">
            专业的海洋数据采集与分析平台
          </p>
          <h2 class="welcome-text">
            欢迎登录
          </h2>
        </div>
        <el-form ref="loginFormRef" :model="loginFormData" :rules="loginFormRules" @keyup.enter="handleLogin" class="login-form">
          <el-form-item prop="username">
            <el-input
              v-model.trim="loginFormData.username"
              placeholder="请输入用户名"
              type="text"
              tabindex="1"
              :prefix-icon="User"
              size="default"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model.trim="loginFormData.password"
              placeholder="请输入密码"
              type="password"
              tabindex="2"
              :prefix-icon="Lock"
              size="default"
              show-password
            />
          </el-form-item>
          <el-form-item prop="code">
            <el-input
              v-model.trim="loginFormData.code"
              placeholder="请输入验证码"
              type="text"
              tabindex="3"
              :prefix-icon="Key"
              maxlength="7"
              size="default"
            >
              <template #append>
                <el-image :src="codeBase64" draggable="false" @click="createCode" title="点击刷新验证码">
                  <template #placeholder>
                    <el-icon>
                      <Picture />
                    </el-icon>
                  </template>
                  <template #error>
                    <el-icon>
                      <Loading />
                    </el-icon>
                  </template>
                </el-image>
              </template>
            </el-input>
          </el-form-item>
          <el-button :loading="loading" type="primary" size="default" @click.prevent="handleLogin" class="login-button">
            <span v-if="!loading">登 录</span>
            <span v-else>验证中...</span>
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a4f7a 0%, #2d8fd5 100%);
  position: relative;
  padding: 20px;
  overflow: hidden;

  .theme-switch {
    position: fixed;
    top: 5%;
    right: 5%;
    cursor: pointer;
    z-index: 10;
  }

  .login-box {
    display: flex;
    width: 900px;
    max-width: 100%;
    min-height: 500px;
    background-color: var(--el-bg-color);
    border-radius: 0;
    overflow: hidden;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    z-index: 1;
    animation: fadeIn 0.8s ease-out;
  }

  .login-left {
    flex: 1;
    position: relative;
    overflow: hidden;

    .image-container {
      position: absolute;
      width: 100%;
      height: 100%;

      .ocean-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 0;
        box-shadow: none;
      }
    }
  }

  .login-right {
    width: 400px;
    padding: 40px;
    display: flex;
    flex-direction: column;

    .form-header {
      text-align: center;
      margin-bottom: 25px;

      .system-title {
        font-size: 1.7rem;
        font-weight: 700;
        margin-bottom: 5px;
        color: var(--el-color-primary);
      }

      .system-slogan {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 20px;
      }

      .welcome-text {
        font-size: 1.5rem;
        color: var(--el-color-primary-light-3);
        margin: 0;
        font-weight: 600;
      }
    }

    .login-form {
      flex: 1;

      :deep(.el-input) {
        margin-bottom: 15px;

        .el-input__wrapper {
          border-radius: 0px;
          height: 42px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid var(--el-color-primary-light-2);

          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }

          &.is-focus {
            box-shadow: 0 4px 12px rgba(45, 143, 213, 0.2);
            border: 1px solid var(--el-color-primary-light-5);
          }
        }

        .el-input__icon {
          color: var(--el-color-primary);
          font-size: 18px;
        }
      }

      :deep(.el-input-group__append) {
        padding: 0;

        .el-image {
          width: 100px;
          height: 42px;
          cursor: pointer;

          &:hover {
            opacity: 0.8;
          }

          &:active {
            transform: scale(0.98);
          }
        }
      }

      :deep(.el-form-item) {
        margin-bottom: 22px;

        &.is-error {
          animation: shake 0.5s;
        }
      }

      .el-button {
        width: 100%;
        margin-top: 15px;
        border-radius: 0px;
        height: 44px;
        font-size: 16px;
        font-weight: 600;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(45, 143, 213, 0.4);
        }
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 992px) {
  .login-container {
    .login-box {
      flex-direction: column;
      width: 450px;
      max-width: 100%;
    }

    .login-left {
      display: none;
    }

    .login-right {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 15px;

    .login-box {
      width: 100%;
      border-radius: 0;
    }

    .login-right {
      padding: 25px 20px;

      .form-header {
        margin-bottom: 20px;

        .system-title {
          font-size: 1.4rem;
        }

        .system-slogan {
          font-size: 0.8rem;
          margin-bottom: 15px;
        }

        .welcome-text {
          font-size: 1.2rem;
        }
      }
    }
  }
}
</style>
