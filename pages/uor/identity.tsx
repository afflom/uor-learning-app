/**
 * Redirect from UOR Identity to Settings/Identity
 * 
 * This page redirects users to the consolidated identity management page
 */
import { useEffect } from 'react'
import { useRouter } from 'next/router'

// Redirect Component
const UORIdentityRedirect = () => {
  const router = useRouter()
  
  // Redirect to the settings/identity page on component mount
  useEffect(() => {
    router.replace('/settings/identity')
  }, [router])
  
  // Display minimal loading message during the redirect
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <p>Redirecting to identity management...</p>
    </div>
  )
}

export default UORIdentityRedirect