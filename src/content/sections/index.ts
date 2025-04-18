import React, { lazy } from 'react'

import * as metadata from './metadata'

// Lazy-loaded section components
const UORSection = lazy(() => import('./uor/index.mdx'))
const FoundationsSection = lazy(() => import('./foundations/index.mdx'))

// Lazy-loaded subsections
const OverviewSub = lazy(() => import('./uor/overview.mdx'))
const UniqueFactSub = lazy(() => import('./foundations/uniqueFactorization.mdx'))
// Lazy-loaded core axioms section
const CoreAxiomsSection = lazy(() => import('./coreAxioms/index.mdx'))

// Lazy-loaded UOR subsections
const CanonicalRepSub = lazy(() => import('./uor/canonicalRepresentation.mdx'))
const SpectralSub = lazy(() => import('./uor/spectralInterpretation.mdx'))
const FiberBundleSub = lazy(() => import('./uor/fiberBundle.mdx'))
const ObserverCoherenceSub = lazy(() => import('./uor/observerCoherence.mdx'))
const GeometryOfPrimeSpacesSub = lazy(() => import('./uor/geometryOfPrimeSpaces.mdx'))
const AlgebraicEnhancementsSub = lazy(() => import('./uor/algebraicTopologicalEnhancements.mdx'))
const CategoryTheorySub = lazy(() => import('./uor/categoryTheoreticPerspective.mdx'))
const UORGeneralizationSub = lazy(() => import('./uor/generalization.mdx'))

// Lazy-loaded Foundations subsections
const IntrinsicPrimesSub = lazy(() => import('./foundations/intrinsicPrimes.mdx'))
const PrimeCoordinatesSub = lazy(() => import('./foundations/primeCoordinates.mdx'))
const PrimeFormulaSub = lazy(() => import('./foundations/primeFormula.mdx'))
const CoherenceNormSub = lazy(() => import('./foundations/coherenceNorm.mdx'))

// Lazy-loaded Extensions section and subsections
const ExtensionsSection = lazy(() => import('./extensions/index.mdx'))
const BeyondIntegersSub = lazy(() => import('./extensions/beyondIntegers.mdx'))
const PhysicsSub = lazy(() => import('./extensions/physicsInterpretation.mdx'))
const PhilosophicalSub = lazy(() => import('./extensions/philosophicalImplications.mdx'))
const FormalSuppSub = lazy(() => import('./extensions/formalSupplement.mdx'))
const FormalGeneralizationSub = lazy(() => import('./extensions/formalGeneralization.mdx'))
const EnsuringUFDSub = lazy(() => import('./extensions/ensuringUniqueFactorization.mdx'))
const RecentExtensionsSub = lazy(() => import('./extensions/recentExtensions.mdx'))
const HiddenSymphonySub = lazy(() => import('./extensions/hiddenSymphony.mdx'))
const PracticalTranscendenceSub = lazy(() => import('./extensions/practicalTranscendence.mdx'))
const UltimateImplicationSub = lazy(() => import('./extensions/ultimateImplication.mdx'))
const IncompletenessTheoremSub = lazy(() => import('./extensions/incompletenessTheorem.mdx'))

/**
 * Definition for a subsection
 */
export interface SubsectionDef {
  id: string
  title: string
  Component: React.ComponentType
}

/**
 * Definition for a section
 */
export interface SectionDef {
  id: string
  title: string
  description?: string
  Component: React.ComponentType
  subsections?: SubsectionDef[]
}

/**
 * Array of section definitions for navigation and routing.
 */
export const sections: SectionDef[] = [
  // Introduction
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
      },
      {
        id: metadata.canonicalRepresentation.id,
        title: metadata.canonicalRepresentation.title,
        Component: CanonicalRepSub
      },
      {
        id: metadata.spectralInterpretation.id,
        title: metadata.spectralInterpretation.title,
        Component: SpectralSub
      },
      {
        id: metadata.fiberBundle.id,
        title: metadata.fiberBundle.title,
        Component: FiberBundleSub
      },
      {
        id: metadata.observerCoherence.id,
        title: metadata.observerCoherence.title,
        Component: ObserverCoherenceSub
      },
      {
        id: metadata.geometryOfPrimeSpaces.id,
        title: metadata.geometryOfPrimeSpaces.title,
        Component: GeometryOfPrimeSpacesSub
      },
      {
        id: metadata.algebraicEnhancements.id,
        title: metadata.algebraicEnhancements.title,
        Component: AlgebraicEnhancementsSub
      },
      {
        id: metadata.categoryTheoryPerspective.id,
        title: metadata.categoryTheoryPerspective.title,
        Component: CategoryTheorySub
      },
      {
        id: metadata.uorGeneralization.id,
        title: metadata.uorGeneralization.title,
        Component: UORGeneralizationSub
      }
    ]
  },
  {
    id: metadata.foundations.id,
    title: metadata.foundations.title,
    description: metadata.foundations.description,
    Component: FoundationsSection,
    subsections: [
      {
        id: metadata.intrinsicPrimes.id,
        title: metadata.intrinsicPrimes.title,
        Component: IntrinsicPrimesSub
      },
      {
        id: metadata.uniqueFactorization.id,
        title: metadata.uniqueFactorization.title,
        Component: UniqueFactSub
      },
      {
        id: metadata.primeCoordinates.id,
        title: metadata.primeCoordinates.title,
        Component: PrimeCoordinatesSub
      },
      {
        id: metadata.primeFormula.id,
        title: metadata.primeFormula.title,
        Component: PrimeFormulaSub
      },
      {
        id: metadata.coherenceNorm.id,
        title: metadata.coherenceNorm.title,
        Component: CoherenceNormSub
      }
    ]
  },
  {
    id: metadata.coreAxioms.id,
    title: metadata.coreAxioms.title,
    description: metadata.coreAxioms.description,
    Component: CoreAxiomsSection
  },
  {
    id: metadata.extensions.id,
    title: metadata.extensions.title,
    description: metadata.extensions.description,
    Component: ExtensionsSection,
    subsections: [
      {
        id: metadata.beyondIntegers.id,
        title: metadata.beyondIntegers.title,
        Component: BeyondIntegersSub
      },
      {
        id: metadata.physicsInterpretation.id,
        title: metadata.physicsInterpretation.title,
        Component: PhysicsSub
      },
      {
        id: metadata.philosophicalImplications.id,
        title: metadata.philosophicalImplications.title,
        Component: PhilosophicalSub
      },
      {
        id: metadata.formalSupplement.id,
        title: metadata.formalSupplement.title,
        Component: FormalSuppSub
      },
      {
        id: metadata.formalGeneralization.id,
        title: metadata.formalGeneralization.title,
        Component: FormalGeneralizationSub
      },
      {
        id: metadata.ensuringUFD.id,
        title: metadata.ensuringUFD.title,
        Component: EnsuringUFDSub
      },
      {
        id: metadata.recentExtensions.id,
        title: metadata.recentExtensions.title,
        Component: RecentExtensionsSub
      },
      {
        id: metadata.hiddenSymphony.id,
        title: metadata.hiddenSymphony.title,
        Component: HiddenSymphonySub
      },
      {
        id: metadata.practicalTranscendence.id,
        title: metadata.practicalTranscendence.title,
        Component: PracticalTranscendenceSub
      },
      {
        id: metadata.ultimateImplication.id,
        title: metadata.ultimateImplication.title,
        Component: UltimateImplicationSub
      },
      {
        id: metadata.incompletenessTheorem.id,
        title: metadata.incompletenessTheorem.title,
        Component: IncompletenessTheoremSub
      }
    ]
  },
  // (Research Directions section removed)
]
