const VITE_APP_TITLE = import.meta.env.VITE_APP_TITLE ?? "数据中心"

const dynamicTitle = ref<string>("")

function setTitle(title?: string) {
  dynamicTitle.value = title ? `${VITE_APP_TITLE} | ${title}` : VITE_APP_TITLE
}

function setDocumentTitle(title?: string) {
  dynamicTitle.value = title || VITE_APP_TITLE
}

watch(dynamicTitle, (value, oldValue) => {
  if (document && value !== oldValue) {
    document.title = value
  }
})

export function useTitle() {
  return { setTitle, setDocumentTitle }
}
