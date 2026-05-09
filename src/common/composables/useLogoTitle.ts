import { nextTick, onUnmounted } from "vue"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

interface LogoTitle { primary?: string, sub?: string }

/**
 * 在当前组件挂载期间临时覆盖 TenantLogo 的标题。
 * 组件卸载时自动恢复（无需手动清除）。
 *
 * ⚠️ 只能在 setup() 内调用（不能在事件回调里调用）。
 *    若需在事件回调中更新标题，使用返回值的 update() 方法：
 *
 * @example
 * // 基本用法（静态标题）：
 * useLogoTitle({ primary: "天津监测项目" })
 *
 * @example
 * // 事件回调中动态更新：
 * const { update } = useLogoTitle({ primary: "初始标题" })
 * function handleClick() {
 *   update({ primary: "新标题" })   // ✅ 不会报 onUnmounted 警告
 * }
 */
export function useLogoTitle(title: LogoTitle) {
  const tenantStore = useTenantContextStore()
  // 每次 setup() 调用生成唯一 token，标记"标题持有者"
  const token = Symbol()
  tenantStore.setTitleOverride(title, token)

  onUnmounted(async () => {
    // 等一个 tick：确保新页面的 setup() 已执行并可能设置了新 token
    await nextTick()
    // 只有仍是持有者才清除（防止清掉新页面已设的标题）
    if (tenantStore.isTitleOwner(token)) {
      tenantStore.setTitleOverride(null, token)
    }
  })

  /**
   * 在事件回调中更新标题（复用同一 token，不注册额外生命周期）。
   * 卸载时仍由上面的 onUnmounted 自动清除。
   */
  function update(newTitle: LogoTitle) {
    tenantStore.setTitleOverride(newTitle, token)
  }

  return { update }
}
