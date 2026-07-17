<script setup lang="ts">
import type { SaveStation, Station, StationStatus } from "../types"
import { Delete, Edit, Plus, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { onMounted, reactive, ref } from "vue"
import { createStation, deleteStation, getApiErrorMessage, getStations, updateStation } from "../apis"

const stations = ref<Station[]>([])
const keyword = ref("")
const loading = ref(false)
const dialogVisible = ref(false)
const editingMn = ref("")
const form = reactive<SaveStation>({ mn: "", name: "", groupName: "", longitude: null, latitude: null, status: "Active", address: "", metadataJson: "{}" })

const statusOptions: Array<{ value: StationStatus, label: string }> = [
  { value: "Active", label: "正常" },
  { value: "Maintenance", label: "维护中" },
  { value: "Offline", label: "离线" },
  { value: "Disabled", label: "禁用" }
]

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
  editingMn.value = row?.mn || ""
  Object.assign(form, row
    ? {
        mn: row.mn,
        name: row.name,
        groupName: row.groupName || "",
        longitude: row.longitude ?? null,
        latitude: row.latitude ?? null,
        status: row.status,
        address: row.address || "",
        metadataJson: row.metadataJson || "{}"
      }
    : { mn: "", name: "", groupName: "", longitude: null, latitude: null, status: "Active", address: "", metadataJson: "{}" })
  dialogVisible.value = true
}

/** 校验扩展 JSON 并保存站点。 */
async function save() {
  if (!form.mn.trim() || !form.name.trim()) return ElMessage.warning("请填写 MN 和站点名称")
  try {
    JSON.parse(form.metadataJson || "{}")
  } catch {
    return ElMessage.warning("扩展信息必须是合法 JSON")
  }
  try {
    editingMn.value ? await updateStation(editingMn.value, { ...form }) : await createStation({ ...form })
    ElMessage.success("站点保存成功")
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "站点保存失败"))
  }
}

/** 删除没有历史数据或配置引用的站点。 */
async function remove(row: Station) {
  await ElMessageBox.confirm(`确认删除站点“${row.name}（${row.mn}）”？有历史数据时后端会拒绝删除。`, "删除确认", { type: "warning" })
  try {
    await deleteStation(row.mn)
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
        <el-input v-model="keyword" clearable placeholder="MN、名称或分组" :prefix-icon="Search" @keyup.enter="loadData" /><el-button :icon="Refresh" @click="loadData">
          刷新
        </el-button><el-button type="primary" :icon="Plus" @click="edit()">
          新增站点
        </el-button>
      </el-space>
    </div>
    <el-table v-loading="loading" :data="stations" height="100%">
      <el-table-column prop="mn" label="站点 MN" min-width="130" fixed />
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

    <el-dialog v-model="dialogVisible" :title="editingMn ? '编辑站点' : '新增站点'" width="650px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="站点 MN" required>
              <el-input v-model="form.mn" :disabled="Boolean(editingMn)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="站点名称" required>
              <el-input v-model="form.name" />
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
              <el-input-number v-model="form.longitude" :min="-180" :max="180" :precision="6" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配置纬度">
              <el-input-number v-model="form.latitude" :min="-90" :max="90" :precision="6" controls-position="right" />
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
        </el-button><el-button type="primary" @click="save">
          保存
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped lang="scss">
@use "../styles.scss";
</style>
