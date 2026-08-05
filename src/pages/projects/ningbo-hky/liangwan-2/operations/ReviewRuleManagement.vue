<script setup lang="ts">
import type { ReviewRuleDefinition } from "../types"
import { Delete, Edit, MagicStick, Plus, Refresh } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, reactive, ref, watch } from "vue"
import { createReviewRule, deleteReviewRule, getApiErrorMessage, getReviewRules, updateReviewRule } from "../apis"
import { useProjectOptions } from "../composables/useProjectOptions"

type RuleKey = "Range" | "Comparison" | "ConsecutiveSameValue" | "CircularGeofence"

const { parameterDefinitions, loadParameterDefinitions, parameterById } = useProjectOptions()
const rules = ref<ReviewRuleDefinition[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const defaultDialogVisible = ref(false)
const editingId = ref<number | "">("")
const defaultParameterId = ref<number | "">("")
const form = reactive({
  code: "",
  name: "",
  implementationKey: "Range" as RuleKey,
  parameterDefinitionId: "" as number | "",
  description: "",
  metric: "Rtd",
  minimum: 0 as number | null,
  maximum: 100 as number | null,
  includeMinimum: true,
  includeMaximum: true,
  missingValuePolicy: "Error",
  operator: "LessThanOrEqual",
  rightSource: "Constant",
  rightValue: 100 as number | null,
  rightParameterDefinitionId: "" as number | "",
  rightMetric: "Rtd",
  count: 3,
  longitudeParameterDefinitionId: "" as number | "",
  latitudeParameterDefinitionId: "" as number | "",
  centerSource: "Station" as "Station" | "Manual",
  centerLongitude: null as number | null,
  centerLatitude: null as number | null,
  radiusMeters: 500
})

const templates: Array<{ key: RuleKey, label: string, description: string }> = [
  { key: "Range", label: "数值范围", description: "判断数值是否在允许的上下限内" },
  { key: "Comparison", label: "条件比较", description: "与固定值或同帧参数进行比较" },
  { key: "ConsecutiveSameValue", label: "连续同值", description: "发现传感器连续多次上报相同值" },
  { key: "CircularGeofence", label: "当前位置圆形围栏", description: "检查设备当前经纬度是否位于指定圆形围栏内" }
]

/** 圆形围栏只允许选择独立配置的经度和纬度参数。 */
const coordinateParameters = computed(() => parameterDefinitions.value.filter(item => item.dataType === "Longitude" || item.dataType === "Latitude"))
const selectedParameter = computed(() => typeof form.parameterDefinitionId === "number" ? parameterById.value.get(form.parameterDefinitionId) : undefined)

const previewAlertType = computed(() => {
  if (form.implementationKey === "ConsecutiveSameValue") return "warning"
  return "success"
})

const previewText = computed(() => {
  const parameter = (typeof form.parameterDefinitionId === "number" ? parameterById.value.get(form.parameterDefinitionId)?.name : undefined) || "目标参数"
  if (form.implementationKey === "Range") {
    if (form.minimum != null && form.maximum != null) {
      return `${parameter} ${form.metric} 在 ${form.minimum} 至 ${form.maximum} 之间判定为【正常通过】，超出范围判定为【异常未通过】`
    }
    if (form.minimum != null) {
      return `${parameter} ${form.metric} ≥ ${form.minimum} 判定为【正常通过】，低于 ${form.minimum} 判定为【异常未通过】`
    }
    if (form.maximum != null) {
      return `${parameter} ${form.metric} ≤ ${form.maximum} 判定为【正常通过】，高于 ${form.maximum} 判定为【异常未通过】`
    }
    return `${parameter} ${form.metric} 未配置范围边界`
  }
  if (form.implementationKey === "Comparison") {
    const rightDesc = form.rightSource === "Constant"
      ? form.rightValue
      : `${typeof form.rightParameterDefinitionId === "number" ? (parameterById.value.get(form.rightParameterDefinitionId)?.name || form.rightParameterDefinitionId) : "同帧参数"}.${form.rightMetric}`
    return `${parameter} ${form.metric} ${operatorLabel(form.operator)} ${rightDesc} 时判定为【正常通过】，不满足条件判定为【异常未通过】`
  }
  if (form.implementationKey === "ConsecutiveSameValue") {
    return `${parameter} ${form.metric} 连续 ${form.count} 次值相同判定为【异常未通过】，未出现连续同值判定为【正常通过】`
  }
  const center = form.centerSource === "Station" ? "站点档案坐标" : `${form.centerLongitude ?? "—"}, ${form.centerLatitude ?? "—"}`
  return `设备当前坐标位于以 ${center} 为圆心、半径 ${form.radiusMeters} 米范围内判定为【正常通过】，超出围栏判定为【异常未通过】`
})

/** 加载全局规则及参数定义。 */
async function loadData() {
  loading.value = true
  try {
    const [{ data }] = await Promise.all([getReviewRules(), loadParameterDefinitions()])
    rules.value = data ?? []
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "审核规则加载失败"))
  } finally {
    loading.value = false
  }
}

/** 安全读取既有规则 JSON，用于编辑表单回填。 */
function parseConfig(json: string) {
  try {
    return JSON.parse(json) as Record<string, any>
  } catch {
    return {}
  }
}

/** 打开友好表单，用户无需直接编辑 JSON。 */
function edit(row?: ReviewRuleDefinition) {
  editingId.value = row?.id || ""
  const config = row ? parseConfig(row.defaultConfigJson) : {}
  const right = config.right || {}
  Object.assign(form, {
    code: row?.code || "",
    name: row?.name || "",
    implementationKey: (row?.implementationKey || "Range") as RuleKey,
    parameterDefinitionId: row?.parameterDefinitionId || parameterDefinitions.value[0]?.id || "",
    description: row?.description || "",
    metric: config.metric || config.leftMetric || "Rtd",
    minimum: config.minimum ?? 0,
    maximum: config.maximum ?? 100,
    includeMinimum: config.includeMinimum ?? true,
    includeMaximum: config.includeMaximum ?? true,
    missingValuePolicy: config.missingValuePolicy || "Error",
    operator: config.operator || "LessThanOrEqual",
    rightSource: right.source || "Constant",
    rightValue: right.value ?? 100,
    rightParameterDefinitionId: right.parameterDefinitionId || right.parameterId || (right.parameterCode ? parameterDefinitions.value.find(p => p.code === right.parameterCode)?.id : "") || "",
    rightMetric: right.metric || "Rtd",
    count: config.count ?? 3,
    longitudeParameterDefinitionId: config.longitudeParameterDefinitionId || config.longitudeParameterId || (config.longitudeParameterCode ? parameterDefinitions.value.find(p => p.code === config.longitudeParameterCode)?.id : "") || "",
    latitudeParameterDefinitionId: config.latitudeParameterDefinitionId || config.latitudeParameterId || (config.latitudeParameterCode ? parameterDefinitions.value.find(p => p.code === config.latitudeParameterCode)?.id : "") || "",
    centerSource: config.useStationCoordinates === false ? "Manual" : "Station",
    centerLongitude: config.centerLongitude ?? null,
    centerLatitude: config.centerLatitude ?? null,
    radiusMeters: config.radiusMeters ?? 500
  })
  dialogVisible.value = true
}

/** 根据所选参数和规则模板自动生成唯一规则编码、规则名称及说明。 */
function generateRuleIdentity() {
  if (editingId.value) return
  const parameter = typeof form.parameterDefinitionId === "number" ? parameterById.value.get(form.parameterDefinitionId) : undefined
  const template = templates.find(item => item.key === form.implementationKey)
  if (parameter && template) {
    const suffixes: Record<RuleKey, string> = {
      Range: "range",
      Comparison: "comparison",
      ConsecutiveSameValue: "same-value",
      CircularGeofence: "circular-geofence"
    }
    form.code = `${parameter.code}-${suffixes[form.implementationKey]}`
    form.name = `${parameter.name}${template.label}规则`
    form.description = template.description
    // 选择经纬度目标参数后同步填入对应的围栏参数 ID，减少重复选择。
    if (parameter.dataType === "Longitude") form.longitudeParameterDefinitionId = parameter.id
    if (parameter.dataType === "Latitude") form.latitudeParameterDefinitionId = parameter.id
  }
}

watch(() => [form.parameterDefinitionId, form.implementationKey], generateRuleIdentity)

/** 根据规则模板生成后端所需默认配置。 */
function buildConfig() {
  if (form.implementationKey === "Range") {
    return {
      metric: form.metric,
      minimum: form.minimum,
      maximum: form.maximum,
      includeMinimum: form.includeMinimum,
      includeMaximum: form.includeMaximum,
      missingValuePolicy: form.missingValuePolicy
    }
  }
  if (form.implementationKey === "Comparison") {
    return {
      leftMetric: form.metric,
      operator: form.operator,
      right: form.rightSource === "Constant"
        ? { source: "Constant", value: form.rightValue }
        : { source: "FrameParameter", parameterDefinitionId: form.rightParameterDefinitionId, metric: form.rightMetric },
      missingValuePolicy: form.missingValuePolicy
    }
  }
  if (form.implementationKey === "ConsecutiveSameValue") {
    return { count: form.count, metric: form.metric, missingValuePolicy: form.missingValuePolicy }
  }
  return {
    longitudeParameterDefinitionId: form.longitudeParameterDefinitionId,
    latitudeParameterDefinitionId: form.latitudeParameterDefinitionId,
    radiusMeters: form.radiusMeters,
    useStationCoordinates: form.centerSource === "Station",
    ...(form.centerSource === "Manual" ? { centerLongitude: form.centerLongitude, centerLatitude: form.centerLatitude } : {}),
    missingValuePolicy: form.missingValuePolicy
  }
}

/** 每种内置模板使用固定 JSON Schema，由表单负责生成配置。 */
function buildSchema(key: RuleKey) {
  const commonPolicy = { type: "string", enum: ["Pass", "Fail", "Error"] }
  if (key === "Range") return { type: "object", properties: { metric: { type: "string" }, minimum: { type: "number" }, maximum: { type: "number" }, includeMinimum: { type: "boolean" }, includeMaximum: { type: "boolean" }, missingValuePolicy: commonPolicy }, required: ["includeMinimum", "includeMaximum", "missingValuePolicy"] }
  if (key === "Comparison") return { type: "object", properties: { leftMetric: { type: "string" }, operator: { type: "string" }, right: { type: "object" }, missingValuePolicy: commonPolicy }, required: ["leftMetric", "operator", "right", "missingValuePolicy"] }
  if (key === "ConsecutiveSameValue") return { type: "object", properties: { count: { type: "integer", minimum: 2, maximum: 100 }, metric: { type: "string" }, missingValuePolicy: commonPolicy }, required: ["count", "metric", "missingValuePolicy"] }
  return { type: "object", properties: { longitudeParameterDefinitionId: { type: "integer" }, latitudeParameterDefinitionId: { type: "integer" }, radiusMeters: { type: "number", exclusiveMinimum: 0 }, useStationCoordinates: { type: "boolean" }, centerLongitude: { type: "number", minimum: -180, maximum: 180 }, centerLatitude: { type: "number", minimum: -90, maximum: 90 }, missingValuePolicy: commonPolicy }, required: ["longitudeParameterDefinitionId", "latitudeParameterDefinitionId", "radiusMeters", "useStationCoordinates", "missingValuePolicy"] }
}

/** 保存规则并执行模板对应的前端校验。 */
async function save() {
  if (!form.code.trim() || !form.name.trim() || !form.parameterDefinitionId) return ElMessage.warning("请填写编码、名称并选择参数")
  if (form.implementationKey === "Range" && form.minimum == null && form.maximum == null) return ElMessage.warning("范围规则至少填写一个边界")
  if (form.implementationKey === "Range" && form.minimum != null && form.maximum != null && form.minimum > form.maximum) return ElMessage.warning("最小值不能大于最大值")
  if (form.implementationKey === "Comparison" && form.rightSource === "FrameParameter" && !form.rightParameterDefinitionId) return ElMessage.warning("请选择同帧比较参数")
  if (form.implementationKey === "CircularGeofence" && !["Longitude", "Latitude"].includes(selectedParameter.value?.dataType || "")) return ElMessage.warning("圆形围栏规则的目标参数必须是经度或纬度类型")
  if (form.implementationKey === "CircularGeofence" && (!form.longitudeParameterDefinitionId || !form.latitudeParameterDefinitionId)) return ElMessage.warning("请选择经度参数和纬度参数")
  if (form.implementationKey === "CircularGeofence" && form.radiusMeters <= 0) return ElMessage.warning("围栏半径必须大于 0 米")
  if (form.implementationKey === "CircularGeofence" && form.centerSource === "Manual" && (form.centerLongitude == null || form.centerLatitude == null)) return ElMessage.warning("请输入完整的围栏圆心经纬度")
  if (form.implementationKey === "CircularGeofence" && form.radiusMeters <= 0) return ElMessage.warning("围栏半径必须大于 0 米")
  if (form.implementationKey === "CircularGeofence" && form.centerSource === "Manual" && (form.centerLongitude == null || form.centerLatitude == null)) return ElMessage.warning("请输入完整的围栏圆心经纬度")
  const payload = {
    code: form.code.trim(),
    name: form.name.trim(),
    implementationKey: form.implementationKey,
    parameterDefinitionId: form.parameterDefinitionId,
    defaultConfigJson: JSON.stringify(buildConfig()),
    configSchemaJson: JSON.stringify(buildSchema(form.implementationKey)),
    description: form.description.trim()
  }
  try {
    editingId.value ? await updateReviewRule(editingId.value as number, payload) : await createReviewRule(payload)
    ElMessage.success("审核规则保存成功")
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "审核规则保存失败"))
  }
}

/** 删除规则定义。 */
async function removeRule(row: ReviewRuleDefinition) {
  await ElMessageBox.confirm(`确认删除规则“${row.name}”？`, "删除确认", { type: "warning" })
  try {
    await deleteReviewRule(row.id)
    ElMessage.success("删除成功")
    await loadData()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "删除失败"))
  }
}

/** 为一个参数快速创建范围、比较和连续同值三个可继续调整的默认规则。 */
async function createDefaults() {
  const parameter = typeof defaultParameterId.value === "number" ? parameterById.value.get(defaultParameterId.value) : undefined
  if (!parameter) return ElMessage.warning("请选择目标参数")
  await ElMessageBox.confirm("将创建数值范围、条件比较、连续同值三个默认规则（默认阈值可继续编辑），是否继续？", "创建默认规则", { type: "info" })
  loading.value = true
  const defaults = [
    { suffix: "range", name: "数值范围", key: "Range" as RuleKey, config: { metric: parameter.primaryMetricSuffix || "Rtd", minimum: 0, maximum: 100, includeMinimum: true, includeMaximum: true, missingValuePolicy: "Error" } },
    { suffix: "comparison", name: "条件比较", key: "Comparison" as RuleKey, config: { leftMetric: parameter.primaryMetricSuffix || "Rtd", operator: "LessThanOrEqual", right: { source: "Constant", value: 100 }, missingValuePolicy: "Error" } },
    { suffix: "same-value", name: "连续同值", key: "ConsecutiveSameValue" as RuleKey, config: { count: 3, metric: parameter.primaryMetricSuffix || "Rtd", missingValuePolicy: "Error" } }
  ]
  let success = 0
  try {
    for (const item of defaults) {
      try {
        await createReviewRule({ code: `${parameter.code}-${item.suffix}`, name: `${parameter.name}${item.name}规则`, implementationKey: item.key, parameterDefinitionId: parameter.id, defaultConfigJson: JSON.stringify(item.config), description: item.name })
        success++
      } catch { /* 编码冲突时继续创建其他模板，最后统一反馈。 */ }
    }
    ElMessage.success(`已创建 ${success} 个默认规则`)
    defaultDialogVisible.value = false
    await loadData()
  } finally {
    loading.value = false
  }
}

function parameterName(id: number) {
  const item = parameterById.value.get(id)
  return item ? `${item.name}（${item.code}）` : id
}
function templateName(key: string) {
  return templates.find(item => item.key === key)?.label || key
}
function operatorLabel(value: string) {
  return ({ GreaterThan: ">", GreaterThanOrEqual: ">=", LessThan: "<", LessThanOrEqual: "<=", Equal: "=", NotEqual: "!=" } as Record<string, string>)[value] || value
}

onMounted(loadData)
</script>

<template>
  <section class="lw2-content">
    <div class="lw2-page-title">
      <h2>自动审核规则定义</h2>
      <el-space>
        <el-button :icon="Refresh" @click="loadData">
          刷新
        </el-button><el-button :icon="MagicStick" @click="defaultDialogVisible = true">
          创建默认规则
        </el-button><el-button type="primary" :icon="Plus" @click="edit()">
          新增规则
        </el-button>
      </el-space>
    </div>
    <el-alert title="规则定义由全局复用；本站点的阈值差异请在“规则绑定”中覆盖。" type="info" :closable="false" show-icon />
    <el-table v-loading="loading" :data="rules" class="rule-table" height="100%">
      <el-table-column prop="code" label="规则编码" min-width="170" fixed />
      <el-table-column prop="name" label="规则名称" min-width="190" />
      <el-table-column label="规则模板" width="130">
        <template #default="scope">
          <el-tag>{{ templateName(scope.row.implementationKey) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="目标参数" min-width="180">
        <template #default="scope">
          {{ parameterName(scope.row.parameterDefinitionId) }}
        </template>
      </el-table-column>
      <el-table-column prop="defaultConfigJson" label="默认配置" min-width="250" show-overflow-tooltip />
      <el-table-column prop="description" label="说明" min-width="170" show-overflow-tooltip />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="scope">
          <el-button link type="primary" :icon="Edit" @click="edit(scope.row)">
            编辑
          </el-button><el-button link type="danger" :icon="Delete" @click="removeRule(scope.row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑审核规则' : '新增审核规则'" width="720px" destroy-on-close>
      <el-form :model="form" label-width="115px">
        <el-form-item label="规则模板" required>
          <el-radio-group v-model="form.implementationKey" :disabled="Boolean(editingId)">
            <el-radio-button v-for="item in templates" :key="item.key" :value="item.key">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="目标参数" required>
          <el-select v-model="form.parameterDefinitionId" filterable :disabled="Boolean(editingId)" style="width: 100%">
            <el-option v-for="item in parameterDefinitions" :key="item.id" :label="`${item.name}（${item.code}）`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="规则编码" required>
              <el-input v-model="form.code" />
            </el-form-item>
          </el-col><el-col :span="12">
            <el-form-item label="规则名称" required>
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">
          规则条件
        </el-divider>
        <el-form-item v-if="form.implementationKey !== 'CircularGeofence'" label="审核指标">
          <el-input v-model="form.metric" placeholder="Rtd（有效主值）" />
        </el-form-item>
        <template v-if="form.implementationKey === 'Range'">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="最小值">
                <el-input-number v-model="form.minimum" controls-position="right" />
              </el-form-item>
            </el-col><el-col :span="12">
              <el-form-item label="最大值">
                <el-input-number v-model="form.maximum" controls-position="right" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="包含边界">
            <el-checkbox v-model="form.includeMinimum">
              包含最小值
            </el-checkbox><el-checkbox v-model="form.includeMaximum">
              包含最大值
            </el-checkbox>
          </el-form-item>
        </template>
        <template v-else-if="form.implementationKey === 'Comparison'">
          <el-form-item label="运算符">
            <el-select v-model="form.operator">
              <el-option label="大于 >" value="GreaterThan" /><el-option label="大于等于 >=" value="GreaterThanOrEqual" /><el-option label="小于 <" value="LessThan" /><el-option label="小于等于 <=" value="LessThanOrEqual" /><el-option label="等于 =" value="Equal" /><el-option label="不等于 !=" value="NotEqual" />
            </el-select>
          </el-form-item>
          <el-form-item label="右侧来源">
            <el-radio-group v-model="form.rightSource">
              <el-radio value="Constant">
                固定值
              </el-radio><el-radio value="FrameParameter">
                同一报文参数
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="form.rightSource === 'Constant'" label="固定值">
            <el-input-number v-model="form.rightValue" />
          </el-form-item>
          <el-row v-else :gutter="16">
            <el-col :span="14">
              <el-form-item label="比较参数">
                <el-select v-model="form.rightParameterDefinitionId" filterable style="width: 100%">
                  <el-option v-for="item in parameterDefinitions" :key="item.id" :label="`${item.name}（${item.code}）`" :value="item.id" />
                </el-select>
              </el-form-item>
            </el-col><el-col :span="10">
              <el-form-item label="指标">
                <el-input v-model="form.rightMetric" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
        <el-form-item v-else-if="form.implementationKey === 'ConsecutiveSameValue'" label="连续次数">
          <el-input-number v-model="form.count" :min="2" :max="100" />
        </el-form-item>
        <template v-else>
          <el-alert title="圆形围栏仅适用于经度或纬度类型参数，并检查同一帧中的一对坐标。" type="info" :closable="false" show-icon />
          <el-row :gutter="16" class="geofence-fields">
            <el-col :span="12">
              <el-form-item label="经度参数" required>
                <el-select v-model="form.longitudeParameterDefinitionId" filterable style="width: 100%">
                  <el-option v-for="item in coordinateParameters.filter(item => item.dataType === 'Longitude')" :key="item.id" :label="`${item.name}（${item.code}）`" :value="item.id" />
                </el-select>
              </el-form-item>
            </el-col><el-col :span="12">
              <el-form-item label="纬度参数" required>
                <el-select v-model="form.latitudeParameterDefinitionId" filterable style="width: 100%">
                  <el-option v-for="item in coordinateParameters.filter(item => item.dataType === 'Latitude')" :key="item.id" :label="`${item.name}（${item.code}）`" :value="item.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="围栏圆心">
            <el-radio-group v-model="form.centerSource">
              <el-radio value="Station">
                使用站点坐标
              </el-radio><el-radio value="Manual">
                手动指定坐标
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-row v-if="form.centerSource === 'Manual'" :gutter="16">
            <el-col :span="12">
              <el-form-item label="圆心经度" required>
                <el-input-number v-model="form.centerLongitude" :min="-180" :max="180" :precision="6" controls-position="right" />
              </el-form-item>
            </el-col><el-col :span="12">
              <el-form-item label="圆心纬度" required>
                <el-input-number v-model="form.centerLatitude" :min="-90" :max="90" :precision="6" controls-position="right" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="围栏半径" required>
            <el-input-number v-model="form.radiusMeters" :min="1" :max="1000000" controls-position="right" />
            <span class="field-unit">米</span>
          </el-form-item>
        </template>
        <el-form-item label="值缺失策略">
          <el-select v-model="form.missingValuePolicy">
            <el-option label="标记为规则错误（建议）" value="Error" /><el-option label="视为通过" value="Pass" /><el-option label="视为失败" value="Fail" />
          </el-select>
        </el-form-item>
        <el-alert :title="previewText" :type="previewAlertType" :closable="false" show-icon />
        <el-form-item label="说明" class="description-item">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-collapse>
          <el-collapse-item title="高级查看：最终默认配置 JSON">
            <pre class="config-preview">{{ JSON.stringify(buildConfig(), null, 2) }}</pre>
          </el-collapse-item>
        </el-collapse>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button><el-button type="primary" @click="save">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="defaultDialogVisible" title="创建默认审核规则" width="500px">
      <el-alert title="将为所选参数创建范围、比较、连续同值三个规则，初始阈值为 0～100，请创建后按参数实际量程调整。" type="warning" :closable="false" show-icon />
      <el-form label-width="90px" class="default-form">
        <el-form-item label="目标参数">
          <el-select v-model="defaultParameterId" filterable style="width: 100%">
            <el-option v-for="item in parameterDefinitions" :key="item.id" :label="`${item.name}（${item.code}）`" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="defaultDialogVisible = false">
          取消
        </el-button><el-button type="primary" :loading="loading" @click="createDefaults">
          创建
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped lang="scss">
@use "../styles.scss";
.rule-table {
  margin-top: 14px;
}
.description-item {
  margin-top: 16px;
}
.geofence-fields {
  margin-top: 16px;
}
.field-unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
.config-preview {
  padding: 10px;
  margin: 0;
  font-size: 12px;
  background: #f5f7fa;
  border-radius: 0;
}
.default-form {
  margin-top: 20px;
}
</style>
