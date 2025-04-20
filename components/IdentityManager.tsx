/**
 * Identity Manager Component
 * 
 * UI component for managing user identities and authentication.
 */
import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

// Types
import { UserImpl } from '../knowledgebase/models/User'
import { IdentityImpl } from '../knowledgebase/models/Identity'

// Component must be client-side only due to IndexedDB usage
const IdentityManager = () => {
  const [isClient, setIsClient] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<UserImpl | null>(null)
  const [currentIdentity, setCurrentIdentity] = useState<IdentityImpl | null>(null)
  const [userIdentities, setUserIdentities] = useState<IdentityImpl[]>([])
  
  // Form state
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [newIdentityName, setNewIdentityName] = useState('')
  const [selectedIdentityId, setSelectedIdentityId] = useState('')
  
  // UI state
  const [activeTab, setActiveTab] = useState('login') // login, register, manage
  const [showSettings, setShowSettings] = useState(false)
  
  // Initialize on client-side only
  useEffect(() => {
    setIsClient(true)
    
    // Skip remaining initialization on server
    if (typeof window === 'undefined') return
    
    const initIdentityProvider = async () => {
      try {
        setLoading(true)
        
        // Import the identity provider
        const { IdentityProvider } = await import('../knowledgebase/IdentityProvider')
        const provider = new IdentityProvider()
        
        // Initialize
        await provider.initialize()
        
        // Attach to window for global access
        ;(window as any).identityProvider = provider
        
        // Check if we have a user ID in localStorage (basic session persistence)
        const savedUserId = localStorage.getItem('uorCurrentUserId')
        
        if (savedUserId) {
          try {
            const { user, identity } = await provider.login(savedUserId)
            setCurrentUser(user)
            setCurrentIdentity(identity)
            setActiveTab('manage')
            
            // Get all identities for this user
            const identities = await provider.getUserIdentities()
            setUserIdentities(identities)
          } catch (err: any) {
            console.error('Failed to restore session:', err)
            localStorage.removeItem('uorCurrentUserId')
          }
        }
        
        setInitialized(true)
      } catch (err: any) {
        console.error('Error initializing identity provider:', err)
        setError(err?.message || 'Failed to initialize identity system')
      } finally {
        setLoading(false)
      }
    }
    
    initIdentityProvider()
  }, [])
  
  // Helper to get identity provider
  const getProvider = useCallback(() => {
    if (typeof window === 'undefined') return null
    return (window as any).identityProvider
  }, [])
  
  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const provider = getProvider()
    if (!provider) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Get all users (this is a simplified demo approach)
      const users = await provider.getAllUsers()
      
      // Find user by username (in a real app, you'd look up by proper credentials)
      const targetUser = users.find((u: UserImpl) => u.username === username)
      
      if (!targetUser) {
        throw new Error(`No user found with username: ${username}`)
      }
      
      // Login with the found user ID
      const { user, identity } = await provider.login(targetUser.id)
      
      // Save to state
      setCurrentUser(user)
      setCurrentIdentity(identity)
      
      // Get all identities for this user
      const identities = await provider.getUserIdentities()
      setUserIdentities(identities)
      
      // Save user ID to localStorage for session persistence
      localStorage.setItem('uorCurrentUserId', user.id)
      
      // Switch to management view
      setActiveTab('manage')
      
      // Clear form
      setUsername('')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err?.message || 'Failed to log in')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const provider = getProvider()
    if (!provider) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Register new user
      const { user, identity } = await provider.register(username, displayName || undefined)
      
      // Save to state
      setCurrentUser(user)
      setCurrentIdentity(identity)
      setUserIdentities([identity])
      
      // Save user ID to localStorage
      localStorage.setItem('uorCurrentUserId', user.id)
      
      // Switch to management view
      setActiveTab('manage')
      
      // Clear form
      setUsername('')
      setDisplayName('')
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err?.message || 'Failed to register')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle logout
  const handleLogout = () => {
    const provider = getProvider()
    if (!provider) return
    
    provider.logout()
    setCurrentUser(null)
    setCurrentIdentity(null)
    setUserIdentities([])
    localStorage.removeItem('uorCurrentUserId')
    setActiveTab('login')
  }
  
  // Create new identity
  const handleCreateIdentity = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const provider = getProvider()
    if (!provider) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Create new identity
      await provider.createIdentity(newIdentityName)
      
      // Update identity list
      const identities = await provider.getUserIdentities()
      setUserIdentities(identities)
      
      // Clear form
      setNewIdentityName('')
    } catch (err: any) {
      console.error('Create identity error:', err)
      setError(err?.message || 'Failed to create identity')
    } finally {
      setLoading(false)
    }
  }
  
  // Switch active identity
  const handleSwitchIdentity = async () => {
    if (!selectedIdentityId) return
    
    const provider = getProvider()
    if (!provider) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Switch identity
      const identity = await provider.switchIdentity(selectedIdentityId)
      
      // Update current identity
      setCurrentIdentity(identity)
      
      // Update user (active identity might have changed)
      const user = provider.getCurrentUser()
      if (user) setCurrentUser(user)
    } catch (err: any) {
      console.error('Switch identity error:', err)
      setError(err?.message || 'Failed to switch identity')
    } finally {
      setLoading(false)
    }
  }
  
  // Remove an identity
  const handleRemoveIdentity = async (identityId: string) => {
    const provider = getProvider()
    if (!provider) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Confirm
      if (!confirm('Are you sure you want to remove this identity?')) {
        setLoading(false)
        return
      }
      
      // Remove identity
      await provider.removeIdentity(identityId)
      
      // Update lists
      const identities = await provider.getUserIdentities()
      setUserIdentities(identities)
      
      // Update current identity (might have changed)
      const identity = provider.getCurrentIdentity()
      if (identity) setCurrentIdentity(identity)
    } catch (err: any) {
      console.error('Remove identity error:', err)
      setError(err?.message || 'Failed to remove identity')
    } finally {
      setLoading(false)
    }
  }
  
  // If we're still on the server or the client hasn't initialized yet, show a loading message
  if (!isClient) {
    return <div>Loading identity system...</div>
  }
  
  return (
    <div className="identity-manager">
      <div className="identity-header">
        <h2>Identity Manager</h2>
        {currentUser && (
          <div className="user-info">
            <span>Logged in as: <strong>{currentUser.displayName || currentUser.username}</strong></span>
            {currentIdentity && (
              <span className="active-identity">
                Active Identity: <strong>{currentIdentity.name}</strong>
              </span>
            )}
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="settings-toggle"
            >
              {showSettings ? 'Hide Settings' : 'Settings'}
            </button>
            <button 
              onClick={handleLogout}
              className="logout-button"
            >
              Log Out
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="error-message" data-testid="identity-error">
          {error}
        </div>
      )}
      
      {!initialized || loading ? (
        <div className="loading">Loading...</div>
      ) : currentUser ? (
        <div className="user-management">
          {!showSettings ? (
            <div className="identity-info">
              <h3>Current Identity: {currentIdentity?.name}</h3>
              <p>Use this identity to sign and verify records.</p>
            </div>
          ) : (
            <>
              <div className="identity-section">
                <h3>Your Identities</h3>
                <div className="identity-list">
                  {userIdentities.map(identity => (
                    <div 
                      key={identity.id} 
                      className={`identity-item ${identity.id === currentIdentity?.id ? 'active' : ''}`}
                    >
                      <div className="identity-details">
                        <span className="identity-name">{identity.name}</span>
                        <span className="identity-id">ID: {identity.id}</span>
                        <span className="identity-created">Created: {new Date(identity.created).toLocaleString()}</span>
                      </div>
                      <div className="identity-actions">
                        {identity.id !== currentIdentity?.id && (
                          <button 
                            onClick={() => {
                              setSelectedIdentityId(identity.id)
                              handleSwitchIdentity()
                            }}
                            className="switch-button"
                          >
                            Switch To
                          </button>
                        )}
                        {userIdentities.length > 1 && (
                          <button 
                            onClick={() => handleRemoveIdentity(identity.id)}
                            className="remove-button"
                            disabled={identity.id === currentIdentity?.id}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="create-identity-section">
                <h3>Create New Identity</h3>
                <form onSubmit={handleCreateIdentity}>
                  <div className="form-group">
                    <label htmlFor="newIdentityName">Identity Name:</label>
                    <input
                      type="text"
                      id="newIdentityName"
                      value={newIdentityName}
                      onChange={e => setNewIdentityName(e.target.value)}
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading || !newIdentityName}
                    className="create-button"
                  >
                    Create Identity
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="auth-tabs">
          <div className="tab-headers">
            <button 
              className={activeTab === 'login' ? 'active' : ''}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button 
              className={activeTab === 'register' ? 'active' : ''}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} data-testid="login-form">
                <div className="form-group">
                  <label htmlFor="username">Username:</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading || !username}
                  className="login-button"
                >
                  Log In
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} data-testid="register-form">
                <div className="form-group">
                  <label htmlFor="reg-username">Username:</label>
                  <input
                    type="text"
                    id="reg-username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="displayName">Display Name (optional):</label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading || !username}
                  className="register-button"
                >
                  Register
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .identity-manager {
          margin: 20px 0;
          padding: 20px;
          border: 1px solid #eee;
          border-radius: 5px;
        }
        
        .identity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }
        
        .active-identity {
          background-color: #f0f8ff;
          padding: 4px 8px;
          border-radius: 4px;
          border-left: 3px solid #0070f3;
        }
        
        .auth-tabs {
          margin-top: 20px;
        }
        
        .tab-headers {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        
        .tab-headers button {
          padding: 10px 20px;
          background: none;
          border: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
        }
        
        .tab-headers button.active {
          border-bottom: 2px solid #0070f3;
          font-weight: bold;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
        }
        
        .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        button {
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
        }
        
        button:hover {
          background-color: #0051a2;
        }
        
        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .logout-button {
          background-color: #f44336;
        }
        
        .logout-button:hover {
          background-color: #d32f2f;
        }
        
        .settings-toggle {
          background-color: #4caf50;
        }
        
        .settings-toggle:hover {
          background-color: #388e3c;
        }
        
        .error-message {
          margin: 15px 0;
          padding: 10px 15px;
          background-color: #fff0f0;
          color: #d32f2f;
          border-left: 4px solid #d32f2f;
          border-radius: 4px;
        }
        
        .loading {
          text-align: center;
          padding: 20px;
          color: #666;
        }
        
        .identity-section {
          margin-bottom: 30px;
        }
        
        .identity-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .identity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border: 1px solid #eee;
          border-radius: 5px;
          background-color: #f9f9f9;
        }
        
        .identity-item.active {
          border-color: #0070f3;
          background-color: #f0f7ff;
        }
        
        .identity-details {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        
        .identity-name {
          font-weight: bold;
          font-size: 16px;
        }
        
        .identity-id, .identity-created {
          font-size: 12px;
          color: #666;
        }
        
        .identity-actions {
          display: flex;
          gap: 8px;
        }
        
        .switch-button {
          background-color: #0070f3;
        }
        
        .remove-button {
          background-color: #f44336;
        }
        
        .create-identity-section {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled to ensure this component only renders on the client
export default dynamic(() => Promise.resolve(IdentityManager), {
  ssr: false
})