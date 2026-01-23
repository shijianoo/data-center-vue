import { useRoute } from "vue-router"

interface TenantParams {
  tenantKey: string
  projectKey: string
  modelKey: string
  deviceCode: string
}

export function useTenantRoute() {
  const route = useRoute()
  return route as ReturnType<typeof useRoute> & { params: TenantParams }
}
