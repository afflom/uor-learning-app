/**
 * Topic Browser Page
 * 
 * This page demonstrates the UOR knowledge base with content-addressable
 * storage and schema references.
 */
import React from 'react'
import dynamic from 'next/dynamic'
import { NextPage } from 'next'

const TopicBrowser = dynamic(() => import('../../components/TopicBrowser'), {
  ssr: false
})

const TopicBrowserPage: NextPage = () => {
  return (
    <div className="container">
      <h1>UOR Topic Browser</h1>
      
      <div className="description">
        <p>
          This page demonstrates the UOR knowledge base with content-addressable
          storage and schema references. The knowledge base stores primitive values
          as hashed content, which can be referenced by multiple schemas.
        </p>
        
        <p>
          The approach follows UOR principles by:
        </p>
        
        <ul>
          <li>Storing primitive values by their content hash (single source of truth)</li>
          <li>Creating schema references to these hashed values (no duplication)</li>
          <li>Supporting multiple schema interpretations of the same primitive values</li>
          <li>Allowing lazy loading of values based on schema references</li>
          <li>Creating explicit relationships between schemas</li>
        </ul>
      </div>
      
      <div className="browser-container">
        <TopicBrowser />
      </div>
      
      <style jsx>{`
        .container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        h1 {
          margin-bottom: 20px;
          color: #333;
          border-bottom: 2px solid #eee;
          padding-bottom: 10px;
        }
        
        .description {
          margin-bottom: 30px;
          background-color: #f5f5f5;
          padding: 20px;
          border-radius: 5px;
          border-left: 5px solid #0070f3;
        }
        
        ul {
          padding-left: 25px;
        }
        
        li {
          margin: 8px 0;
        }
        
        .browser-container {
          margin-top: 30px;
          border: 1px solid #eee;
          border-radius: 5px;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default TopicBrowserPage