/**
 * Knowledge Base Loader Component
 * 
 * This component loads sample content from the knowledgebase directory into IndexedDB.
 * Now supports signing records with the current identity.
 */
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Sample data - in a real app, this would be dynamically loaded from API/files
const sampleData = [
  {
    file: 'intrinsicPrimes.json',
    content: {
      "@context": "https://schema.org",
      "@type": "MathematicalObject",
      "@id": "intrinsic-primes",
      "name": "Intrinsic Primes",
      "description": "Fundamental building blocks in the Universal Object Reference framework that cannot be decomposed further and serve as the basis for all representable structures."
    }
  },
  {
    file: 'uniqueFactorization.json',
    content: {
      "@context": "https://schema.org",
      "@type": "MathematicalObject",
      "@id": "unique-factorization",
      "name": "Unique Factorization",
      "description": "The principle that every object in a well-defined domain can be uniquely decomposed into a product of prime elements, up to ordering and equivalence."
    }
  },
  {
    file: 'primeCoordinates.json',
    content: {
      "@context": "https://schema.org",
      "@type": "MathematicalObject",
      "@id": "prime-coordinates",
      "name": "Prime Coordinates",
      "description": "The representation of objects as vectors of exponents in a prime basis, enabling a direct mapping between objects and their prime decomposition."
    }
  },
  {
    file: 'coherenceNorm.json',
    content: {
      "@context": "https://schema.org",
      "@type": "MathematicalObject",
      "@id": "coherence-norm",
      "name": "Coherence Norm",
      "description": "A measure of representational complexity defined on prime coordinates, providing a metric for the 'simplicity' or 'coherence' of structures."
    }
  }
]

// Client-side only component to avoid IndexedDB issues during SSR
const KnowledgeBaseLoader = () => {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{file: string, status: string}[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isIndexedDBSupported, setIsIndexedDBSupported] = useState(false)
  const [signWithIdentity, setSignWithIdentity] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [conceptName, setConceptName] = useState('')
  const [conceptDescription, setConceptDescription] = useState('')
  
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
  
  // Helper to get identity provider
  const getIdentityProvider = () => {
    if (typeof window === 'undefined') return null
    return (window as any).identityProvider
  }
  
  // Handle loading content into IndexedDB - kept for backward compatibility
  // eslint-disable-next-line no-unused-vars
  const handleLoadContent = () => {
    // For tests that expect this function
    if (handleImportContent) {
      handleImportContent()
    }
  }
  
  // Handle creating a new mathematical concept
  const handleCreateConcept = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isClient || !isIndexedDBSupported) {
      setError('Cannot create concept: IndexedDB is not supported')
      return
    }
    
    // Need an identity provider and active identity
    const identityProvider = getIdentityProvider()
    if (!identityProvider) {
      setError('Cannot create concept: Identity provider not available')
      return
    }
    
    const currentIdentity = identityProvider.getCurrentIdentity()
    if (!currentIdentity) {
      setError('Cannot create concept: No active identity. Please sign in first.')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Create a new mathematical concept
      const conceptData = {
        "@context": "https://schema.org",
        "@type": "MathematicalObject",
        "name": conceptName,
        "description": conceptDescription,
        "createdAt": new Date().toISOString()
      }
      
      // Use identity provider's createRecord method
      // This automatically signs the record
      const { id } = await identityProvider.createRecord(
        conceptData,
        "schema.org/MathematicalObject"
      )
      
      // Show success result
      setResults([{
        file: 'Created Concept',
        status: `Created and signed: "${conceptName}" with ID: ${id}`
      }])
      
      // Clear form
      setConceptName('')
      setConceptDescription('')
      setShowCreateForm(false)
    } catch (err: any) {
      console.error('Error creating concept:', err)
      setError(err?.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle loading content into IndexedDB
  const handleImportContent = async () => {
    if (!isClient || !isIndexedDBSupported) {
      setError('Cannot load content: IndexedDB is not supported')
      return
    }
    
    setLoading(true)
    setResults([])
    setError(null)
    
    try {
      // Dynamically import the UOREncoder and IndexedDBKnowledgeBase
      // This ensures they are only loaded on the client side
      const { UOREncoder } = await import('../knowledgebase/uorEncoder')
      const { IndexedDBKnowledgeBase } = await import('../knowledgebase/indexedDbKnowledgeBase')
      
      console.log('Creating knowledge base...')
      // Use version 0 to automatically use the existing version
      const kb = new IndexedDBKnowledgeBase('uor-kb', 0)
      const encoder = new UOREncoder(kb)
      
      // Get the current identity if signing is enabled
      let currentIdentityId: string | undefined = undefined
      
      if (signWithIdentity) {
        const identityProvider = getIdentityProvider()
        if (identityProvider) {
          const currentIdentity = identityProvider.getCurrentIdentity()
          if (currentIdentity) {
            currentIdentityId = currentIdentity.id
            setResults([{ 
              file: '-- INFO --', 
              status: `Signing records with identity: ${currentIdentity.name} (${currentIdentity.id})` 
            }])
          } else {
            setResults([{ 
              file: '-- WARNING --', 
              status: 'No active identity found. Records will not be signed.' 
            }])
          }
        } else {
          setResults([{ 
            file: '-- WARNING --', 
            status: 'Identity provider not available. Records will not be signed.' 
          }])
        }
      }
      
      // Process each item sequentially
      let loadedResults = [...results]
      
      // Import using the identity provider if available
      const identityProvider = getIdentityProvider()
      
      for (const item of sampleData) {
        try {
          console.log(`Importing file: ${item.file}`)
          const resourceType = item.content['@type'] || 'MathematicalObject'
          
          // Use the identity provider if available for better control
          if (identityProvider) {
            // Import the record - explicitly setting whether to sign
            const { id } = await identityProvider.importRecord(
              item.content,
              `schema.org/${resourceType}`,
              signWithIdentity
            )
            
            if (signWithIdentity && currentIdentityId) {
              loadedResults.push({
                file: item.file,
                status: `Imported and signed with ID: ${id}`
              })
            } else {
              loadedResults.push({
                file: item.file,
                status: `Imported with ID: ${id} (not signed)`
              })
            }
          } else {
            // Fallback to direct encoder if identity provider not available
            const id = await encoder.encode(
              item.content, 
              `schema.org/${resourceType}`,
              currentIdentityId,
              { 
                imported: true, 
                signed: signWithIdentity 
              }
            )
            
            loadedResults.push({
              file: item.file,
              status: `Imported with ID: ${id} (using direct encoder)`
            })
          }
        } catch (err: any) {
          console.error(`Error importing ${item.file}:`, err)
          loadedResults.push({
            file: item.file,
            status: `Error: ${err?.message || 'Unknown error'}`
          })
        }
        
        // Update results after each item
        setResults([...loadedResults])
      }
      
      // Get resource types
      try {
        // @ts-ignore - Property exists on our implementation
        const types = await kb.getResourceTypes()
        
        setResults(prev => [
          ...prev,
          { file: '-- SUMMARY --', status: `Resource types in IndexedDB: ${types.join(', ')}` }
        ])
      } catch (err: any) {
        console.error('Error getting resource types:', err)
        setResults(prev => [
          ...prev,
          { file: '-- SUMMARY --', status: `Error getting resource types: ${err?.message || 'Unknown error'}` }
        ])
      }
    } catch (err: any) {
      console.error('Error in handleLoadContent:', err)
      setError(err?.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  
  // If we're still on the server or the client hasn't initialized yet, show a loading message
  if (!isClient) {
    return <div>Loading knowledge base functionality...</div>
  }
  
  return (
    <div className="knowledge-base-loader">
      <h2>Knowledge Base Content Loader</h2>
      
      {!isIndexedDBSupported && (
        <div className="browser-warning" data-testid="kb-browser-warning">
          <p><strong>Warning:</strong> IndexedDB is not supported in your browser. 
          This feature requires a modern browser with IndexedDB support.</p>
        </div>
      )}
      
      <div className="controls">
        <div className="control-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={signWithIdentity}
              onChange={e => setSignWithIdentity(e.target.checked)}
              disabled={loading}
            />
            Sign imported content with current identity
          </label>
          <div className="info-text">
            Note: Created records are always signed, imported records are signed only when explicitly requested
          </div>
        </div>
        
        <div className="button-group">
          <button 
            onClick={handleImportContent} 
            disabled={loading || !isIndexedDBSupported}
            className="load-button"
            data-testid="load-kb-button"
            id="handleLoadContent" // For backwards compatibility with tests
          >
            {loading ? 'Loading...' : 'Import Sample Content'}
          </button>
          
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={loading}
            className="create-button"
          >
            {showCreateForm ? 'Hide Form' : 'Create New Concept'}
          </button>
        </div>
      </div>
      
      {showCreateForm && (
        <div className="create-form">
          <h3>Create Mathematical Concept</h3>
          <p className="note">This will be signed by your active identity</p>
          
          <form onSubmit={handleCreateConcept}>
            <div className="form-group">
              <label htmlFor="conceptName">Concept Name:</label>
              <input 
                type="text"
                id="conceptName"
                value={conceptName}
                onChange={e => setConceptName(e.target.value)}
                required
                placeholder="e.g., Coherence Manifold"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="conceptDescription">Description:</label>
              <textarea
                id="conceptDescription"
                value={conceptDescription}
                onChange={e => setConceptDescription(e.target.value)}
                required
                rows={3}
                placeholder="Describe this mathematical concept..."
              />
            </div>
            
            <div className="form-actions">
              <button
                type="submit"
                disabled={loading || !conceptName || !conceptDescription}
                className="submit-button"
              >
                {loading ? 'Creating...' : 'Create & Sign'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="cancel-button"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {error && (
        <div className="error" data-testid="kb-load-error">
          Error: {error}
        </div>
      )}
      
      {results.length > 0 && (
        <div className="results" data-testid="kb-load-results">
          <h3>Loading Results:</h3>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr 
                  key={index} 
                  className={
                    result.status.includes('Error') 
                      ? 'error-row' 
                      : result.status.includes('signed') 
                        ? 'signed-row' 
                        : ''
                  }
                >
                  <td>{result.file}</td>
                  <td>{result.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <style jsx>{`
        .knowledge-base-loader {
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
        
        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .control-options {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 5px;
        }
        
        .info-text {
          font-size: 12px;
          color: #666;
          font-style: italic;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }
        
        .checkbox-label input {
          margin-right: 8px;
          cursor: pointer;
        }
        
        .button-group {
          display: flex;
          gap: 10px;
        }
        
        .load-button {
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 5px;
          padding: 10px 15px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .load-button:hover {
          background-color: #0051a2;
        }
        
        .create-button {
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 5px;
          padding: 10px 15px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .create-button:hover {
          background-color: #388e3c;
        }
        
        button:disabled {
          background-color: #ccc !important;
          cursor: not-allowed;
        }
        
        .create-form {
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
          background-color: #f9f9f9;
        }
        
        .create-form h3 {
          margin-top: 0;
          margin-bottom: 5px;
        }
        
        .note {
          margin-top: 0;
          font-size: 13px;
          color: #666;
          margin-bottom: 15px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .form-group input, .form-group textarea {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          font-size: 14px;
        }
        
        .form-group textarea {
          resize: vertical;
        }
        
        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        
        .submit-button {
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 5px;
          padding: 8px 15px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .submit-button:hover {
          background-color: #388e3c;
        }
        
        .cancel-button {
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 5px;
          padding: 8px 15px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .cancel-button:hover {
          background-color: #d32f2f;
        }
        
        .error {
          margin-top: 15px;
          padding: 10px;
          background-color: #fff0f0;
          color: #d00;
          border-radius: 4px;
          border-left: 4px solid #d00;
        }
        
        .results {
          margin-top: 20px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background-color: #f5f5f5;
        }
        
        .error-row {
          background-color: #fff0f0;
          color: #d00;
        }
        
        .signed-row {
          background-color: #f0fff4;
          color: #00796b;
        }
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled to ensure this component only renders on the client
export default dynamic(() => Promise.resolve(KnowledgeBaseLoader), {
  ssr: false
})