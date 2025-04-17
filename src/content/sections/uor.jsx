import React from 'react'
import SectionTemplate from '../../templates/SectionTemplate'
import { uor } from './metadata'

/**
 * Main section for Universal Object Reference (UOR).
 * Content should be populated within the SectionTemplate wrapper.
 */
function UORSection() {
  return (
    <SectionTemplate metadata={uor}>
      {/* TODO: Populate with UOR introduction and core content. */}
      <p>
        This section will introduce the Universal Object Reference and Prime
        Framework.
      </p>
    </SectionTemplate>
  )
}

export default UORSection