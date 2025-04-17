import React from 'react'

/**
 * A template wrapper for subsection pages.
 * Displays subtitle, optional description, and content area.
 */
function SubsectionTemplate({ metadata, children }) {
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