import type { HistoryLocationQuery, HistoryQuery } from "./type"
import axios from "axios"

// 根据运行环境选择 baseURL`
const BASE_URL = import.meta.env.DEV
  ? "http://150.158.28.39:9206/ningbo/query" // 开发环境
  : "http://150.158.28.39:9206/ningbo/query" // 生产环境，修改为实际地址

const client = axios.create({ baseURL: BASE_URL })

// 获取浮标水文与气象数据
export function getBuoyMeteoPageData(sn: string, page: number, pageSize: number) {
  return client.get(`buoy/meteo/page?sn=${sn}&page=${page}&pageSize=${pageSize}`)
}

// 获取浮标水质数据
export function getBuoyWaterPageData(sn: string, page: number, pageSize: number) {
  return client.get(`buoy/water/page?sn=${sn}&page=${page}&pageSize=${pageSize}`)
}

// 获取浮标营养盐数据
export function getBuoyNutrientPageData(sn: string, page: number, pageSize: number) {
  return client.get(`buoy/nutrient/page?sn=${sn}&page=${page}&pageSize=${pageSize}`)
}

// 获取一分钟数据
export function getOneMinutePageData(sn: string, page: number, pageSize: number) {
  return client.get(`buoy/minute/page?sn=${sn}&page=${page}&pageSize=${pageSize}`)
}

// 获取十五分钟数据
export function getQuarterPageData(sn: string, page: number, pageSize: number) {
  return client.get(`buoy/quarter/page?sn=${sn}&page=${page}&pageSize=${pageSize}`)
}

// 获取岸基站水质数据
export function getShoreWaterPageData(sn: string, page: number, pageSize: number) {
  return client.get(`shore/water/page?sn=${sn}&page=${page}&pageSize=${pageSize}`)
}

// 获取岸基站营养盐数据
export function getShoreNutrientPageData(sn: string, page: number, pageSize: number) {
  return client.get(`shore/nutrient/page?sn=${sn}&page=${page}&pageSize=${pageSize}`)
}

// 获取岸基站海流数据
export function getShoreCurrentPageData(sn: string, page: number, pageSize: number) {
  return client.get(`shore/current/page?sn=${sn}&page=${page}&pageSize=${pageSize}`)
}

// 获取所有设备最新位置数据
export function getLatestDeviceLocations() {
  return client.get("location/latest")
}

// 获取历史位置数据
export function getHistoricalLocations(query: HistoryLocationQuery) {
  return client.post("location/historical", query)
}

// 查询历史数据
export function getHistoricalData(query: HistoryQuery) {
  return client.post("data/search", query)
}

// 查询最新数据
export function getLatestData(tableName: string, serialNumber: string, selectColumns: string[]) {
  return client.post("data/latest", { tableName, serialNumber, selectColumns })
}

// 导出数据,返回一个文件下载链接，可以使用这个链接来下载文件
export function exportFile(query: HistoryQuery) {
  return client.post("data/export", query)
}
