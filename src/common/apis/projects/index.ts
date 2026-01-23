import type { Project, ProjectExtra, ProjectForm, ProjectListResponseData } from "./type"
import { dataCenterRequest } from "@/http/axios"

/** 创建项目 */
export function createProjectApi(data: ProjectForm) {
  return dataCenterRequest({
    url: "/projects",
    method: "post",
    data
  })
}

/** 删除项目 */
export function deleteProjectApi(id: string) {
  return dataCenterRequest({
    url: `/projects/${id}`,
    method: "delete"
  })
}

/** 更新项目 */
export function updateProjectApi(id: string, data: ProjectForm) {
  return dataCenterRequest({
    url: `/projects/${id}`,
    method: "put",
    data
  })
}

/** 更新项目扩展信息 */
export function updateProjectExtraApi(id: string, data: ProjectExtra) {
  return dataCenterRequest({
    url: `/projects/${id}/extra`,
    method: "put",
    data
  })
}

/** 获取项目列表 */
export function getProjectListApi(tenantId?: string) {
  return dataCenterRequest<ProjectListResponseData>({
    url: "/projects",
    method: "get",
    params: { tenantId }
  })
}

/** 获取指定项目 */
export function getProjectApi(id: string) {
  return dataCenterRequest<ApiResponseData<Project>>({
    url: `/projects/${id}`,
    method: "get"
  })
}

/** 获取通过key指定项目 */
export function getProjectByKeyApi(value: string) {
  return dataCenterRequest<ApiResponseData<Project>>({
    url: `/projects/resolve/${value}`,
    method: "get"
  })
}
