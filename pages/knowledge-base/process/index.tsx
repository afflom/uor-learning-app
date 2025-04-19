/**
 * Content Processing Page
 * 
 * Process content with model providers to create records linked to artifacts.
 */
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

interface ModelProvider {
  id: string
  name: string
  type: string
}

interface ProcessResult {
  providerId: string
  outputId: string
  timestamp: string
  status: 'success' | 'error'
  details?: any
}

// Client-side only component due to IndexedDB usage
const ContentProcessingPage = () => {
  const [isClient, setIsClient] = useState(false)
  const [content, setContent] = useState('')
  const [contentId, setContentId] = useState('')
  const [contentType, setContentType] = useState('text')
  const [availableProviders, setAvailableProviders] = useState<ModelProvider[]>([])
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [results, setResults] = useState<ProcessResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Set isClient to true when the component mounts on the client
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Load available model providers
  useEffect(() => {
    if (!isClient) return
    
    async function loadProviders() {
      try {
        setError(null)
        
        // Check if IndexedDB is supported
        if (typeof window === 'undefined' || !('indexedDB' in window)) {
          setError('IndexedDB is not supported in this browser')
          setIsLoading(false)
          return
        }

        // Import knowledge base components
        const { IndexedDBKnowledgeBase } = await import('../../../knowledgebase/indexedDbKnowledgeBase')
        
        // Create knowledge base instance
        const kb = new IndexedDBKnowledgeBase('uor-kb', 0)
        
        // Get resource types that are model providers
        try {
          // @ts-ignore - Property exists on our implementation
          const allTypes = await kb.getResourceTypes()
          
          // Filter for model provider types
          const modelProviderTypes = allTypes.filter(type => type.startsWith('model-outputs/'))
          
          // Format providers
          const providers = modelProviderTypes.map(type => {
            const id = type.replace('model-outputs/', '')
            return {
              id,
              name: id,
              type: id.startsWith('text-embedding') ? 'Text Embedding' : 
                    id.startsWith('digital-signature') ? 'Digital Signature' :
                    'Unknown'
            }
          })
          
          setAvailableProviders(providers)
          
          // Select all providers by default
          setSelectedProviders(providers.map(p => p.id))
        } catch (err: any) {
          console.error('Error getting model providers:', err)
          setError(`Error getting model providers: ${err?.message || 'Unknown error'}`)
        }
      } catch (err: any) {
        console.error('Error in loadProviders:', err)
        setError(err?.message || 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProviders()
  }, [isClient])
  
  // Handle provider selection
  const handleProviderSelection = (providerId: string) => {
    if (selectedProviders.includes(providerId)) {
      setSelectedProviders(selectedProviders.filter(id => id !== providerId))
    } else {
      setSelectedProviders([...selectedProviders, providerId])
    }
  }
  
  // Process content with selected model providers
  const handleProcessContent = async () => {
    if (!content) {
      setError('Please enter content to process')
      return
    }
    
    if (selectedProviders.length === 0) {
      setError('Please select at least one model provider')
      return
    }
    
    try {
      setIsProcessing(true)
      setError(null)
      setResults([])
      
      // Import necessary modules
      const { IndexedDBKnowledgeBase } = await import('../../../knowledgebase/indexedDbKnowledgeBase')
      const modelProviders = await import('../../../knowledgebase/modelProvider')
      const { HashStore } = await import('../../../knowledgebase/hashStore')
      
      // Create knowledge base instance - use 0 to automatically use the existing version
      const kb = new IndexedDBKnowledgeBase('uor-kb', 0)
      
      // Store the original content
      const hashStore = new HashStore(kb)
      await hashStore.store(content, contentType, { source: 'user-input' })
      
      // Generate content ID if not already set
      const newContentId = contentId || `content-${Date.now()}`
      setContentId(newContentId)
      
      // Process with each selected provider
      const processResults: ProcessResult[] = []
      
      for (const providerId of selectedProviders) {
        try {
          let provider
          
          // Create the appropriate provider based on type
          if (providerId.startsWith('text-embedding')) {
            const parts = providerId.split('-')
            const modelName = parts[parts.length - 1]
            provider = new modelProviders.TextEmbeddingProvider(kb, modelName, 512)
          } else if (providerId.startsWith('digital-signature')) {
            const parts = providerId.split('-')
            const signerName = parts[parts.length - 1]
            provider = new modelProviders.DigitalSignatureProvider(kb, signerName)
          } else {
            throw new Error(`Unknown provider type: ${providerId}`)
          }
          
          // Process the content
          const outputId = await provider.processContent(content, contentType, newContentId)
          const output = await provider.getOutput(outputId)
          
          // Add to results
          processResults.push({
            providerId: provider.getProviderId(),
            outputId,
            timestamp: output.timestamp,
            status: 'success',
            details: output
          })
        } catch (err: any) {
          console.error(`Error processing with ${providerId}:`, err)
          
          // Add error result
          processResults.push({
            providerId,
            outputId: '',
            timestamp: new Date().toISOString(),
            status: 'error',
            details: { error: err.message || 'Unknown error' }
          })
        }
      }
      
      setResults(processResults)
    } catch (err: any) {
      console.error('Error in handleProcessContent:', err)
      setError(err?.message || 'An unknown error occurred')
    } finally {
      setIsProcessing(false)
    }
  }
  
  // If we're still on the server, return a loading message
  if (!isClient) {
    return <div>Loading content processing...</div>
  }
  
  return (
    <div className="process-page">
      <h1>Process Content with Model Providers</h1>
      
      <p className="description">
        Process content with multiple model providers to create different interpretations.
        Each model provider creates its own record linking to a content artifact.
      </p>
      
      {isLoading ? (
        <div className="loading">Loading model providers...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="content-section">
            <h2>Content</h2>
            
            <div className="form-group">
              <label htmlFor="contentType">Content Type:</label>
              <select 
                id="contentType" 
                value={contentType} 
                onChange={(e) => setContentType(e.target.value)}
                disabled={isProcessing}
              >
                <option value="text">Text</option>
                <option value="json">JSON</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="contentId">Content ID (optional):</label>
              <input 
                type="text" 
                id="contentId" 
                value={contentId} 
                onChange={(e) => setContentId(e.target.value)}
                placeholder="Leave blank to auto-generate"
                disabled={isProcessing}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="content">Content:</label>
              <textarea 
                id="content" 
                value={content} 
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter content to process..."
                rows={8}
                disabled={isProcessing}
              />
            </div>
          </div>
          
          <div className="providers-section">
            <h2>Select Model Providers</h2>
            
            {availableProviders.length === 0 ? (
              <div className="empty-state">
                <p>No model providers found. Please add a model provider first.</p>
                <Link href="/knowledge-base/models">
                  <button className="add-button">Add Model Provider</button>
                </Link>
              </div>
            ) : (
              <div className="provider-list">
                {availableProviders.map((provider, index) => (
                  <div key={index} className="provider-item">
                    <input 
                      type="checkbox" 
                      id={`provider-${provider.id}`} 
                      checked={selectedProviders.includes(provider.id)}
                      onChange={() => handleProviderSelection(provider.id)}
                      disabled={isProcessing}
                    />
                    <label htmlFor={`provider-${provider.id}`}>
                      <span className="provider-name">{provider.name}</span>
                      <span className="provider-type">{provider.type}</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
            
            <button 
              className="process-button"
              onClick={handleProcessContent}
              disabled={isProcessing || !content || selectedProviders.length === 0}
            >
              {isProcessing ? 'Processing...' : 'Process Content'}
            </button>
          </div>
          
          {results.length > 0 && (
            <div className="results-section">
              <h2>Processing Results</h2>
              
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Output ID</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className={result.status === 'error' ? 'error-row' : ''}>
                      <td>{result.providerId}</td>
                      <td className={`status ${result.status}`}>
                        {result.status === 'success' ? '✓ Success' : '✗ Error'}
                      </td>
                      <td>{result.outputId || '-'}</td>
                      <td>{new Date(result.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="result-actions">
                <Link href={`/knowledge-base/view/${encodeURIComponent(contentId)}`}>
                  <button className="view-button">View Content Records</button>
                </Link>
              </div>
            </div>
          )}
          
          <div className="actions-section">
            <Link href="/knowledge-base">
              <button className="back-button">Back to Knowledge Base</button>
            </Link>
            
            <Link href="/knowledge-base/models">
              <button className="models-button">Model Providers</button>
            </Link>
          </div>
        </>
      )}
      
      <style jsx>{`
        .process-page {
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
          margin-bottom: 1rem;
        }
        
        h2 {
          margin-top: 0;
          color: #0c1e35;
          font-size: 1.4rem;
        }
        
        .content-section, .providers-section, .results-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f5f7fa;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.7rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          font-family: inherit;
        }
        
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: #666;
          background: #f9f9f9;
          border-radius: 4px;
          margin: 1rem 0;
        }
        
        .provider-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
        }
        
        .provider-item {
          display: flex;
          align-items: center;
          padding: 0.7rem;
          background: #fff;
          border-radius: 4px;
          border: 1px solid #eee;
        }
        
        .provider-item input {
          margin-right: 0.8rem;
        }
        
        .provider-item label {
          display: flex;
          flex-direction: column;
          cursor: pointer;
          flex-grow: 1;
        }
        
        .provider-name {
          font-weight: 500;
        }
        
        .provider-type {
          font-size: 0.8rem;
          color: #666;
          margin-top: 0.2rem;
        }
        
        .process-button {
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
          width: 100%;
        }
        
        .process-button:hover {
          background-color: #0051a2;
        }
        
        .process-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .results-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        
        .results-table th,
        .results-table td {
          padding: 0.8rem;
          text-align: left;
          border-bottom: 1px solid #e5e8ed;
        }
        
        .results-table th {
          background-color: #f0f2f5;
          font-weight: 600;
        }
        
        .status {
          font-weight: 500;
        }
        
        .status.success {
          color: #2e7d32;
        }
        
        .status.error {
          color: #c62828;
        }
        
        .error-row {
          background-color: #fff8f8;
        }
        
        .result-actions {
          margin-top: 1rem;
          display: flex;
          justify-content: center;
        }
        
        .view-button {
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.8rem 1.2rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .view-button:hover {
          background-color: #3d8b40;
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
        
        .add-button, .models-button {
          background-color: #6c5ce7;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.8rem 1.2rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .add-button:hover, .models-button:hover {
          background-color: #5649c0;
        }
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled for IndexedDB compatibility
export default dynamic(() => Promise.resolve(ContentProcessingPage), {
  ssr: false
})