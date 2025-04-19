/**
 * Dynamic Content View Path
 * 
 * This catch-all route handles dynamic content view paths
 */
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

// Client-side only component due to IndexedDB usage
const ContentPathViewPage = () => {
  const router = useRouter()
  const { contentPath } = router.query
  
  const [isClient, setIsClient] = useState(false)
  
  // Set isClient to true when the component mounts on the client
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // When paths are available, redirect to the correct page
  useEffect(() => {
    if (!isClient || !contentPath) return
    
    // For catch-all routes, contentPath is an array - redirect to the proper content ID
    if (Array.isArray(contentPath) && contentPath.length > 0) {
      const contentId = contentPath[0]
      
      // Redirect to the normal content view page
      router.replace(`/knowledge-base/view/${encodeURIComponent(contentId)}`)
    }
  }, [isClient, contentPath, router])
  
  // If we're still on the server, return a loading message
  if (!isClient) {
    return <div>Loading content view...</div>
  }
  
  return (
    <div className="content-path-page">
      <h1>Redirecting...</h1>
      <p>Please wait while we redirect you to the content view page.</p>
      
      <style jsx>{`
        .content-path-page {
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
export default dynamic(() => Promise.resolve(ContentPathViewPage), {
  ssr: false
})