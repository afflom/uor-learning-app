import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { SectionData, sectionsData } from '../src/content/sections/sectionsData'

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
  isMobile?: boolean;
}

export default function Navbar({ isMobile = false }: NavbarProps) {
  const router = useRouter()
  const path = router.asPath.split('?')[0];
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState<{[key: string]: boolean}>({})

  // Determine active section
  const isActive = (path: string) => {
    return router.pathname.startsWith(path)
  }
  
  // Auto-open dropdown for current section
  useEffect(() => {
    // Find which section is active
    const currentPath = router.asPath.split('?')[0];
    
    // Check if we should auto-open any dropdown
    sectionsData.forEach(section => {
      const sectionPath = `/${section.id}`;
      
      if (currentPath === sectionPath || currentPath.startsWith(`${sectionPath}/`)) {
        // Auto-open the dropdown when on mobile only
        if (isMobile && section.subsections && section.subsections.length > 0) {
          setOpenDropdowns(prev => ({...prev, [section.id]: true}));
        }
      }
    });
  }, [router.asPath, isMobile]);
  
  
  // Add a click outside handler to close the menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if the click was outside the navbar menu
      if (menuOpen && 
          !target.closest('.navbar-menu') && 
          !target.closest('.navbar-toggle')) {
        setMenuOpen(false);
      }
      
      // Check if click was outside any dropdown
      if (Object.values(openDropdowns).some(isOpen => isOpen) && 
          !target.closest('.modern-dropdown') && 
          !target.closest('.nav-dropdown')) {
        setOpenDropdowns({});
      }
    };
    
    // Add document-wide click listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen, openDropdowns]);
  
  // Close menu and dropdowns on route change
  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdowns({});
  }, [router.asPath]);

  // Toggle dropdown for a specific section on mobile
  const toggleSectionDropdown = (e: React.MouseEvent, sectionId: string) => {
    if (!isMobile) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setOpenDropdowns(prev => {
      const newState = { ...prev };
      // Close all other dropdowns
      Object.keys(newState).forEach(key => {
        if (key !== sectionId) newState[key] = false;
      });
      // Toggle this dropdown
      newState[sectionId] = !prev[sectionId];
      return newState;
    });
  };

  return (
    <nav className={`navbar ${isMobile ? 'navbar-mobile' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-brand">
          <a href="https://www.uor.foundation" className="navbar-logo" target="_blank" rel="noopener noreferrer">
            UOR
          </a>
          <div className="navbar-buttons">
            {/* Menu toggle button for mobile */}
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
            {/* Modern hover-based dropdown navigation */}
            {sectionsData.map((section: SectionData) => {
              const sectionPath = `/${section.id}`;
              const isActiveSection = isActive(sectionPath);
              const hasDropdown = section.subsections && section.subsections.length > 0;
              const isDropdownOpen = openDropdowns[section.id] || false;
              
              return (
                <div key={section.id} 
                  className={`nav-dropdown ${isActiveSection ? 'active' : ''}`}
                  onMouseEnter={() => !isMobile && setOpenDropdowns(prev => ({...prev, [section.id]: true}))}
                  onMouseLeave={() => !isMobile && setOpenDropdowns(prev => ({...prev, [section.id]: false}))}
                >
                  <Link 
                    href={sectionPath} 
                    className="nav-link"
                    onClick={(e) => {
                      if (isMobile && hasDropdown) {
                        // Prevent navigation for sections with dropdowns on mobile
                        e.preventDefault();
                        toggleSectionDropdown(e, section.id);
                      } else {
                        // Only close menu when clicking non-dropdown sections
                        setMenuOpen(false);
                      }
                    }}
                    data-testid={`nav-section-${section.id}`}
                  >
                    {section.title}
                    {hasDropdown && (
                      <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M7 10l5 5 5-5z" />
                        </svg>
                      </span>
                    )}
                  </Link>
                  
                  {/* Modern dropdown menu */}
                  {hasDropdown && section.subsections && (
                    <div 
                      className={`modern-dropdown ${isDropdownOpen ? 'show' : ''}`}
                      style={{ 
                        backgroundColor: 'white', 
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '8px'
                      }}
                    >
                      <div className="dropdown-content" style={{ 
                        backgroundColor: 'white',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        padding: '4px 0',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}>
                        {section.subsections.map(sub => {
                          const subPath = `${sectionPath}/${convertIdToFilePath(sub.id)}`;
                          const isActiveSub = path === subPath;
                          
                          return (
                            <Link 
                              key={sub.id}
                              href={subPath} 
                              className={`dropdown-item ${isActiveSub ? 'active' : ''}`}
                              onClick={() => {
                                setMenuOpen(false);
                                setOpenDropdowns({});
                              }}
                              data-testid={`nav-subsection-${sub.id}`}
                              style={{ 
                                color: isActiveSub ? '#4a7eff' : '#333', 
                                textDecoration: 'none',
                                backgroundColor: isActiveSub ? '#f0f5ff' : 'transparent',
                                borderLeft: isActiveSub ? '3px solid #4a7eff' : 'none',
                                paddingLeft: isActiveSub ? '17px' : '20px',
                                paddingRight: '20px',
                                paddingTop: '12px',
                                paddingBottom: '12px',
                                borderBottom: '1px solid #f0f0f0',
                                display: 'block',
                                width: '100%',
                                boxSizing: 'border-box',
                                whiteSpace: 'normal',
                                fontSize: '0.9rem',
                                lineHeight: '1.5',
                                fontWeight: isActiveSub ? '500' : '400',
                                wordWrap: 'break-word',
                                overflow: 'hidden'
                              }}
                            >
                              {sub.title}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Empty placeholder for layout balance */}
        <div className="desktop-account"></div>
      </div>

      <style jsx>{`
        .navbar {
          background: linear-gradient(to right, #1a2a4d, #153366);
          color: white;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
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
          padding: 0 1.5rem;
          height: 64px;
          width: 100%;
          box-sizing: border-box;
        }
        
        @media (max-width: 480px) {
          .navbar-container {
            padding: 0 1rem;
          }
        }

        .navbar-brand {
          display: flex;
          align-items: center;
        }
        
        .navbar-buttons {
          display: flex;
          align-items: center;
        }
        
        @media (max-width: 768px) {
          .navbar-brand {
            width: 100%;
            justify-content: space-between;
          }
        }

        .navbar-logo {
          font-size: 1.5rem;
          font-weight: 600;
          color: white;
          text-decoration: none;
          letter-spacing: 0.5px;
          margin-right: 30px;
          display: inline-block;
        }
        
        .navbar-logo:hover {
          color: #f0f0f0;
          text-decoration: none;
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
        
        @media (max-width: 768px) {
          .navbar-toggle {
            margin-left: auto;
            margin-right: 0;
            padding: 0.6rem;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
          }
        }

        .navbar-toggle span {
          display: block;
          width: 24px;
          height: 2px;
          background: white;
          margin-bottom: 5px;
          border-radius: 1px;
          transition: all 0.3s ease;
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
          margin: 0;
          padding: 0;
          height: 100%;
        }

        /* Modern dropdown navigation */
        .nav-dropdown {
          position: relative;
          height: 64px;
          display: flex;
          align-items: center;
        }
        
        .nav-dropdown.active .nav-link {
          color: #fff;
          opacity: 1;
        }
        
        .nav-dropdown.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 15px;
          right: 15px;
          height: 3px;
          background-color: #4a7eff;
          border-radius: 3px 3px 0 0;
        }
        
        .nav-link {
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          padding: 0 15px;
          height: 64px;
          display: flex;
          align-items: center;
          font-size: 0.95rem;
          font-weight: 500;
          letter-spacing: 0.3px;
          transition: color 0.2s;
          position: relative;
        }
        
        .nav-link:hover {
          color: #fff;
        }
        
        .dropdown-arrow {
          margin-left: 5px;
          display: inline-flex;
          align-items: center;
          opacity: 0.7;
          transition: transform 0.2s ease;
        }
        
        .dropdown-arrow.open {
          transform: rotate(180deg);
        }
        
        .nav-dropdown:hover .dropdown-arrow {
          transform: rotate(180deg);
        }
        
        /* Mobile dropdown arrow styling */
        @media (max-width: 768px) {
          .dropdown-arrow {
            opacity: 1;
            margin-left: auto;
            padding: 4px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
          }
          
          .dropdown-arrow svg {
            width: 20px;
            height: 20px;
          }
        }
        
        /* Modern dropdown menu */
        .modern-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          width: 300px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
          opacity: 0;
          visibility: hidden;
          transform: translateY(10px);
          transition: all 0.2s ease-in-out;
          z-index: 1000;
          overflow: hidden;
          margin-top: 5px;
        }
        
        /* Position dropdowns that would go off-screen */
        .nav-dropdown:nth-last-child(-n+2) .modern-dropdown {
          left: auto;
          right: 0;
        }
        
        .modern-dropdown.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        
        .dropdown-content {
          display: flex;
          flex-direction: column;
          padding: 8px 0;
        }
        
        .dropdown-item {
          padding: 12px 20px;
          color: #333 !important; /* Force dark text color for all dropdown items */
          text-decoration: none;
          font-size: 0.9rem;
          transition: background-color 0.15s;
          white-space: normal;
          line-height: 1.5;
          border-bottom: 1px solid #f0f0f0;
          box-sizing: border-box;
          word-wrap: break-word;
          width: 100%;
          overflow: hidden;
        }
        
        .dropdown-item:hover {
          background-color: #f5f8ff;
          color: #1a2a4d !important;
        }
        
        .dropdown-item.active {
          background-color: #f0f5ff;
          color: #4a7eff !important;
          font-weight: 500;
          border-left: 3px solid #4a7eff;
          padding-left: 17px;
        }
        
        .dropdown-item:last-child {
          border-bottom: none;
        }
        
        /* Desktop account placeholder */
        .desktop-account {
          display: flex;
          align-items: center;
        }

        /* Mobile styles */
        @media (max-width: 768px) {
          .navbar-toggle {
            display: flex;
          }

          .navbar-menu {
            display: none;
            position: absolute;
            top: 64px;
            left: 0;
            right: 0;
            background: #1a2a4d;
            flex-direction: column;
            align-items: stretch;
            padding: 1rem;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
            z-index: 999;
          }
          
          .navbar-menu.is-open {
            display: flex !important;
          }

          .navbar-items {
            flex-direction: column;
            width: 100%;
            height: auto;
          }
          
          .navbar-logo {
            margin-right: 0;
          }
          
          .nav-dropdown {
            height: auto;
            flex-direction: column;
            align-items: flex-start;
            margin-bottom: 10px;
          }
          
          .nav-dropdown::after {
            display: none;
          }
          
          .nav-link {
            width: 100%;
            height: auto;
            padding: 15px;
            justify-content: space-between;
            border-radius: 6px;
          }
          
          .nav-link:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }
          
          .nav-dropdown.active .nav-link {
            background-color: rgba(255, 255, 255, 0.15);
          }
          
          .modern-dropdown {
            position: static;
            width: 100%;
            margin-top: 0;
            margin-left: 15px;
            box-shadow: none;
            background: transparent;
            transform: none;
            max-height: 0;
            opacity: 1;
            visibility: hidden;
            overflow: hidden;
            transition: max-height 0.3s ease;
            padding: 0;
            box-sizing: border-box;
          }
          
          @media (max-width: 480px) {
            .modern-dropdown {
              margin-left: 10px;
              margin-right: 5px;
            }
          }
          
          .modern-dropdown.show {
            max-height: 2000px;
            visibility: visible;
            opacity: 1;
            margin-bottom: 10px;
          }
          
          .dropdown-content {
            background-color: rgba(0, 0, 0, 0.1);
            border-radius: 6px;
            margin-top: 5px;
            width: 100%;
            display: flex;
            flex-direction: column;
          }
          
          /* Override inline styles for dropdown items on mobile */
          .dropdown-item {
            background-color: rgba(0, 0, 0, 0.15) !important;
            color: rgba(255, 255, 255, 0.95) !important;
            margin-bottom: 2px;
            border-radius: 4px;
            white-space: normal;
            line-height: 1.4;
            padding: 12px 20px;
            display: block;
            width: 100%;
            box-sizing: border-box;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          @media (max-width: 480px) {
            .dropdown-item {
              padding: 12px 15px;
              font-size: 0.85rem;
            }
          }
          
          .dropdown-item:hover {
            background-color: rgba(255, 255, 255, 0.1);
            color: white !important;
          }
          
          .dropdown-item.active {
            background-color: rgba(255, 255, 255, 0.15);
            color: white !important;
            border-left-color: #4a7eff;
          }
          
          .desktop-account {
            display: none;
          }
        }
      `}</style>
    </nav>
  )
}