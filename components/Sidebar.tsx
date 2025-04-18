import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { SectionData, sectionsData } from '../src/content/sections/sectionsData';

// Helper function to convert kebab-case IDs to camelCase for file paths
function convertIdToFilePath(id: string): string {
  if (!id) return id;
  
  // Special case mappings for IDs that don't follow the normal pattern
  const specialCases: Record<string, string> = {
    'uor-generalization': 'generalization',
    'algebraic-topological-enhancements': 'algebraicTopologicalEnhancements',
    'category-theoretic-perspective': 'categoryTheoreticPerspective'
  };

  // Check for special cases first
  if (specialCases[id]) {
    return specialCases[id];
  }
  
  // Convert kebab-case to camelCase for normal cases
  return id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

export default function Sidebar() {
  const router = useRouter();
  const path = router.asPath.split('?')[0];
  
  return (
    <nav className="sidebar">
      <ul>
        {sectionsData.map((section: SectionData) => {
          const sectionPath = `/${section.id}`;
          const isActiveSection = path === sectionPath || path.startsWith(`${sectionPath}/`);
          
          return (
            <li key={section.id} data-testid={`section-${section.id}`}>
              <Link 
                href={sectionPath} 
                className={isActiveSection ? 'active' : ''} 
                data-testid={`section-link-${section.id}`}
              >
                {section.title}
              </Link>
              {section.subsections && (
                <ul className={isActiveSection ? 'active' : 'hidden'}>
                  {section.subsections.map((sub) => {
                    // Convert subsection ID from kebab-case to camelCase for file paths
                    const subPath = `${sectionPath}/${convertIdToFilePath(sub.id)}`;
                    const isActiveSub = path === subPath;
                    
                    return (
                      <li key={sub.id} data-testid={`subsection-${sub.id}`}>
                        <Link 
                          href={subPath} 
                          className={isActiveSub ? 'active' : ''} 
                          data-testid={`subsection-link-${sub.id}`}
                        >
                          {sub.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}