import React from 'react'
import SubsectionTemplate from '../../../templates/SubsectionTemplate'
import { uniqueFactorization } from '../metadata'

/**
 * Subsection: Unique Factorization.
 * Presents and proves the Fundamental Theorem of Arithmetic.
 */
function UniqueFactorizationSubsection() {
  return (
    <SubsectionTemplate metadata={uniqueFactorization}>
      {/* TODO: Populate with statement and proof of unique factorization. */}
      <p>
        This subsection will present the statement and proof of the Fundamental
        Theorem of Arithmetic.
      </p>
    </SubsectionTemplate>
  )
}

export default UniqueFactorizationSubsection