import React, { useState, useEffect } from 'react'

interface SidebarToggleProps {
  onToggle: (isExpanded: boolean) => void
  defaultExpanded?: boolean
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({ 
  onToggle,
  defaultExpanded = true
}) => {
  // Use localStorage to persist the sidebar state
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  // On mount, check for saved preference
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-expanded')
    if (savedState !== null) {
      const expanded = savedState === 'true'
      setIsExpanded(expanded)
      onToggle(expanded)
    }
  }, [onToggle])
  
  // Toggle sidebar and save preference
  const toggleSidebar = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    localStorage.setItem('sidebar-expanded', String(newState))
    onToggle(newState)
  }
  
  return (
    <button 
      className={`sidebar-toggle ${isExpanded ? 'expanded' : 'collapsed'}`}
      onClick={toggleSidebar}
      aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      data-testid="sidebar-toggle"
    >
      <span className="toggle-icon"></span>
      
      <style jsx>{`
        .sidebar-toggle {
          position: fixed;
          left: ${isExpanded ? '250px' : '0'};
          top: 80px;
          width: 24px;
          height: 40px;
          background-color: #f0f0f0;
          border: 1px solid #ddd;
          border-left: ${isExpanded ? '1px solid #ddd' : 'none'};
          border-right: ${isExpanded ? 'none' : '1px solid #ddd'};
          border-radius: ${isExpanded ? '0 4px 4px 0' : '0 4px 4px 0'};
          cursor: pointer;
          z-index: 100;
          transition: left 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          outline: none;
          box-shadow: 2px 0 5px rgba(0,0,0,0.1);
        }
        
        .sidebar-toggle:hover {
          background-color: #e0e0e0;
        }
        
        .toggle-icon {
          width: 8px;
          height: 12px;
          position: relative;
        }
        
        .toggle-icon::before {
          content: '';
          position: absolute;
          width: 8px;
          height: 12px;
          border-style: solid;
          border-width: ${isExpanded ? '6px 0 6px 8px' : '6px 8px 6px 0'};
          border-color: ${isExpanded ? 
            'transparent transparent transparent #666' : 
            'transparent #666 transparent transparent'};
          transition: transform 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .sidebar-toggle {
            display: none; /* Hide on mobile as we'll use the sections toggle in navbar */
          }
        }
      `}</style>
    </button>
  )
}

export default SidebarToggle