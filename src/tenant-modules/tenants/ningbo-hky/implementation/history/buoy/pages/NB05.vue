<script lang="ts" setup>
import BuoyHistoryPage from "../BuoyHistoryPage.vue"
</script>

<template>
  <!-- 单设备页面只传入编号，具体字段、表名、围栏配置都从 buoy/config.ts 读取。 -->
  <BuoyHistoryPage buoy="NB05" />
</template>
