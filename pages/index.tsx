import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Client-side redirect to the welcome page
export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/welcome');
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Redirecting to welcome page...</p>
    </div>
  );
}