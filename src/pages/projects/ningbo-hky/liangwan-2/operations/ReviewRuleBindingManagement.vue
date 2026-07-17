<script setup lang="ts">
import type { ReviewRuleBinding } from "../types"
import { Delete, Edit, Plus, Refresh } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, reactive, ref, watch } from "vue"
import { createReviewRuleBinding, deleteReviewRuleBinding, getApiErrorMessage, getReviewRuleBindings, getReviewRules, updateReviewRuleBinding } from "../apis"
import { useProjectOptions } from "../composables/useProjectOptions"

const { stations, loadStations, stationById } = useProjectOptions()
const rules = ref<any[]>([])
const bindings = ref<ReviewRuleBinding[]>([])
const stationId = ref("")
const loading = ref(false)
const dialogVisible = ref(false)
const editingId = ref("")
const form = reactive({ ruleDefinitionId: "", stationId: "", configOverrideJson: "{}", priority: 10 })
const selectedStation = computed(() => stationById.value.get(stationId.value))

watch(stationId, loadBindings)

/** 加载当前站点的规则绑定。 */
async function loadBindings() {
  if (!stationId.value) {
    bindings.value = []
    return
  }
  loading.value = true
  try {
    const { data } = await getReviewRuleBindings(stationId.value)
    bindings.value = data ?? []
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "规则绑定加载失败"))
  } finally {
    loading.value = false
  }
}

/** 打开规则绑定新增或编辑表单。 */
function edit(row?: ReviewRuleBinding) {
  editingId.value = row?.id || ""
  Object.assign(form, row ? { ruleDefinitionId: row.ruleDefinitionId, stationId: row.stationId, configOverrideJson: row.configOverrideJson || "{}", priority: row.priority } : { ruleDefinitionId: "", stationId: stationId.value, configOverrideJson: "{}", priority: 10 })
  dialogVisible.value = true
}

/** 校验站点覆盖 JSON 并保存规则绑定。 */
async function save() {
  if (!form.stationId || !form.ruleDefinitionId) return ElMessage.warning("请选择站点和规则")
  try {
    JSON.parse(form.configOverrideJson || "{}")
  } catch {
    return ElMessage.warning("阈值覆盖必须是合法 JSON")
  }
  try {
    editingId.value ? await updateReviewRuleBinding(editingId.value, { ...form, configOverrideJson: form.configOverrideJson || "{}" }) : await createReviewRuleBinding({ ...form, configOverrideJson: form.configOverrideJson || "{}" })
    ElMessage.success("规则绑定保存成功")
    dialogVisible.value = false
    stationId.value = form.stationId
    await loadBindings()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "规则绑定保存失败"))
  }
}

/** 删除站点规则绑定，不影响全局规则定义。 */
async function remove(row: ReviewRuleBinding) {
  await ElMessageBox.confirm(`确认解除规则“${ruleName(row.ruleDefinitionId)}”？`, "删除确认", { type: "warning" })
  try {
    await deleteReviewRuleBinding(row.id)
    ElMessage.success("解绑成功")
    await loadBindings()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "解绑失败"))
  }
}

function ruleName(id: string) {
  return rules.value.find(item => item.id === id)?.name || id
}
function defaultConfig(id: string) {
  return rules.value.find(item => item.id === id)?.defaultConfigJson || "{}"
}

onMounted(async () => {
  try {
    const [list, ruleResponse] = await Promise.all([loadStations(), getReviewRules()])
    rules.value = ruleResponse.data ?? []
    if (list[0]) stationId.value = list[0].id
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "初始化规则绑定失败"))
  }
})
</script>

<template>
  <section class="lw2-content">
    <div class="lw2-page-title">
      <h2>站点规则绑定</h2>
      <el-space>
        <el-select v-model="stationId" filterable placeholder="请选择站点" style="width: 230px">
          <el-option v-for="station in stations" :key="station.id" :label="`${station.name}（${station.mn}）`" :value="station.id" />
        </el-select><el-button :icon="Refresh" @click="loadBindings">
          刷新
        </el-button><el-button type="primary" :icon="Plus" :disabled="!stationId" @click="edit()">
          新增绑定
        </el-button>
      </el-space>
    </div>
    <el-table v-loading="loading" :data="bindings" height="100%">
      <el-table-column label="站点" min-width="160">
        <template #default>
          {{ selectedStation?.name }}
        </template>
      </el-table-column>
      <el-table-column label="审核规则" min-width="200">
        <template #default="scope">
          {{ ruleName(scope.row.ruleDefinitionId) }}
        </template>
      </el-table-column>
      <el-table-column label="全局默认配置" min-width="250" show-overflow-tooltip>
        <template #default="scope">
          {{ defaultConfig(scope.row.ruleDefinitionId) }}
        </template>
      </el-table-column>
      <el-table-column label="本站覆盖" min-width="220">
        <template #default="scope">
          <el-tag v-if="!scope.row.configOverrideJson || scope.row.configOverrideJson === '{}'" type="info">
            使用默认值
          </el-tag><code v-else>{{ scope.row.configOverrideJson }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="100" align="right" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button link type="primary" :icon="Edit" @click="edit(scope.row)">
            编辑
          </el-button><el-button link type="danger" :icon="Delete" @click="remove(scope.row)">
            解绑
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑规则绑定' : '新增规则绑定'" width="620px">
      <el-form :model="form" label-width="115px">
        <el-form-item label="站点" required>
          <el-select v-model="form.stationId" filterable style="width: 100%">
            <el-option v-for="station in stations" :key="station.id" :label="`${station.name}（${station.mn}）`" :value="station.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核规则" required>
          <el-select v-model="form.ruleDefinitionId" filterable style="width: 100%">
            <el-option v-for="rule in rules" :key="rule.id" :label="`${rule.name}（${rule.code}）`" :value="rule.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="全局默认配置">
          <pre class="default-config">{{ defaultConfig(form.ruleDefinitionId) }}</pre>
        </el-form-item>
        <el-form-item label="本站阈值覆盖">
          <el-input v-model="form.configOverrideJson" type="textarea" :rows="5" placeholder="不覆盖时填写 {}；仅填写变化字段，如 {&quot;maximum&quot;:35}" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="form.priority" :min="0" /><span class="priority-help">数字越小越先执行</span>
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
.default-config {
  width: 100%;
  max-height: 130px;
  padding: 9px;
  margin: 0;
  overflow: auto;
  font-size: 12px;
  background: #f5f7fa;
  border-radius: 0;
  white-space: pre-wrap;
}
.priority-help {
  margin-left: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
