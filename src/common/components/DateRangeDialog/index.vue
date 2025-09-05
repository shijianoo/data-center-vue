<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import zhCn from "element-plus/es/locale/lang/zh-cn" // Element Plus 中文包
import { onMounted, ref } from "vue"

const props = withDefaults(defineProps<Props>(), {
  maxDays: 60,
  useUtc: false
})
dayjs.extend(utc)
dayjs.extend(timezone)

export interface DateRange {
  startDate: string
  endDate: string
}

interface Props {
  maxDays?: number
  useUtc?: boolean
  onResolve?: (result: DateRange | null) => void
  onReject?: (error?: any) => void
}

const visible = ref(false)
const formRef = ref<FormInstance>()
const pendingResult = ref<DateRange | null>(null)

const form = ref({
  startDate: new Date(),
  endDate: new Date()
})

const rules: FormRules = {
  startDate: [
    { required: true, message: "请选择开始日期", trigger: "change" }
  ],
  endDate: [
    { required: true, message: "请选择结束日期", trigger: "change" }
  ]
}

// 组件挂载后自动显示弹窗
onMounted(() => {
  visible.value = true
})

// 禁用开始日期
function disabledStartDate(time: Date) {
  if (form.value.endDate) {
    return time.getTime() >= form.value.endDate.getTime()
  }
  return false
}

// 禁用结束日期
function disabledEndDate(time: Date) {
  if (form.value.startDate) {
    const startTime = form.value.startDate.getTime()
    const currentTime = time.getTime()

    // 结束日期不能早于或等于开始日期
    if (currentTime <= startTime) {
      return true
    }

    // 如果设置了最大天数限制
    if (props.maxDays) {
      const maxTime = startTime + (props.maxDays - 1) * 24 * 60 * 60 * 1000
      return currentTime > maxTime
    }
  }
  return false
}

// 确认选择
async function handleConfirm() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 使用 dayjs 处理日期验证
    const startDay = dayjs(form.value.startDate).startOf("day")
    const endDay = dayjs(form.value.endDate).endOf("day")

    // 验证开始日期不能等于结束日期
    if (startDay.isSame(endDay)) {
      ElMessage.error("开始日期不能与结束日期相同")
      return
    }

    // 验证开始日期不能晚于结束日期
    if (startDay.isAfter(endDay)) {
      ElMessage.error("开始日期不能晚于结束日期")
      return
    }

    // 验证最大天数限制
    if (props.maxDays) {
      const daysDiff = endDay.diff(startDay, "day") + 1
      if (daysDiff > props.maxDays) {
        ElMessage.error(`日期范围不能超过${props.maxDays}天`)
        return
      }
    }

    // 使用 dayjs 生成 ISO 8601 格式字符串
    let startDateString: string
    let endDateString: string

    if (props.useUtc) {
      // 返回 UTC 时间格式
      startDateString = startDay.utc().toISOString()
      endDateString = endDay.utc().toISOString()
    } else {
      // 返回本地时间格式，使用 format 方法保持本地时区
      const localTimezone = dayjs.tz.guess() // 获取本地时区
      startDateString = startDay.tz(localTimezone).format("YYYY-MM-DDTHH:mm:ss.SSSZ")
      endDateString = endDay.tz(localTimezone).format("YYYY-MM-DDTHH:mm:ss.SSSZ")
    }

    const result: DateRange = {
      startDate: startDateString,
      endDate: endDateString
    }

    // 保存结果，等待弹窗关闭动画完成后再调用回调
    pendingResult.value = result
    visible.value = false
  } catch (error) {
    console.error("表单验证失败:", error)
  }
}

// 取消选择
function handleCancel() {
  // 保存null结果，等待弹窗关闭动画完成后再调用回调
  pendingResult.value = null
  visible.value = false
}

// 弹窗关闭事件（点击X或ESC键时触发）
function handleClose() {
  // 如果没有待处理的结果，说明是用户直接关闭弹窗
  if (pendingResult.value === undefined) {
    pendingResult.value = null
  }
}

// 弹窗关闭动画完成后的事件
function handleClosed() {
  // 在关闭动画完成后调用回调函数
  props.onResolve?.(pendingResult.value)
  // 重置待处理结果
  pendingResult.value = null
}
</script>

<template>
  <el-config-provider :locale="zhCn">
    <el-dialog
      v-model="visible"
      title="选择日期范围"
      width="500px"
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="handleClose"
      @closed="handleClosed"
    >
      <div class="dialog-tip" v-if="props.maxDays">
        <el-alert
          :title="`最多可选择 ${props.maxDays} 天的日期范围`"
          type="info"
          :closable="false"
          show-icon
        />
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="form.startDate"
            type="date"
            placeholder="请选择开始日期"
            format="YYYY-MM-DD"
            style="width: 100%"
            :disabled-date="disabledStartDate"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="form.endDate"
            type="date"
            placeholder="请选择结束日期"
            format="YYYY-MM-DD"
            style="width: 100%"
            :disabled-date="disabledEndDate"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div>
          <el-button @click="handleCancel">
            取消
          </el-button>
          <el-button type="primary" @click="handleConfirm">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </el-config-provider>
</template>

<style scoped>
.dialog-tip {
  margin-bottom: 16px;
}
</style>
