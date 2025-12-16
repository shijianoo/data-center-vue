import type { Tenant } from "@/common/apis/tenant/type"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { getCurrentUserTenantsApi } from "@/common/apis/tenant"
import { PlatformTenantNo } from "@/common/constants/app-key"

export const useTenantStore = defineStore("tenant", () => {
  // 当前用户的租户列表
  const tenants = ref<Tenant[] | undefined>(undefined)

  // 当前租户
  const activeTenant = ref<Tenant | null>(null)

  // 是否是内部租户
  const isInternal = computed(() =>
    tenants.value?.some(t => t.tenantNo === PlatformTenantNo) ?? false
  )

  // 获取当前用户的租户列表
  async function getTenantList() {
    const { data } = await getCurrentUserTenantsApi()
    tenants.value = data
    console.log("当前用户的所有租户", tenants.value)
    console.log("是否为平台租户", isInternal.value)

    if (tenants.value?.length === 0) {
      console.log("该用户没有分配租户")
      return
    }

    if (activeTenant.value === null) {
      if (!isInternal.value) {
        const activeTenantId = localStorage.getItem("activeTenantId")
        if (activeTenantId) {
          const tenant = tenants.value.find(t => t.id === activeTenantId)
          if (tenant) {
            setAtiveTenant(tenant)
            return
          }
        }
      }
      setAtiveTenant(tenants.value[0])
    }
  }

  // 设置当前租户
  function setAtiveTenant(tenant: Tenant) {
    console.log("设置当前租户", tenant)
    activeTenant.value = tenant
    localStorage.setItem("activeTenantId", tenant.id)
  }

  return {
    tenants,
    activeTenant,
    isInternal,
    getTenantList,
    setAtiveTenant
  }
})
