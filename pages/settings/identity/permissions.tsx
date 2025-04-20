/**
 * Identity Permissions Page
 * 
 * Configure which applications can use your identities
 */
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Layout from '../../../components/Layout'

// Client-side only component
const IdentityPermissionsPage = () => {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [identities, setIdentities] = useState<any[]>([])
  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null)
  
  // Sample permissions data - in a real app, this would come from the database
  const [appPermissions, setAppPermissions] = useState([
    {
      id: 'app-1',
      name: 'Knowledge Base Manager',
      description: 'Core application for managing UOR knowledge base content',
      permissions: ['read', 'write', 'sign'],
      enabled: true
    },
    {
      id: 'app-2',
      name: 'Model Provider System',
      description: 'Processes content through model providers',
      permissions: ['read', 'sign'],
      enabled: true
    },
    {
      id: 'app-3',
      name: 'Content Importer',
      description: 'Imports external content into the knowledge base',
      permissions: ['read', 'write'],
      enabled: true
    }
  ])
  
  // Set isClient to true when the component mounts on the client
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Load identities when component mounts
  useEffect(() => {
    if (!isClient) return
    
    async function loadIdentities() {
      try {
        if (typeof window === 'undefined') return
        
        // Get the identity provider
        const identityProvider = (window as any).identityProvider
        
        if (!identityProvider) {
          // Initialize identity provider if not already available
          const { IdentityProvider } = await import('../../../knowledgebase/IdentityProvider')
          const provider = new IdentityProvider()
          await provider.initialize()
          ;(window as any).identityProvider = provider
          
          // Check for saved user ID
          const savedUserId = localStorage.getItem('uorCurrentUserId')
          if (savedUserId) {
            try {
              await provider.login(savedUserId)
            } catch (err) {
              console.error('Failed to restore session:', err)
              localStorage.removeItem('uorCurrentUserId')
            }
          }
        }
        
        // Get the current identity provider
        const provider = (window as any).identityProvider
        
        // Get current user
        const currentUser = provider.getCurrentUser()
        
        if (!currentUser) {
          setError('Please sign in to manage identity permissions')
          setIsLoading(false)
          return
        }
        
        // Get user identities
        const userIdentities = await provider.getUserIdentities()
        setIdentities(userIdentities)
        
        // Set selected identity to current active identity
        const currentIdentity = provider.getCurrentIdentity()
        if (currentIdentity) {
          setSelectedIdentity(currentIdentity.id)
        } else if (userIdentities.length > 0) {
          setSelectedIdentity(userIdentities[0].id)
        }
        
        setIsLoading(false)
      } catch (err: any) {
        console.error('Error loading identities:', err)
        setError(err?.message || 'An unknown error occurred')
        setIsLoading(false)
      }
    }
    
    loadIdentities()
  }, [isClient])
  
  // Handle identity change
  const handleIdentityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedIdentity(e.target.value)
  }
  
  // Toggle application permission
  const toggleAppPermission = (appId: string) => {
    setAppPermissions(prevPermissions => 
      prevPermissions.map(app => 
        app.id === appId ? { ...app, enabled: !app.enabled } : app
      )
    )
  }
  
  // Toggle specific permission
  const togglePermission = (appId: string, permission: string) => {
    setAppPermissions(prevPermissions => 
      prevPermissions.map(app => {
        if (app.id === appId) {
          const permissions = app.permissions.includes(permission)
            ? app.permissions.filter(p => p !== permission)
            : [...app.permissions, permission]
          return { ...app, permissions }
        }
        return app
      })
    )
  }
  
  // If we're still on the server, return a loading message
  if (!isClient) {
    return <div>Loading identity permissions...</div>
  }
  
  return (
    <Layout>
      <div className="permissions-page">
        <div className="page-header">
          <h1>Identity Permissions</h1>
          <p className="description">
            Configure which applications and services can access and use your identities.
            Control the permission levels for each identity separately.
          </p>
        </div>
        
        {error ? (
          <div className="error-card">
            <h3>Error</h3>
            <p>{error}</p>
            {error.includes('sign in') && (
              <Link href="/settings/identity">
                <button className="action-button">Go to Identity Management</button>
              </Link>
            )}
          </div>
        ) : isLoading ? (
          <div className="loading-card">
            <p>Loading identity permissions...</p>
          </div>
        ) : (
          <>
            <div className="identity-selector">
              <label htmlFor="identity-select">Configure Permissions For:</label>
              <select 
                id="identity-select" 
                value={selectedIdentity || ''} 
                onChange={handleIdentityChange}
              >
                {identities.map(identity => (
                  <option key={identity.id} value={identity.id}>
                    {identity.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="info-card">
              <h3>About Permissions</h3>
              <p>
                Identity permissions control what applications can do with your identity. 
                The available permission types are:
              </p>
              <ul>
                <li><strong>Read:</strong> Application can view resources created by this identity</li>
                <li><strong>Write:</strong> Application can create new resources with this identity</li>
                <li><strong>Sign:</strong> Application can sign resources with this identity</li>
              </ul>
            </div>
            
            <div className="permissions-section">
              <h2>Application Permissions</h2>
              
              <div className="permissions-list">
                {appPermissions.map(app => (
                  <div key={app.id} className="permission-card">
                    <div className="app-header">
                      <div className="app-info">
                        <h3>{app.name}</h3>
                        <p>{app.description}</p>
                      </div>
                      <div className="app-toggle">
                        <label className="switch">
                          <input 
                            type="checkbox" 
                            checked={app.enabled} 
                            onChange={() => toggleAppPermission(app.id)}
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className={`permission-controls ${!app.enabled ? 'disabled' : ''}`}>
                      <div className="permission-group">
                        <label className={`permission-label ${app.permissions.includes('read') ? 'active' : ''}`}>
                          <input 
                            type="checkbox" 
                            checked={app.permissions.includes('read')} 
                            onChange={() => togglePermission(app.id, 'read')}
                            disabled={!app.enabled}
                          />
                          Read
                        </label>
                        
                        <label className={`permission-label ${app.permissions.includes('write') ? 'active' : ''}`}>
                          <input 
                            type="checkbox" 
                            checked={app.permissions.includes('write')} 
                            onChange={() => togglePermission(app.id, 'write')}
                            disabled={!app.enabled}
                          />
                          Write
                        </label>
                        
                        <label className={`permission-label ${app.permissions.includes('sign') ? 'active' : ''}`}>
                          <input 
                            type="checkbox" 
                            checked={app.permissions.includes('sign')} 
                            onChange={() => togglePermission(app.id, 'sign')}
                            disabled={!app.enabled}
                          />
                          Sign
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="actions-bar">
              <button className="save-button">Save Permissions</button>
              <Link href="/settings/identity">
                <button className="cancel-button">Cancel</button>
              </Link>
            </div>
          </>
        )}
      </div>
      
      <style jsx>{`
        .permissions-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .page-header {
          margin-bottom: 2rem;
        }
        
        h1 {
          margin-bottom: 0.5rem;
          color: #0c1e35;
        }
        
        .description {
          color: #555;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        
        h2 {
          margin: 2rem 0 1rem;
          color: #0c1e35;
          font-size: 1.4rem;
          border-bottom: 1px solid #eee;
          padding-bottom: 0.5rem;
        }
        
        .error-card, .loading-card {
          padding: 2rem;
          background: #fff0f0;
          border-radius: 8px;
          margin: 2rem 0;
        }
        
        .error-card {
          border-left: 4px solid #e53935;
        }
        
        .error-card h3 {
          margin-top: 0;
          color: #e53935;
        }
        
        .loading-card {
          background: #f5f5f5;
          text-align: center;
          color: #666;
        }
        
        .identity-selector {
          margin: 1.5rem 0;
          padding: 1rem;
          background: #f5f7fa;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .identity-selector label {
          font-weight: 500;
          color: #333;
        }
        
        .identity-selector select {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          border: 1px solid #ccc;
          background: white;
          font-size: 1rem;
          flex-grow: 1;
          max-width: 400px;
        }
        
        .info-card {
          margin: 1.5rem 0;
          padding: 1.5rem;
          background: #f0f7ff;
          border-left: 4px solid #0070f3;
          border-radius: 4px;
        }
        
        .info-card h3 {
          margin-top: 0;
          color: #0070f3;
        }
        
        .info-card p, .info-card ul {
          color: #444;
          line-height: 1.6;
        }
        
        .info-card ul {
          padding-left: 1.5rem;
        }
        
        .info-card li {
          margin-bottom: 0.5rem;
        }
        
        .permissions-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 1.5rem 0;
        }
        
        .permission-card {
          padding: 1.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .app-info h3 {
          margin: 0 0 0.5rem;
          color: #0c1e35;
        }
        
        .app-info p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }
        
        /* Toggle switch styling */
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }
        
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
        }
        
        input:checked + .slider {
          background-color: #2196F3;
        }
        
        input:focus + .slider {
          box-shadow: 0 0 1px #2196F3;
        }
        
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        
        .slider.round {
          border-radius: 24px;
        }
        
        .slider.round:before {
          border-radius: 50%;
        }
        
        .permission-controls {
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }
        
        .permission-controls.disabled {
          opacity: 0.5;
        }
        
        .permission-group {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .permission-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          background: #f5f5f5;
          cursor: pointer;
          user-select: none;
        }
        
        .permission-label.active {
          background: #e3f2fd;
          color: #1976d2;
          font-weight: 500;
        }
        
        .permission-label input {
          margin: 0;
        }
        
        .actions-bar {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin: 2rem 0;
        }
        
        .save-button, .cancel-button, .action-button {
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          border: none;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .save-button, .action-button {
          background: #0070f3;
          color: white;
        }
        
        .save-button:hover, .action-button:hover {
          background: #0051a2;
        }
        
        .cancel-button {
          background: #f5f5f5;
          color: #333;
        }
        
        .cancel-button:hover {
          background: #e0e0e0;
        }
        
        @media (max-width: 600px) {
          .app-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .app-toggle {
            width: 100%;
            display: flex;
            justify-content: flex-end;
          }
          
          .permission-group {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </Layout>
  )
}

// Use Next.js dynamic import with SSR disabled for IndexedDB compatibility
export default dynamic(() => Promise.resolve(IdentityPermissionsPage), {
  ssr: false
})