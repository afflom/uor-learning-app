import React, { PropsWithChildren } from 'react'

interface SubsectionTemplateProps {
  metadata: {
    title: string
    description?: string
  }
}

/**
 * A template wrapper for subsection pages.
 */
function SubsectionTemplate({
  metadata,
  children
}: PropsWithChildren<SubsectionTemplateProps>) {
  const { title, description } = metadata
  return (
    <div className="subsection">
      <h2>{title}</h2>
      {description && <p className="subsection-description">{description}</p>}
      <div className="subsection-content">{children}</div>
    </div>
  )
}

export default SubsectionTemplate
