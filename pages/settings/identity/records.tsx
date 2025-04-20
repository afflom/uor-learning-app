/**
 * Signed Records Page
 * 
 * View and manage records signed by your identities
 */
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Layout from '../../../components/Layout'

// Client-side only component
const SignedRecordsPage = () => {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [identities, setIdentities] = useState<any[]>([])
  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null)
  const [signedRecords, setSignedRecords] = useState<any[]>([])
  
  // Set isClient to true when the component mounts on the client
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Load identities when component mounts
  useEffect(() => {
    if (!isClient) return
    
    async function loadIdentities() {
      try {
        if (typeof window === 'undefined') return
        
        // Get the identity provider
        const identityProvider = (window as any).identityProvider
        
        if (!identityProvider) {
          // Initialize identity provider if not already available
          const { IdentityProvider } = await import('../../../knowledgebase/IdentityProvider')
          const provider = new IdentityProvider()
          await provider.initialize()
          ;(window as any).identityProvider = provider
          
          // Check for saved user ID
          const savedUserId = localStorage.getItem('uorCurrentUserId')
          if (savedUserId) {
            try {
              await provider.login(savedUserId)
            } catch (err) {
              console.error('Failed to restore session:', err)
              localStorage.removeItem('uorCurrentUserId')
            }
          }
        }
        
        // Get the current identity provider
        const provider = (window as any).identityProvider
        
        // Get current user
        const currentUser = provider.getCurrentUser()
        
        if (!currentUser) {
          setError('Please sign in to view your signed records')
          setIsLoading(false)
          return
        }
        
        // Get user identities
        const userIdentities = await provider.getUserIdentities()
        setIdentities(userIdentities)
        
        // Set selected identity to current active identity
        const currentIdentity = provider.getCurrentIdentity()
        if (currentIdentity) {
          setSelectedIdentity(currentIdentity.id)
          
          // Load records signed by this identity
          await loadSignedRecords(currentIdentity.id)
        } else if (userIdentities.length > 0) {
          setSelectedIdentity(userIdentities[0].id)
          
          // Load records signed by the first identity
          await loadSignedRecords(userIdentities[0].id)
        }
        
        setIsLoading(false)
      } catch (err: any) {
        console.error('Error loading identities:', err)
        setError(err?.message || 'An unknown error occurred')
        setIsLoading(false)
      }
    }
    
    loadIdentities()
  }, [isClient])
  
  // Load signed records for the selected identity
  const loadSignedRecords = async (identityId: string) => {
    try {
      setIsLoading(true)
      
      // Get the identity provider
      const provider = (window as any).identityProvider
      if (!provider) {
        throw new Error('Identity provider not available')
      }
      
      // Import knowledge base components
      const { IndexedDBKnowledgeBase } = await import('../../../knowledgebase/indexedDbKnowledgeBase')
      
      // Create knowledge base instance
      const kb = new IndexedDBKnowledgeBase('uor-kb', 0)
      
      // Get all resource types
      // @ts-ignore - Property exists on our implementation
      const types = await kb.getResourceTypes()
      
      // Get all records from each type and check if they're signed by this identity
      const records: any[] = []
      
      for (const type of types) {
        // @ts-ignore - Property exists on our implementation
        const typeRecords = await kb.getAllOfType(type)
        
        for (const record of typeRecords) {
          // Check if this record has signatures
          if (record.record.resource.__signatures) {
            // Check if any signature has this identity ID
            const hasSigned = record.record.resource.__signatures.some(
              (sig: any) => sig.identityId === identityId
            )
            
            if (hasSigned) {
              records.push({
                id: record.id,
                type,
                name: record.record.resource.name || 'Unnamed Resource',
                description: record.record.resource.description || '',
                imported: record.record.imported || false,
                created: record.record.createdBy === identityId
              })
            }
          }
        }
      }
      
      setSignedRecords(records)
      setIsLoading(false)
    } catch (err: any) {
      console.error('Error loading signed records:', err)
      setError(err?.message || 'An unknown error occurred')
      setIsLoading(false)
    }
  }
  
  // Handle identity change
  const handleIdentityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newIdentityId = e.target.value
    setSelectedIdentity(newIdentityId)
    await loadSignedRecords(newIdentityId)
  }
  
  // If we're still on the server, return a loading message
  if (!isClient) {
    return <div>Loading signed records...</div>
  }
  
  return (
    <Layout>
      <div className="signed-records-page">
        <div className="page-header">
          <h1>Signed Records</h1>
          <p className="description">
            View and manage records that have been signed by your identities. 
            Signed records indicate attribution or verification by an identity.
          </p>
        </div>
        
        {error ? (
          <div className="error-card">
            <h3>Error</h3>
            <p>{error}</p>
            {error.includes('sign in') && (
              <Link href="/settings/identity">
                <button className="action-button">Go to Identity Management</button>
              </Link>
            )}
          </div>
        ) : isLoading ? (
          <div className="loading-card">
            <p>Loading signed records...</p>
          </div>
        ) : (
          <>
            <div className="identity-selector">
              <label htmlFor="identity-select">Select Identity:</label>
              <select 
                id="identity-select" 
                value={selectedIdentity || ''} 
                onChange={handleIdentityChange}
              >
                {identities.map(identity => (
                  <option key={identity.id} value={identity.id}>
                    {identity.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="records-section">
              <h2>Records Signed by {identities.find(i => i.id === selectedIdentity)?.name}</h2>
              
              {signedRecords.length === 0 ? (
                <div className="empty-state">
                  <p>No records have been signed by this identity yet.</p>
                  <Link href="/knowledge-base/loader">
                    <button className="action-button">Create Signed Content</button>
                  </Link>
                </div>
              ) : (
                <div className="records-list">
                  {signedRecords.map((record, index) => (
                    <div key={index} className={`record-card ${record.created ? 'created' : 'signed'}`}>
                      <div className="record-header">
                        <h3>{record.name}</h3>
                        <div className="record-badges">
                          <span className="type-badge">{record.type}</span>
                          <span className={`role-badge ${record.created ? 'creator' : 'signer'}`}>
                            {record.created ? 'Creator' : 'Signer'}
                          </span>
                          {record.imported && (
                            <span className="import-badge">Imported</span>
                          )}
                        </div>
                      </div>
                      {record.description && (
                        <p className="record-description">{record.description}</p>
                      )}
                      <div className="record-actions">
                        <Link href={`/knowledge-base/view/${encodeURIComponent(record.type)}/${encodeURIComponent(record.id)}`}>
                          <button className="view-button">View Content</button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <style jsx>{`
        .signed-records-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .page-header {
          margin-bottom: 2rem;
        }
        
        h1 {
          margin-bottom: 0.5rem;
          color: #0c1e35;
        }
        
        .description {
          color: #555;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        
        h2 {
          margin: 2rem 0 1rem;
          color: #0c1e35;
          font-size: 1.4rem;
          border-bottom: 1px solid #eee;
          padding-bottom: 0.5rem;
        }
        
        .error-card, .loading-card {
          padding: 2rem;
          background: #fff0f0;
          border-radius: 8px;
          margin: 2rem 0;
        }
        
        .error-card {
          border-left: 4px solid #e53935;
        }
        
        .error-card h3 {
          margin-top: 0;
          color: #e53935;
        }
        
        .loading-card {
          background: #f5f5f5;
          text-align: center;
          color: #666;
        }
        
        .identity-selector {
          margin: 1.5rem 0;
          padding: 1rem;
          background: #f5f7fa;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .identity-selector label {
          font-weight: 500;
          color: #333;
        }
        
        .identity-selector select {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          border: 1px solid #ccc;
          background: white;
          font-size: 1rem;
          flex-grow: 1;
          max-width: 400px;
        }
        
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: #666;
          background: #f9f9f9;
          border-radius: 8px;
          margin: 1rem 0;
        }
        
        .records-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 1.5rem 0;
        }
        
        .record-card {
          padding: 1.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          position: relative;
        }
        
        .record-card.created {
          border-left: 4px solid #4caf50;
        }
        
        .record-card.signed {
          border-left: 4px solid #2196f3;
        }
        
        .record-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .record-card h3 {
          margin: 0;
          color: #0c1e35;
        }
        
        .record-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .type-badge, .role-badge, .import-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
          white-space: nowrap;
        }
        
        .type-badge {
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .role-badge {
          background: #e8f5e9;
          color: #388e3c;
        }
        
        .role-badge.signer {
          background: #e8eaf6;
          color: #3f51b5;
        }
        
        .import-badge {
          background: #fff3e0;
          color: #e65100;
        }
        
        .record-description {
          margin: 0.5rem 0 1rem;
          color: #555;
          line-height: 1.5;
        }
        
        .record-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
        
        .view-button, .action-button {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .view-button {
          background: #f5f5f5;
          color: #333;
        }
        
        .view-button:hover {
          background: #e0e0e0;
        }
        
        .action-button {
          background: #0070f3;
          color: white;
        }
        
        .action-button:hover {
          background: #0051a2;
        }
        
        @media (max-width: 600px) {
          .record-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </Layout>
  )
}

// Use Next.js dynamic import with SSR disabled for IndexedDB compatibility
export default dynamic(() => Promise.resolve(SignedRecordsPage), {
  ssr: false
})