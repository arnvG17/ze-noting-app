import html2pdf from "html2pdf.js";
import ReactDOMServer from "react-dom/server";
import React from "react";
import ReactMarkdown from "react-markdown";
import CodeBlock from "../components/ui/CodeBlock";

// Render markdown to HTML string with code highlighting
export function renderMarkdownToHtml(markdown) {
  return ReactDOMServer.renderToStaticMarkup(
    <div style={{ background: "#18181b", color: "#f3f3f3", padding: 24, fontFamily: "Inter, sans-serif" }}>
      <ReactMarkdown
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <CodeBlock
                language={match ? match[1] : 'text'}
                code={String(children).replace(/\n$/, '')}
              />
            ) : (
              <code className={className} {...props}>{children}</code>
            );
          }
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

export function exportMarkdownToPdf(markdown, filename = "output.pdf") {
  const html = renderMarkdownToHtml(markdown);
  const opt = {
    margin:       0.5,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().from(html).set(opt).save();
} 