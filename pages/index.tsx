import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Client-side redirect to the UOR page
export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/uor');
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Redirecting to UOR page...</p>
    </div>
  );
}