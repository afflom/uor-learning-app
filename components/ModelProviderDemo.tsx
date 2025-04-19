/**
 * Model Provider Demo - Demonstrates the Model Provider system
 * 
 * Shows how different model providers can process the same content
 * and create their own UOR records linked to artifacts.
 */
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

interface ModelOutput {
  providerId: string
  outputId: string
  timestamp: string
  status: 'success' | 'error'
  details?: any
}

// Client-side only component to avoid SSR issues with IndexedDB
const ModelProviderDemo = () => {
  const [isClient, setIsClient] = useState(false)
  const [isIndexedDBSupported, setIsIndexedDBSupported] = useState(false)
  const [sampleContent, setSampleContent] = useState('')
  const [contentId, setContentId] = useState('')
  const [modelOutputs, setModelOutputs] = useState<ModelOutput[]>([])
  const [embeddingSimilarity, setEmbeddingSimilarity] = useState<number | null>(null)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Check if we're on the client and if IndexedDB is supported
  useEffect(() => {
    setIsClient(true)
    const hasIndexedDB = typeof window !== 'undefined' && 
                       'indexedDB' in window && 
                       window.indexedDB !== null
    
    setIsIndexedDBSupported(hasIndexedDB)
    
    if (hasIndexedDB) {
      console.log('IndexedDB is supported in this browser')
    } else {
      console.log('IndexedDB is NOT supported in this browser')
      setError('IndexedDB is not supported in this browser')
    }
  }, [])

  // Process content with all model providers
  const processContent = async () => {
    if (!isClient || !isIndexedDBSupported || !sampleContent) {
      setError('Cannot process content: IndexedDB not supported or no content provided')
      return
    }

    try {
      setStatus('Processing...')
      setError(null)
      setModelOutputs([])
      setEmbeddingSimilarity(null)
      setIsVerified(null)

      // Dynamically import necessary modules
      const { IndexedDBKnowledgeBase } = await import('../knowledgebase/indexedDbKnowledgeBase')
      const { TextEmbeddingProvider, DigitalSignatureProvider } = await import('../knowledgebase/modelProvider')
      const { HashStore } = await import('../knowledgebase/hashStore')

      // Create knowledge base - use 0 to automatically use the existing version
      const kb = new IndexedDBKnowledgeBase('uor-kb', 0)
      
      // Store the original content using HashStore
      const hashStore = new HashStore(kb)
      await hashStore.store(sampleContent, 'text', { source: 'user-input' })
      const newContentId = `text-content-${Date.now()}`
      setContentId(newContentId)

      // Create model providers
      const embeddingProvider = new TextEmbeddingProvider(kb, 'universal-sentence-encoder', 512)
      const signatureProvider = new DigitalSignatureProvider(kb, 'app-signer')

      // Process with text embedding provider
      const embeddingOutputId = await embeddingProvider.processContent(sampleContent, 'text', newContentId)
      const embeddingOutput = await embeddingProvider.getOutput(embeddingOutputId)

      // Process with digital signature provider
      const signatureOutputId = await signatureProvider.processContent(sampleContent, 'text', newContentId)
      const signatureOutput = await signatureProvider.getOutput(signatureOutputId)

      // Get results
      setModelOutputs([
        {
          providerId: embeddingProvider.getProviderId(),
          outputId: embeddingOutputId,
          timestamp: embeddingOutput.timestamp,
          status: 'success',
          details: {
            dimensions: embeddingOutput.metadata.dimensions,
            embeddingHash: embeddingOutput.embeddingHash
          }
        },
        {
          providerId: signatureProvider.getProviderId(),
          outputId: signatureOutputId,
          timestamp: signatureOutput.timestamp,
          status: 'success',
          details: {
            algorithm: signatureOutput.metadata.algorithm,
            signatureHash: signatureOutput.signatureHash,
            contentHash: signatureOutput.contentHash
          }
        }
      ])

      setStatus('Processing complete')
    } catch (err: any) {
      console.error('Error in processContent:', err)
      setError(err?.message || 'Unknown error')
      setStatus('Error')
    }
  }

  // Verify the digital signature
  const verifySignature = async () => {
    if (!isClient || !isIndexedDBSupported || modelOutputs.length === 0) {
      setError('Cannot verify: No model outputs available')
      return
    }

    try {
      setStatus('Verifying signature...')
      
      // Find signature output
      const signatureOutput = modelOutputs.find(output => 
        output.providerId.startsWith('digital-signature')
      )
      
      if (!signatureOutput) {
        setError('No signature found')
        return
      }

      // Dynamically import necessary modules
      const { IndexedDBKnowledgeBase } = await import('../knowledgebase/indexedDbKnowledgeBase')
      const { DigitalSignatureProvider } = await import('../knowledgebase/modelProvider')

      // Create knowledge base and provider - use 0 to automatically use the existing version
      const kb = new IndexedDBKnowledgeBase('uor-kb', 0)
      const signatureParts = signatureOutput.providerId.split('-')
      const signerName = signatureParts[signatureParts.length - 1]
      const signatureProvider = new DigitalSignatureProvider(kb, signerName)

      // Verify signature
      const isValid = await signatureProvider.verifySignature(signatureOutput.outputId, sampleContent)
      setIsVerified(isValid)
      setStatus(isValid ? 'Signature verified' : 'Signature invalid')
    } catch (err: any) {
      console.error('Error verifying signature:', err)
      setError(err?.message || 'Unknown error during verification')
      setStatus('Error')
    }
  }

  // Calculate similarity between two text embeddings
  const calculateSimilarity = async () => {
    if (!isClient || !isIndexedDBSupported || modelOutputs.length === 0) {
      setError('Cannot calculate similarity: No model outputs available')
      return
    }

    try {
      setStatus('Creating second embedding for comparison...')
      
      // Find embedding output
      const embeddingOutput = modelOutputs.find(output => 
        output.providerId.startsWith('text-embedding')
      )
      
      if (!embeddingOutput) {
        setError('No embedding found')
        return
      }

      // Create a slightly modified version of the content
      const modifiedContent = sampleContent + ' (slightly modified)'
      const modifiedContentId = `modified-${contentId}`

      // Dynamically import necessary modules
      const { IndexedDBKnowledgeBase } = await import('../knowledgebase/indexedDbKnowledgeBase')
      const { TextEmbeddingProvider } = await import('../knowledgebase/modelProvider')

      // Create knowledge base and provider - use 0 to automatically use the existing version
      const kb = new IndexedDBKnowledgeBase('uor-kb', 0)
      const providerParts = embeddingOutput.providerId.split('-')
      const modelName = providerParts[providerParts.length - 1]
      const dimensions = embeddingOutput.details.dimensions
      const embeddingProvider = new TextEmbeddingProvider(kb, modelName, dimensions)

      // Create embedding for modified content
      const newEmbeddingId = await embeddingProvider.processContent(modifiedContent, 'text', modifiedContentId)

      // Calculate similarity
      const similarity = await embeddingProvider.calculateSimilarity(embeddingOutput.outputId, newEmbeddingId)
      setEmbeddingSimilarity(similarity)
      setStatus('Similarity calculated')
    } catch (err: any) {
      console.error('Error calculating similarity:', err)
      setError(err?.message || 'Unknown error calculating similarity')
      setStatus('Error')
    }
  }

  // If we're still on the server or the client hasn't initialized yet, show a loading message
  if (!isClient) {
    return <div>Loading model provider demo...</div>
  }

  return (
    <div className="model-provider-demo">
      <h2>Model Provider System Demo</h2>
      
      {!isIndexedDBSupported && (
        <div className="browser-warning" data-testid="browser-warning">
          <p><strong>Warning:</strong> IndexedDB is not supported in your browser. 
          This feature requires a modern browser with IndexedDB support.</p>
        </div>
      )}
      
      <div className="demo-section">
        <h3>Sample Content</h3>
        <p>Enter some text content to be processed by different model providers:</p>
        
        <textarea 
          value={sampleContent}
          onChange={(e) => setSampleContent(e.target.value)}
          placeholder="Enter text content here..."
          rows={5}
          className="content-input"
          data-testid="content-input"
        />
        
        <button 
          onClick={processContent}
          disabled={!isIndexedDBSupported || !sampleContent || sampleContent.length < 10}
          className="process-button"
          data-testid="process-button"
        >
          Process with Model Providers
        </button>
        
        {status && (
          <div className="status" data-testid="status">
            Status: {status}
          </div>
        )}
        
        {error && (
          <div className="error" data-testid="error">
            Error: {error}
          </div>
        )}
      </div>
      
      {modelOutputs.length > 0 && (
        <div className="outputs-section" data-testid="outputs-section">
          <h3>Model Outputs</h3>
          <p>Each model provider has processed the content and created its own UOR records:</p>
          
          <table>
            <thead>
              <tr>
                <th>Provider ID</th>
                <th>Output ID</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {modelOutputs.map((output, index) => (
                <tr key={index}>
                  <td>{output.providerId}</td>
                  <td>{output.outputId}</td>
                  <td>{new Date(output.timestamp).toLocaleString()}</td>
                  <td>{output.status}</td>
                  <td>
                    <pre>{JSON.stringify(output.details, null, 2)}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="actions-section">
            <h3>Verify and Compare</h3>
            <p>Perform operations on the model outputs:</p>
            
            <div className="actions-buttons">
              <button 
                onClick={verifySignature}
                className="verify-button"
                data-testid="verify-button"
              >
                Verify Digital Signature
              </button>
              
              <button 
                onClick={calculateSimilarity}
                className="similarity-button"
                data-testid="similarity-button"
              >
                Calculate Embedding Similarity
              </button>
            </div>
            
            {isVerified !== null && (
              <div className={`verification-result ${isVerified ? 'success' : 'error'}`} data-testid="verification-result">
                Signature verification: {isVerified ? 'Valid ✓' : 'Invalid ✗'}
              </div>
            )}
            
            {embeddingSimilarity !== null && (
              <div className="similarity-result" data-testid="similarity-result">
                <p>Similarity between original and modified text:</p>
                <div className="similarity-value">
                  {(embeddingSimilarity * 100).toFixed(2)}%
                </div>
                <p className="explanation">
                  (Values closer to 100% indicate more similar content)
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .model-provider-demo {
          margin: 20px 0;
          padding: 20px;
          border: 1px solid #eee;
          border-radius: 5px;
        }
        
        .browser-warning {
          margin: 15px 0;
          padding: 10px 15px;
          background-color: #fff8e1;
          color: #856404;
          border-left: 4px solid #ffc107;
          border-radius: 4px;
        }
        
        .demo-section {
          margin: 20px 0;
        }
        
        .content-input {
          width: 100%;
          margin-bottom: 15px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-family: inherit;
        }
        
        .process-button {
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 5px;
          padding: 10px 15px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .process-button:hover {
          background-color: #0051a2;
        }
        
        .process-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .status {
          margin-top: 10px;
          padding: 8px;
          background-color: #f0f4ff;
          border-radius: 4px;
        }
        
        .error {
          margin-top: 10px;
          padding: 8px;
          background-color: #fff0f0;
          color: #d00;
          border-radius: 4px;
          border-left: 4px solid #d00;
        }
        
        .outputs-section {
          margin-top: 30px;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background-color: #f5f5f5;
        }
        
        pre {
          font-size: 12px;
          background-color: #f5f5f5;
          padding: 5px;
          border-radius: 3px;
          max-height: 100px;
          overflow-y: auto;
          white-space: pre-wrap;
        }
        
        .actions-section {
          margin-top: 20px;
        }
        
        .actions-buttons {
          display: flex;
          gap: 15px;
          margin: 15px 0;
        }
        
        .verify-button, .similarity-button {
          background-color: #34a853;
          color: white;
          border: none;
          border-radius: 5px;
          padding: 10px 15px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .verify-button:hover {
          background-color: #2d8f47;
        }
        
        .similarity-button {
          background-color: #4285f4;
        }
        
        .similarity-button:hover {
          background-color: #366dc9;
        }
        
        .verification-result {
          margin-top: 15px;
          padding: 10px;
          border-radius: 4px;
          font-weight: bold;
        }
        
        .verification-result.success {
          background-color: #e6f4ea;
          color: #34a853;
        }
        
        .verification-result.error {
          background-color: #fce8e6;
          color: #ea4335;
        }
        
        .similarity-result {
          margin-top: 15px;
          padding: 15px;
          background-color: #e8f0fe;
          border-radius: 5px;
          text-align: center;
        }
        
        .similarity-value {
          font-size: 24px;
          font-weight: bold;
          color: #4285f4;
          margin: 10px 0;
        }
        
        .explanation {
          font-size: 14px;
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled to ensure this component only renders on the client
export default dynamic(() => Promise.resolve(ModelProviderDemo), {
  ssr: false
})