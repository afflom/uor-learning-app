import type { AppProps } from 'next/app';
import '../styles/index.css';
import '../styles/App.css';
import Layout from '../components/Layout';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}