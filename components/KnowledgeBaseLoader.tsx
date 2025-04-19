/**
 * Knowledge Base Loader Component
 * 
 * This component loads sample content from the knowledgebase directory into IndexedDB.
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
  
  // Handle loading content into IndexedDB
  const handleLoadContent = async () => {
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
      
      // Process each item sequentially
      const loadedResults = []
      for (const item of sampleData) {
        try {
          console.log(`Encoding file: ${item.file}`)
          const resourceType = item.content['@type'] || 'MathematicalObject'
          const id = await encoder.encode(item.content, `schema.org/${resourceType}`)
          
          loadedResults.push({
            file: item.file,
            status: `Encoded successfully with ID: ${id}`
          })
        } catch (err: any) {
          console.error(`Error encoding ${item.file}:`, err)
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
      
      <button 
        onClick={handleLoadContent} 
        disabled={loading || !isIndexedDBSupported}
        className="load-button"
        data-testid="load-kb-button"
      >
        {loading ? 'Loading...' : 'Load Content into IndexedDB'}
      </button>
      
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
                <tr key={index} className={result.status.includes('Error') ? 'error-row' : ''}>
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
        
        .load-button {
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 5px;
          padding: 10px 15px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s ease;
          margin-bottom: 20px;
        }
        
        .load-button:hover {
          background-color: #0051a2;
        }
        
        .load-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
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
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled to ensure this component only renders on the client
export default dynamic(() => Promise.resolve(KnowledgeBaseLoader), {
  ssr: false
})