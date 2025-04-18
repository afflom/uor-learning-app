/// <reference types="vite/client" />
// Allow importing MDX files as React components
declare module '*.mdx' {
  import { ComponentType } from 'react'
  const MDXComponent: ComponentType<Record<string, unknown>>
  export default MDXComponent
}