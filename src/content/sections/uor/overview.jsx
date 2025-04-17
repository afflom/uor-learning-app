import React from 'react'
import SubsectionTemplate from '../../../templates/SubsectionTemplate'
import { overview } from '../metadata'

/**
 * Overview and Motivation subsection under UOR section.
 * TODO: populate with summary and context.
 */
function OverviewSubsection() {
  return (
    <SubsectionTemplate metadata={overview}>
      <p>This subsection provides an overview and motivation for UOR.</p>
    </SubsectionTemplate>
  )
}

export default OverviewSubsection