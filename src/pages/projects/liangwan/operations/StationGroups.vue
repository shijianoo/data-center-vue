<script setup lang="ts">
/* eslint-disable style/max-statements-per-line */
import type { ParameterGroup, Station } from "../apis/type"
import { ElMessage, ElMessageBox } from "element-plus"
import { onMounted, ref } from "vue"
import { createStationGroup, deleteStationGroup, getStationGroups, getStations, updateStationGroup } from "../apis"

const stations = ref<Station[]>([]); const selectedMn = ref(""); const rows = ref<ParameterGroup[]>([]); const dialogVisible = ref(false)
const form = ref<Partial<ParameterGroup>>({ groupKind: "Monitoring", reportIntervalMinutes: 15, sortOrder: 0 })
async function loadStations() {
  try {
    stations.value = (await getStations({ pageSize: 200 })).items
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
async function load() {
  if (!selectedMn.value) return; try {
    rows.value = await getStationGroups(selectedMn.value)
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
function openDialog(row?: ParameterGroup) {
  form.value = row ? { ...row } : { groupKind: "Monitoring", reportIntervalMinutes: 15, sortOrder: 0 }; dialogVisible.value = true
}
async function save() {
  if (!selectedMn.value) return; try {
    if (form.value.id) await updateStationGroup(selectedMn.value, form.value.id, form.value); else await createStationGroup(selectedMn.value, form.value); ElMessage.success("站点参数组已保存"); dialogVisible.value = false; load()
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
async function remove(row: ParameterGroup) {
  try {
    await ElMessageBox.confirm(`确认删除“${row.name}”？`, "删除确认", { type: "warning" }); await deleteStationGroup(selectedMn.value, row.id); ElMessage.success("已删除"); load()
  } catch (error: any) {
    if (error !== "cancel") ElMessage.error(error.message)
  }
}
onMounted(loadStations)
</script>

<template>
  <section class="page-card">
    <header>
      <div><h2>站点参数组</h2><p>为单个站点创建同上报周期的参数集合。</p></div><el-button type="primary" :disabled="!selectedMn" @click="openDialog()">
        新增参数组
      </el-button>
    </header><el-form inline>
      <el-form-item label="站点">
        <el-select v-model="selectedMn" filterable placeholder="请选择站点" style="width:300px" @change="load">
          <el-option v-for="station in stations" :key="station.mn" :label="`${station.name}（${station.mn}）`" :value="station.mn" />
        </el-select>
      </el-form-item>
    </el-form><el-empty v-if="!selectedMn" description="请先选择站点" /><el-table v-else :data="rows" border>
      <el-table-column prop="name" label="名称" /><el-table-column prop="groupKind" label="类别" /><el-table-column prop="reportIntervalMinutes" label="上报周期（分钟）" /><el-table-column prop="sortOrder" label="排序" /><el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">
            编辑
          </el-button><el-button link type="danger" @click="remove(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </section><el-dialog v-model="dialogVisible" :title="form.id ? '编辑站点参数组' : '新增站点参数组'" width="520px">
    <el-form label-width="120px">
      <el-form-item label="名称" required>
        <el-input v-model="form.name" />
      </el-form-item><el-form-item label="类别">
        <el-input v-model="form.groupKind" />
      </el-form-item><el-form-item label="上报周期（分钟）">
        <el-input-number v-model="form.reportIntervalMinutes" :min="1" />
      </el-form-item><el-form-item label="排序">
        <el-input-number v-model="form.sortOrder" :min="0" />
      </el-form-item>
    </el-form><template #footer>
      <el-button @click="dialogVisible = false">
        取消
      </el-button><el-button type="primary" @click="save">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.page-card {
  min-height: 100%;
  padding: 20px;
  background: #fff;
  border-radius: 6px;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}
h2 {
  margin: 0;
  font-size: 20px;
}
p {
  margin: 6px 0 0;
  color: #909399;
  font-size: 13px;
}
</style>
