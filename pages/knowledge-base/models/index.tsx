/**
 * Knowledge Base Model Providers Page
 * 
 * This page displays and manages the model providers integrated with the knowledge base.
 */
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Client-side only component due to IndexedDB usage
const ModelProvidersPage = () => {
  const [isClient, setIsClient] = useState(false)
  const [modelProviders, setModelProviders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newModelName, setNewModelName] = useState('')
  const [newModelType, setNewModelType] = useState('text-embedding')
  
  // Set isClient to true when the component mounts on the client
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Load model providers when component mounts
  useEffect(() => {
    if (!isClient) return
    
    async function loadModelProviders() {
      try {
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
        
        // Get resource types that are model providers
        try {
          // @ts-ignore - Property exists on our implementation
          const allTypes = await kb.getResourceTypes()
          
          // Filter for model provider types (types that start with 'model-outputs/')
          const modelProviderTypes = allTypes.filter(type => type.startsWith('model-outputs/'))
          
          // Get details for each provider
          const providers = []
          for (const type of modelProviderTypes) {
            const providerName = type.replace('model-outputs/', '')
            
            // @ts-ignore - Method exists on our implementation
            const outputs = await kb.getAllOfType(type)
            
            providers.push({
              id: providerName,
              type: providerName.startsWith('text-embedding') ? 'Text Embedding' : 
                    providerName.startsWith('digital-signature') ? 'Digital Signature' :
                    'Unknown',
              name: providerName,
              outputCount: outputs.length,
              lastUpdated: outputs.length > 0 ? 
                new Date(Math.max(...outputs.map(output => 
                  new Date((output.record.resource as any).timestamp || 0).getTime()
                ))) : null
            })
          }
          
          setModelProviders(providers)
        } catch (err: any) {
          console.error('Error getting model providers:', err)
          setError(`Error getting model providers: ${err?.message || 'Unknown error'}`)
        }
      } catch (err: any) {
        console.error('Error in loadModelProviders:', err)
        setError(err?.message || 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadModelProviders()
  }, [isClient])
  
  // Handle adding a new model provider
  const handleAddProvider = async () => {
    if (!newModelName) {
      setError('Please enter a name for the model provider')
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Import necessary modules
      const { IndexedDBKnowledgeBase } = await import('../../../knowledgebase/indexedDbKnowledgeBase')
      const { TextEmbeddingProvider, DigitalSignatureProvider } = await import('../../../knowledgebase/modelProvider')
      
      // Create knowledge base instance - use 0 to automatically use the existing version
      const kb = new IndexedDBKnowledgeBase('uor-kb', 0)
      
      // Create appropriate provider based on type
      if (newModelType === 'text-embedding') {
        // For embedding models, dimensions are required
        const dimensions = 512 // Default to 512 dimensions
        const provider = new TextEmbeddingProvider(kb, newModelName, dimensions)
        
        // Add a sample output to register the provider
        const sampleText = "This is a sample text to initialize the model provider."
        await provider.processContent(sampleText, 'text', 'sample-content-' + Date.now())
      } else if (newModelType === 'digital-signature') {
        // Create signature provider
        const provider = new DigitalSignatureProvider(kb, newModelName)
        
        // Add a sample output to register the provider
        const sampleText = "This is a sample text to initialize the model provider."
        await provider.processContent(sampleText, 'text', 'sample-content-' + Date.now())
      }
      
      // Reload providers
      const allTypes = await kb.getResourceTypes()
      const modelProviderTypes = allTypes.filter(type => type.startsWith('model-outputs/'))
      const providers = []
      
      for (const type of modelProviderTypes) {
        const providerName = type.replace('model-outputs/', '')
        
        // @ts-ignore - Method exists on our implementation
        const outputs = await kb.getAllOfType(type)
        
        providers.push({
          id: providerName,
          type: providerName.startsWith('text-embedding') ? 'Text Embedding' : 
                providerName.startsWith('digital-signature') ? 'Digital Signature' :
                'Unknown',
          name: providerName,
          outputCount: outputs.length,
          lastUpdated: outputs.length > 0 ? 
            new Date(Math.max(...outputs.map(output => 
              new Date((output.record.resource as any).timestamp || 0).getTime()
            ))) : null
        })
      }
      
      setModelProviders(providers)
      setNewModelName('')
    } catch (err: any) {
      console.error('Error adding model provider:', err)
      setError(`Error adding model provider: ${err?.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // If we're still on the server, return a loading message
  if (!isClient) {
    return <div>Loading model providers...</div>
  }
  
  return (
    <div className="model-providers-page">
      <h1>Model Providers</h1>
      
      <p className="description">
        Model providers process content and create UOR records that link to model artifacts.
        Different model providers interpret the same content in different ways, creating a
        multi-dimensional knowledge representation.
      </p>
      
      {isLoading ? (
        <div className="loading">Loading model providers...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="model-providers-list">
            <h2>Available Model Providers</h2>
            
            {modelProviders.length === 0 ? (
              <div className="empty-state">
                <p>No model providers found in the knowledge base.</p>
                <p>Add a new model provider below to get started.</p>
              </div>
            ) : (
              <table className="providers-table">
                <thead>
                  <tr>
                    <th>Provider Name</th>
                    <th>Type</th>
                    <th>Output Count</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {modelProviders.map((provider, index) => (
                    <tr key={index}>
                      <td>{provider.name}</td>
                      <td>{provider.type}</td>
                      <td>{provider.outputCount}</td>
                      <td>{provider.lastUpdated ? provider.lastUpdated.toLocaleString() : 'Never'}</td>
                      <td>
                        <Link href={`/knowledge-base/models/${provider.id}`}>
                          <button className="view-button">View</button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="add-provider-section">
            <h2>Add New Model Provider</h2>
            <div className="add-form">
              <div className="form-group">
                <label htmlFor="modelType">Provider Type:</label>
                <select 
                  id="modelType" 
                  value={newModelType} 
                  onChange={(e) => setNewModelType(e.target.value)}
                >
                  <option value="text-embedding">Text Embedding</option>
                  <option value="digital-signature">Digital Signature</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="modelName">Provider Name:</label>
                <input 
                  type="text" 
                  id="modelName" 
                  value={newModelName} 
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="Enter model name"
                />
              </div>
              
              <button 
                className="add-button"
                onClick={handleAddProvider}
                disabled={!newModelName}
              >
                Add Provider
              </button>
            </div>
          </div>
          
          <div className="actions-section">
            <Link href="/knowledge-base">
              <button className="back-button">Back to Knowledge Base</button>
            </Link>
            
            <Link href="/knowledge-base/process">
              <button className="process-button">Process Content</button>
            </Link>
          </div>
        </>
      )}
      
      <style jsx>{`
        .model-providers-page {
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
        
        .model-providers-list {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f5f7fa;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        h2 {
          margin-top: 0;
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
        
        .providers-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        
        .providers-table th,
        .providers-table td {
          padding: 0.8rem;
          text-align: left;
          border-bottom: 1px solid #e5e8ed;
        }
        
        .providers-table th {
          background-color: #f0f2f5;
          font-weight: 600;
        }
        
        .view-button {
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.4rem 0.8rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .view-button:hover {
          background-color: #3d8b40;
        }
        
        .add-provider-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f5f7fa;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .add-form {
          margin-top: 1rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.7rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .add-button {
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
        
        .add-button:hover {
          background-color: #0051a2;
        }
        
        .add-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .actions-section {
          margin-top: 2rem;
          display: flex;
          justify-content: space-between;
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
        
        .process-button {
          background-color: #6c5ce7;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.8rem 1.2rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .process-button:hover {
          background-color: #5649c0;
        }
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled for IndexedDB compatibility
export default dynamic(() => Promise.resolve(ModelProvidersPage), {
  ssr: false
})