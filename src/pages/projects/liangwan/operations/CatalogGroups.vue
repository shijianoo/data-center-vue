<script setup lang="ts">
/* eslint-disable style/max-statements-per-line */
import type { ParameterCatalogGroup } from "../apis/type"
import { ElMessage, ElMessageBox } from "element-plus"
import { onMounted, ref } from "vue"
import { createCatalogGroup, deleteCatalogGroup, getCatalogGroups, updateCatalogGroup } from "../apis"

const loading = ref(false)
const dialogVisible = ref(false)
const rows = ref<ParameterCatalogGroup[]>([])
const form = ref<Partial<ParameterCatalogGroup>>({ parameterKind: "Monitoring", sortOrder: 0 })

async function load() {
  loading.value = true
  try {
    rows.value = await getCatalogGroups()
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}
function openDialog(row?: ParameterCatalogGroup) {
  form.value = row ? { ...row } : { parameterKind: "Monitoring", sortOrder: 0 }
  dialogVisible.value = true
}
async function save() {
  try {
    if (form.value.id) await updateCatalogGroup(form.value.id, form.value)
    else await createCatalogGroup(form.value)
    ElMessage.success("参数组已保存")
    dialogVisible.value = false
    load()
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
async function remove(row: ParameterCatalogGroup) {
  try {
    await ElMessageBox.confirm(`确认删除“${row.name}”？`, "删除确认", { type: "warning" }); await deleteCatalogGroup(row.id); ElMessage.success("已删除"); load()
  } catch (error: any) {
    if (error !== "cancel") ElMessage.error(error.message)
  }
}
onMounted(load)
</script>

<template>
  <section class="page-card">
    <header>
      <div><h2>全局参数组</h2><p>维护全局参数目录，为参数定义提供分类。</p></div><el-button type="primary" @click="openDialog()">
        新增参数组
      </el-button>
    </header>
    <el-table v-loading="loading" :data="rows" border>
      <el-table-column prop="name" label="名称" /><el-table-column prop="parameterKind" label="参数类别" width="140" /><el-table-column prop="parentId" label="父级 ID" /><el-table-column prop="sortOrder" label="排序" width="100" /><el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">
            编辑
          </el-button><el-button link type="danger" @click="remove(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑参数组' : '新增参数组'" width="520px">
    <el-form label-width="90px">
      <el-form-item label="名称" required>
        <el-input v-model="form.name" />
      </el-form-item><el-form-item label="参数类别">
        <el-select v-model="form.parameterKind">
          <el-option label="监测参数" value="Monitoring" /><el-option label="系统参数" value="System" />
        </el-select>
      </el-form-item><el-form-item label="父级 ID">
        <el-input v-model="form.parentId" clearable />
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
