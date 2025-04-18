import type { AppProps } from 'next/app';
import { MDXProvider } from '@mdx-js/react';
import '../styles/index.css';
import '../styles/App.css';
import Layout from '../components/Layout';
import MDXComponents from '../components/MDXComponents';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MDXProvider components={MDXComponents}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </MDXProvider>
  );
}