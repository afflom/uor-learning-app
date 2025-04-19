/**
 * Dynamic Model Provider Page
 * 
 * This catch-all route handles dynamic model provider pages
 */
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'

// Client-side only component due to IndexedDB usage
const ModelProviderDetailPage = () => {
  const router = useRouter()
  const { providerId } = router.query
  
  const [isClient, setIsClient] = useState(false)
  const [provider, setProvider] = useState<any>(null)
  const [outputs, setOutputs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Set isClient to true when the component mounts on the client
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Load provider details when component mounts
  useEffect(() => {
    if (!isClient || !providerId) return
    
    async function loadProviderDetails() {
      try {
        setError(null)
        
        // The providerId is an array for catch-all routes - join to get the full path
        const fullProviderId = Array.isArray(providerId) ? providerId.join('/') : (providerId || '')
        
        // If we don't have a valid provider ID, show error
        if (!fullProviderId) {
          setError('Invalid provider ID')
          setIsLoading(false)
          return
        }
        
        // Check if IndexedDB is supported
        if (typeof window === 'undefined' || !('indexedDB' in window)) {
          setError('IndexedDB is not supported in this browser')
          setIsLoading(false)
          return
        }

        // Import knowledge base components
        const { IndexedDBKnowledgeBase } = await import('../../../knowledgebase/indexedDbKnowledgeBase')
        
        // Create knowledge base instance - use 0 to automatically use the existing version
        const kb = new IndexedDBKnowledgeBase('uor-kb', 0)
        
        // Get resource type for this provider
        const resourceType = `model-outputs/${fullProviderId}`
        
        // Get outputs for this provider
        try {
          // @ts-ignore - Method exists on our implementation
          const records = await kb.getAllOfType(resourceType)
          
          if (records.length === 0) {
            setError(`No outputs found for provider ${fullProviderId}`)
          } else {
            // Set provider info based on first output
            const providerType = fullProviderId.startsWith('text-embedding') ? 'Text Embedding' : 
                      fullProviderId.startsWith('digital-signature') ? 'Digital Signature' :
                      'Unknown'
            
            setProvider({
              id: fullProviderId,
              name: fullProviderId,
              type: providerType,
              outputCount: records.length,
              lastUpdated: records.length > 0 ? 
                new Date(Math.max(...records.map(output => 
                  new Date((output.record.resource as any).timestamp || 0).getTime()
                ))) : null
            })
            
            // Map records to outputs
            const outputsList = records.map(record => ({
              outputId: record.id,
              contentId: (record.record.resource as any).contentId,
              timestamp: (record.record.resource as any).timestamp,
              details: record.record.resource
            }))
            
            setOutputs(outputsList)
          }
        } catch (err: any) {
          console.error('Error getting model provider outputs:', err)
          setError(`Error getting model provider outputs: ${err?.message || 'Unknown error'}`)
        }
      } catch (err: any) {
        console.error('Error in loadProviderDetails:', err)
        setError(err?.message || 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProviderDetails()
  }, [isClient, providerId])
  
  // If we're still on the server, return a loading message
  if (!isClient) {
    return <div>Loading model provider details...</div>
  }
  
  return (
    <div className="provider-detail-page">
      <h1>Model Provider Details</h1>
      
      {isLoading ? (
        <div className="loading">Loading provider details...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : provider ? (
        <>
          <div className="provider-info">
            <h2>{provider.name}</h2>
            <div className="provider-metadata">
              <div className="info-item">
                <span className="label">Type:</span>
                <span className="value">{provider.type}</span>
              </div>
              <div className="info-item">
                <span className="label">Output Count:</span>
                <span className="value">{provider.outputCount}</span>
              </div>
              <div className="info-item">
                <span className="label">Last Updated:</span>
                <span className="value">
                  {provider.lastUpdated ? provider.lastUpdated.toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="outputs-section">
            <h3>Model Outputs</h3>
            
            {outputs.length === 0 ? (
              <div className="empty-state">
                <p>No outputs found for this model provider.</p>
                <Link href="/knowledge-base/process">
                  <button className="process-button">Process Content</button>
                </Link>
              </div>
            ) : (
              <table className="outputs-table">
                <thead>
                  <tr>
                    <th>Output ID</th>
                    <th>Content ID</th>
                    <th>Timestamp</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {outputs.map((output, index) => (
                    <tr key={index}>
                      <td>{output.outputId}</td>
                      <td>{output.contentId}</td>
                      <td>{new Date(output.timestamp).toLocaleString()}</td>
                      <td>
                        <Link href={`/knowledge-base/view/${encodeURIComponent(output.contentId)}`}>
                          <button className="view-button">View Content</button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {provider.type === 'Text Embedding' && (
            <div className="provider-actions">
              <h3>Embedding Model Actions</h3>
              <p>
                This text embedding model creates vector representations of text content.
                You can use these embeddings to find similar content or perform semantic searches.
              </p>
              <Link href="/knowledge-base/process">
                <button className="action-button">Process New Content</button>
              </Link>
            </div>
          )}
          
          {provider.type === 'Digital Signature' && (
            <div className="provider-actions">
              <h3>Digital Signature Actions</h3>
              <p>
                This digital signature provider creates and verifies signatures for content.
                You can use it to verify the authenticity and integrity of content.
              </p>
              <Link href="/knowledge-base/process">
                <button className="action-button">Sign New Content</button>
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="error">Provider not found</div>
      )}
      
      <div className="actions-section">
        <Link href="/knowledge-base/models">
          <button className="back-button">Back to Model Providers</button>
        </Link>
      </div>
      
      <style jsx>{`
        .provider-detail-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        h1 {
          margin-bottom: 1rem;
          color: #0c1e35;
        }
        
        h2 {
          color: #0070f3;
          margin-bottom: 1rem;
        }
        
        h3 {
          color: #333;
          margin: 1.5rem 0 1rem;
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
          margin-bottom: 1rem;
        }
        
        .provider-info {
          background: #f5f7fa;
          border-radius: 6px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          margin-bottom: 2rem;
        }
        
        .provider-metadata {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .label {
          font-weight: 500;
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.2rem;
        }
        
        .value {
          font-size: 1.1rem;
        }
        
        .outputs-section, .provider-actions {
          background: #f5f7fa;
          border-radius: 6px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          margin-bottom: 2rem;
        }
        
        .outputs-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        
        .outputs-table th,
        .outputs-table td {
          padding: 0.8rem;
          text-align: left;
          border-bottom: 1px solid #e5e8ed;
        }
        
        .outputs-table th {
          background-color: #f0f2f5;
          font-weight: 600;
        }
        
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: #666;
          background: #f9f9f9;
          border-radius: 4px;
          margin: 1rem 0;
        }
        
        .view-button, .process-button, .action-button {
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.6rem 1rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .view-button:hover {
          background-color: #3d8b40;
        }
        
        .process-button, .action-button {
          background-color: #0070f3;
          padding: 0.8rem 1.2rem;
          font-size: 1rem;
        }
        
        .process-button:hover, .action-button:hover {
          background-color: #0051a2;
        }
        
        .actions-section {
          margin-top: 2rem;
          margin-bottom: 2rem;
        }
        
        .back-button {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 0.8rem 1.2rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .back-button:hover {
          background-color: #e5e5e5;
        }
        
        .provider-actions p {
          margin-bottom: 1.5rem;
          color: #555;
        }
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled for IndexedDB compatibility
export default dynamic(() => Promise.resolve(ModelProviderDetailPage), {
  ssr: false
})