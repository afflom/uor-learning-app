import type { AppProps } from 'next/app';
import { MDXProvider } from '@mdx-js/react';
import { MathJaxContext } from 'better-react-mathjax';
import '../styles/index.css';
import '../styles/App.css';
import Layout from '../components/Layout';
import MDXComponents from '../components/MDXComponents';

// MathJax configuration
const mathJaxConfig = {
  loader: { load: ["[tex]/html"] },
  tex: {
    packages: { "[+]": ["html"] },
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true
  },
  startup: {
    typeset: true // Automatically typeset the page on load
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'annotation', 'annotation-xml'],
    includeHtmlTags: { br: true }, // Make <br> tags part of the surrounding paragraph for math processing
    processHtmlClass: 'math-content'
  }
};

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MathJaxContext config={mathJaxConfig}>
      <MDXProvider components={MDXComponents}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </MDXProvider>
    </MathJaxContext>
  );
}