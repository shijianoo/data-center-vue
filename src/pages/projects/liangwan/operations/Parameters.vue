<script setup lang="ts">
/* eslint-disable style/max-statements-per-line */
import type { ParameterCatalogGroup, ParameterDefinition } from "../apis/type"
import { ElMessage, ElMessageBox } from "element-plus"
import { onMounted, ref } from "vue"
import { createParameterDefinition, deleteParameterDefinition, getCatalogGroups, getParameterDefinitions, updateParameterDefinition } from "../apis"

const loading = ref(false); const dialogVisible = ref(false); const rows = ref<ParameterDefinition[]>([]); const groups = ref<ParameterCatalogGroup[]>([])
const form = ref<Partial<ParameterDefinition>>({ parameterKind: "Monitoring", dataType: "Decimal", decimalPlaces: 2, primaryMetricSuffix: "Rtd", sortOrder: 0 })
async function load() {
  loading.value = true; try {
    rows.value = (await getParameterDefinitions({ pageSize: 200 })).items; groups.value = await getCatalogGroups()
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}
function openDialog(row?: ParameterDefinition) {
  form.value = row ? { ...row } : { parameterKind: "Monitoring", dataType: "Decimal", decimalPlaces: 2, primaryMetricSuffix: "Rtd", sortOrder: 0 }; dialogVisible.value = true
}
async function save() {
  try {
    if (form.value.id) await updateParameterDefinition(form.value.id, form.value); else await createParameterDefinition(form.value); ElMessage.success("参数已保存"); dialogVisible.value = false; load()
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
async function remove(row: ParameterDefinition) {
  try {
    await ElMessageBox.confirm(`确认删除参数“${row.name}”？`, "删除确认", { type: "warning" }); await deleteParameterDefinition(row.id); ElMessage.success("已删除"); load()
  } catch (error: any) {
    if (error !== "cancel") ElMessage.error(error.message)
  }
}
onMounted(load)
</script>

<template>
  <section class="page-card">
    <header>
      <div><h2>全局参数管理</h2><p>维护协议参数、数据类型和显示精度。</p></div><el-button type="primary" @click="openDialog()">
        新增参数
      </el-button>
    </header><el-table v-loading="loading" :data="rows" border>
      <el-table-column prop="code" label="编码" width="110" /><el-table-column prop="name" label="名称" min-width="150" /><el-table-column prop="parameterKind" label="类别" width="110" /><el-table-column prop="dataType" label="数据类型" width="120" /><el-table-column prop="unit" label="单位" width="90" /><el-table-column prop="decimalPlaces" label="小数位" width="90" /><el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">
            编辑
          </el-button><el-button link type="danger" @click="remove(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </section><el-dialog v-model="dialogVisible" :title="form.id ? '编辑参数' : '新增参数'" width="620px">
    <el-form label-width="100px">
      <el-form-item label="编码" required>
        <el-input v-model="form.code" />
      </el-form-item><el-form-item label="名称" required>
        <el-input v-model="form.name" />
      </el-form-item><el-form-item label="目录分组">
        <el-select v-model="form.catalogGroupId" clearable>
          <el-option v-for="group in groups" :key="group.id" :label="group.name" :value="group.id" />
        </el-select>
      </el-form-item><el-form-item label="参数类别">
        <el-select v-model="form.parameterKind">
          <el-option label="监测参数" value="Monitoring" /><el-option label="系统参数" value="System" />
        </el-select>
      </el-form-item><el-form-item label="数据类型">
        <el-select v-model="form.dataType">
          <el-option v-for="item in ['Decimal', 'Integer', 'Boolean', 'String', 'DateTime', 'Longitude', 'Latitude', 'Enum']" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item><el-form-item label="单位">
        <el-input v-model="form.unit" />
      </el-form-item><el-form-item label="小数位">
        <el-input-number v-model="form.decimalPlaces" :min="0" />
      </el-form-item><el-form-item label="主指标后缀">
        <el-input v-model="form.primaryMetricSuffix" />
      </el-form-item><el-form-item label="说明">
        <el-input v-model="form.description" type="textarea" />
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
