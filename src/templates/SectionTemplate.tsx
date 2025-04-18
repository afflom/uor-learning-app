import React, { PropsWithChildren } from 'react'

interface SectionTemplateProps {
  metadata: {
    title: string
    description?: string
  }
}

/**
 * A template wrapper for primary section pages.
 */
function SectionTemplate({
  metadata,
  children
}: PropsWithChildren<SectionTemplateProps>) {
  const { title, description } = metadata
  return (
    <div className="section">
      <h1>{title}</h1>
      {description && <p className="section-description">{description}</p>}
      <div className="section-content">{children}</div>
    </div>
  )
}

export default SectionTemplate
