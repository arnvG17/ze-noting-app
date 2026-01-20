import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { FiCopy, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import CodeBlock from './ui/CodeBlock';

const NotesViewer = ({ notes }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(notes);
        setCopied(true);
        toast.success('Notes copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    if (!notes) return null;

    return (
        <div style={{
            width: '100%',
            maxWidth: '1000px',
            margin: '2rem auto',
            animation: 'fadeInUp 0.5s ease-out',
            background: 'rgba(30, 20, 50, 0.4)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem 2rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'rgba(255, 255, 255, 0.02)'
            }}>
                <div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        color: '#fff',
                        marginBottom: '0.25rem',
                        fontFamily: 'Satoshi, sans-serif'
                    }}>
                        AI Generated Notes
                    </h2>
                    <p style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>
                        Comprehensive summary and key takeaways
                    </p>
                </div>
                <button
                    onClick={handleCopy}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
                        background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: copied ? '#4ade80' : '#fff',
                        border: '1px solid',
                        borderColor: copied ? '#22c55e' : 'rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>

            {/* Content */}
            <div style={{
                padding: '2rem',
                color: '#e4e4e7',
                lineHeight: '1.7',
                fontSize: '1.05rem',
                textAlign: 'left' // Explicitly set text alignment to left
            }}>
                <div className="markdown-content">
                    <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            table: ({ children }) => (
                                <div style={{ overflowX: 'auto', marginBottom: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'rgba(255,255,255,0.02)' }}>{children}</table>
                                </div>
                            ),
                            thead: ({ children }) => <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>{children}</thead>,
                            th: ({ children }) => <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontWeight: '600', color: '#fff' }}>{children}</th>,
                            td: ({ children }) => <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#d4d4d8' }}>{children}</td>,
                            hr: () => <hr style={{ border: 'none', height: '1px', background: 'linear-gradient(to right, transparent, rgba(139, 92, 246, 0.5), transparent)', margin: '2.5rem 0' }} />,
                            h1: ({ children }) => (
                                <h1 style={{
                                    fontSize: '2.25rem',
                                    fontWeight: '800',
                                    marginTop: '2.5rem',
                                    marginBottom: '1.25rem',
                                    color: '#fff',
                                    paddingBottom: '0.75rem',
                                    borderBottom: '2px solid rgba(139, 92, 246, 0.3)',
                                    letterSpacing: '-0.02em'
                                }}>{children}</h1>
                            ),
                            h2: ({ children }) => (
                                <h2 style={{
                                    fontSize: '1.75rem',
                                    fontWeight: '700',
                                    marginTop: '2rem',
                                    marginBottom: '1rem',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span style={{ width: '4px', height: '1.5rem', background: '#8b5cf6', borderRadius: '2px', display: 'inline-block' }}></span>
                                    {children}
                                </h2>
                            ),
                            h3: ({ children }) => (
                                <h3 style={{
                                    fontSize: '1.35rem',
                                    fontWeight: '600',
                                    marginTop: '1.5rem',
                                    marginBottom: '0.75rem',
                                    color: '#f4f4f5'
                                }}>{children}</h3>
                            ),
                            p: ({ children }) => (
                                <p style={{ marginBottom: '1.25rem', color: '#d4d4d8', fontSize: '1.05rem', fontWeight: '400', lineHeight: '1.7' }}>{children}</p>
                            ),
                            ul: ({ children }) => (
                                <ul style={{ marginBottom: '1.25rem', paddingLeft: '0', listStyleType: 'none' }}>{children}</ul>
                            ),
                            ol: ({ children }) => (
                                <ol style={{ marginBottom: '1.25rem', paddingLeft: '1.5rem', listStyleType: 'decimal', color: '#d4d4d8' }}>{children}</ol>
                            ),
                            li: ({ children, ordered }) => (
                                <li style={{ marginBottom: '0.625rem', position: 'relative', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    {!ordered && <span style={{ color: '#8b5cf6', marginTop: '0.35rem', fontSize: '1.2em', flexShrink: 0 }}>•</span>}
                                    <div style={{ flex: 1 }}>{children}</div>
                                </li>
                            ),
                            blockquote: ({ children }) => (
                                <blockquote style={{
                                    borderLeft: '4px solid #8b5cf6',
                                    paddingLeft: '1.5rem',
                                    margin: '1.5rem 0',
                                    fontStyle: 'italic',
                                    color: '#a1a1aa',
                                    background: 'linear-gradient(to right, rgba(139, 92, 246, 0.15), transparent)',
                                    padding: '1.25rem 1.5rem',
                                    borderRadius: '0 12px 12px 0'
                                }}>{children}</blockquote>
                            ),
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline ? (
                                    <div style={{ margin: '1.5rem 0' }}>
                                        <CodeBlock
                                            language={match ? match[1] : 'text'}
                                            code={String(children).replace(/\n$/, '')}
                                        />
                                    </div>
                                ) : (
                                    <code style={{
                                        background: 'rgba(139, 92, 246, 0.15)',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: 6,
                                        fontSize: '0.9em',
                                        fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
                                        color: '#c084fc',
                                        border: '1px solid rgba(139, 92, 246, 0.2)'
                                    }} {...props}>{children}</code>
                                )
                            },
                        }}
                    >
                        {notes}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default NotesViewer;
