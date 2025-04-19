import type { GetServerSideProps } from 'next';

// Redirect root to the welcome page
export default function Home() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/welcome',
    permanent: false
  }
});