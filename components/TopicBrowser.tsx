/**
 * Topic Browser Component
 * 
 * Shows a simplified list of topics without knowledge base integration
 */
import React, { useState } from 'react'
import dynamic from 'next/dynamic'

// Types for our component
interface TopicBrowserProps {
  initialTopicId?: string;
}

// Simplified static content
const topics = [
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

// Client-side only component
const TopicBrowser: React.FC<TopicBrowserProps> = ({ initialTopicId }) => {
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(initialTopicId || null)
  
  // Find current topic if one is selected
  const currentTopic = currentTopicId 
    ? topics.find(t => t.id === currentTopicId) 
    : null;

  return (
    <div className="topic-browser">
      <h1>Universal Object Reference Topics</h1>
      
      <div className="topic-browser-layout">
        <div className="topic-list">
          <h2>Topics</h2>
          
          <ul>
            {topics.map(topic => (
              <li key={topic.id}>
                <button
                  onClick={() => setCurrentTopicId(topic.id)}
                  className={currentTopicId === topic.id ? 'active' : ''}
                >
                  {topic.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="topic-content">
          {currentTopic ? (
            <div className="current-topic">
              <h2>{currentTopic.name}</h2>
              <p className="topic-description">{currentTopic.description}</p>
            </div>
          ) : (
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