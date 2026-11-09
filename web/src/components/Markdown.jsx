import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router';
import rehypeSanitize from 'rehype-sanitize';
import { CodeBlock } from './CodeBlock';

// Ambil teks polos dari node hast (buat deteksi "Tip:" dan isi code block)
function hastText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value;
  return (node.children || []).map(hastText).join('');
}

const isExternal = (href = '') => /^https?:\/\//i.test(href);
// Link internal (/courses/…) lewat router: tidak memuat ulang halaman, jadi sesi & cache tetap utuh.
const isInternal = (href = '') => href.startsWith('/') && !href.startsWith('//');

const components = {
  // Code block fenced → CodeBlock dengan highlight + tombol Copy
  pre({ node }) {
    const codeNode = node?.children?.find((c) => c.tagName === 'code');
    const cls = [].concat(codeNode?.properties?.className || []);
    const lang = cls.map(String).find((c) => c.startsWith('language-'))?.slice(9);
    return <CodeBlock code={hastText(codeNode)} language={lang} />;
  },
  // Sisanya pasti inline code (yang block sudah ditangani di pre)
  code({ children }) {
    return <code className="inline-code">{children}</code>;
  },
  blockquote({ node, children }) {
    if (hastText(node).trim().startsWith('Tip:')) {
      return (
        <div className="md-tip" role="note">
          {children}
        </div>
      );
    }
    return <blockquote className="md-quote">{children}</blockquote>;
  },
  a({ href, children }) {
    if (isExternal(href)) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
    if (isInternal(href)) return <Link to={href}>{children}</Link>;
    return <a href={href}>{children}</a>;
  },
  // judul lesson sudah h1, jadi heading markdown level 1 diturunkan jadi h2
  h1: ({ children }) => <h2>{children}</h2>,
  img: ({ src, alt }) => <img src={src} alt={alt || ''} loading="lazy" />,
};

const inlineComponents = {
  ...components,
  p: ({ children }) => <>{children}</>,
};

export function Markdown({ children, className = 'md', inline = false }) {
  if (!children) return null;
  const content = (
    <ReactMarkdown rehypePlugins={[rehypeSanitize]} components={inline ? inlineComponents : components}>
      {children}
    </ReactMarkdown>
  );
  if (inline) return content;
  return <div className={className}>{content}</div>;
}
