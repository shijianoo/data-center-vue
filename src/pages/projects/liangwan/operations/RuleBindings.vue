<script setup lang="ts">
import type { ReviewRule, ReviewRuleBinding, Station } from "../apis/type"
import { ElMessage, ElMessageBox } from "element-plus"
import { onMounted, ref } from "vue"
import { createReviewRuleBinding, deleteReviewRuleBinding, getReviewRuleBindings, getReviewRules, getStations, updateReviewRuleBinding } from "../apis"

const stations = ref<Station[]>([])
const rules = ref<ReviewRule[]>([])
const rows = ref<ReviewRuleBinding[]>([])
const selectedStationId = ref("")
const dialogVisible = ref(false)
const form = ref<Partial<ReviewRuleBinding>>({ configOverrideJson: "{}", priority: 0 })

async function loadInit() {
  try {
    [stations.value, rules.value] = await Promise.all([
      getStations({ pageSize: 200 }).then(result => result.items),
      getReviewRules()
    ])
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
async function load() {
  if (!selectedStationId.value) return
  try {
    rows.value = await getReviewRuleBindings(selectedStationId.value)
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
function ruleName(id: string) {
  return rules.value.find(rule => rule.id === id)?.name || id
}
function openDialog(row?: ReviewRuleBinding) {
  form.value = row ? { ...row } : { stationId: selectedStationId.value, configOverrideJson: "{}", priority: 0 }
  dialogVisible.value = true
}
async function save() {
  try {
    JSON.parse(form.value.configOverrideJson || "{}")
    if (form.value.id) await updateReviewRuleBinding(form.value.id, form.value)
    else await createReviewRuleBinding({ ...form.value, stationId: selectedStationId.value })
    ElMessage.success("审核规则绑定已保存")
    dialogVisible.value = false
    load()
  } catch (error: any) {
    ElMessage.error(error instanceof SyntaxError ? "覆盖配置 JSON 格式不正确" : error.message)
  }
}
async function remove(row: ReviewRuleBinding) {
  try {
    await ElMessageBox.confirm("确认删除该审核规则绑定？", "删除确认", { type: "warning" })
    await deleteReviewRuleBinding(row.id)
    ElMessage.success("已删除")
    load()
  } catch (error: any) {
    if (error !== "cancel") ElMessage.error(error.message)
  }
}
onMounted(loadInit)
</script>

<template>
  <section class="page-card">
    <header>
      <div><h2>站点审核规则绑定</h2><p>为某个站点选择全局审核规则，并按站点覆盖默认配置。</p></div><el-button type="primary" :disabled="!selectedStationId" @click="openDialog()">
        新增规则绑定
      </el-button>
    </header>
    <el-form inline>
      <el-form-item label="站点">
        <el-select v-model="selectedStationId" filterable placeholder="请选择站点" style="width:300px" @change="load">
          <el-option v-for="station in stations" :key="station.id" :label="`${station.name}（${station.mn}）`" :value="station.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <el-empty v-if="!selectedStationId" description="请先选择站点" />
    <el-table v-else :data="rows" border>
      <el-table-column label="审核规则" min-width="180">
        <template #default="{ row }">
          {{ ruleName(row.ruleDefinitionId) }}
        </template>
      </el-table-column><el-table-column prop="priority" label="优先级" width="100" /><el-table-column prop="configOverrideJson" label="本站覆盖配置" min-width="260" /><el-table-column label="操作" width="150">
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
  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑规则绑定' : '新增规则绑定'" width="620px">
    <el-form label-width="110px">
      <el-form-item label="全局审核规则" required>
        <el-select v-model="form.ruleDefinitionId" filterable>
          <el-option v-for="rule in rules" :key="rule.id" :label="`${rule.name}（${rule.code}）`" :value="rule.id" />
        </el-select>
      </el-form-item><el-form-item label="优先级">
        <el-input-number v-model="form.priority" :min="0" />
      </el-form-item><el-form-item label="覆盖配置 JSON">
        <el-input v-model="form.configOverrideJson" type="textarea" :rows="8" />
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
