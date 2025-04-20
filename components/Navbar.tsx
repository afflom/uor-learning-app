import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { SectionData, sectionsData } from '../src/content/sections/sectionsData'
import dynamic from 'next/dynamic'

// Import UserAccount component with SSR disabled
const UserAccount = dynamic(() => import('./UserAccount'), { ssr: false })

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

interface NavbarProps {
  showSidebarToggle?: boolean;
}

export default function Navbar({ showSidebarToggle }: NavbarProps) {
  const router = useRouter()
  const path = router.asPath.split('?')[0];
  const [menuOpen, setMenuOpen] = useState(false)
  const [sectionsOpen, setSectionsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false) // Used in JSX conditional rendering
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null)

  // Determine active section
  const isActive = (path: string) => {
    return router.pathname.startsWith(path)
  }
  
  // Determine active section and subsection
  useEffect(() => {
    // Find which section is active
    const currentPath = router.asPath.split('?')[0];
    
    // Reset the active index
    let foundIndex = null;
    
    for (let i = 0; i < sectionsData.length; i++) {
      const section = sectionsData[i];
      const sectionPath = `/${section.id}`;
      
      if (currentPath === sectionPath || currentPath.startsWith(`${sectionPath}/`)) {
        foundIndex = i;
        break;
      }
    }
    
    setActiveSectionIndex(foundIndex);
  }, [router.asPath]);
  
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
  
  // Add a click outside handler to close the menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if the click was outside the navbar menu
      if (menuOpen && 
          !target.closest('.navbar-menu') && 
          !target.closest('.navbar-toggle') &&
          !target.closest('.sections-menu')) {
        setMenuOpen(false);
      }
      
      // Check if click was outside the sections menu
      if (sectionsOpen && 
          !target.closest('.sections-menu') && 
          !target.closest('.sections-toggle')) {
        setSectionsOpen(false);
      }
    };
    
    // Add document-wide click listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen, sectionsOpen]);
  
  // Close menu and sections on route change
  useEffect(() => {
    setMenuOpen(false);
    setSectionsOpen(false);
  }, [router.asPath]);

  // Toggle the sections menu
  const handleToggleSections = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSectionsOpen(!sectionsOpen);
  };

  return (
    <nav className={`navbar ${isMobile ? 'navbar-mobile' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link href="/welcome" className="navbar-logo">
            UOR Framework
          </Link>
          <div className="navbar-buttons">
            {/* Menu toggle button */}
            <button 
              className="navbar-toggle" 
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        <div className={`navbar-menu ${menuOpen ? 'is-open' : ''}`}>
          <div className="navbar-items">
            {/* Content nav item with sections toggle on mobile */}
            <div className={`navbar-item-wrapper ${isActive('/uor') ? 'active' : ''}`}>
              <Link href="/uor" className="navbar-item" onClick={() => setMenuOpen(false)}>
                Content
              </Link>
              {showSidebarToggle && (
                <button 
                  className={`sections-toggle ${sectionsOpen ? 'active' : ''}`}
                  onClick={handleToggleSections}
                  aria-label="Toggle sections"
                  data-testid="sections-toggle-button"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className={`navbar-item-wrapper ${isActive('/knowledge-base') ? 'active' : ''}`}>
              <Link href="/knowledge-base" className="navbar-item" onClick={() => setMenuOpen(false)}>
                Knowledge Base
              </Link>
            </div>
            
            <div className={`navbar-item-wrapper ${isActive('/settings') ? 'active' : ''}`}>
              <Link href="/settings" className="navbar-item" onClick={() => setMenuOpen(false)}>
                Settings
              </Link>
            </div>
            
            {/* Identity management link */}
            <div className={`navbar-item-wrapper ${isActive('/settings/identity') ? 'active' : ''}`}>
              <Link href="/settings/identity" className="navbar-item" onClick={() => setMenuOpen(false)}>
                Identity
              </Link>
            </div>
            
            {/* Mobile account section */}
            <div className="mobile-account">
              <UserAccount />
            </div>
          </div>
        </div>
        
        {/* Desktop account section */}
        <div className="desktop-account">
          <UserAccount />
        </div>
      </div>

      {/* Sections dropdown menu */}
      {sectionsOpen && (
        <div className="sections-menu">
          <div className="sections-menu-content">
            <div className="sections-menu-header">
              <h3>Sections</h3>
              <button 
                className="close-sections" 
                onClick={() => setSectionsOpen(false)}
                aria-label="Close sections menu"
              >
                ×
              </button>
            </div>
            <ul className="sections-list">
              {sectionsData.map((section: SectionData, index: number) => {
                const sectionPath = `/${section.id}`;
                const isActiveSection = path === sectionPath || path.startsWith(`${sectionPath}/`);
                const expanded = activeSectionIndex === index;
                
                return (
                  <li key={section.id} className={isActiveSection ? 'active' : ''} data-testid={`section-${section.id}`}>
                    <div className="section-header">
                      <Link 
                        href={sectionPath} 
                        className={`section-link ${isActiveSection ? 'active' : ''}`}
                        onClick={() => setSectionsOpen(false)}
                        data-testid={`section-link-${section.id}`}
                        style={{
                          color: isActiveSection ? 'white' : '#333', 
                          backgroundColor: isActiveSection ? '#4a7eff' : 'transparent',
                          borderRadius: '6px',
                          padding: '0.6rem 0.8rem',
                          boxShadow: isActiveSection ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {section.title}
                      </Link>
                      {section.subsections && section.subsections.length > 0 && (
                        <button 
                          className={`expand-toggle ${expanded ? 'expanded' : ''}`}
                          onClick={() => setActiveSectionIndex(expanded ? null : index)}
                          aria-label={expanded ? "Collapse section" : "Expand section"}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M7 10l5 5 5-5z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    {section.subsections && section.subsections.length > 0 && (
                      <ul className={expanded ? 'subsections-list expanded' : 'subsections-list'}>
                        {section.subsections.map((sub) => {
                          // Convert subsection ID from kebab-case to camelCase for file paths
                          const subPath = `${sectionPath}/${convertIdToFilePath(sub.id)}`;
                          const isActiveSub = path === subPath;
                          
                          return (
                            <li key={sub.id} className={isActiveSub ? 'active' : ''} data-testid={`subsection-${sub.id}`}>
                              <Link 
                                href={subPath} 
                                className={`subsection-link ${isActiveSub ? 'active' : ''}`}
                                onClick={() => setSectionsOpen(false)}
                                data-testid={`subsection-link-${sub.id}`}
                                style={{
                                  color: isActiveSub ? 'white' : '#555',
                                  backgroundColor: isActiveSub ? '#4a7eff' : 'transparent',
                                  borderRadius: '6px',
                                  padding: '0.5rem 0.7rem',
                                  marginLeft: '0.4rem',
                                  fontSize: '0.95rem',
                                  boxShadow: isActiveSub ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                  transition: 'all 0.2s ease'
                                }}
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
          </div>
        </div>
      )}

      {/* Overlay for mobile when sections menu is open */}
      {sectionsOpen && (
        <div className="sections-overlay" onClick={() => setSectionsOpen(false)}></div>
      )}

      <style jsx>{`
        .navbar {
          background: #0c1e35;
          color: white;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .navbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          height: 60px;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
        }
        
        .navbar-buttons {
          display: flex;
          align-items: center;
        }

        .navbar-logo {
          font-size: 1.4rem;
          font-weight: 700;
          color: white;
          text-decoration: none;
          padding: 0.5rem 0;
        }
        
        .navbar-toggle {
          display: none;
          flex-direction: column;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          margin-left: 0.5rem;
        }

        .navbar-toggle span {
          display: block;
          width: 25px;
          height: 3px;
          background: white;
          margin-bottom: 5px;
          border-radius: 2px;
        }

        .navbar-toggle span:last-child {
          margin-bottom: 0;
        }

        .navbar-menu {
          display: flex;
          align-items: center;
        }

        .navbar-items {
          display: flex;
          gap: 0.25rem;
        }

        .navbar-item {
          color: white;
          text-decoration: none;
          padding: 0.6rem 1.25rem;
          font-size: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          margin: 0 0.35rem;
          transition: all 0.2s;
          display: block;
          font-weight: 500;
          position: relative;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .navbar-item:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .navbar-item.active {
          background: rgba(255, 255, 255, 0.2);
          position: relative;
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 1px 4px rgba(255, 255, 255, 0.15), 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .navbar-item-wrapper:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .navbar-item-wrapper.active {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 1px 4px rgba(255, 255, 255, 0.15), 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .navbar-item.active::after,
        .navbar-item-wrapper.active .navbar-item::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 8px;
          right: 8px;
          height: 2px;
          background: #4a7eff;
          border-radius: 2px;
        }
        
        /* Wrapper for navbar item with toggle */
        .navbar-item-wrapper {
          display: flex;
          align-items: center;
          position: relative;
          margin: 0 0.35rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        .navbar-item-wrapper .navbar-item {
          flex-grow: 1;
          border: none;
          margin: 0;
        }
        
        /* Sections toggle button */
        .sections-toggle {
          background: transparent;
          border: none;
          color: white;
          padding: 4px;
          margin-left: 4px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, background 0.2s;
        }
        
        .sections-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .sections-toggle.active {
          background: rgba(255, 255, 255, 0.2);
          transform: rotate(180deg);
        }
        
        /* User account styles */
        .desktop-account {
          display: flex;
          align-items: center;
        }
        
        .mobile-account {
          display: none;
          margin-top: 1rem;
          width: 100%;
        }

        /* Sections Menu Styles */
        .sections-menu {
          position: fixed;
          top: 60px;
          left: 0;
          width: 300px;
          max-width: 100%;
          height: calc(100vh - 60px);
          background: white;
          z-index: 999;
          box-shadow: 2px 0 10px rgba(0,0,0,0.1);
          overflow-y: auto;
          animation: slideIn 0.25s ease-out forwards;
        }

        .sections-overlay {
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 998;
          animation: fadeIn 0.2s ease-out forwards;
        }

        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .sections-menu-content {
          padding: 1rem;
        }

        .sections-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #ddd;
        }

        .sections-menu-header h3 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
        }

        .close-sections {
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

        .close-sections:hover {
          background-color: #e0e0e0;
        }

        .sections-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .sections-list li {
          margin-bottom: 0.25rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* Section and subsection links - ensure proper contrast */
        .sections-list a,
        .section-header a,
        .subsections-list a {
          display: block;
          padding: 0.5rem;
          color: #333 !important; /* Force dark text color on white background */
          text-decoration: none;
          border-radius: 4px;
          transition: background-color 0.2s;
          font-weight: 500;
        }

        .sections-list a:hover {
          background-color: #f5f7ff;
        }
        
        /* Modern styling for the sections menu */
        .sections-menu {
          border-radius: 0 0 4px 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .sections-list li {
          margin-bottom: 0.35rem;
        }

        /* Active state styling is now handled via inline styles */
        .section-link.active,
        .subsection-link.active {
          font-weight: bold;
          border-radius: 4px;
        }

        .expand-toggle {
          background: transparent;
          border: none;
          padding: 4px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }

        .expand-toggle:hover {
          background-color: #f0f0f0;
        }

        .expand-toggle.expanded {
          transform: rotate(180deg);
        }

        .subsections-list {
          list-style: none;
          margin: 0 0 0 1rem;
          padding: 0;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
        }

        .subsections-list.expanded {
          max-height: 1000px;
        }

        .subsections-list a {
          font-weight: normal;
          font-size: 0.95rem;
        }

        /* Mobile styles */
        @media (max-width: 768px) {
          .navbar-toggle {
            display: flex;
          }

          .navbar-menu {
            display: none;
            position: absolute;
            top: 60px;
            left: 0;
            right: 0;
            background: #0c1e35;
            flex-direction: column;
            align-items: stretch;
            padding: 1rem;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            z-index: 999;
          }
          
          /* Mobile menu is at top level */
          .navbar-menu.is-open {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }

          .navbar-items {
            flex-direction: column;
            width: 100%;
          }

          .navbar-item {
            width: 100%;
            padding: 1rem;
            border-radius: 4px;
          }
          
          .navbar-item-wrapper {
            width: 100%;
          }
          
          .navbar-item-wrapper .navbar-item {
            width: auto;
            margin-right: 0;
            /* Add extra padding to give more space for the toggle button */
            padding-right: 40px;
          }
          
          .sections-toggle {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            /* Make the toggle button bigger and easier to click */
            width: 36px;
            height: 36px;
            background-color: rgba(255, 255, 255, 0.1);
          }
          
          .sections-toggle.active {
            transform: translateY(-50%) rotate(180deg);
            background-color: rgba(255, 255, 255, 0.2);
          }

          /* Full width sections menu on mobile */
          .sections-menu {
            width: 100%;
          }

          .navbar-item.active::after,
          .navbar-item-wrapper.active .navbar-item::after {
            bottom: 0;
            left: 0;
            width: 4px;
            height: 100%;
            border-radius: 0 3px 3px 0;
          }
          
          /* Show mobile account and hide desktop account */
          .desktop-account {
            display: none;
          }
          
          .mobile-account {
            display: block;
            margin-top: 1rem;
          }
        }
      `}</style>
    </nav>
  )
}