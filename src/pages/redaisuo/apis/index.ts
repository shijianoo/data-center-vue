import axios from "axios"

// 基础 IP 地址
const BASE_IP = "http://150.158.28.39:9005/Data"

/** 获取 CT Chain 数据 */
export function getCTChain(psn: string, pageNumber: number, pageSize: number) {
  return axios.get(`${BASE_IP}/GetCTChain`, {
    params: {
      psn,
      pageNumber,
      pageSize
    }
  })
}

/** 获取 Tidal 数据 */
export function getTidal(psn: string, pageNumber: number, pageSize: number) {
  return axios.get(`${BASE_IP}/GetTidal`, {
    params: {
      psn,
      pageNumber,
      pageSize
    }
  })
}
