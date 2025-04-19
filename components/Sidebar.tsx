import React, { useState, useEffect } from 'react';
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
    'category-theoretic-perspective': 'categoryTheoreticPerspective',
    'time-operator-formalism': 'timeOperatorFormalism',
    'temporal-prime-decomposition': 'temporalPrimeDecomposition',
    'coherence-preserving-dynamics': 'coherencePreservingDynamics',
    'temporal-observer-frames': 'temporalObserverFrames',
    'non-local-temporal-correlations': 'nonLocalTemporalCorrelations',
    'emergent-temporal-order': 'emergentTemporalOrder'
  };

  // Check for special cases first
  if (specialCases[id]) {
    return specialCases[id];
  }
  
  // Convert kebab-case to camelCase for normal cases
  return id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const path = router.asPath.split('?')[0];
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile view on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile && onClose) {
      onClose();
    }
  }, [path, isMobile, onClose]);
  
  // Use a more explicit class to ensure visibility
  const sidebarClass = isMobile ? 
    (isOpen ? 'sidebar sidebar-mobile open' : 'sidebar sidebar-mobile closed') : 
    'sidebar';
    
  // Log the current state for debugging
  useEffect(() => {
    if (isMobile) {
      console.log('Sidebar mobile state changed, isOpen:', isOpen);
    }
  }, [isOpen, isMobile]);
  
  return (
    <nav className={sidebarClass} id="main-sidebar">
      <div className="sidebar-header">
        <h3>Sections</h3>
        {isMobile && onClose && (
          <button className="close-sidebar" onClick={onClose} aria-label="Close sidebar">
            ×
          </button>
        )}
      </div>
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
      
      <style jsx>{`
        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #ddd;
        }
        
        .sidebar-header h3 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
        }
        
        .close-sidebar {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #333;
          padding: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        
        .close-sidebar:hover {
          background-color: #e0e0e0;
        }
        
        /* The styles for mobile sidebar are now managed in App.css */
        }
      `}</style>
    </nav>
  );
}