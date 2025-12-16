export interface Links {
  name: string
  path: string
  exact?: boolean
}

export interface BreadcrumbItem {
  name: string
  path?: string
  onClick?: () => void
}
