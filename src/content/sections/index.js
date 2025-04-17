import { lazy } from 'react'

// Metadata imports
import * as metadata from './metadata'

// Lazy-loaded section components
const UORSection = lazy(() => import('./uor'))
const FoundationsSection = lazy(() => import('./foundations'))

// Lazy-loaded subsections
const OverviewSub = lazy(() => import('./uor/overview'))
const UniqueFactSub = lazy(() => import('./foundations/uniqueFactorization'))

/**
 * Array of section definitions for navigation and routing.
 * Each section has an id, title, description, component, and optional subsections.
 */
export const sections = [
  {
    id: metadata.uor.id,
    title: metadata.uor.title,
    description: metadata.uor.description,
    Component: UORSection,
    subsections: [
      {
        id: metadata.overview.id,
        title: metadata.overview.title,
        Component: OverviewSub
      }
      // further subsections can be added here
    ]
  },
  {
    id: metadata.foundations.id,
    title: metadata.foundations.title,
    description: metadata.foundations.description,
    Component: FoundationsSection,
    subsections: [
      {
        id: metadata.uniqueFactorization.id,
        title: metadata.uniqueFactorization.title,
        Component: UniqueFactSub
      }
    ]
  }
  // further sections can be added here
]
