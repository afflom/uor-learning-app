/**
 * Identity Management Page
 * 
 * Central page for managing user identities and authentication in the UOR system
 */
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Import identity management components (client-side only)
const IdentityManager = dynamic(
  () => import('../../../components/IdentityManager'),
  { ssr: false }
)

// Client-side only component
const IdentityManagementPage = () => {
  const [isClient, setIsClient] = useState(false)
  
  // Set isClient to true when the component mounts on the client
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  return (
    <div className="identity-container">
      <div className="identity-page">
        <div className="page-header">
          <h1>Identity Management</h1>
          <p className="description">
            Manage your digital identities within the Universal Object Reference (UOR) system.
            Identities are used to sign and verify records in the knowledge base.
          </p>
        </div>
        
        <div className="info-section">
          <div className="info-card">
            <h3>About UOR Identities</h3>
            <p>
              In the UOR framework, identity serves as the fundamental anchor for all resources. 
              Each user can have multiple identities, and each identity can sign different records.
              This allows for flexible attribution and ownership of knowledge resources.
            </p>
            <ul>
              <li>Users can maintain multiple distinct identities</li>
              <li>Identities sign records to indicate attribution or verification</li>
              <li>Resources are always relative to the identity that created them</li>
              <li>Multiple identities can sign a single record</li>
            </ul>
          </div>
        </div>
        
        <div className="identity-section">
          <h2>Identity Manager</h2>
          {!isClient ? (
            <div className="loading">Loading identity manager...</div>
          ) : (
            <IdentityManager />
          )}
        </div>
        
        <div className="actions-section">
          <h2>Identity-Related Actions</h2>
          <div className="actions-grid">
            <Link href="/settings/identity/records" className="action-card">
              <h3>Signed Records</h3>
              <p>View and manage records signed by your identities</p>
              <div className="card-icon">📝</div>
            </Link>
            
            <Link href="/settings/identity/permissions" className="action-card">
              <h3>Permission Management</h3>
              <p>Configure which applications can use your identities</p>
              <div className="card-icon">🔒</div>
            </Link>
            
            <Link href="/knowledge-base/loader" className="action-card">
              <h3>Create Signed Content</h3>
              <p>Create and sign new knowledge base content</p>
              <div className="card-icon">✨</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
      
    <style jsx>{`
        .identity-container {
          padding: 1.5rem;
          width: 100%;
        }
        
        .identity-page {
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
        
        .info-section {
          margin-bottom: 2rem;
        }
        
        .info-card {
          background: #f0f7ff;
          border-left: 4px solid #0070f3;
          padding: 1.5rem;
          border-radius: 4px;
        }
        
        .info-card h3 {
          margin-top: 0;
          color: #0070f3;
        }
        
        .info-card p, .info-card ul {
          color: #444;
          line-height: 1.6;
        }
        
        .info-card ul {
          padding-left: 1.5rem;
        }
        
        .info-card li {
          margin-bottom: 0.5rem;
        }
        
        .identity-section {
          margin: 2rem 0;
        }
        
        .loading {
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 4px;
          color: #555;
          text-align: center;
        }
        
        .actions-section {
          margin: 2rem 0;
        }
        
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        
        .action-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 1.5rem;
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
          text-decoration: none;
          color: inherit;
          overflow: hidden;
        }
        
        .action-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .action-card h3 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          color: #0c1e35;
          font-size: 1.2rem;
        }
        
        .action-card p {
          color: #666;
          font-size: 0.95rem;
          margin-bottom: 0;
        }
        
        .card-icon {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          font-size: 1.5rem;
          opacity: 0.3;
          transition: opacity 0.2s;
        }
        
        .action-card:hover .card-icon {
          opacity: 0.6;
        }
        
        @media (max-width: 768px) {
          .actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  )
}

// Use Next.js dynamic import with SSR disabled for IndexedDB compatibility
export default dynamic(() => Promise.resolve(IdentityManagementPage), {
  ssr: false
})