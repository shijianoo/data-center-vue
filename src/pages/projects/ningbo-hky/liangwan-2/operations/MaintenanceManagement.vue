<script setup lang="ts">
import type { MaintenancePeriod, MaintenanceType } from "../types"
import { Delete, Edit, Plus, Refresh } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, reactive, ref, watch } from "vue"
import { createMaintenancePeriod, deleteMaintenancePeriod, getApiErrorMessage, getMaintenancePeriods, updateMaintenancePeriod } from "../apis"
import { useProjectOptions } from "../composables/useProjectOptions"
import { displayTime, toLocalIso } from "../utils"

const { stations, loadStations, stationById } = useProjectOptions()
const stationId = ref<number | "">("")
const rows = ref<MaintenancePeriod[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | "">("")
const form = reactive({ maintenanceType: "Routine" as MaintenanceType, timeRange: [new Date(), new Date(Date.now() + 24 * 60 * 60 * 1000)] as [Date, Date], reason: "" })

const selectedStation = computed(() => typeof stationId.value === "number" ? stationById.value.get(stationId.value) : undefined)
const typeOptions: Array<{ value: MaintenanceType, label: string }> = [
  { value: "AnnualOverhaul", label: "年度大修" },
  { value: "Emergency", label: "应急维护" },
  { value: "Routine", label: "例行维护" },
  { value: "Other", label: "其他" }
]

watch(stationId, loadData)

/** 加载当前站点的全部大修与维护时段。 */
async function loadData() {
  if (!selectedStation.value) {
    rows.value = []
    return
  }
  loading.value = true
  try {
    const { data } = await getMaintenancePeriods(selectedStation.value.mn)
    rows.value = data ?? []
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "维护时段加载失败"))
  } finally {
    loading.value = false
  }
}

/** 打开维护时段表单。 */
function edit(row?: MaintenancePeriod) {
  editingId.value = row?.id || ""
  Object.assign(form, row ? { maintenanceType: row.maintenanceType, timeRange: [new Date(row.startAt), new Date(row.endAt)], reason: row.reason || "" } : { maintenanceType: "Routine", timeRange: [new Date(), new Date(Date.now() + 24 * 60 * 60 * 1000)], reason: "" })
  dialogVisible.value = true
}

/** 保存维护期，结束时间必须晚于开始时间。 */
async function save() {
  if (!selectedStation.value) return ElMessage.warning("请选择站点")
  const startAt = toLocalIso(form.timeRange[0])
  const endAt = toLocalIso(form.timeRange[1])
  if (new Date(startAt) >= new Date(endAt)) return ElMessage.warning("结束时间必须晚于开始时间")
  const payload = { maintenanceType: form.maintenanceType, startAt, endAt, reason: form.reason.trim() }
  try {
    editingId.value ? await updateMaintenancePeriod(selectedStation.value.mn, editingId.value, payload) : await createMaintenancePeriod(selectedStation.value.mn, payload)
    ElMessage.success("维护时段保存成功")
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "维护时段保存失败"))
  }
}

/** 删除维护时段。 */
async function remove(row: MaintenancePeriod) {
  if (!selectedStation.value) return
  await ElMessageBox.confirm(`确认删除 ${displayTime(row.startAt)} 开始的维护时段？`, "删除确认", { type: "warning" })
  try {
    await deleteMaintenancePeriod(selectedStation.value.mn, row.id)
    ElMessage.success("删除成功")
    await loadData()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "删除失败"))
  }
}

function typeName(value: MaintenanceType) {
  return typeOptions.find(item => item.value === value)?.label || value
}

onMounted(async () => {
  const list = await loadStations()
  if (list[0]) stationId.value = list[0].id
})
</script>

<template>
  <section class="lw2-content">
    <div class="lw2-page-title">
      <h2>大修与运维时段</h2>
      <el-space>
        <el-select v-model="stationId" filterable placeholder="请选择站点" style="width: 230px">
          <el-option v-for="station in stations" :key="station.id" :label="station.name" :value="station.id" />
        </el-select><el-button :icon="Refresh" @click="loadData">
          刷新
        </el-button><el-button type="primary" :icon="Plus" :disabled="!stationId" @click="edit()">
          新增维护时段
        </el-button>
      </el-space>
    </div>
    <el-alert title="维护时段可供统计分析排除大修、应急和例行维护期间的数据。" type="info" :closable="false" show-icon />
    <el-table v-loading="loading" :data="rows" class="maintenance-table" height="100%">
      <el-table-column label="维护类型" width="130">
        <template #default="scope">
          <el-tag :type="scope.row.maintenanceType === 'Emergency' ? 'danger' : scope.row.maintenanceType === 'AnnualOverhaul' ? 'warning' : 'info'">
            {{ typeName(scope.row.maintenanceType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="开始时间" min-width="180">
        <template #default="scope">
          {{ displayTime(scope.row.startAt) }}
        </template>
      </el-table-column>
      <el-table-column label="结束时间" min-width="180">
        <template #default="scope">
          {{ displayTime(scope.row.endAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="reason" label="维护原因" min-width="250" show-overflow-tooltip />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button link type="primary" :icon="Edit" @click="edit(scope.row)">
            编辑
          </el-button><el-button link type="danger" :icon="Delete" @click="remove(scope.row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑维护时段' : '新增维护时段'" width="580px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="维护类型" required>
          <el-select v-model="form.maintenanceType" style="width: 100%">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="维护时间" required>
          <el-date-picker v-model="form.timeRange" type="datetimerange" format="YYYY-MM-DD HH:mm:ss" :clearable="false" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="维护原因">
          <el-input v-model="form.reason" type="textarea" :rows="4" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button><el-button type="primary" @click="save">
          保存
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped lang="scss">
@use "../styles.scss";
.maintenance-table {
  margin-top: 14px;
}
</style>
