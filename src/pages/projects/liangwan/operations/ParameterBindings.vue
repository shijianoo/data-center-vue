<script setup lang="ts">
/* eslint-disable style/max-statements-per-line */
import type { ParameterDefinition, ParameterGroup, Station, StationParameterBinding } from "../apis/type"
import { ElMessage, ElMessageBox } from "element-plus"
import { onMounted, ref } from "vue"
import { createStationBinding, deleteStationBinding, getParameterDefinitions, getStationBindings, getStationGroups, getStations, updateStationBinding } from "../apis"

const stations = ref<Station[]>([]); const groups = ref<ParameterGroup[]>([]); const parameters = ref<ParameterDefinition[]>([]); const rows = ref<StationParameterBinding[]>([])
const selectedMn = ref(""); const dialogVisible = ref(false)
const form = ref<Partial<StationParameterBinding>>({ sortOrder: 0 })
async function loadInit() {
  try {
    stations.value = (await getStations({ pageSize: 200 })).items; parameters.value = (await getParameterDefinitions({ pageSize: 200 })).items
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
async function load() {
  if (!selectedMn.value) return; try {
    [groups.value, rows.value] = await Promise.all([getStationGroups(selectedMn.value), getStationBindings(selectedMn.value)])
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
function groupName(id: string) {
  return groups.value.find(item => item.id === id)?.name || id
}
function parameterName(id: string) {
  const item = parameters.value.find(parameter => parameter.id === id); return item ? `${item.name}（${item.code}）` : id
}
function openDialog(row?: StationParameterBinding) {
  form.value = row ? { ...row } : { sortOrder: 0 }; dialogVisible.value = true
}
async function save() {
  if (!selectedMn.value) return; try {
    if (form.value.id) await updateStationBinding(selectedMn.value, form.value.id, form.value); else await createStationBinding(selectedMn.value, form.value); ElMessage.success("参数绑定已保存"); dialogVisible.value = false; load()
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
async function remove(row: StationParameterBinding) {
  try {
    await ElMessageBox.confirm("确认删除该参数绑定？", "删除确认", { type: "warning" }); await deleteStationBinding(selectedMn.value, row.id); ElMessage.success("已删除"); load()
  } catch (error: any) {
    if (error !== "cancel") ElMessage.error(error.message)
  }
}
onMounted(loadInit)
</script>

<template>
  <section class="page-card">
    <header>
      <div><h2>站点参数绑定</h2><p>将全局参数分配到指定站点的参数组。</p></div><el-button type="primary" :disabled="!selectedMn" @click="openDialog()">
        新增参数绑定
      </el-button>
    </header><el-form inline>
      <el-form-item label="站点">
        <el-select v-model="selectedMn" filterable placeholder="请选择站点" style="width:300px" @change="load">
          <el-option v-for="station in stations" :key="station.mn" :label="`${station.name}（${station.mn}）`" :value="station.mn" />
        </el-select>
      </el-form-item>
    </el-form><el-empty v-if="!selectedMn" description="请先选择站点" /><el-table v-else :data="rows" border>
      <el-table-column label="参数组" min-width="140">
        <template #default="{ row }">
          {{ groupName(row.stationParameterGroupId) }}
        </template>
      </el-table-column><el-table-column label="参数" min-width="160">
        <template #default="{ row }">
          {{ parameterName(row.parameterDefinitionId) }}
        </template>
      </el-table-column><el-table-column prop="displayNameOverride" label="显示名覆盖" /><el-table-column prop="unitOverride" label="单位覆盖" /><el-table-column prop="sortOrder" label="排序" /><el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">
            编辑
          </el-button><el-button link type="danger" @click="remove(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </section><el-dialog v-model="dialogVisible" :title="form.id ? '编辑参数绑定' : '新增参数绑定'" width="560px">
    <el-form label-width="120px">
      <el-form-item label="站点参数组" required>
        <el-select v-model="form.stationParameterGroupId">
          <el-option v-for="group in groups" :key="group.id" :label="group.name" :value="group.id" />
        </el-select>
      </el-form-item><el-form-item label="全局参数" required>
        <el-select v-model="form.parameterDefinitionId" filterable>
          <el-option v-for="parameter in parameters" :key="parameter.id" :label="`${parameter.name}（${parameter.code}）`" :value="parameter.id" />
        </el-select>
      </el-form-item><el-form-item label="显示名覆盖">
        <el-input v-model="form.displayNameOverride" />
      </el-form-item><el-form-item label="单位覆盖">
        <el-input v-model="form.unitOverride" />
      </el-form-item><el-form-item label="小数位覆盖">
        <el-input-number v-model="form.decimalPlacesOverride" :min="0" />
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
