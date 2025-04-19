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
    id: md.universalCoordinates.id,
    title: md.universalCoordinates.title,
    description: md.universalCoordinates.description,
    subsections: [
      { id: md.universalNumbersFoundation.id, title: md.universalNumbersFoundation.title },
      { id: md.computabilityAspects.id, title: md.computabilityAspects.title },
      { id: md.algebraicStructure.id, title: md.algebraicStructure.title },
      { id: md.topologicalProperties.id, title: md.topologicalProperties.title },
      { id: md.universalAnalysis.id, title: md.universalAnalysis.title },
      { id: md.applicationsDomains.id, title: md.applicationsDomains.title }
    ]
  },
  {
    id: md.temporalCoherence.id,
    title: md.temporalCoherence.title,
    description: md.temporalCoherence.description,
    subsections: [
      { id: md.timeOperatorFormalism.id, title: md.timeOperatorFormalism.title },
      { id: md.temporalPrimeDecomposition.id, title: md.temporalPrimeDecomposition.title },
      { id: md.coherencePreservingDynamics.id, title: md.coherencePreservingDynamics.title },
      { id: md.temporalObserverFrames.id, title: md.temporalObserverFrames.title },
      { id: md.nonLocalTemporalCorrelations.id, title: md.nonLocalTemporalCorrelations.title },
      { id: md.emergentTemporalOrder.id, title: md.emergentTemporalOrder.title }
    ]
  },
  {
    id: md.signalProcessing.id,
    title: md.signalProcessing.title,
    description: md.signalProcessing.description,
    subsections: [
      { id: md.universalTransforms.id, title: md.universalTransforms.title },
      { id: md.blockConversion.id, title: md.blockConversion.title },
      { id: md.signalCompression.id, title: md.signalCompression.title },
      { id: md.informationPreservation.id, title: md.informationPreservation.title },
      { id: md.pivotFields.id, title: md.pivotFields.title }
    ]
  },
  {
    id: md.internetSubstrate.id,
    title: md.internetSubstrate.title,
    description: md.internetSubstrate.description,
    subsections: [
      { id: md.digitalTwinFramework.id, title: md.digitalTwinFramework.title },
      { id: md.tripartiteKernel.id, title: md.tripartiteKernel.title },
      { id: md.universalIdentity.id, title: md.universalIdentity.title },
      { id: md.mediaTypeDefinition.id, title: md.mediaTypeDefinition.title },
      { id: md.distributedCompute.id, title: md.distributedCompute.title }
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