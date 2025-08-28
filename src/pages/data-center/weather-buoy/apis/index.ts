import type { CardData } from "./type"
import axios from "axios"

export const API_BASE_URL = "http://150.158.28.39:8100"

export function getBuoyData(fromCard: string, pageIndex: number, pageSize: number) {
  return axios.get(`${API_BASE_URL}/BDData/GetBuoyPagedData?dataType=driftingbuoy&fromCard=${fromCard}&pageIndex=${pageIndex}&pageSize=${pageSize}`)
}

export function getCardData() {
  return axios.get(`${API_BASE_URL}/card/list`)
}

export function addCard(card: CardData) {
  return axios.post(`${API_BASE_URL}/card/add`, card)
}

export function updateCard(id: string, card: CardData) {
  return axios.post(`${API_BASE_URL}/card/Update/${id}`, card)
}

export function deleteCard(id: string) {
  return axios.delete(`${API_BASE_URL}/card/delete?id=${id}`)
}

export function getWeatherBuoyData(deviceId: string, pageIndex: number, pageSize: number) {
  return axios.get(`${API_BASE_URL}/WeatherBuoy/PagedData?deviceId=${deviceId}&pageIndex=${pageIndex}&pageSize=${pageSize}`)
}
