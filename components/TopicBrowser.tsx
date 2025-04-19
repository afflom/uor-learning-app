/**
 * Topic Browser Component
 * 
 * Allows users to browse topics in the knowledge base with their
 * relationships and references to hashed primitive values.
 */
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { IndexedDBKnowledgeBase } from '../knowledgebase/indexedDbKnowledgeBase'
import { SchemaReferenceManager } from '../knowledgebase/schemaReference'
// No server-side dependencies

// Types for our component
interface TopicBrowserProps {
  initialTopicId?: string;
}

interface TopicData {
  '@id': string;
  '@type': string;
  name: string;
  description: string;
  relationships: Array<{
    type: string;
    targetSchemaType: string;
    targetSchemaId: string;
  }>;
}

interface RelatedTopic {
  '@id': string;
  '@type': string;
  name: string;
  description: string;
  relationshipType: string;
}

// Helper function to create sample content directly in the browser
const createSampleContent = async (schemaManager: SchemaReferenceManager): Promise<Record<string, string>> => {
  const ids: Record<string, string> = {};
  
  // Create mathematical objects
  const mathObjects = [
    {
      id: 'intrinsic-primes',
      name: 'Intrinsic Primes',
      description: 'Fundamental building blocks in the Universal Object Reference framework that cannot be decomposed further and serve as the basis for all representable structures.'
    },
    {
      id: 'unique-factorization',
      name: 'Unique Factorization',
      description: 'The principle that every object in a well-defined domain can be uniquely decomposed into a product of prime elements, up to ordering and equivalence.'
    },
    {
      id: 'prime-coordinates',
      name: 'Prime Coordinates',
      description: 'The representation of objects as vectors of exponents in a prime basis, enabling a direct mapping between objects and their prime decomposition.'
    },
    {
      id: 'coherence-norm',
      name: 'Coherence Norm',
      description: 'A measure of representational complexity defined on prime coordinates, providing a metric for the "simplicity" or "coherence" of structures.'
    }
  ];
  
  // Create topic terms
  const topics = [
    {
      id: 'uor',
      name: 'Universal Object Reference',
      description: 'Foundations of the Prime Framework and Universal Object Reference.'
    },
    {
      id: 'foundations',
      name: 'Prime Foundations',
      description: 'Intrinsic primes, unique factorization, and canonical representations.'
    }
  ];
  
  // Create math objects
  for (const obj of mathObjects) {
    const id = schemaManager.generateId('MathematicalObject', obj.id);
    await schemaManager.createSchema(
      'MathematicalObject',
      id,
      {
        name: obj.name,
        description: obj.description,
        originalId: obj.id
      }
    );
    ids[obj.id] = id;
  }
  
  // Create topics
  for (const topic of topics) {
    const id = schemaManager.generateId('DefinedTerm', topic.id);
    await schemaManager.createSchema(
      'DefinedTerm',
      id,
      {
        name: topic.name,
        description: topic.description,
        termSet: 'UORKnowledgeBase',
        originalId: topic.id
      }
    );
    ids[topic.id] = id;
  }
  
  // Create relationships between topics
  await schemaManager.addRelationship(
    'DefinedTerm',
    ids['uor'],
    'relatedTo',
    'DefinedTerm',
    ids['foundations']
  );
  
  await schemaManager.addRelationship(
    'DefinedTerm',
    ids['foundations'],
    'relatedTo',
    'DefinedTerm',
    ids['uor']
  );
  
  // Link math objects to topics
  await schemaManager.addRelationship(
    'DefinedTerm',
    ids['foundations'],
    'mainEntityOfPage',
    'MathematicalObject',
    ids['intrinsic-primes']
  );
  
  await schemaManager.addRelationship(
    'DefinedTerm',
    ids['foundations'],
    'mainEntityOfPage',
    'MathematicalObject',
    ids['unique-factorization']
  );
  
  await schemaManager.addRelationship(
    'DefinedTerm',
    ids['foundations'],
    'mainEntityOfPage',
    'MathematicalObject',
    ids['prime-coordinates']
  );
  
  await schemaManager.addRelationship(
    'DefinedTerm',
    ids['foundations'],
    'mainEntityOfPage',
    'MathematicalObject',
    ids['coherence-norm']
  );
  
  return ids;
};

// Client-side only component
const TopicBrowser: React.FC<TopicBrowserProps> = ({ initialTopicId }) => {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTopic, setCurrentTopic] = useState<TopicData | null>(null)
  const [relatedTopics, setRelatedTopics] = useState<RelatedTopic[]>([])
  const [mathObjects, setMathObjects] = useState<any[]>([])
  const [allTopics, setAllTopics] = useState<{id: string, name: string}[]>([])
  
  // Check if we're on the client and if IndexedDB is supported
  useEffect(() => {
    setIsClient(true)
    
    // Check for IndexedDB support
    const hasIndexedDB = typeof window !== 'undefined' && 
                         'indexedDB' in window && 
                         window.indexedDB !== null
    
    if (!hasIndexedDB) {
      setError('IndexedDB is not supported in this browser. Please use a modern browser with IndexedDB support and ensure that third-party cookies and storage are enabled.')
      return
    }
    
    // Test if we can actually use IndexedDB
    try {
      const testRequest = window.indexedDB.open('test-idb-access', 1)
      
      testRequest.onerror = (event) => {
        // This typically happens when IndexedDB is blocked by browser settings
        console.error('Error accessing IndexedDB:', event)
        setError('Unable to access IndexedDB. This may be due to browser privacy settings, private browsing mode, or third-party cookie restrictions. Please ensure storage access is enabled for this site.')
      }
      
      testRequest.onsuccess = () => {
        // Clean up the test database
        const db = testRequest.result
        db.close()
        window.indexedDB.deleteDatabase('test-idb-access')
      }
    } catch (err) {
      console.error('Error testing IndexedDB access:', err)
      setError('Unable to access IndexedDB due to a browser restriction. Please ensure you are using a secure context (HTTPS) and that storage access is enabled.')
    }
  }, [])
  
  // Initialize the knowledge base
  useEffect(() => {
    if (!isClient) return
    
    const initializeKnowledgeBase = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Create the knowledge base and schema manager
        const kb = new IndexedDBKnowledgeBase('uor-kb', 1)
        
        // Import sample content if not already initialized
        try {
          await kb.initialize()
          const schemaManager = new SchemaReferenceManager(kb)
          const topics = await schemaManager.getAllSchemasOfType('DefinedTerm')
          
          if (topics.length === 0) {
            // No topics found, initialize with sample content directly
            console.log('Initializing knowledge base with sample content...')
            
            // Create sample content directly with the schemaManager
            await createSampleContent(schemaManager)
            
            // Load all topics
            const initTopics = await schemaManager.getAllSchemasOfType('DefinedTerm')
            setAllTopics(initTopics.map(topic => ({
              id: topic['@id'],
              name: topic.name
            })))
            
            // Load initial topic (use the first one)
            if (initialTopicId) {
              await loadTopic(initialTopicId)
            } else if (initTopics.length > 0) {
              await loadTopic(initTopics[0]['@id'])
            }
          } else {
            // Knowledge base already initialized, load topics
            console.log('Knowledge base already initialized with topics:', topics.length)
            setAllTopics(topics.map(topic => ({
              id: topic['@id'],
              name: topic.name
            })))
            
            // Load initial topic
            if (initialTopicId) {
              await loadTopic(initialTopicId)
            } else if (topics.length > 0) {
              await loadTopic(topics[0]['@id'])
            }
          }
        } catch (err: any) {
          console.error('Error initializing knowledge base:', err)
          setError(`Error initializing knowledge base: ${err.message}`)
        }
        
        setIsLoading(false)
      } catch (err: any) {
        console.error('Error in initialization:', err)
        setError(err.message || 'An error occurred during initialization')
        setIsLoading(false)
      }
    }
    
    initializeKnowledgeBase()
  }, [isClient, initialTopicId])
  
  // Load a topic and its related content
  const loadTopic = async (topicId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const kb = new IndexedDBKnowledgeBase('uor-kb', 1)
      const schemaManager = new SchemaReferenceManager(kb)
      
      // Get the topic
      const topic = await schemaManager.getSchema('DefinedTerm', topicId)
      if (!topic) {
        throw new Error(`Topic not found: ${topicId}`)
      }
      
      setCurrentTopic(topic)
      
      // Get related topics
      const related = await schemaManager.getRelatedSchemas('DefinedTerm', topicId)
      setRelatedTopics(related)
      
      // Get mathematical objects related to this topic
      const objects = await schemaManager.getRelatedSchemas(
        'DefinedTerm',
        topicId,
        'mainEntityOfPage'
      )
      setMathObjects(objects)
      
      setIsLoading(false)
    } catch (err: any) {
      console.error(`Error loading topic ${topicId}:`, err)
      setError(err.message || 'An error occurred loading the topic')
      setIsLoading(false)
    }
  }
  
  // If not on client or IndexedDB not supported, show message
  if (!isClient) {
    return <div>Loading topic browser...</div>
  }
  
  if (error) {
    return (
      <div className="topic-browser-error">
        <h2>Knowledge Base Access Error</h2>
        <p>{error}</p>
        
        <div className="error-help">
          <h3>Troubleshooting Tips:</h3>
          <ul>
            <li>Make sure you're using a modern browser like Chrome, Firefox, Safari, or Edge</li>
            <li>Ensure you're accessing this site via HTTPS</li>
            <li>Check that you have not disabled cookies or site data in your browser settings</li>
            <li>If using private/incognito browsing, try regular browsing mode instead</li>
            <li>Some browser extensions or privacy tools might block IndexedDB access</li>
          </ul>
        </div>
      </div>
    )
  }
  
  return (
    <div className="topic-browser">
      <h1>Universal Object Reference Knowledge Base</h1>
      
      <div className="topic-browser-layout">
        <div className="topic-list">
          <h2>Topics</h2>
          {isLoading && <p>Loading topics...</p>}
          
          <ul>
            {allTopics.map(topic => (
              <li key={topic.id}>
                <button
                  onClick={() => loadTopic(topic.id)}
                  className={currentTopic && currentTopic['@id'] === topic.id ? 'active' : ''}
                >
                  {topic.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="topic-content">
          {isLoading && <p>Loading content...</p>}
          
          {currentTopic && (
            <div className="current-topic">
              <h2>{currentTopic.name}</h2>
              <p className="topic-description">{currentTopic.description}</p>
              
              {mathObjects.length > 0 && (
                <div className="math-objects">
                  <h3>Mathematical Objects</h3>
                  {mathObjects.map(obj => (
                    <div key={obj['@id']} className="math-object">
                      <h4>{obj.name}</h4>
                      <p>{obj.description}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {relatedTopics.length > 0 && (
                <div className="related-topics">
                  <h3>Related Topics</h3>
                  <ul>
                    {relatedTopics.map(topic => (
                      <li key={topic['@id']}>
                        <button onClick={() => loadTopic(topic['@id'])}>
                          {topic.name} 
                          <span className="relationship-type">({topic.relationshipType})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {!currentTopic && !isLoading && (
            <div className="no-topic">
              <p>Select a topic to view its details</p>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .topic-browser {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .topic-browser h1 {
          margin-bottom: 30px;
          border-bottom: 2px solid #eee;
          padding-bottom: 10px;
        }
        
        .topic-browser-layout {
          display: flex;
          gap: 30px;
        }
        
        .topic-list {
          flex: 0 0 300px;
          border-right: 1px solid #eee;
          padding-right: 20px;
        }
        
        .topic-content {
          flex: 1;
          min-height: 400px;
        }
        
        .topic-list ul {
          list-style: none;
          padding: 0;
        }
        
        .topic-list button {
          background: none;
          border: none;
          padding: 8px 15px;
          text-align: left;
          width: 100%;
          cursor: pointer;
          border-radius: 4px;
          margin-bottom: 5px;
        }
        
        .topic-list button:hover {
          background-color: #f0f0f0;
        }
        
        .topic-list button.active {
          background-color: #0070f3;
          color: white;
        }
        
        .topic-description {
          margin-bottom: 30px;
          font-size: 1.1em;
          line-height: 1.5;
        }
        
        .math-objects {
          margin-bottom: 30px;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
        
        .math-object {
          margin-bottom: 20px;
        }
        
        .math-object h4 {
          margin-bottom: 5px;
          color: #0070f3;
        }
        
        .related-topics ul {
          list-style: none;
          padding: 0;
        }
        
        .related-topics button {
          background: none;
          border: none;
          padding: 5px 10px;
          cursor: pointer;
          color: #0070f3;
          border-radius: 4px;
        }
        
        .related-topics button:hover {
          background-color: #f0f0f0;
        }
        
        .relationship-type {
          color: #666;
          font-size: 0.9em;
          margin-left: 5px;
        }
        
        .topic-browser-error {
          padding: 20px;
          margin: 20px;
          background-color: #fff5f5;
          color: #333;
          border-radius: 5px;
          border-left: 4px solid #d00;
          max-width: 800px;
          margin: 30px auto;
        }
        
        .topic-browser-error h2 {
          color: #d00;
          margin-top: 0;
        }
        
        .topic-browser-error p {
          font-size: 1.1em;
          line-height: 1.5;
          margin-bottom: 20px;
        }
        
        .error-help {
          background-color: #f8f8f8;
          padding: 15px;
          border-radius: 4px;
          margin-top: 20px;
        }
        
        .error-help h3 {
          margin-top: 0;
          color: #333;
        }
        
        .error-help ul {
          margin-bottom: 0;
        }
        
        .no-topic {
          padding: 30px;
          text-align: center;
          color: #666;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled
export default dynamic(() => Promise.resolve(TopicBrowser), {
  ssr: false
})