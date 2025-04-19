import * as md from './metadata';

export interface SubsectionData {
  id: string;
  title: string;
}

export interface SectionData {
  id: string;
  title: string;
  description?: string;
  subsections?: SubsectionData[];
}

export const sectionsData: SectionData[] = [
  {
    id: md.uor.id,
    title: md.uor.title,
    description: md.uor.description,
    subsections: [
      { id: md.overview.id, title: md.overview.title },
      { id: md.canonicalRepresentation.id, title: md.canonicalRepresentation.title },
      { id: md.spectralInterpretation.id, title: md.spectralInterpretation.title },
      { id: md.fiberBundle.id, title: md.fiberBundle.title },
      { id: md.observerCoherence.id, title: md.observerCoherence.title },
      { id: md.geometryOfPrimeSpaces.id, title: md.geometryOfPrimeSpaces.title },
      { id: md.algebraicEnhancements.id, title: md.algebraicEnhancements.title },
      { id: md.categoryTheoryPerspective.id, title: md.categoryTheoryPerspective.title },
      { id: md.uorGeneralization.id, title: md.uorGeneralization.title }
    ]
  },
  {
    id: md.foundations.id,
    title: md.foundations.title,
    description: md.foundations.description,
    subsections: [
      { id: md.intrinsicPrimes.id, title: md.intrinsicPrimes.title },
      { id: md.uniqueFactorization.id, title: md.uniqueFactorization.title },
      { id: md.primeCoordinates.id, title: md.primeCoordinates.title },
      { id: md.primeFormula.id, title: md.primeFormula.title },
      { id: md.coherenceNorm.id, title: md.coherenceNorm.title }
    ]
  },
  {
    id: md.coreAxioms.id,
    title: md.coreAxioms.title,
    description: md.coreAxioms.description,
    subsections: [
      { id: md.intrinsicPrimesAxiom.id, title: md.intrinsicPrimesAxiom.title },
      { id: md.uniqueFactorizationAxiom.id, title: md.uniqueFactorizationAxiom.title },
      { id: md.primeCoordinateHomomorphism.id, title: md.primeCoordinateHomomorphism.title },
      { id: md.canonicalRepresentationAxiom.id, title: md.canonicalRepresentationAxiom.title },
      { id: md.coherenceNormAxiom.id, title: md.coherenceNormAxiom.title },
      { id: md.coherenceInnerProduct.id, title: md.coherenceInnerProduct.title },
      { id: md.trilateralCoherence.id, title: md.trilateralCoherence.title },
      { id: md.universalMappingProperty.id, title: md.universalMappingProperty.title }
    ]
  },
  {
    id: md.extensions.id,
    title: md.extensions.title,
    description: md.extensions.description,
    subsections: [
      { id: md.beyondIntegers.id, title: md.beyondIntegers.title },
      { id: md.physicsInterpretation.id, title: md.physicsInterpretation.title },
      { id: md.philosophicalImplications.id, title: md.philosophicalImplications.title },
      { id: md.formalSupplement.id, title: md.formalSupplement.title },
      { id: md.formalGeneralization.id, title: md.formalGeneralization.title },
      { id: md.ensuringUFD.id, title: md.ensuringUFD.title },
      { id: md.recentExtensions.id, title: md.recentExtensions.title },
      { id: md.hiddenSymphony.id, title: md.hiddenSymphony.title },
      { id: md.practicalTranscendence.id, title: md.practicalTranscendence.title },
      { id: md.ultimateImplication.id, title: md.ultimateImplication.title },
      { id: md.incompletenessTheorem.id, title: md.incompletenessTheorem.title }
    ]
  }
];