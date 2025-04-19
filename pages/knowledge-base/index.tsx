import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Client-side only component due to IndexedDB usage
const KnowledgeBasePage = () => {
  const [isClient, setIsClient] = useState(false)
  const [resourceTypes, setResourceTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Set isClient to true when the component mounts on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load resource types when component mounts
  useEffect(() => {
    if (!isClient) return

    async function loadResourceTypes() {
      try {
        // Check if IndexedDB is supported
        if (typeof window === 'undefined' || !('indexedDB' in window)) {
          setError('IndexedDB is not supported in this browser')
          setIsLoading(false)
          return
        }

        // Import knowledge base components
        const { IndexedDBKnowledgeBase } = await import('../../knowledgebase/indexedDbKnowledgeBase')
        
        // Create knowledge base instance
        const kb = new IndexedDBKnowledgeBase('uor-kb', 2)
        
        // Get resource types
        try {
          // @ts-ignore - Property exists on our implementation
          const types = await kb.getResourceTypes()
          setResourceTypes(types)
        } catch (err: any) {
          console.error('Error getting resource types:', err)
          setError(`Error getting resource types: ${err?.message || 'Unknown error'}`)
        }
      } catch (err: any) {
        console.error('Error in loadResourceTypes:', err)
        setError(err?.message || 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    loadResourceTypes()
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
              
              <Link href="/knowledge-base/loader">
                <button className="load-button">Load More Sample Data</button>
              </Link>
            </>
          )}
        </div>
      )}
      
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
        
        .kb-actions {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f5f7fa;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .kb-actions h2 {
          margin-top: 0;
          color: #0c1e35;
          font-size: 1.4rem;
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
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled for IndexedDB compatibility
export default dynamic(() => Promise.resolve(KnowledgeBasePage), {
  ssr: false
})