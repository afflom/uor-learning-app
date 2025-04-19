import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Client-side only component due to IndexedDB usage
const SettingsPage = () => {
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
        const kb = new IndexedDBKnowledgeBase('uor-kb', 0)
        
        // Get resource types
        try {
          // @ts-ignore - Property exists on our implementation
          const allTypes = await kb.getResourceTypes()
          
          // Filter and organize types by namespace
          const organizedTypes = allTypes.map(type => {
            // Already has a namespace prefix
            if (type.includes('/')) {
              return type;
            }
            
            // Handle schema.org types
            if (type.startsWith('schema.org')) {
              return type;
            }
            
            // Handle model output types
            if (type.startsWith('model-outputs')) {
              return type;
            }
            
            // For known system types
            if (['primitives', 'MathematicalObject'].includes(type)) {
              return `uor/${type}`;
            }
            
            // For content hash IDs, assign to content namespace
            if (/^[0-9a-f]{32,}$/i.test(type)) {
              return `content/${type}`;
            }
            
            // For remaining types, add a generic namespace
            return `types/${type}`;
          });
          
          // Filter out content types from the settings view
          const filteredTypes = organizedTypes.filter(type => 
            !type.startsWith('content/')
          );
          
          setResourceTypes(filteredTypes)
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
    return <div>Loading settings...</div>
  }

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      
      <p className="description">
        Configure settings for the Universal Object Reference framework. Settings are synchronized 
        with the knowledge base, allowing you to configure and extend resource types and define
        custom configurations.
      </p>
      
      <div className="settings-info">
        <div className="info-card">
          <h3>How Settings Work</h3>
          <p>
            Each topic in the knowledge base has a corresponding configuration section. 
            Settings enable object definitions to be configured and extended while maintaining 
            type immutability - modified types become new types in the system.
          </p>
        </div>
      </div>
      
      <div className="settings-categories">
        <h2>Resource Type Settings</h2>
        
        {isLoading ? (
          <div className="loading">Loading resource types...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : resourceTypes.length === 0 ? (
          <div className="empty-state">
            <p>No resource types found in the knowledge base.</p>
            <Link href="/uor/knowledgeBaseTest">
              <button className="action-button">Load Sample Data</button>
            </Link>
          </div>
        ) : (
          <div className="settings-grid">
            {resourceTypes.map((type, index) => (
              <Link 
                key={index} 
                href={`/settings/types/${encodeURIComponent(type)}`}
                className="settings-card"
              >
                <h3>{type}</h3>
                <p>Configure type schemas and validation rules</p>
                <div className="card-icon">⚙️</div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      <div className="settings-actions">
        <h2>System Settings</h2>
        <div className="settings-grid">
          <div className="settings-card system-card">
            <h3>User Preferences</h3>
            <p>Configure appearance and behavior</p>
            <div className="card-icon">👤</div>
          </div>
          
          <div className="settings-card system-card">
            <h3>Knowledge Base</h3>
            <p>Manage storage and indexing</p>
            <div className="card-icon">🗄️</div>
          </div>
          
          <Link 
            href="/knowledge-base" 
            className="settings-card system-card"
          >
            <h3>Browse Knowledge Base</h3>
            <p>View all stored resources</p>
            <div className="card-icon">🔍</div>
          </Link>
        </div>
      </div>
      
      <div className="settings-actions">
        <h2>Create New Type</h2>
        <div className="settings-grid">
          <div className="settings-card new-type-card">
            <h3>Create Custom Type</h3>
            <p>Define a new resource type from existing schemas</p>
            <div className="card-icon">➕</div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .settings-page {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        h1 {
          margin-bottom: 1rem;
          color: #0c1e35;
        }
        
        h2 {
          margin: 2rem 0 1rem;
          color: #0c1e35;
          font-size: 1.4rem;
        }
        
        .description {
          color: #555;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }
        
        .settings-info {
          margin-bottom: 2rem;
        }
        
        .info-card {
          background: #f0f7ff;
          border-left: 4px solid #0070f3;
          padding: 1.5rem;
          border-radius: 4px;
        }
        
        .info-card h3 {
          margin-top: 0;
          color: #0070f3;
        }
        
        .info-card p {
          color: #444;
          line-height: 1.6;
          margin-bottom: 0;
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
        
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: #666;
          background: #f9f9f9;
          border-radius: 4px;
          margin: 1rem 0;
        }
        
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        
        .settings-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 1.5rem;
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
          text-decoration: none;
          color: inherit;
          overflow: hidden;
        }
        
        .settings-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .settings-card h3 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          color: #0c1e35;
          font-size: 1.2rem;
        }
        
        .settings-card p {
          color: #666;
          font-size: 0.95rem;
          margin-bottom: 0;
        }
        
        .card-icon {
          position: absolute;
          bottom: 0.5rem;
          right: 0.5rem;
          font-size: 2rem;
          opacity: 0.15;
          transition: opacity 0.2s;
        }
        
        .settings-card:hover .card-icon {
          opacity: 0.3;
        }
        
        .system-card {
          background: #f8f9fa;
          border: 1px solid #eaeaea;
        }
        
        .new-type-card {
          background: #f0f7ff;
          border: 1px dashed #0070f3;
        }
        
        .new-type-card h3 {
          color: #0070f3;
        }
        
        .action-button {
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.8rem 1.2rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          font-weight: 500;
          margin-top: 1rem;
        }
        
        .action-button:hover {
          background-color: #0051a2;
        }
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled for IndexedDB compatibility
export default dynamic(() => Promise.resolve(SettingsPage), {
  ssr: false
})