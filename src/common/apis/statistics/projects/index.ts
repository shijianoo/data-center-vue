import type { DeviceModelStatistics } from "./type"
import { dataCenterRequest } from "@/http/axios"

/** 获取指定项目的型号统计信息 */
export function getDeviceModelStatisticsApi(projectId: string) {
  return dataCenterRequest<ApiResponseData<DeviceModelStatistics[]>>({
    url: `/statistics/projects/${projectId}/models`,
    method: "get"
  })
}
