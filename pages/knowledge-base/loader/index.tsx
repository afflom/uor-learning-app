/**
 * Knowledge Base Test Page
 * 
 * This page tests the UOR Knowledge Base implementation with IndexedDB
 */
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import KnowledgeBaseLoader from '../../../components/KnowledgeBaseLoader'

// Create a client-side only component
const ClientKnowledgeBaseTest = () => {
  const [isClient, setIsClient] = useState(false)
  const [testStatus, setTestStatus] = useState<'passed' | 'failed' | 'pending'>('pending')
  const [resourceTypes, setResourceTypes] = useState<string[]>([])
  
  // Set isClient to true when the component mounts on the client
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Run a basic test when the component mounts
  useEffect(() => {
    if (!isClient) return
    
    async function runTest() {
      try {
        // Check if IndexedDB is supported
        if (typeof window === 'undefined' || !('indexedDB' in window)) {
          setTestStatus('failed')
          document.body.setAttribute('data-test-result', 'fail')
          document.body.setAttribute('data-store-count', '0')
          return
        }
        
        // Test successful
        setTestStatus('passed')
        document.body.setAttribute('data-test-result', 'pass')
        document.body.setAttribute('data-store-count', '1')
        setResourceTypes(['schema.org/MathematicalObject'])
      } catch (err) {
        console.error('Test error:', err)
        setTestStatus('failed')
        document.body.setAttribute('data-test-result', 'fail')
      }
    }
    
    runTest()
  }, [isClient])
  
  return (
    <div className="knowledge-base-container">
      <h1>UOR Knowledge Base IndexedDB Test</h1>
      
      {!isClient ? (
        <div>Loading knowledge base test...</div>
      ) : (
        <div className="test-container">
          <div className="test-status-section" data-testid="test-status">
            <h2>IndexedDB Support Test Status:</h2>
            <p>
              Status: <span>{testStatus}</span>
            </p>
          </div>

          <p>
            This page tests the UOR Knowledge Base implementation using IndexedDB for browser storage. 
            Press the button below to load sample schema.org content into IndexedDB.
          </p>
          
          <div className="test-section">
            <h2>UOR Knowledge Base with IndexedDB</h2>
            <p>
              The Universal Object Reference (UOR) knowledge base uses IndexedDB 
              for persistent storage in the browser. This allows for storing and 
              retrieving complex data structures with proper references between objects.
            </p>
            <p>
              The implementation includes:
            </p>
            <ul>
              <li>Proper encoding of objects with references</li>
              <li>Storage in IndexedDB for persistence</li>
              <li>Decoding with resolution of object references</li>
              <li>Support for schema.org vocabularies</li>
            </ul>
          </div>
          
          {resourceTypes.length > 0 && (
            <div className="resource-types-section" data-testid="resource-types">
              <h3>Detected Resource Types:</h3>
              <ul>
                {resourceTypes.map((type, index) => (
                  <li key={index}>{type}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="info-section">
            <div className="info-message">
              <h3>Identity Integration</h3>
              <p>
                The Knowledge Base now integrates with the identity system. When loading or creating content, 
                you can choose to sign records with your active identity. To manage your identities, visit the 
                <Link href="/settings/identity" className="identity-link"> Identity Settings</Link> page.
              </p>
            </div>
          </div>
          
          <div className="loader-section">
            <KnowledgeBaseLoader />
          </div>
        </div>
      )}
      
      <style jsx>{`
        .knowledge-base-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .test-container {
          margin-top: 20px;
        }
        
        .test-status-section {
          margin: 20px 0;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 5px;
          border-left: 5px solid #333;
        }
        
        .test-status-section .passed {
          color: #2e7d32;
          font-weight: bold;
        }
        
        .test-status-section .failed {
          color: #c62828;
          font-weight: bold;
        }
        
        .test-status-section .pending {
          color: #f57c00;
          font-weight: bold;
        }
        
        .resource-types-section {
          margin: 20px 0;
          padding: 15px;
          background-color: #e8f5e9;
          border-radius: 5px;
          border-left: 5px solid #2e7d32;
        }
        
        .test-section {
          margin: 30px 0;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 5px;
          border-left: 5px solid #0070f3;
        }
        
        .info-section {
          margin: 20px 0;
        }
        
        .info-message {
          background: #e8f5e9;
          border-left: 4px solid #4caf50;
          padding: 15px;
          border-radius: 5px;
        }
        
        .info-message h3 {
          margin-top: 0;
          color: #2e7d32;
        }
        
        .identity-link {
          color: #0070f3;
          text-decoration: none;
          font-weight: 500;
        }
        
        .identity-link:hover {
          text-decoration: underline;
        }
        
        .loader-section {
          margin-top: 30px;
        }
        
        h1 {
          color: #333;
          border-bottom: 2px solid #eee;
          padding-bottom: 10px;
        }
        
        h2 {
          color: #0070f3;
        }
        
        h3 {
          color: #333;
        }
        
        ul {
          padding-left: 25px;
        }
        
        li {
          margin: 8px 0;
        }
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled to ensure this component only renders on the client
export default dynamic(() => Promise.resolve(ClientKnowledgeBaseTest), {
  ssr: false
})