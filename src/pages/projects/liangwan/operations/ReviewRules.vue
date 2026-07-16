<script setup lang="ts">
/* eslint-disable style/max-statements-per-line */
import type { ParameterDefinition, ReviewRule } from "../apis/type"
import { ElMessage } from "element-plus"
import { onMounted, ref } from "vue"
import { createReviewRule, getParameterDefinitions, getReviewRules, updateReviewRule } from "../apis"

const rows = ref<ReviewRule[]>([]); const parameters = ref<ParameterDefinition[]>([]); const dialogVisible = ref(false)
const form = ref<Partial<ReviewRule>>({ implementationKey: "Range", defaultConfigJson: "{\n  \"minimum\": 0,\n  \"maximum\": 100,\n  \"includeMinimum\": true,\n  \"includeMaximum\": true,\n  \"missingValuePolicy\": \"Error\"\n}", configSchemaJson: "{\n  \"type\": \"object\"\n}" })
async function load() {
  try {
    [rows.value, parameters.value] = await Promise.all([getReviewRules(), getParameterDefinitions({ pageSize: 200 }).then(item => item.items)])
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
function openDialog(row?: ReviewRule) {
  form.value = row ? { ...row } : { implementationKey: "Range", defaultConfigJson: "{\n  \"minimum\": 0,\n  \"maximum\": 100,\n  \"includeMinimum\": true,\n  \"includeMaximum\": true,\n  \"missingValuePolicy\": \"Error\"\n}", configSchemaJson: "{\n  \"type\": \"object\"\n}" }; dialogVisible.value = true
}
async function save() {
  try {
    JSON.parse(form.value.defaultConfigJson || "{}"); JSON.parse(form.value.configSchemaJson || "{}"); if (form.value.id) await updateReviewRule(form.value.id, form.value); else await createReviewRule(form.value); ElMessage.success("审核规则已保存"); dialogVisible.value = false; load()
  } catch (error: any) {
    ElMessage.error(error instanceof SyntaxError ? "规则 JSON 格式不正确" : error.message)
  }
}
onMounted(load)
</script>

<template>
  <section class="page-card">
    <header>
      <div><h2>全局参数审核规则</h2><p>定义可复用的范围、条件比较和连续同值审核规则。</p></div><el-button type="primary" @click="openDialog()">
        新增规则
      </el-button>
    </header><el-table :data="rows" border>
      <el-table-column prop="code" label="编码" /><el-table-column prop="name" label="名称" /><el-table-column prop="implementationKey" label="规则模板" /><el-table-column prop="description" label="说明" /><el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">
            编辑
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </section><el-dialog v-model="dialogVisible" :title="form.id ? '编辑审核规则' : '新增审核规则'" width="680px">
    <el-form label-width="110px">
      <el-form-item label="规则编码" required>
        <el-input v-model="form.code" />
      </el-form-item><el-form-item label="规则名称" required>
        <el-input v-model="form.name" />
      </el-form-item><el-form-item label="目标参数" required>
        <el-select v-model="form.parameterDefinitionId" filterable>
          <el-option v-for="parameter in parameters" :key="parameter.id" :label="`${parameter.name}（${parameter.code}）`" :value="parameter.id" />
        </el-select>
      </el-form-item><el-form-item label="规则模板">
        <el-select v-model="form.implementationKey">
          <el-option v-for="item in ['Range', 'Comparison', 'ConsecutiveSameValue']" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item><el-form-item label="默认配置 JSON">
        <el-input v-model="form.defaultConfigJson" type="textarea" :rows="7" />
      </el-form-item><el-form-item label="Schema JSON">
        <el-input v-model="form.configSchemaJson" type="textarea" :rows="4" />
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
