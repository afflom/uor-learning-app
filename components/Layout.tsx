import React, { PropsWithChildren } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useRouter } from 'next/router';

export default function Layout({ children }: PropsWithChildren<{}>) {
  const router = useRouter();
  
  // Only show sidebar for UOR content section
  // The router.pathname check ensures we only show the sidebar for UOR-related pages
  const showSidebar = router.pathname.startsWith('/uor') ||
                      router.pathname.startsWith('/core-axioms') ||
                      router.pathname.startsWith('/foundations') ||
                      router.pathname.startsWith('/extensions') ||
                      router.pathname.startsWith('/universal-coordinates') ||
                      router.pathname.startsWith('/temporal-coherence') ||
                      router.pathname.startsWith('/signal-processing') ||
                      router.pathname.startsWith('/internet-substrate');
  
  return (
    <div className="app">
      <Navbar />
      <div className="app-container">
        {showSidebar && <Sidebar />}
        <div className={`content ${!showSidebar ? 'full-width' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}