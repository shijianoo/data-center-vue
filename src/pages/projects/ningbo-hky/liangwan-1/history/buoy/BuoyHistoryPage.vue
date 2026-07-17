<script lang="ts" setup>
import type { BuoyKey, HistoryRow } from "./config.ts"
import { computed } from "vue"
import HistoryDataPage from "../components/HistoryDataPage.vue"
import { buoyHistoryConfig, buoyOptions, getBuoyName } from "./config.ts"

const props = defineProps<{
  buoy: BuoyKey
}>()

const groups = computed(() => buoyHistoryConfig[props.buoy] ?? [])
const pageTitle = computed(() => `${props.buoy} ${getBuoyName(props.buoy)}`)
const locationConfig = computed(() => buoyOptions.find(item => item.key === props.buoy))

function formatLocationStatus(row: HistoryRow) {
  // GPS 状态根据当前点位到固定围栏中心的距离判断，超过配置半径即异常。
  // 只有浮标 GPS 分组需要这列，所以保留在浮标包装页里传给通用组件。
  const config = locationConfig.value
  if (!config || config.longitude == null || config.latitude == null || config.radius == null) return "--"

  const longitude = parseCoordinate(row.g02)
  const latitude = parseCoordinate(row.g03)
  if (longitude == null || latitude == null) return "--"

  return getDistance(longitude, latitude, config.longitude, config.latitude) > config.radius ? "异常" : "正常"
}

function parseCoordinate(value: unknown) {
  // 兼容 g02/g03 中的 ddmm.mmmm 格式，便于和固定围栏中心点做米级距离计算。
  if (value === null || value === undefined || value === "") return null
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return null
  const absValue = Math.abs(numberValue)
  if (absValue > 180) {
    const degree = Math.floor(absValue / 100)
    const minutes = absValue - degree * 100
    const decimalDegree = degree + minutes / 60
    return numberValue < 0 ? -decimalDegree : decimalDegree
  }
  return numberValue
}

function getDistance(lng1: number, lat1: number, lng2: number, lat2: number) {
  // 使用 Haversine 公式计算两点球面距离，结果单位为米，适合电子围栏半径判断。
  const earthRadius = 6371000
  const radLat1 = toRad(lat1)
  const radLat2 = toRad(lat2)
  const deltaLat = toRad(lat2 - lat1)
  const deltaLng = toRad(lng2 - lng1)
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLng / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(value: number) {
  return value * Math.PI / 180
}
</script>

<template>
  <HistoryDataPage
    :serial-number="buoy"
    :title="pageTitle"
    :groups="groups"
    :get-location-status="formatLocationStatus"
  />
</template>
