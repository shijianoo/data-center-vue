<script setup lang="ts">
/* eslint-disable style/max-statements-per-line */
import type { Station } from "../apis/type"
import { ElMessage, ElMessageBox } from "element-plus"
import { onMounted, ref } from "vue"
import { createStation, deleteStation, getStations, updateStation } from "../apis"

const rows = ref<Station[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref<Partial<Station>>({ status: "Active", metadataJson: "{}" })

async function load() {
  loading.value = true; try {
    rows.value = (await getStations({ pageSize: 200 })).items
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}
function openDialog(row?: Station) {
  form.value = row ? { ...row } : { status: "Active", metadataJson: "{}" }; dialogVisible.value = true
}
async function save() {
  try {
    if (form.value.id && form.value.mn) await updateStation(form.value.mn, form.value); else await createStation(form.value as Omit<Station, "id">); ElMessage.success("站点已保存"); dialogVisible.value = false; load()
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
async function remove(row: Station) {
  try {
    await ElMessageBox.confirm(`确认删除站点“${row.name}”？`, "删除确认", { type: "warning" }); await deleteStation(row.mn); ElMessage.success("已删除"); load()
  } catch (error: any) {
    if (error !== "cancel") ElMessage.error(error.message)
  }
}
onMounted(load)
</script>

<template>
  <section class="page-card">
    <header>
      <div><h2>站点管理</h2><p>维护站点 MN、位置、状态和附加档案。</p></div><el-button type="primary" @click="openDialog()">
        新增站点
      </el-button>
    </header>
    <el-table v-loading="loading" :data="rows" border>
      <el-table-column prop="mn" label="MN" width="140" /><el-table-column prop="name" label="名称" min-width="150" /><el-table-column prop="groupName" label="分组" width="120" /><el-table-column prop="status" label="状态" width="110" /><el-table-column label="经纬度" min-width="180">
        <template #default="{ row }">
          {{ row.longitude ?? '—' }}, {{ row.latitude ?? '—' }}
        </template>
      </el-table-column><el-table-column label="操作" width="150">
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
  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑站点' : '新增站点'" width="600px">
    <el-form label-width="100px">
      <el-form-item label="MN" required>
        <el-input v-model="form.mn" :disabled="Boolean(form.id)" />
      </el-form-item><el-form-item label="名称" required>
        <el-input v-model="form.name" />
      </el-form-item><el-form-item label="分组">
        <el-input v-model="form.groupName" />
      </el-form-item><el-form-item label="经度">
        <el-input-number v-model="form.longitude" :precision="6" />
      </el-form-item><el-form-item label="纬度">
        <el-input-number v-model="form.latitude" :precision="6" />
      </el-form-item><el-form-item label="状态">
        <el-select v-model="form.status">
          <el-option v-for="item in ['Active', 'Maintenance', 'Offline', 'Disabled']" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item><el-form-item label="地址">
        <el-input v-model="form.address" />
      </el-form-item><el-form-item label="元数据 JSON">
        <el-input v-model="form.metadataJson" type="textarea" />
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
