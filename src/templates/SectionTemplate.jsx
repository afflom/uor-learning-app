import React from 'react'

/**
 * A template wrapper for primary section pages.
 * Displays title, optional description, and content area.
 */
function SectionTemplate({ metadata, children }) {
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