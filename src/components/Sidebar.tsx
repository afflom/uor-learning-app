import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { SectionDef } from '../content/sections'

interface SidebarProps {
  sections: SectionDef[]
}

function Sidebar({ sections }: SidebarProps) {
  const location = useLocation()
  return (
    <nav className="sidebar">
      <ul>
        {sections.map(section => {
          const isActiveSection = location.pathname.startsWith(`/${section.id}`)
          return (
            <li key={section.id}>
              <Link
                to={`/${section.id}`}
                className={isActiveSection ? 'active' : ''}
              >
                {section.title}
              </Link>
              {isActiveSection && section.subsections && (
                <ul>
                  {section.subsections.map(sub => (
                    <li key={sub.id}>
                      <Link
                        to={`/${section.id}/${sub.id}`}
                        className={
                          location.pathname === `/${section.id}/${sub.id}`
                            ? 'active'
                            : ''
                        }
                      >
                        {sub.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default Sidebar
