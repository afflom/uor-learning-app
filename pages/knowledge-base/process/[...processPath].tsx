/**
 * Dynamic Process Path
 * 
 * This catch-all route handles dynamic process paths
 */
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

// Client-side only component due to IndexedDB usage
const ProcessPathPage = () => {
  const router = useRouter()
  const { processPath } = router.query
  
  const [isClient, setIsClient] = useState(false)
  
  // Set isClient to true when the component mounts on the client
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // When paths are available, redirect to the correct page
  useEffect(() => {
    if (!isClient || !processPath) return
    
    // For catch-all routes, processPath is an array
    if (Array.isArray(processPath) && processPath.length > 0) {
      // Just redirect to the main process page for now
      router.replace('/knowledge-base/process')
    }
  }, [isClient, processPath, router])
  
  // If we're still on the server, return a loading message
  if (!isClient) {
    return <div>Loading process page...</div>
  }
  
  return (
    <div className="process-path-page">
      <h1>Redirecting...</h1>
      <p>Please wait while we redirect you to the content processing page.</p>
      
      <style jsx>{`
        .process-path-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px;
          text-align: center;
          margin-top: 3rem;
        }
        
        h1 {
          color: #0c1e35;
        }
      `}</style>
    </div>
  )
}

// Use Next.js dynamic import with SSR disabled for IndexedDB compatibility
export default dynamic(() => Promise.resolve(ProcessPathPage), {
  ssr: false
})