import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Client-side only component due to IndexedDB usage
const KnowledgeBasePage = () => {
  const [isClient, setIsClient] = useState(false)
  const [resourceTypes, setResourceTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentIdentity, setCurrentIdentity] = useState<any>(null)

  // Set isClient to true when the component mounts on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load resource types and identity info when component mounts
  useEffect(() => {
    if (!isClient) return

    async function loadData() {
      try {
        // Check if IndexedDB is supported
        if (typeof window === 'undefined' || !('indexedDB' in window)) {
          setError('IndexedDB is not supported in this browser')
          setIsLoading(false)
          return
        }

        // Import knowledge base components
        const { IndexedDBKnowledgeBase } = await import('../../knowledgebase/indexedDbKnowledgeBase')
        
        // Create knowledge base instance - use 0 to automatically use the existing version
        const kb = new IndexedDBKnowledgeBase('uor-kb', 0)
        
        // Get resource types
        try {
          // @ts-ignore - Property exists on our implementation
          const types = await kb.getResourceTypes()
          setResourceTypes(types)
        } catch (err: any) {
          console.error('Error getting resource types:', err)
          setError(`Error getting resource types: ${err?.message || 'Unknown error'}`)
        }
        
        // Get identity information
        try {
          // Get the identity provider
          const identityProvider = (window as any).identityProvider
          
          if (identityProvider) {
            // Get current user and identity
            const user = identityProvider.getCurrentUser()
            const identity = identityProvider.getCurrentIdentity()
            
            if (user) setCurrentUser(user)
            if (identity) setCurrentIdentity(identity)
          } else {
            // Check if identity provider can be initialized
            const { IdentityProvider } = await import('../../knowledgebase/IdentityProvider')
            const provider = new IdentityProvider()
            await provider.initialize()
            ;(window as any).identityProvider = provider
            
            // Try to restore session
            const savedUserId = localStorage.getItem('uorCurrentUserId')
            if (savedUserId) {
              try {
                const { user, identity } = await provider.login(savedUserId)
                setCurrentUser(user)
                setCurrentIdentity(identity)
              } catch (err) {
                console.error('Failed to restore session:', err)
              }
            }
          }
        } catch (err: any) {
          console.error('Error getting identity information:', err)
          // Non-critical error, don't set the main error state
        }
      } catch (err: any) {
        console.error('Error in loadData:', err)
        setError(err?.message || 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isClient])

  // If we're still on the server, return a loading message
  if (!isClient) {
    return <div>Loading knowledge base...</div>
  }

  return (
    <div className="knowledge-base-page">
      <h1>Knowledge Base</h1>
      
      <p className="description">
        The UOR Knowledge Base provides a structured repository of concepts and definitions
        used in the Universal Object Reference framework. All content is stored locally in your
        browser using IndexedDB.
      </p>
      
      {currentUser && currentIdentity ? (
        <div className="identity-card">
          <div className="identity-info">
            <div className="identity-avatar">
              {currentIdentity.name.charAt(0)}
            </div>
            <div className="identity-details">
              <div className="identity-name">{currentIdentity.name}</div>
              <div className="user-name">User: {currentUser.displayName || currentUser.username}</div>
            </div>
          </div>
          <Link href="/settings/identity">
            <button className="manage-identity-button">Manage Identities</button>
          </Link>
        </div>
      ) : (
        <div className="identity-card signin-prompt">
          <div className="prompt-info">
            <div className="prompt-icon">🔑</div>
            <div className="prompt-text">
              Sign in to create and manage signed knowledge base content
            </div>
          </div>
          <Link href="/settings/identity">
            <button className="signin-button">Sign In / Register</button>
          </Link>
        </div>
      )}
      
      {isLoading ? (
        <div className="loading">Loading knowledge base data...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="resource-types">
          <h2>Available Resource Types</h2>
          
          {resourceTypes.length === 0 ? (
            <div className="empty-state">
              <p>No resource types found in the knowledge base.</p>
              <Link href="/knowledge-base/loader">
                <button className="load-button">Load Sample Data</button>
              </Link>
            </div>
          ) : (
            <>
              <ul className="resource-types-list">
                {resourceTypes.map((type, index) => (
                  <li key={index}>
                    <Link href={`/knowledge-base/types/${encodeURIComponent(type)}`}>
                      {type}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <div className="action-buttons">
                <Link href="/knowledge-base/loader">
                  <button className="load-button">Load More Sample Data</button>
                </Link>
                <Link href="/settings/identity/records">
                  <button className="signed-button">View Signed Records</button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
      
      <div className="model-provider-section">
        <h2>Model Providers</h2>
        <p>
          Model providers process content and create their own UOR records that link to model 
          artifacts. Different model providers can create different interpretations of the same content.
        </p>
        <div className="action-buttons">
          <Link href="/knowledge-base/models">
            <button className="action-button models-button">Manage Model Providers</button>
          </Link>
          <Link href="/knowledge-base/process">
            <button className="action-button process-button">Process Content</button>
          </Link>
        </div>
      </div>
      
      <div className="kb-actions">
        <h2>Knowledge Base Actions</h2>
        <div className="action-buttons">
          <Link href="/knowledge-base/loader">
            <button className="action-button test-button">Data Loader</button>
          </Link>
          <Link href="/settings">
            <button className="action-button settings-button">Configure Settings</button>
          </Link>
        </div>
      </div>
      
      <style jsx>{`
        .knowledge-base-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        h1 {
          margin-bottom: 1rem;
          color: #0c1e35;
        }
        
        .description {
          color: #555;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }
        
        .loading {
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 4px;
          color: #555;
          text-align: center;
        }
        
        .error {
          background: #fff0f0;
          padding: 1rem;
          border-radius: 4px;
          color: #d00;
          border-left: 4px solid #d00;
        }
        
        .resource-types {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f5f7fa;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .resource-types h2 {
          margin-top: 0;
          color: #0c1e35;
          font-size: 1.4rem;
        }
        
        .resource-types-list {
          list-style: none;
          padding: 0;
          margin: 1.5rem 0;
        }
        
        .resource-types-list li {
          padding: 0.8rem 1rem;
          border-bottom: 1px solid #e5e8ed;
        }
        
        .resource-types-list li:last-child {
          border-bottom: none;
        }
        
        .resource-types-list a {
          color: #0070f3;
          text-decoration: none;
          font-weight: 500;
          font-size: 1.1rem;
          display: block;
        }
        
        .resource-types-list a:hover {
          text-decoration: underline;
        }
        
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: #666;
          background: #f9f9f9;
          border-radius: 4px;
          margin: 1rem 0;
        }
        
        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }
        
        .load-button, .action-button {
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.8rem 1.2rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          font-weight: 500;
        }
        
        .load-button:hover, .action-button:hover {
          background-color: #0051a2;
        }
        
        .signed-button {
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.8rem 1.2rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          font-weight: 500;
        }
        
        .signed-button:hover {
          background-color: #388e3c;
        }
        
        .identity-card {
          margin: 1.5rem 0;
          padding: 1rem;
          background: #f0f7ff;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        
        .identity-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .identity-avatar {
          width: 40px;
          height: 40px;
          background: #4a7eff;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: bold;
        }
        
        .identity-details {
          display: flex;
          flex-direction: column;
        }
        
        .identity-name {
          font-weight: bold;
          color: #0c1e35;
        }
        
        .user-name {
          font-size: 0.9rem;
          color: #666;
        }
        
        .manage-identity-button {
          background: rgba(74, 126, 255, 0.1);
          color: #4a7eff;
          border: 1px solid rgba(74, 126, 255, 0.3);
          border-radius: 4px;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }
        
        .manage-identity-button:hover {
          background: rgba(74, 126, 255, 0.2);
          border-color: rgba(74, 126, 255, 0.5);
        }
        
        .signin-prompt {
          background: #fff8e1;
        }
        
        .prompt-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .prompt-icon {
          font-size: 1.5rem;
        }
        
        .prompt-text {
          font-weight: 500;
          color: #795548;
        }
        
        .signin-button {
          background: #ff9800;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.6rem 1.2rem;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background-color 0.2s;
          font-weight: 500;
        }
        
        .signin-button:hover {
          background: #f57c00;
        }
        
        .kb-actions, .model-provider-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f5f7fa;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .kb-actions h2, .model-provider-section h2 {
          margin-top: 0;
          color: #0c1e35;
          font-size: 1.4rem;
        }
        
        .model-provider-section p {
          color: #555;
          margin-bottom: 1.5rem;
        }
        
        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .settings-button {
          background-color: #6c5ce7;
        }
        
        .settings-button:hover {
          background-color: #5649c0;
        }
        
        .test-button {
          background-color: #00a8ff;
        }
        
        .test-button:hover {
          background-color: #0084c8;
        }
        
        .models-button {
          background-color: #0070f3;
        }
        
        .models-button:hover {
          background-color: #0051a2;
        }
        
        .process-button {
          background-color: #4caf50;
        }
        
        .process-button:hover {
          background-color: #3d8b40;
        }
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled for IndexedDB compatibility
export default dynamic(() => Promise.resolve(KnowledgeBasePage), {
  ssr: false
})