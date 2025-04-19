import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import Link from 'next/link'

// Client-side only component due to IndexedDB usage
const TypeSettingsPage = () => {
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
    return <div>Loading type settings...</div>
  }

  return (
    <div className="type-settings-page">
      <div className="header">
        <Link href="/settings" className="back-link">
          ← Back to Settings
        </Link>
        <h1>Settings: {typeName}</h1>
      </div>
      
      <div className="type-info">
        <h2>Type Configuration</h2>
        <p>
          Configure settings for all resources of type <strong>{typeName}</strong>. 
          Changes to type definitions will create new derived types while preserving the originals.
        </p>
        
        <div className="config-card">
          <h3>Schema Definition</h3>
          <div className="config-fields">
            <div className="config-field">
              <label>Type Name</label>
              <input type="text" value={typeName as string} disabled />
              <p className="field-help">Type names are immutable. Create a new type to rename.</p>
            </div>
            
            <div className="config-field">
              <label>Required Properties</label>
              <div className="checkbox-list">
                <div className="checkbox-item">
                  <input type="checkbox" id="req-name" defaultChecked />
                  <label htmlFor="req-name">name</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="req-id" defaultChecked />
                  <label htmlFor="req-id">@id</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="req-context" defaultChecked />
                  <label htmlFor="req-context">@context</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="req-description" />
                  <label htmlFor="req-description">description</label>
                </div>
              </div>
            </div>
            
            <div className="config-field">
              <label>Validation Rules</label>
              <select defaultValue="schema.org">
                <option value="schema.org">schema.org</option>
                <option value="custom">Custom Rules</option>
                <option value="none">No Validation</option>
              </select>
            </div>
            
            <div className="config-field">
              <label>Derivation Base</label>
              <p className="field-value">{typeName as string}</p>
              <p className="field-help">New types created from this type will reference it as their base.</p>
            </div>
          </div>
          
          <div className="config-actions">
            <button className="action-button primary">Save Configuration</button>
            <button className="action-button">Derive New Type</button>
          </div>
        </div>
      </div>
      
      <div className="type-instances">
        <h2>Type Instances ({resources.length})</h2>
        
        {isLoading ? (
          <div className="loading">Loading resources...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : resources.length === 0 ? (
          <div className="empty-state">
            <p>No resources found for this type.</p>
            <Link href="/uor/knowledgeBaseTest">
              <button className="action-button">Load Sample Data</button>
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
                
                <Link 
                  href={`/settings/types/${encodeURIComponent(typeName as string)}/${encodeURIComponent(item.id)}`}
                  className="action-button resource-button"
                >
                  Configure Instance
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .type-settings-page {
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
        
        h2 {
          margin: 2rem 0 1rem;
          color: #0c1e35;
          font-size: 1.4rem;
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
        
        .type-info p {
          color: #555;
          margin-bottom: 1.5rem;
        }
        
        .config-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .config-card h3 {
          margin-top: 0;
          color: #0c1e35;
          border-bottom: 1px solid #eee;
          padding-bottom: 0.8rem;
          margin-bottom: 1.5rem;
        }
        
        .config-fields {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        
        .config-field {
          margin-bottom: 0.5rem;
        }
        
        .config-field label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #333;
        }
        
        .config-field input[type="text"],
        .config-field select {
          width: 100%;
          padding: 0.6rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .config-field input[type="text"]:disabled {
          background: #f5f5f5;
          color: #666;
        }
        
        .field-help {
          margin-top: 0.4rem;
          color: #666;
          font-size: 0.85rem;
        }
        
        .field-value {
          padding: 0.6rem;
          background: #f5f5f5;
          border-radius: 4px;
          margin: 0;
          font-family: monospace;
        }
        
        .checkbox-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.5rem;
        }
        
        .checkbox-item {
          display: flex;
          align-items: center;
        }
        
        .checkbox-item input {
          margin-right: 0.5rem;
        }
        
        .config-actions {
          margin-top: 2rem;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }
        
        .action-button {
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.6rem 1rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
          font-weight: 500;
          text-decoration: none;
          text-align: center;
        }
        
        .action-button:hover {
          background-color: #0051a2;
        }
        
        .action-button.primary {
          background-color: #0070f3;
        }
        
        .action-button.primary:hover {
          background-color: #0051a2;
        }
        
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: #666;
          background: #f9f9f9;
          border-radius: 4px;
          margin: 1rem 0;
        }
        
        .resources-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
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
        
        .resource-button {
          margin-top: auto;
          display: block;
        }
        
        @media (min-width: 768px) {
          .config-fields {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled for IndexedDB compatibility
export default dynamic(() => Promise.resolve(TypeSettingsPage), {
  ssr: false
})