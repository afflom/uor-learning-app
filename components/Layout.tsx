import React, { PropsWithChildren } from 'react';
import Navbar from './Navbar';
import { useRouter } from 'next/router';

export default function Layout({ children }: PropsWithChildren<{}>) {
  const router = useRouter();
  
  // Only show sidebar toggle for content section
  // The router.pathname check ensures we only show the sidebar for UOR-related pages
  const shouldShowSidebarToggle = router.pathname.startsWith('/uor') ||
                        router.pathname.startsWith('/core-axioms') ||
                        router.pathname.startsWith('/foundations') ||
                        router.pathname.startsWith('/extensions') ||
                        router.pathname.startsWith('/universal-coordinates') ||
                        router.pathname.startsWith('/temporal-coherence') ||
                        router.pathname.startsWith('/signal-processing') ||
                        router.pathname.startsWith('/internet-substrate');
  
  // Determine content class based on sidebar visibility
  const contentClass = !shouldShowSidebarToggle ? 'full-width' : '';
  
  return (
    <div className="app">
      <Navbar showSidebarToggle={shouldShowSidebarToggle} />
      <div className="app-container">
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
        }
        
        .content {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
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
        }
      `}</style>
    </div>
  );
}