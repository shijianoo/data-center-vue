<script lang="ts" setup>
import type { MenuExtra } from "@/common/apis/menus/type"
import { cloneDeep } from "lodash-es"
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
  keepAlive: false
}

const loading = ref(false)
const formData = ref<MenuExtra>(cloneDeep(defaultForm))

async function loadData() {
  const { data } = await getMenu(props.menuId!)
  formData.value = data.extra!
}

function handleDialogOpen() {
  if (!props.menuId) {
    visible.value = false
    ElMessage.warning("请先选择设备")
  }
}

function handleClosed() {
  visible.value = false
  formData.value = cloneDeep(defaultForm)
}

async function handleSubmit() {
  loading.value = true
  try {
    await updateMenuExtra(props.menuId!, formData.value)
    ElMessage.success("操作成功")
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog
    title="分配菜单" v-model="visible" width="30%" @open="handleDialogOpen" @opened="loadData"
    @closed="handleClosed"
  >
    <el-form
      :data="formData"
    >
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
    </el-form>
    <template #footer>
      <el-button :loading="loading" @click="handleClosed">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped></style>
