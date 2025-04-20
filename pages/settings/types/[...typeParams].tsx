import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import Link from 'next/link'

// Client-side only component due to IndexedDB usage
const TypeSettingsPage = () => {
  const router = useRouter()
  const { typeParams } = router.query
  
  const [isClient, setIsClient] = useState(false)
  const [resources, setResources] = useState<{id: string, record: any}[]>([])
  const [resource, setResource] = useState<{id: string, record: any} | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'type' | 'resource'>('type')
  
  // Form state for type configuration
  const [requiredProps, setRequiredProps] = useState({
    name: true,
    id: true,
    context: true,
    description: false
  })
  const [validationRule, setValidationRule] = useState('schema.org')
  const [newTypeName, setNewTypeName] = useState('')
  const [isDeriving, setIsDeriving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Determine the typeName and resourceId from the params
  let typeName: string | null = null;
  let resourceId: string | null = null;
  
  if (Array.isArray(typeParams) && typeParams.length > 0) {
    // Check if we have a content resource ID
    if (typeParams[0] === 'content' && typeParams.length > 1) {
      typeName = 'content';
      resourceId = typeParams.slice(1).join('/');
    }
    // Check if it's a namespaced type (like uor/primitives)
    else if (typeParams.length > 1 && !typeParams.join('/').match(/[0-9a-f]{32,}/i)) {
      typeName = typeParams.join('/');
      resourceId = null;
    }
    // Otherwise assume standard type and resource id pattern
    else {
      typeName = typeParams[0];
      resourceId = typeParams.length > 1 ? typeParams.slice(1).join('/') : null;
    }
  }
  
  // For debugging
  useEffect(() => {
    if (isClient) {
      console.log('Route params:', { typeParams, typeName, resourceId });
    }
  }, [isClient, typeParams, typeName, resourceId]);

  // Set isClient to true when the component mounts on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Set view mode based on params
  useEffect(() => {
    if (typeName && resourceId) {
      setViewMode('resource')
    } else {
      setViewMode('type')
    }
  }, [typeName, resourceId])

  // Load resources of the specified type when component mounts
  useEffect(() => {
    if (!isClient || !typeName) return

    async function loadData() {
      try {
        setIsLoading(true)
        setError(null)
        
        // Check if IndexedDB is supported
        if (typeof window === 'undefined' || !('indexedDB' in window)) {
          setError('IndexedDB is not supported in this browser')
          setIsLoading(false)
          return
        }

        // Import knowledge base components
        const { IndexedDBKnowledgeBase } = await import('../../../knowledgebase/indexedDbKnowledgeBase')
        
        // Create knowledge base instance - use 0 to automatically use the existing version
        const kb = new IndexedDBKnowledgeBase('uor-kb', 0)
        
        // If we have a resource ID, load that specific resource
        if (viewMode === 'resource' && resourceId) {
          try {
            // @ts-ignore - Property exists on our implementation
            const record = await kb.get(resourceId)
            
            if (record) {
              setResource({ id: resourceId, record })
            } else {
              setError(`Resource not found: ${resourceId}`)
            }
          } catch (err: any) {
            console.error(`Error getting resource ${resourceId}:`, err)
            setError(`Error getting resource: ${err?.message || 'Unknown error'}`)
          }
        } 
        // Otherwise load all resources of the specified type
        else {
          try {
            // Extract the actual type name without namespace if needed
            let actualTypeName = typeName;
            
            // Handle namespaced types
            if (typeName && typeName.includes('/')) {
              const parts = typeName.split('/');
              // Skip the namespace prefix
              actualTypeName = parts.slice(1).join('/');
            }
            
            // @ts-ignore - Property exists on our implementation
            const records = await kb.getAllOfType(actualTypeName)
            setResources(records)
            
            console.log(`Loaded ${records.length} resources of type ${actualTypeName}`);
          } catch (err: any) {
            console.error(`Error getting resources of type ${typeName}:`, err)
            setError(`Error getting resources: ${err?.message || 'Unknown error'}`)
          }
        }
      } catch (err: any) {
        console.error('Error in loadData:', err)
        setError(err?.message || 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isClient, typeName, resourceId, viewMode])

  // Save type configuration
  const handleSaveConfiguration = async () => {
    if (!typeName) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      // Import knowledge base components
      const { IndexedDBKnowledgeBase } = await import('../../../knowledgebase/indexedDbKnowledgeBase');
      
      // Create knowledge base instance
      const kb = new IndexedDBKnowledgeBase('uor-kb', 0);
      
      // Get actual type name without namespace
      let actualTypeName = typeName;
      if (typeName.includes('/')) {
        const parts = typeName.split('/');
        actualTypeName = parts.slice(1).join('/');
      }
      
      // Create type configuration record
      const typeConfig = {
        name: actualTypeName,
        requiredProperties: Object.keys(requiredProps).filter(key => requiredProps[key as keyof typeof requiredProps]),
        validationRule,
        updated: new Date().toISOString(),
      };
      
      // Store the configuration
      // @ts-ignore - Property exists on our implementation
      await kb.storeTypeConfiguration(actualTypeName, typeConfig);
      
      // Reload resources if needed
      try {
        // Get actual type name
        let queryTypeName = actualTypeName;
        
        // @ts-ignore - Property exists on our implementation
        const records = await kb.getAllOfType(queryTypeName);
        setResources(records);
        
        console.log(`Reloaded ${records.length} resources after saving configuration`);
      } catch (loadErr) {
        console.warn("Error reloading resources after save:", loadErr);
        // Continue even if reload fails
      }
      
      setSuccessMessage('Type configuration saved successfully');
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err: any) {
      console.error('Error saving type configuration:', err);
      setError(`Error saving configuration: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Derive a new type from the current type
  const handleDeriveNewType = () => {
    setIsDeriving(true);
  };
  
  // Create the derived type
  const handleCreateDerivedType = async () => {
    if (!typeName || !newTypeName) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      // Import knowledge base components
      const { IndexedDBKnowledgeBase } = await import('../../../knowledgebase/indexedDbKnowledgeBase');
      
      // Create knowledge base instance
      const kb = new IndexedDBKnowledgeBase('uor-kb', 0);
      
      // Get actual type name without namespace
      let actualTypeName = typeName;
      if (typeName.includes('/')) {
        const parts = typeName.split('/');
        actualTypeName = parts.slice(1).join('/');
      }
      
      // Create type configuration record for derived type
      const derivedTypeConfig = {
        name: newTypeName,
        baseType: actualTypeName,
        requiredProperties: Object.keys(requiredProps).filter(key => requiredProps[key as keyof typeof requiredProps]),
        validationRule,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };
      
      // Store the derived type configuration
      // @ts-ignore - Property exists on our implementation
      await kb.storeTypeConfiguration(newTypeName, derivedTypeConfig);
      
      // Create an empty store for the new type
      // @ts-ignore - Method exists on our implementation
      await kb.ensureStoreExists(newTypeName);
      
      // Show success message temporarily
      setSuccessMessage(`Created new type: ${newTypeName}`);
      
      // Hide the form for a moment to show the success message
      setTimeout(() => {
        setIsDeriving(false);
        
        // Redirect to the new type page after showing success
        setTimeout(() => {
          // Navigate to the new type's page
          router.push(`/settings/types/types/${encodeURIComponent(newTypeName)}`);
        }, 500);
      }, 1000);
      
    } catch (err: any) {
      console.error('Error creating derived type:', err);
      setError(`Error creating derived type: ${err?.message || 'Unknown error'}`);
      setIsLoading(false);
      // Don't hide the form if there's an error
    }
  };

  // If we're still on the server or don't have typeName yet, return a loading message
  if (!isClient || !typeName) {
    return <div>Loading settings...</div>
  }

  // Render a single resource view
  if (viewMode === 'resource') {
    return (
      <div className="resource-settings-page">
        <div className="header">
          <Link href={`/settings/types/${encodeURIComponent(typeName)}`} className="back-link">
            ← Back to {typeName}
          </Link>
          <h1>Resource: {resourceId}</h1>
        </div>
        
        {isLoading ? (
          <div className="loading">Loading resource data...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : resource ? (
          <div className="resource-details">
            <div className="detail-card">
              <h2>Resource Details</h2>
              
              <div className="detail-field">
                <label>Resource ID</label>
                <input type="text" value={resourceId || ''} disabled />
              </div>
              
              <div className="detail-field">
                <label>Type</label>
                <input type="text" value={typeName || ''} disabled />
              </div>
              
              {resource.record.resource.name && (
                <div className="detail-field">
                  <label>Name</label>
                  <input 
                    type="text" 
                    defaultValue={resource.record.resource.name} 
                  />
                </div>
              )}
              
              {resource.record.resource.description && (
                <div className="detail-field">
                  <label>Description</label>
                  <textarea 
                    defaultValue={resource.record.resource.description} 
                    rows={4}
                  />
                </div>
              )}
              
              <div className="detail-field">
                <label>Resource Data</label>
                <pre className="json-display">
                  {JSON.stringify(resource.record.resource, null, 2)}
                </pre>
              </div>
              
              <div className="resource-actions">
                <button className="action-button primary">Save Changes</button>
                <button className="action-button danger">Delete Resource</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="error">Resource not found</div>
        )}
        
        <style jsx>{`
          .resource-settings-page {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
          }
          
          .header {
            margin-bottom: 2rem;
          }
          
          .back-link {
            display: inline-block;
            margin-bottom: 1rem;
            color: #0070f3;
            text-decoration: none;
          }
          
          .back-link:hover {
            text-decoration: underline;
          }
          
          h1 {
            margin-bottom: 1rem;
            color: #0c1e35;
            word-break: break-word;
          }
          
          h2 {
            margin-top: 0;
            color: #0c1e35;
            border-bottom: 1px solid #eee;
            padding-bottom: 0.8rem;
            margin-bottom: 1.5rem;
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
          }
          
          .detail-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 1.5rem;
            margin-bottom: 2rem;
          }
          
          .detail-field {
            margin-bottom: 1.5rem;
          }
          
          .detail-field label {
            display: block;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #333;
          }
          
          .detail-field input,
          .detail-field textarea {
            width: 100%;
            padding: 0.6rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
            font-family: inherit;
          }
          
          .detail-field input:disabled {
            background: #f5f5f5;
            color: #666;
          }
          
          .json-display {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 4px;
            font-family: monospace;
            overflow-x: auto;
            line-height: 1.4;
            font-size: 0.9rem;
          }
          
          .resource-actions {
            margin-top: 2rem;
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
          }
          
          .action-button {
            border-radius: 4px;
            padding: 0.6rem 1rem;
            font-size: 0.9rem;
            cursor: pointer;
            transition: background-color 0.2s;
            font-weight: 500;
          }
          
          .action-button.primary {
            background-color: #0070f3;
            color: white;
            border: none;
          }
          
          .action-button.primary:hover {
            background-color: #0051a2;
          }
          
          .action-button.danger {
            background-color: white;
            color: #d00;
            border: 1px solid #d00;
          }
          
          .action-button.danger:hover {
            background-color: #fff0f0;
          }
        `}</style>
      </div>
    )
  }

  // Render the type view (list of resources)
  return (
    <div className="type-settings-page">
      <div className="header">
        <Link href="/settings" className="back-link">
          ← Back to Settings
        </Link>
        <h1>Settings: {typeName}</h1>
      </div>
      
      <div className="type-info">
        <h2>Type Configuration</h2>
        <p>
          Configure settings for all resources of type <strong>{typeName}</strong>. 
          Changes to type definitions will create new derived types while preserving the originals.
        </p>
        
        <div className="config-card">
          <h3>Schema Definition</h3>
          <div className="config-fields">
            <div className="config-field">
              <label>Type Name</label>
              <input type="text" value={typeName || ''} disabled />
              <p className="field-help">Type names are immutable. Create a new type to rename.</p>
            </div>
            
            <div className="config-field">
              <label>Required Properties</label>
              <div className="checkbox-list">
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="req-name" 
                    checked={requiredProps.name}
                    onChange={e => setRequiredProps({...requiredProps, name: e.target.checked})}
                  />
                  <label htmlFor="req-name">name</label>
                </div>
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="req-id" 
                    checked={requiredProps.id}
                    onChange={e => setRequiredProps({...requiredProps, id: e.target.checked})}
                  />
                  <label htmlFor="req-id">@id</label>
                </div>
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="req-context" 
                    checked={requiredProps.context}
                    onChange={e => setRequiredProps({...requiredProps, context: e.target.checked})}
                  />
                  <label htmlFor="req-context">@context</label>
                </div>
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="req-description" 
                    checked={requiredProps.description}
                    onChange={e => setRequiredProps({...requiredProps, description: e.target.checked})}
                  />
                  <label htmlFor="req-description">description</label>
                </div>
              </div>
            </div>
            
            <div className="config-field">
              <label>Validation Rules</label>
              <select 
                value={validationRule}
                onChange={e => setValidationRule(e.target.value)}
              >
                <option value="schema.org">schema.org</option>
                <option value="custom">Custom Rules</option>
                <option value="none">No Validation</option>
              </select>
            </div>
            
            <div className="config-field">
              <label>Derivation Base</label>
              <p className="field-value">{typeName || ''}</p>
              <p className="field-help">New types created from this type will reference it as their base.</p>
            </div>
          </div>
          
          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}
          
          <div className="config-actions">
            <button 
              className="action-button primary"
              onClick={handleSaveConfiguration}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </button>
            <button 
              className="action-button"
              onClick={handleDeriveNewType}
              disabled={isLoading || isDeriving}
            >
              Derive New Type
            </button>
          </div>
          
          {isDeriving && (
            <div className="derive-type-form">
              <h4>Create Derived Type</h4>
              <div className="form-row">
                <label htmlFor="newTypeName">New Type Name:</label>
                <input 
                  type="text" 
                  id="newTypeName"
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  placeholder="Enter new type name"
                />
              </div>
              <p className="form-help">
                The new type will inherit all properties and rules from the current type.
              </p>
              <div className="form-actions">
                <button 
                  className="action-button primary"
                  onClick={handleCreateDerivedType}
                  disabled={isLoading || !newTypeName}
                >
                  {isLoading ? 'Creating...' : 'Create Type'}
                </button>
                <button 
                  className="action-button secondary"
                  onClick={() => setIsDeriving(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="type-instances">
        <h2>Type Instances ({resources.length})</h2>
        
        {isLoading ? (
          <div className="loading">Loading resources...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : resources.length === 0 ? (
          <div className="empty-state">
            <p>No resources found for this type.</p>
            <Link href="/uor/identity">
              <button className="action-button">Load Sample Data</button>
            </Link>
          </div>
        ) : (
          <div className="resources-list">
            {resources.map((item, index) => (
              <div key={index} className="resource-card">
                <div className="resource-header">
                  <h3>{item.record.resource.name || item.record.resource['@id'] || item.id}</h3>
                  <span className="resource-id">{item.id}</span>
                </div>
                
                {item.record.resource.description && (
                  <p className="resource-description">{item.record.resource.description}</p>
                )}
                
                <Link 
                  href={`/settings/types/${encodeURIComponent(typeName)}/${encodeURIComponent(item.id)}`}
                  className="action-button resource-button"
                >
                  Configure Instance
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .type-settings-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .header {
          margin-bottom: 2rem;
        }
        
        .back-link {
          display: inline-block;
          margin-bottom: 1rem;
          color: #0070f3;
          text-decoration: none;
        }
        
        .back-link:hover {
          text-decoration: underline;
        }
        
        h1 {
          margin-bottom: 1rem;
          color: #0c1e35;
          word-break: break-word;
        }
        
        h2 {
          margin: 2rem 0 1rem;
          color: #0c1e35;
          font-size: 1.4rem;
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
        }
        
        .type-info p {
          color: #555;
          margin-bottom: 1.5rem;
        }
        
        .config-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .config-card h3 {
          margin-top: 0;
          color: #0c1e35;
          border-bottom: 1px solid #eee;
          padding-bottom: 0.8rem;
          margin-bottom: 1.5rem;
        }
        
        .config-fields {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        
        .config-field {
          margin-bottom: 0.5rem;
        }
        
        .config-field label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #333;
        }
        
        .config-field input[type="text"],
        .config-field select {
          width: 100%;
          padding: 0.6rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .config-field input[type="text"]:disabled {
          background: #f5f5f5;
          color: #666;
        }
        
        .field-help {
          margin-top: 0.4rem;
          color: #666;
          font-size: 0.85rem;
        }
        
        .field-value {
          padding: 0.6rem;
          background: #f5f5f5;
          border-radius: 4px;
          margin: 0;
          font-family: monospace;
        }
        
        .checkbox-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.5rem;
        }
        
        .checkbox-item {
          display: flex;
          align-items: center;
        }
        
        .checkbox-item input {
          margin-right: 0.5rem;
        }
        
        .config-actions {
          margin-top: 2rem;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }
        
        .action-button {
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.6rem 1rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
          font-weight: 500;
          text-decoration: none;
          text-align: center;
        }
        
        .action-button:hover {
          background-color: #0051a2;
        }
        
        .action-button.primary {
          background-color: #0070f3;
        }
        
        .action-button.primary:hover {
          background-color: #0051a2;
        }
        
        .empty-state {
          padding: 2rem;
          text-align: center;
          color: #666;
          background: #f9f9f9;
          border-radius: 4px;
          margin: 1rem 0;
        }
        
        .resources-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        
        .resource-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }
        
        .resource-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        
        .resource-header h3 {
          margin: 0;
          color: #0c1e35;
          font-size: 1.2rem;
          flex-grow: 1;
        }
        
        .resource-id {
          font-size: 0.8rem;
          color: #666;
          background: #f5f5f5;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          white-space: nowrap;
          margin-left: 0.5rem;
        }
        
        .resource-description {
          color: #555;
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        
        .resource-button {
          margin-top: auto;
          display: block;
        }
        
        .success-message {
          background: #e6f4ea;
          color: #2e7d32;
          padding: 0.8rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          text-align: center;
          font-weight: 500;
        }
        
        .derive-type-form {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: #f5f5f5;
          border-radius: 5px;
          border: 1px dashed #999;
        }
        
        .derive-type-form h4 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #0c1e35;
        }
        
        .form-row {
          margin-bottom: 1rem;
        }
        
        .form-row label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .form-row input {
          width: 100%;
          padding: 0.7rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .form-help {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 1.2rem;
        }
        
        .form-actions {
          display: flex;
          gap: 1rem;
        }
        
        .action-button.secondary {
          background: #fff;
          color: #333;
          border: 1px solid #ddd;
        }
        
        .action-button.secondary:hover {
          background: #f5f5f5;
        }
        
        .action-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
          opacity: 0.7;
        }
        
        @media (min-width: 768px) {
          .config-fields {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled for IndexedDB compatibility
export default dynamic(() => Promise.resolve(TypeSettingsPage), {
  ssr: false
})