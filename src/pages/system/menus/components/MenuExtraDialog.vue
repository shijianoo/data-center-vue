<script lang="ts" setup>
import type { MenuExtra } from "@/common/apis/menus/type"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref } from "vue"
import { getMenu, updateMenuExtra } from "@/common/apis/menus"

interface Props {
  menuId?: string
}

const props = defineProps<Props>()
const visible = defineModel<boolean>("visible")

const defaultForm: MenuExtra = {
  isHidden: false,
  breadcrumb: false,
  affix: false,
  alwaysShow: false,
  keepAlive: true
}

const loading = ref(false)
const formData = ref<MenuExtra>(cloneDeep(defaultForm))

async function loadData() {
  if (!props.menuId) return
  loading.value = true
  try {
    const { data } = await getMenu(props.menuId)
    formData.value = Object.assign(cloneDeep(defaultForm), data.extra || {})
  } catch (error) {
    console.error("获取扩展信息失败", error)
    ElMessage.error("获取扩展信息失败")
  } finally {
    loading.value = false
  }
}

function handleDialogOpen() {
  if (!props.menuId) {
    visible.value = false
    ElMessage.warning("请先选择菜单")
  }
}

function handleClosed() {
  formData.value = cloneDeep(defaultForm)
}

async function handleSubmit() {
  if (!props.menuId) return
  loading.value = true
  try {
    const submitData: MenuExtra = {
      ...formData.value,
      id: props.menuId
    }
    await updateMenuExtra(submitData)
    ElMessage.success("扩展信息保存成功")
    visible.value = false
  } catch (error) {
    console.error(error)
    ElMessage.error("保存失败")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="菜单扩展信息"
    @open="handleDialogOpen"
    @opened="loadData"
    @closed="handleClosed"
    width="500px"
    destroy-on-close
  >
    <div v-loading="loading">
      <el-form :model="formData" label-width="120px">
        <el-tabs type="border-card">
          <el-tab-pane label="显示配置">
            <el-form-item prop="svgIcon" label="SVG图标">
              <el-input v-model="formData.svgIcon" placeholder="请输入SVG图标名称">
                <template #prepend>
                  <SvgIcon v-if="formData.svgIcon" :name="formData.svgIcon as any" />
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="isHidden" label="是否隐藏">
              <el-radio-group v-model="formData.isHidden">
                <el-radio :label="false">
                  显示
                </el-radio>
                <el-radio :label="true">
                  隐藏
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item prop="breadcrumb" label="面包屑显示">
              <el-radio-group v-model="formData.breadcrumb">
                <el-radio :label="true">
                  显示
                </el-radio>
                <el-radio :label="false">
                  隐藏
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item prop="alwaysShow" label="是否总是显示">
              <el-radio-group v-model="formData.alwaysShow">
                <el-radio :label="false">
                  不总是显示
                </el-radio>
                <el-radio :label="true">
                  总是显示
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="高级配置">
            <el-form-item prop="affix" label="固定标签">
              <el-radio-group v-model="formData.affix">
                <el-radio :label="false">
                  不固定
                </el-radio>
                <el-radio :label="true">
                  固定
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item prop="keepAlive" label="页面缓存">
              <el-radio-group v-model="formData.keepAlive">
                <el-radio :label="false">
                  不缓存
                </el-radio>
                <el-radio :label="true">
                  缓存
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </div>
    <template #footer>
      <el-button :loading="loading" @click="visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped></style>
