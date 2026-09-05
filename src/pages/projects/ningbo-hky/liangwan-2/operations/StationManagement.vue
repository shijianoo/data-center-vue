<script setup lang="ts">
import type { SaveStationCommand, SaveStationDeviceCommand, Station, StationDeviceModel, StationStatus } from "../types"
import { Cpu, Delete, Edit, Plus, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { onMounted, reactive, ref } from "vue"
import {
  createDevice,
  createStation,
  deleteDevice,
  deleteStation,
  getApiErrorMessage,
  getDevices,
  getStations,
  updateDevice,
  updateStation
} from "../apis"

const stations = ref<Station[]>([])
const keyword = ref("")
const loading = ref(false)
const dialogVisible = ref(false)
const editingStationId = ref<number | "">("")
const form = reactive<SaveStationCommand>({
  code: "",
  name: "",
  groupName: "",
  longitude: null,
  latitude: null,
  geofenceRadiusMeters: null,
  status: "Active",
  address: "",
  metadataJson: "{}"
})

const statusOptions: Array<{ value: StationStatus, label: string }> = [
  { value: "Active", label: "正常" },
  { value: "Maintenance", label: "维护中" },
  { value: "Offline", label: "离线" },
  { value: "Disabled", label: "禁用" }
]

// #region 站点下挂设备管理

const deviceDialogVisible = ref(false)
const currentStation = ref<Station | null>(null)
const devices = ref<StationDeviceModel[]>([])
const devicesLoading = ref(false)

const deviceFormVisible = ref(false)
const editingDeviceId = ref<number | string | "">("")
const deviceForm = reactive<{ mn: string, name: string, deviceKind: string, isEnabled: boolean }>({
  mn: "",
  name: "",
  deviceKind: "",
  isEnabled: true
})

/** 打开关联设备管理对话框 */
async function openDeviceDialog(station: Station) {
  currentStation.value = station
  deviceDialogVisible.value = true
  await loadDevices()
}

/** 加载当前站点的设备列表 */
async function loadDevices() {
  if (!currentStation.value) return
  devicesLoading.value = true
  try {
    const { data } = await getDevices(currentStation.value.id)
    devices.value = data ?? []
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "站点设备列表加载失败"))
  } finally {
    devicesLoading.value = false
  }
}

/** 打开设备编辑/新增弹窗 */
function editDevice(row?: StationDeviceModel) {
  editingDeviceId.value = row?.id || ""
  Object.assign(deviceForm, row
    ? {
        mn: row.mn,
        name: row.name || "",
        deviceKind: row.deviceKind || "",
        isEnabled: row.isEnabled
      }
    : {
        mn: "",
        name: "",
        deviceKind: "",
        isEnabled: true
      })
  deviceFormVisible.value = true
}

/** 保存设备 */
async function saveDevice() {
  if (!currentStation.value || !deviceForm.mn.trim()) {
    return ElMessage.warning("请填写设备 MN")
  }
  const payload: SaveStationDeviceCommand = {
    mn: deviceForm.mn.trim(),
    name: deviceForm.name.trim() || undefined,
    deviceKind: deviceForm.deviceKind.trim() || undefined,
    isEnabled: deviceForm.isEnabled
  }
  try {
    if (editingDeviceId.value) {
      await updateDevice(currentStation.value.id, editingDeviceId.value, payload)
    } else {
      await createDevice(currentStation.value.id, payload)
    }
    ElMessage.success("设备保存成功")
    deviceFormVisible.value = false
    await loadDevices()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "设备保存失败"))
  }
}

/** 删除设备 */
async function removeDevice(row: StationDeviceModel) {
  if (!currentStation.value) return
  await ElMessageBox.confirm(`确认删除关联设备“${row.name || row.mn}”？`, "删除确认", { type: "warning" })
  try {
    await deleteDevice(currentStation.value.id, row.id)
    ElMessage.success("删除成功")
    await loadDevices()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "删除失败"))
  }
}

// #endregion

/** 按关键字加载站点列表。 */
async function loadData() {
  loading.value = true
  try {
    const { data } = await getStations({ keyword: keyword.value || undefined })
    stations.value = data.items ?? []
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "站点加载失败"))
  } finally {
    loading.value = false
  }
}

/** 打开站点新增或编辑对话框。 */
function edit(row?: Station) {
  editingStationId.value = row?.id || ""
  Object.assign(form, row
    ? {
        code: row.code || "",
        name: row.name,
        groupName: row.groupName || "",
        longitude: row.longitude ?? null,
        latitude: row.latitude ?? null,
        geofenceRadiusMeters: row.geofenceRadiusMeters ?? null,
        status: row.status,
        address: row.address || "",
        metadataJson: row.metadataJson || "{}"
      }
    : { code: "", name: "", groupName: "", longitude: null, latitude: null, geofenceRadiusMeters: null, status: "Active", address: "", metadataJson: "{}" })
  dialogVisible.value = true
}

/** 校验扩展 JSON 并保存站点。 */
async function save() {
  if (!form.code.trim() || !form.name.trim()) return ElMessage.warning("请填写站点编码和站点名称")
  try {
    JSON.parse(form.metadataJson || "{}")
  } catch {
    return ElMessage.warning("扩展信息必须是合法 JSON")
  }
  const payload: SaveStationCommand = {
    code: form.code.trim(),
    name: form.name.trim(),
    groupName: form.groupName?.trim() || undefined,
    longitude: form.longitude ?? null,
    latitude: form.latitude ?? null,
    geofenceRadiusMeters: form.geofenceRadiusMeters ?? null,
    status: form.status,
    address: form.address?.trim() || undefined,
    metadataJson: form.metadataJson?.trim() || "{}"
  }
  try {
    editingStationId.value ? await updateStation(editingStationId.value as number, payload) : await createStation(payload)
    ElMessage.success("站点保存成功")
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "站点保存失败"))
  }
}

/** 删除没有历史数据或配置引用的站点。 */
async function remove(row: Station) {
  await ElMessageBox.confirm(`确认删除站点“${row.name}（${row.code || row.id}）”？有历史数据时后端会拒绝删除。`, "删除确认", { type: "warning" })
  try {
    await deleteStation(row.id)
    ElMessage.success("删除成功")
    await loadData()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "站点删除失败"))
  }
}

onMounted(loadData)
</script>

<template>
  <section class="lw2-content">
    <div class="lw2-page-title">
      <h2>站点管理</h2>
      <el-space>
        <el-input v-model="keyword" clearable placeholder="编码、名称或分组" :prefix-icon="Search" @keyup.enter="loadData" />
        <el-button :icon="Refresh" @click="loadData">
          刷新
        </el-button>
        <el-button type="primary" :icon="Plus" @click="edit()">
          新增站点
        </el-button>
      </el-space>
    </div>
    <el-table v-loading="loading" :data="stations" height="100%">
      <el-table-column prop="id" label="ID" width="70" fixed />
      <el-table-column prop="code" label="逻辑编码" min-width="130" fixed />
      <el-table-column prop="name" label="站点名称" min-width="150" fixed />
      <el-table-column prop="groupName" label="站点分组" min-width="130" />
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'Active' ? 'success' : scope.row.status === 'Maintenance' ? 'warning' : 'info'">
            {{ statusOptions.find(item => item.value === scope.row.status)?.label || scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="配置坐标" min-width="180">
        <template #default="scope">
          {{ scope.row.longitude ?? '—' }}, {{ scope.row.latitude ?? '—' }}
        </template>
      </el-table-column>
      <el-table-column prop="address" label="地址" min-width="190" show-overflow-tooltip />
      <el-table-column prop="lastSeenAt" label="最后在线时间" min-width="180" />
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="scope">
          <el-button link type="primary" :icon="Edit" @click="edit(scope.row)">
            编辑
          </el-button>
          <el-button link type="success" :icon="Cpu" @click="openDeviceDialog(scope.row)">
            设备管理
          </el-button>
          <el-button link type="danger" :icon="Delete" @click="remove(scope.row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 站点新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingStationId ? '编辑站点' : '新增站点'" width="650px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="逻辑编码" required>
              <el-input v-model="form.code" placeholder="例如：STATION_001" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="站点名称" required>
              <el-input v-model="form.name" placeholder="例如：1号水质监测站" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="站点分组">
              <el-input v-model="form.groupName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配置经度">
              <el-input-number v-model="form.longitude" :min="-180" :max="180" :precision="6" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配置纬度">
              <el-input-number v-model="form.latitude" :min="-90" :max="90" :precision="6" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="围栏半径(m)">
              <el-input-number v-model="form.geofenceRadiusMeters" :min="1" :max="10000" :step="100" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地址">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="扩展 JSON">
          <el-input v-model="form.metadataJson" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="save">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 站点关联设备管理弹窗 -->
    <el-dialog
      v-model="deviceDialogVisible"
      :title="`“${currentStation?.name || ''}” 下挂设备管理`"
      width="780px"
      destroy-on-close
    >
      <div class="device-dialog-toolbar">
        <el-button type="primary" :icon="Plus" size="small" @click="editDevice()">
          新增设备
        </el-button>
        <el-button :icon="Refresh" size="small" @click="loadDevices">
          刷新
        </el-button>
      </div>

      <el-table v-loading="devicesLoading" :data="devices" max-height="400">
        <el-table-column prop="mn" label="设备 MN" min-width="160" />
        <el-table-column prop="name" label="设备名称" min-width="150">
          <template #default="scope">
            {{ scope.row.name || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="deviceKind" label="设备类型说明" min-width="150">
          <template #default="scope">
            {{ scope.row.deviceKind || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="接入状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isEnabled === 1 || scope.row.isEnabled === true ? 'success' : 'info'">
              {{ scope.row.isEnabled === 1 || scope.row.isEnabled === true ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <el-button link type="primary" :icon="Edit" @click="editDevice(scope.row)">
              编辑
            </el-button>
            <el-button link type="danger" :icon="Delete" @click="removeDevice(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 新增/编辑设备表单弹窗 -->
      <el-dialog
        v-model="deviceFormVisible"
        :title="editingDeviceId ? '编辑关联设备' : '新增关联设备'"
        width="520px"
        append-to-body
        destroy-on-close
      >
        <el-form :model="deviceForm" label-width="100px">
          <el-form-item label="设备 MN" required>
            <el-input v-model="deviceForm.mn" placeholder="请输入设备 HJ212 报文中的 MN 标识" />
          </el-form-item>
          <el-form-item label="设备名称">
            <el-input v-model="deviceForm.name" placeholder="例如：水质多参数测定仪" />
          </el-form-item>
          <el-form-item label="设备类型">
            <el-input v-model="deviceForm.deviceKind" placeholder="例如：HJ212 转发网关" />
          </el-form-item>
          <el-form-item label="接入状态">
            <el-switch v-model="deviceForm.isEnabled" active-text="启用" inactive-text="禁用" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="deviceFormVisible = false">
            取消
          </el-button>
          <el-button type="primary" @click="saveDevice">
            保存设备
          </el-button>
        </template>
      </el-dialog>
    </el-dialog>
  </section>
</template>

<style scoped lang="scss">
@use "../styles.scss";

.device-dialog-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
