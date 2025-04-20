/**
 * User Account Component
 * 
 * Displays current user information and login/logout options.
 */
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { UserImpl } from '../knowledgebase/models/User'
import { IdentityImpl } from '../knowledgebase/models/Identity'

// Client-side only component
const UserAccount = () => {
  const [isClient, setIsClient] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserImpl | null>(null)
  const [currentIdentity, setCurrentIdentity] = useState<IdentityImpl | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  
  // Initialize on client-side only
  useEffect(() => {
    setIsClient(true)
    
    // Skip remaining initialization on server
    if (typeof window === 'undefined') return
    
    const checkIdentityProvider = async () => {
      // Check if identity provider is already initialized
      if ((window as any).identityProvider) {
        const provider = (window as any).identityProvider
        
        // Get current user and identity
        const user = provider.getCurrentUser()
        const identity = provider.getCurrentIdentity()
        
        if (user) setCurrentUser(user)
        if (identity) setCurrentIdentity(identity)
        
        setInitialized(true)
        return
      }
      
      // Import and initialize
      try {
        // Import the identity provider
        const { IdentityProvider } = await import('../knowledgebase/IdentityProvider')
        const provider = new IdentityProvider()
        
        // Initialize
        await provider.initialize()
        
        // Attach to window for global access
        ;(window as any).identityProvider = provider
        
        // Check if we have a user ID in localStorage (basic session persistence)
        const savedUserId = localStorage.getItem('uorCurrentUserId')
        
        if (savedUserId) {
          try {
            const { user, identity } = await provider.login(savedUserId)
            setCurrentUser(user)
            setCurrentIdentity(identity)
          } catch (err) {
            console.error('Failed to restore session:', err)
            localStorage.removeItem('uorCurrentUserId')
          }
        }
        
        setInitialized(true)
      } catch (err) {
        console.error('Error initializing identity provider:', err)
      }
    }
    
    checkIdentityProvider()
    
    // Close menu when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (menuOpen && !(e.target as Element).closest('.user-account')) {
        setMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])
  
  // Handle logout
  const handleLogout = () => {
    if (typeof window === 'undefined') return
    
    const provider = (window as any).identityProvider
    if (!provider) return
    
    provider.logout()
    setCurrentUser(null)
    setCurrentIdentity(null)
    localStorage.removeItem('uorCurrentUserId')
    setMenuOpen(false)
  }
  
  // If we're on the server or not initialized yet, show a placeholder
  if (!isClient || !initialized) {
    return (
      <div className="user-account">
        <div className="account-button">
          <span className="loading-indicator"></span>
        </div>
        <style jsx>{`
          .account-button {
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            padding: 0.6rem 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.05);
          }
          
          .loading-indicator {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-top-color: white;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }
  
  return (
    <div className="user-account">
      {currentUser ? (
        // Logged in state
        <div className="account-dropdown">
          <button 
            className="account-button" 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="identity-icon">
              {currentIdentity?.name.charAt(0) || 'U'}
            </span>
            <span className="username">
              {currentUser.displayName || currentUser.username}
            </span>
            <span className="dropdown-arrow">▼</span>
          </button>
          
          {menuOpen && (
            <div className="dropdown-menu">
              <div className="menu-header">
                <div className="user-info">
                  <div className="user-name">{currentUser.displayName || currentUser.username}</div>
                  <div className="identity-info">
                    Active Identity: <strong>{currentIdentity?.name}</strong>
                  </div>
                </div>
              </div>
              
              <div className="menu-items">
                <Link href="/settings/identity" passHref style={{ width: '100%' }}>
                  <button 
                    className="menu-item identity"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="icon">🔑</span>
                    Manage Identities
                  </button>
                </Link>
                <button className="menu-item logout" onClick={handleLogout}>
                  <span className="icon">🚪</span>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Logged out state
        <Link href="/settings/identity" passHref>
          <button className="login-button">
            Sign In / Register
          </button>
        </Link>
      )}
      
      <style jsx>{`
        .user-account {
          position: relative;
        }
        
        .account-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          padding: 0.5rem 1rem;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .account-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .identity-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #4a7eff;
          color: white;
          border-radius: 50%;
          font-size: 14px;
          font-weight: bold;
        }
        
        .username {
          font-weight: 500;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .dropdown-arrow {
          font-size: 10px;
          opacity: 0.7;
        }
        
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          width: 250px;
          background: white;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          z-index: 1000;
          animation: dropdownFade 0.2s ease;
        }
        
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .menu-header {
          padding: 1rem;
          border-bottom: 1px solid #eee;
        }
        
        .user-name {
          font-weight: bold;
          color: #333;
          margin-bottom: 0.5rem;
        }
        
        .identity-info {
          font-size: 0.8rem;
          color: #666;
        }
        
        .menu-items {
          padding: 0.5rem 0;
        }
        
        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          color: #333;
          text-decoration: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          font-size: 0.9rem;
          transition: background 0.2s;
          user-select: none;
        }
        
        .menu-item:hover {
          background: #f5f5f5;
        }
        
        .menu-item.logout {
          color: #e53935;
        }
        
        .menu-item.logout:hover {
          background: #ffebee;
        }
        
        .icon {
          font-size: 1rem;
        }
        
        form {
          margin: 0;
          padding: 0;
        }
        
        .login-button {
          display: inline-block;
          padding: 0.6rem 1.2rem;
          background: #4a7eff;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
          user-select: none;
        }
        
        .login-button:hover {
          background: #3d6ae8;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        @media (max-width: 768px) {
          .dropdown-menu {
            width: calc(100vw - 2rem);
            right: -1rem;
          }
          
          .username {
            max-width: 80px;
          }
        }
      `}</style>
    </div>
  )
}

// Export as dynamic component to avoid SSR issues
export default dynamic(() => Promise.resolve(UserAccount), {
  ssr: false
})