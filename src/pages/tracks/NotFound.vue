<script lang="ts" setup>
import { ArrowLeft, House, Warning } from "@element-plus/icons-vue"
import { useRouter } from "vue-router"

const router = useRouter()
const goBack = () => router.back()
const goHome = () => router.push("/")
</script>

<template>
  <div class="not-found-container">
    <div class="glass-panel content-box">
      <el-icon class="icon">
        <Warning />
      </el-icon>
      <h2 class="title">
        未找到租户信息
      </h2>
      <p class="desc">
        当前未选择租户或租户不存在，无法查看设备轨迹。
      </p>
      <div class="actions">
        <button class="btn btn-outline" @click="goBack">
          <el-icon><ArrowLeft /></el-icon> 返回上一页
        </button>
        <button class="btn btn-primary" @click="goHome">
          <el-icon><House /></el-icon> 返回首页
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-found-container {
  --bg-glass: rgba(15, 23, 42, 0.85);
  --border-glass: 1px solid rgba(255, 255, 255, 0.1);
  --accent: #0ea5e9;
  --text-main: #f8fafc;
  --text-sub: #94a3b8;
  --radius: 4px;

  position: relative;
  width: 100%;
  height: calc(100vh - var(--header-h, 60px));
  background: #0f172a; /* Dark background matching the map container color */
  color: var(--text-main);
  font-family: "Segoe UI", sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.glass-panel {
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.content-box {
  padding: 40px 60px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
}

.icon {
  font-size: 64px;
  color: var(--accent);
  margin-bottom: 20px;
  opacity: 0.8;
}

.title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 10px;
  color: var(--text-main);
  letter-spacing: 1px;
}

.desc {
  font-size: 14px;
  color: var(--text-sub);
  line-height: 1.6;
  margin: 0;
}

.actions {
  margin-top: 30px;
  display: flex;
  gap: 15px;
}

.btn {
  padding: 8px 20px;
  border-radius: var(--radius);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
  outline: none;
}

.btn-outline {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--text-main);
}
.btn-outline:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-primary {
  background: var(--accent);
  color: #000;
  font-weight: 600;
}
.btn-primary:hover {
  background: var(--accent-hover);
}
</style>
