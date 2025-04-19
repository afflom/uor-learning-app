import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Navbar() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  // Determine active section
  const isActive = (path: string) => {
    return router.pathname.startsWith(path)
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link href="/welcome" className="navbar-logo">
            UOR Framework
          </Link>
          <button 
            className="navbar-toggle" 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <div className={`navbar-menu ${menuOpen ? 'is-open' : ''}`}>
          <div className="navbar-items">
            <Link href="/welcome" className={`navbar-item ${isActive('/welcome') ? 'active' : ''}`}>
              Home
            </Link>
            <Link href="/uor" className={`navbar-item ${isActive('/uor') ? 'active' : ''}`}>
              Content
            </Link>
            <Link href="/knowledge-base" className={`navbar-item ${isActive('/knowledge-base') ? 'active' : ''}`}>
              Knowledge Base
            </Link>
            <Link href="/settings" className={`navbar-item ${isActive('/settings') ? 'active' : ''}`}>
              Settings
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .navbar {
          background: #0c1e35;
          color: white;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .navbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          height: 60px;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
        }

        .navbar-logo {
          font-size: 1.4rem;
          font-weight: 700;
          color: white;
          text-decoration: none;
          padding: 0.5rem 0;
        }

        .navbar-toggle {
          display: none;
          flex-direction: column;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          margin-left: 1rem;
        }

        .navbar-toggle span {
          display: block;
          width: 25px;
          height: 3px;
          background: white;
          margin-bottom: 5px;
          border-radius: 2px;
        }

        .navbar-toggle span:last-child {
          margin-bottom: 0;
        }

        .navbar-menu {
          display: flex;
          align-items: center;
        }

        .navbar-items {
          display: flex;
          gap: 0.5rem;
        }

        .navbar-item {
          color: white;
          text-decoration: none;
          padding: 0.5rem 1rem;
          font-size: 1rem;
          border-radius: 4px;
          transition: background 0.2s;
          display: block;
          font-weight: 500;
        }

        .navbar-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .navbar-item.active {
          background: rgba(255, 255, 255, 0.2);
          position: relative;
        }

        .navbar-item.active::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 3px;
          background: #0070f3;
          border-radius: 3px 3px 0 0;
        }

        @media (max-width: 768px) {
          .navbar-toggle {
            display: flex;
          }

          .navbar-menu {
            display: none;
            position: absolute;
            top: 60px;
            left: 0;
            right: 0;
            background: #0c1e35;
            flex-direction: column;
            align-items: stretch;
            padding: 1rem;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          .navbar-menu.is-open {
            display: flex;
          }

          .navbar-items {
            flex-direction: column;
            width: 100%;
          }

          .navbar-item {
            width: 100%;
            padding: 1rem;
            border-radius: 4px;
          }

          .navbar-item.active::after {
            bottom: 0;
            left: 0;
            width: 4px;
            height: 100%;
            border-radius: 0 3px 3px 0;
          }
        }
      `}</style>
    </nav>
  )
}