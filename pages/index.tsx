import type { GetServerSideProps } from 'next';

// Redirect root to the first section (uor)
export default function Home() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/uor',
    permanent: false
  }
});