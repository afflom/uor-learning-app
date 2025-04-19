import React from 'react'
import Link from 'next/link'

export default function WelcomePage() {
  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <h1>Welcome to the Universal Object Reference Framework</h1>
        
        <p className="intro">
          Explore the mathematical foundations, implementation details, and applications of the
          Universal Object Reference (UOR) framework — a comprehensive system for uniquely 
          representing and analyzing objects across mathematical domains.
        </p>
        
        <div className="cards-container">
          <Link href="/uor" className="welcome-card">
            <div>
              <h2>Content</h2>
              <p>Explore the mathematics and theory behind UOR</p>
              <ul>
                <li>Core Mathematical Framework</li>
                <li>Unique Factorization</li>
                <li>Prime Coordinates</li>
                <li>Observer Coherence</li>
              </ul>
            </div>
          </Link>
          
          <Link href="/knowledge-base" className="welcome-card">
            <div>
              <h2>Knowledge Base</h2>
              <p>Interactive database of UOR concepts</p>
              <ul>
                <li>Schema.org Integration</li>
                <li>Content-Addressable Storage</li>
                <li>Browser Local Persistence</li>
                <li>Reference Resolution</li>
              </ul>
            </div>
          </Link>
          
          <Link href="/settings" className="welcome-card">
            <div>
              <h2>Settings</h2>
              <p>Configure and extend the UOR system</p>
              <ul>
                <li>Type Management</li>
                <li>Schema Configuration</li>
                <li>User Preferences</li>
                <li>Knowledge Base Settings</li>
              </ul>
            </div>
          </Link>
        </div>
        
        <div className="getting-started">
          <h2>Getting Started</h2>
          <p>
            The Universal Object Reference framework provides a new way of thinking about objects
            and their representations using prime decomposition and coordinate mapping. This
            application helps you explore these concepts and their applications.
          </p>
          
          <div className="buttons">
            <Link href="/uor/overview" className="start-button">
              Start with an Overview
            </Link>
            <Link href="/knowledge-base/loader" className="load-button">
              Load Knowledge Base Data
            </Link>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .welcome-page {
          padding: 2rem 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .welcome-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }
        
        h1 {
          color: #0c1e35;
          font-size: 2.2rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .intro {
          color: #444;
          font-size: 1.2rem;
          line-height: 1.7;
          max-width: 800px;
          margin: 0 auto 3rem;
          text-align: center;
        }
        
        .cards-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }
        
        .welcome-card {
          background: #f5f7fa;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          padding: 1.5rem;
          transition: all 0.3s ease;
          text-decoration: none;
          color: inherit;
          border: 1px solid #eee;
          height: 100%;
          display: block;
        }
        
        .welcome-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
          border-color: #0070f3;
        }
        
        .welcome-card h2 {
          color: #0070f3;
          margin-top: 0;
          margin-bottom: 0.8rem;
          font-size: 1.5rem;
        }
        
        .welcome-card p {
          color: #444;
          margin-bottom: 1.2rem;
          font-size: 1.1rem;
        }
        
        .welcome-card ul {
          color: #555;
          padding-left: 1.2rem;
        }
        
        .welcome-card li {
          margin-bottom: 0.5rem;
        }
        
        .getting-started {
          background: #f0f7ff;
          border-radius: 8px;
          padding: 2rem;
          border-left: 4px solid #0070f3;
        }
        
        .getting-started h2 {
          color: #0070f3;
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .getting-started p {
          color: #444;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        
        .buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .start-button, .load-button {
          display: inline-block;
          padding: 0.8rem 1.5rem;
          border-radius: 4px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .start-button {
          background: #0070f3;
          color: white;
        }
        
        .start-button:hover {
          background: #0051a2;
        }
        
        .load-button {
          background: white;
          color: #0070f3;
          border: 1px solid #0070f3;
        }
        
        .load-button:hover {
          background: #f0f7ff;
        }
        
        @media (max-width: 768px) {
          .cards-container {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .welcome-page {
            padding: 1rem;
          }
          
          h1 {
            font-size: 1.8rem;
          }
          
          .buttons {
            flex-direction: column;
          }
          
          .start-button, .load-button {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  )
}