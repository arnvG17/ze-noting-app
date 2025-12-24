import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ language = 'text', code = '' }) => (
  <SyntaxHighlighter
    language={language}
    style={vscDarkPlus}
    customStyle={{
      borderRadius: 12,
      fontSize: 16,
      background: '#18181b',
      padding: 20,
      fontFamily: 'Consolas, Monaco, "Courier New", monospace'
    }}
  >
    {code}
  </SyntaxHighlighter>
);

export default CodeBlock; 