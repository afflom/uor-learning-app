/**
 * Content View Page
 * 
 * View content and its model outputs
 */
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface ModelOutput {
  providerId: string
  outputId: string
  contentId: string
  timestamp: string
  details: any
}

// Client-side only component due to IndexedDB usage
const ContentViewPage = () => {
  const router = useRouter()
  const { contentId } = router.query
  
  const [isClient, setIsClient] = useState(false)
  const [content, setContent] = useState<any>(null)
  const [modelOutputs, setModelOutputs] = useState<ModelOutput[]>([])
  const [selectedOutput, setSelectedOutput] = useState<ModelOutput | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Set isClient to true when the component mounts on the client
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Load content and model outputs when content ID is available
  useEffect(() => {
    if (!isClient || !contentId) return
    
    async function loadContentData() {
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
        const { HashStore } = await import('../../../knowledgebase/hashStore')
        
        // Create knowledge base instance - use 0 to automatically use the existing version
        const kb = new IndexedDBKnowledgeBase('uor-kb', 0)
        const hashStore = new HashStore(kb)
        
        // Get all resource types
        // @ts-ignore - Property exists on our implementation
        const allTypes = await kb.getResourceTypes()
        
        // Filter for model provider types
        const modelProviderTypes = allTypes.filter(type => type.startsWith('model-outputs/'))
        
        // Get output records for this content ID
        const outputs: ModelOutput[] = []
        
        for (const type of modelProviderTypes) {
          try {
            // @ts-ignore - Method exists on our implementation
            const records = await kb.getAllOfType(type)
            
            // Filter for records related to this content ID
            const relatedRecords = records.filter(record => 
              (record.record.resource as any).contentId === contentId
            )
            
            for (const record of relatedRecords) {
              outputs.push({
                providerId: type.replace('model-outputs/', ''),
                outputId: record.id,
                contentId: (record.record.resource as any).contentId,
                timestamp: (record.record.resource as any).timestamp,
                details: record.record.resource
              })
            }
          } catch (err) {
            console.error(`Error getting records from ${type}:`, err)
          }
        }
        
        setModelOutputs(outputs)
        
        // If there are outputs, try to retrieve the original content
        if (outputs.length > 0 && outputs[0].details.contentHash) {
          try {
            const contentPrimitive = await hashStore.retrieve(outputs[0].details.contentHash)
            setContent(contentPrimitive ? contentPrimitive.value : null)
          } catch (err) {
            console.error('Error retrieving content:', err)
          }
        }
        
        // Select the first output by default
        if (outputs.length > 0) {
          setSelectedOutput(outputs[0])
        }
      } catch (err: any) {
        console.error('Error in loadContentData:', err)
        setError(err?.message || 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadContentData()
  }, [isClient, contentId])
  
  // Handle verifying a signature
  const verifySignature = async () => {
    if (!selectedOutput || !selectedOutput.providerId.startsWith('digital-signature')) {
      setError('No digital signature selected to verify')
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Import necessary modules
      const { IndexedDBKnowledgeBase } = await import('../../../knowledgebase/indexedDbKnowledgeBase')
      const { DigitalSignatureProvider } = await import('../../../knowledgebase/modelProvider')
      
      // Create KB and provider
      const kb = new IndexedDBKnowledgeBase('uor-kb', 0)
      const providerParts = selectedOutput.providerId.split('-')
      const signerName = providerParts[providerParts.length - 1]
      const signatureProvider = new DigitalSignatureProvider(kb, signerName)
      
      // Verify the signature
      const isValid = await signatureProvider.verifySignature(selectedOutput.outputId, content)
      
      alert(isValid ? 'Signature verified successfully! ✓' : 'Signature verification failed! ✗')
    } catch (err: any) {
      console.error('Error verifying signature:', err)
      setError(`Error verifying signature: ${err?.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle calculating similarity between embeddings
  const calculateSimilarity = async (compareText: string) => {
    if (!selectedOutput || !selectedOutput.providerId.startsWith('text-embedding')) {
      setError('No text embedding selected to compare')
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Import necessary modules
      const { IndexedDBKnowledgeBase } = await import('../../../knowledgebase/indexedDbKnowledgeBase')
      const { TextEmbeddingProvider } = await import('../../../knowledgebase/modelProvider')
      
      // Create KB and provider
      const kb = new IndexedDBKnowledgeBase('uor-kb', 0)
      const providerParts = selectedOutput.providerId.split('-')
      const modelName = providerParts[providerParts.length - 1]
      const dimensions = selectedOutput.details.metadata.dimensions
      const embeddingProvider = new TextEmbeddingProvider(kb, modelName, dimensions)
      
      // Create embedding for compare text
      const compareContentId = `compare-${Date.now()}`
      const compareEmbeddingId = await embeddingProvider.processContent(
        compareText, 
        'text', 
        compareContentId
      )
      
      // Calculate similarity
      const similarity = await embeddingProvider.calculateSimilarity(
        selectedOutput.outputId, 
        compareEmbeddingId
      )
      
      if (similarity !== null) {
        alert(`Similarity: ${(similarity * 100).toFixed(2)}%`)
      } else {
        alert('Could not calculate similarity')
      }
    } catch (err: any) {
      console.error('Error calculating similarity:', err)
      setError(`Error calculating similarity: ${err?.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle output selection
  const handleSelectOutput = (output: ModelOutput) => {
    setSelectedOutput(output)
  }
  
  // If we're still on the server, return a loading message
  if (!isClient) {
    return <div>Loading content view...</div>
  }
  
  return (
    <div className="content-view-page">
      <h1>Content View</h1>
      
      {isLoading ? (
        <div className="loading">Loading content...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="content-section">
            <h2>Content ID: {contentId}</h2>
            
            {content ? (
              <div className="content-display">
                <pre>{typeof content === 'string' ? content : JSON.stringify(content, null, 2)}</pre>
              </div>
            ) : (
              <div className="empty-state">
                <p>Original content not available.</p>
              </div>
            )}
          </div>
          
          <div className="outputs-section">
            <h2>Model Outputs</h2>
            
            {modelOutputs.length === 0 ? (
              <div className="empty-state">
                <p>No model outputs found for this content.</p>
                <Link href="/knowledge-base/process">
                  <button className="process-button">Process Content</button>
                </Link>
              </div>
            ) : (
              <div className="outputs-container">
                <div className="outputs-list">
                  <h3>Available Outputs</h3>
                  {modelOutputs.map((output, index) => (
                    <div 
                      key={index} 
                      className={`output-item ${selectedOutput?.outputId === output.outputId ? 'selected' : ''}`}
                      onClick={() => handleSelectOutput(output)}
                    >
                      <div className="output-type">
                        {output.providerId.startsWith('text-embedding') ? '📊 Embedding' :
                         output.providerId.startsWith('digital-signature') ? '🔒 Signature' :
                         '🔄 Other'}
                      </div>
                      <div className="output-provider">{output.providerId}</div>
                      <div className="output-date">{new Date(output.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                
                <div className="output-details">
                  <h3>Output Details</h3>
                  
                  {selectedOutput ? (
                    <>
                      <div className="detail-header">
                        <h4>{selectedOutput.providerId}</h4>
                        <div className="detail-timestamp">
                          Created: {new Date(selectedOutput.timestamp).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="detail-actions">
                        {selectedOutput.providerId.startsWith('digital-signature') && (
                          <button 
                            className="verify-button"
                            onClick={verifySignature}
                            disabled={isLoading}
                          >
                            Verify Signature
                          </button>
                        )}
                        
                        {selectedOutput.providerId.startsWith('text-embedding') && (
                          <button 
                            className="compare-button"
                            onClick={() => {
                              const compareText = prompt('Enter text to compare similarity:')
                              if (compareText) {
                                calculateSimilarity(compareText)
                              }
                            }}
                            disabled={isLoading}
                          >
                            Compare Similarity
                          </button>
                        )}
                      </div>
                      
                      <div className="detail-content">
                        <pre>{JSON.stringify(selectedOutput.details, null, 2)}</pre>
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">
                      <p>Select an output to view details</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="actions-section">
            <Link href="/knowledge-base">
              <button className="back-button">Back to Knowledge Base</button>
            </Link>
            
            <Link href="/knowledge-base/process">
              <button className="process-button">Process More Content</button>
            </Link>
          </div>
        </>
      )}
      
      <style jsx>{`
        .content-view-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        h1 {
          margin-bottom: 1rem;
          color: #0c1e35;
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
        
        h3 {
          color: #0c1e35;
          font-size: 1.2rem;
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        h4 {
          margin: 0;
          font-size: 1.1rem;
        }
        
        .content-section, .outputs-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f5f7fa;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .content-display {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 4px;
          padding: 1rem;
          margin-top: 1rem;
          overflow-x: auto;
        }
        
        .content-display pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: #666;
          background: #f9f9f9;
          border-radius: 4px;
          margin: 1rem 0;
        }
        
        .outputs-container {
          display: flex;
          gap: 1.5rem;
          margin-top: 1rem;
        }
        
        .outputs-list {
          flex: 1;
          min-width: 200px;
        }
        
        .output-item {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 4px;
          padding: 1rem;
          margin-bottom: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .output-item:hover {
          border-color: #0070f3;
          box-shadow: 0 2px 4px rgba(0, 112, 243, 0.1);
        }
        
        .output-item.selected {
          border-color: #0070f3;
          background-color: #f0f7ff;
          box-shadow: 0 2px 4px rgba(0, 112, 243, 0.1);
        }
        
        .output-type {
          font-weight: 500;
          margin-bottom: 0.3rem;
        }
        
        .output-provider {
          font-size: 0.9rem;
          color: #555;
        }
        
        .output-date {
          font-size: 0.8rem;
          color: #777;
          margin-top: 0.5rem;
        }
        
        .output-details {
          flex: 2;
          min-width: 300px;
        }
        
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.8rem;
          border-bottom: 1px solid #eee;
        }
        
        .detail-timestamp {
          font-size: 0.8rem;
          color: #777;
        }
        
        .detail-actions {
          margin-bottom: 1rem;
        }
        
        .verify-button, .compare-button {
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.6rem 1rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-right: 0.5rem;
        }
        
        .verify-button:hover {
          background-color: #3d8b40;
        }
        
        .compare-button {
          background-color: #2196f3;
        }
        
        .compare-button:hover {
          background-color: #0d8aee;
        }
        
        .detail-content {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 4px;
          padding: 1rem;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .detail-content pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 0.9rem;
        }
        
        .actions-section {
          margin-top: 2rem;
          display: flex;
          justify-content: space-between;
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
export default dynamic(() => Promise.resolve(ContentViewPage), {
  ssr: false
})