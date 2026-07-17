<script lang="ts" setup>
import ShoreHistoryPage from "../ShoreHistoryPage.vue"
</script>

<template>
  <!-- 单岸基站页面只传入编号，具体参数类型和字段配置由 shore/config.ts 统一管理。 -->
  <ShoreHistoryPage shore="NB10" />
</template>
