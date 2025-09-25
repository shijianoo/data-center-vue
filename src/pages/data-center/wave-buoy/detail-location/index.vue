<script lang="ts" setup>
import AMapLoader from "@amap/amap-jsapi-loader"
import { onMounted, onUnmounted } from "vue"

defineOptions({
  name: "DetailLocation"
})

let map: any | null = null

onMounted(() => {
  window._AMapSecurityConfig = {
    securityJsCode: "315e9072c6e3433a437aede3570020c9"
  }
  AMapLoader.load({
    key: "ad4165a2acd181970b0f8313af6b7a0b", // 申请好的Web端开发者Key，首次调用 load 时必填
    version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
    plugins: ["AMap.Scale"] // 需要使用的的插件列表，如比例尺'AMap.Scale'，支持添加多个如：['...','...']
  })
    .then((AMap) => {
      map = new AMap.Map("container", {
        // 设置地图容器id
        viewMode: "3D", // 是否为3D地图模式
        zoom: 11, // 初始化地图级别
        center: [116.397428, 39.90923] // 初始化地图中心点位置
      })
    })
    .catch((e) => {
      console.log(e)
    })
})

onUnmounted(() => {
  map?.destroy()
})
</script>

<template>
  <div class="w-full h-full" id="container" />
</template>

<style  lang="scss" scoped>

</style>
