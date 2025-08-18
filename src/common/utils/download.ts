/**
 * 下载文件
 * @param url 完整的下载 URL（调用方已拼接好参数）
 * @param filename 可选的文件名，不传则使用后端指定的文件名
 */
export function downloadFile(url: string, filename?: string) {
  try {
    // 不要对URL进行额外的编码，避免重复编码问题
    const link = document.createElement("a")
    link.href = url

    if (filename) {
      link.download = filename
    }

    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.warn("使用 a 标签下载失败，降级使用 window.open:", error)
    // 降级方案直接使用原始URL，避免重复编码
    window.open(url, "_blank")
  }
}

/**
 * 构建下载URL，确保参数格式正确
 * @param baseUrl 基础URL
 * @param params 参数对象
 * @returns 完整的下载URL
 */
export function buildDownloadUrl(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl)

  // 添加所有参数到URL
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  return url.toString()
}
