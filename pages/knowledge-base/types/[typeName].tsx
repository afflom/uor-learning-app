import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import Link from 'next/link'

// Client-side only component due to IndexedDB usage
const ResourceTypePage = () => {
  const router = useRouter()
  const { typeName } = router.query
  
  const [isClient, setIsClient] = useState(false)
  const [resources, setResources] = useState<{id: string, record: any}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Set isClient to true when the component mounts on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load resources of the specified type when component mounts
  useEffect(() => {
    if (!isClient || !typeName) return

    async function loadResources() {
      try {
        // Check if IndexedDB is supported
        if (typeof window === 'undefined' || !('indexedDB' in window)) {
          setError('IndexedDB is not supported in this browser')
          setIsLoading(false)
          return
        }

        // Import knowledge base components
        const { IndexedDBKnowledgeBase } = await import('../../../knowledgebase/indexedDbKnowledgeBase')
        
        // Create knowledge base instance
        const kb = new IndexedDBKnowledgeBase('uor-kb', 2)
        
        // Get resources of the specified type
        try {
          // @ts-ignore - Property exists on our implementation
          const records = await kb.getAllOfType(typeName as string)
          setResources(records)
        } catch (err: any) {
          console.error(`Error getting resources of type ${typeName}:`, err)
          setError(`Error getting resources: ${err?.message || 'Unknown error'}`)
        }
      } catch (err: any) {
        console.error('Error in loadResources:', err)
        setError(err?.message || 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    loadResources()
  }, [isClient, typeName])

  // If we're still on the server or don't have typeName yet, return a loading message
  if (!isClient || !typeName) {
    return <div>Loading resource type data...</div>
  }

  return (
    <div className="resource-type-page">
      <div className="header">
        <Link href="/knowledge-base" className="back-link">
          ← Back to Knowledge Base
        </Link>
        <h1>{typeName}</h1>
      </div>
      
      {isLoading ? (
        <div className="loading">Loading resources...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="resources">
          <h2>Resources ({resources.length})</h2>
          
          {resources.length === 0 ? (
            <div className="empty-state">
              <p>No resources found for this type.</p>
              <Link href="/knowledge-base/loader">
                <button className="load-button">Load Sample Data</button>
              </Link>
            </div>
          ) : (
            <div className="resources-list">
              {resources.map((item, index) => (
                <div key={index} className="resource-card">
                  <div className="resource-header">
                    <h3>{item.record.resource.name || item.record.resource['@id'] || item.id}</h3>
                    <span className="resource-id">{item.id}</span>
                  </div>
                  
                  {item.record.resource.description && (
                    <p className="resource-description">{item.record.resource.description}</p>
                  )}
                  
                  <details className="resource-details">
                    <summary>View Resource Data</summary>
                    <pre className="json-data">{JSON.stringify(item.record.resource, null, 2)}</pre>
                  </details>
                  
                  <div className="resource-actions">
                    <Link href={`/settings/types/${encodeURIComponent(typeName as string)}/${encodeURIComponent(item.id)}`}>
                      <button className="action-button">Configure</button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .resource-type-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .header {
          margin-bottom: 2rem;
        }
        
        .back-link {
          display: inline-block;
          margin-bottom: 1rem;
          color: #0070f3;
          text-decoration: none;
        }
        
        .back-link:hover {
          text-decoration: underline;
        }
        
        h1 {
          margin-bottom: 1rem;
          color: #0c1e35;
          word-break: break-word;
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
        
        .resources {
          margin-top: 1rem;
        }
        
        .resources h2 {
          margin-bottom: 1.5rem;
          color: #0c1e35;
          font-size: 1.4rem;
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
          padding: 0.6rem 1rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
          font-weight: 500;
        }
        
        .load-button:hover, .action-button:hover {
          background-color: #0051a2;
        }
        
        .resources-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        
        .resource-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }
        
        .resource-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        
        .resource-header h3 {
          margin: 0;
          color: #0c1e35;
          font-size: 1.2rem;
          flex-grow: 1;
        }
        
        .resource-id {
          font-size: 0.8rem;
          color: #666;
          background: #f5f5f5;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          white-space: nowrap;
          margin-left: 0.5rem;
        }
        
        .resource-description {
          color: #555;
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        
        .resource-details {
          margin-bottom: 1rem;
          flex-grow: 1;
        }
        
        .resource-details summary {
          cursor: pointer;
          color: #0070f3;
          padding: 0.5rem 0;
        }
        
        .json-data {
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 4px;
          overflow: auto;
          max-height: 300px;
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }
        
        .resource-actions {
          margin-top: auto;
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled for IndexedDB compatibility
export default dynamic(() => Promise.resolve(ResourceTypePage), {
  ssr: false
})