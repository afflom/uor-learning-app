import React, { PropsWithChildren, useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import SidebarToggle from './SidebarToggle';
import { useRouter } from 'next/router';

export default function Layout({ children }: PropsWithChildren<{}>) {
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Only show sidebar for content section
  const shouldShowSidebar = router.pathname.startsWith('/uor') ||
                  router.pathname.startsWith('/core-axioms') ||
                  router.pathname.startsWith('/foundations') ||
                  router.pathname.startsWith('/extensions') ||
                  router.pathname.startsWith('/universal-coordinates') ||
                  router.pathname.startsWith('/temporal-coherence') ||
                  router.pathname.startsWith('/signal-processing') ||
                  router.pathname.startsWith('/internet-substrate');
  
  // Check for mobile view
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
  
  // Close sidebar automatically on navigation in mobile view
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [router.pathname, isMobile]);
  
  // Handle sidebar toggle
  const handleSidebarToggle = (expanded: boolean) => {
    setSidebarOpen(expanded);
  };
  
  // Determine content class based on sidebar visibility
  const contentClass = !shouldShowSidebar ? 'full-width' : 
                        (isSidebarOpen ? 'with-sidebar' : 'sidebar-collapsed');
  
  return (
    <div className="app">
      <Navbar showSidebarToggle={shouldShowSidebar} />
      <div className="app-container">
        {shouldShowSidebar && (
          <>
            <div className={`sidebar-container ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
              <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            </div>
            
            {!isMobile && (
              <SidebarToggle 
                onToggle={handleSidebarToggle} 
                defaultExpanded={true} 
              />
            )}
          </>
        )}
        
        <div className={`content ${contentClass}`}>
          {children}
        </div>
      </div>
      
      <style jsx>{`
        .app {
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        
        .app-container {
          display: flex;
          flex: 1;
          overflow: hidden;
          position: relative;
        }
        
        .sidebar-container {
          width: 250px;
          transition: width 0.3s ease, transform 0.3s ease;
          overflow: hidden;
        }
        
        .sidebar-container.collapsed {
          width: 0;
          transform: translateX(-100%);
        }
        
        .content {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          transition: margin-left 0.3s ease;
        }
        
        .content.with-sidebar {
          margin-left: 0;
        }
        
        .content.sidebar-collapsed {
          margin-left: 0;
        }
        
        .content.full-width {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          padding: 2rem;
          background-color: #fff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        @media (max-width: 768px) {
          .app-container {
            flex-direction: column;
          }
          
          .sidebar-container {
            width: 100%;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 100;
          }
          
          .sidebar-container.collapsed {
            display: none;
          }
          
          .content {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}