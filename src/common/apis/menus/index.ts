import type * as Menus from "./type"
import { authCenterRequest } from "@/http/axios"

// 创建菜单
export function createMenu(data: Menus.MenuForm) {
  return authCenterRequest({
    url: "/menus",
    method: "post",
    data
  })
}

// 更新菜单
export function updateMenu(data: Menus.MenuForm) {
  return authCenterRequest({
    url: `/menus/${data.id}`,
    method: "put",
    data
  })
}

// 删除菜单
export function deleteMenu(id: string) {
  return authCenterRequest({
    url: `/menus/${id}`,
    method: "delete"
  })
}

// 获取菜单树
export function getMenuTree() {
  return authCenterRequest<Menus.MenuTreeListResponseData>({
    url: "/menus/tree",
    method: "get"
  })
}

// 获取当前用户菜单
export function getCurrentMenusApi() {
  return authCenterRequest<Menus.MenuTreeListResponseData>({
    url: "/menus/me",
    method: "get"
  })
}
