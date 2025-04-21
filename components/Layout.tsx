import React, { PropsWithChildren, useEffect, useState } from 'react';
import Navbar from './Navbar';

export default function Layout({ children }: PropsWithChildren<{}>) {
  const [isMobile, setIsMobile] = useState(false);
  
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
  
  return (
    <div className="app">
      <Navbar isMobile={isMobile} />
      <div className="app-container">
        <div className="content">
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
        
        .content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          background-color: #fff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          box-sizing: border-box;
        }
        
        @media (max-width: 768px) {
          .content {
            padding: 1.5rem;
            padding-bottom: 3rem;
          }
        }
        
        @media (max-width: 480px) {
          .content {
            padding: 1.25rem;
            padding-bottom: 3rem;
          }
        }
      `}</style>
    </div>
  );
}