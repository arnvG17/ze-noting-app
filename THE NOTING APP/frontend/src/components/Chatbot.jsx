import React, { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { useDocumentText } from './DocumentTextContext';
import CodeBlock from './ui/CodeBlock';
import { TextShimmer } from './ui/text-shimmer';

const Chatbot = ({ onClose }) => {
  const { documentText } = useDocumentText();
  // Debug: log documentText every render
  console.log('documentText in Chatbot', documentText);
  const contextText = (documentText || '').slice(0, 4000);
  const isTruncated = (documentText || '').length > 4000;
  const [showTruncationMsg, setShowTruncationMsg] = useState(false);

  useEffect(() => {
    if (isTruncated) {
      setShowTruncationMsg(true);
      const timer = setTimeout(() => setShowTruncationMsg(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isTruncated]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI assistant. I can help you with questions about your documents or any other topics. How can I help you today?'
    }
  ])
  console.log("im hittt");
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('https://the-noting-app.onrender.com/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },  
        body: JSON.stringify({
          text: contextText, // Always send a string, limited to 4000 chars
          question: inputValue.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.answer || 'I apologize, but I couldn\'t process your request. Please try again.'
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'I\'m sorry, I encountered an error. Please try again later.'
      }
      setMessages(prev => [...prev, errorMessage])
      toast.error('Failed to get response from AI')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chatbot-overlay" onClick={onClose}>
      <div className="chatbot-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chatbot-header">
          <div className="chatbot-title">
            <div className="chatbot-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <h3>AI Assistant</h3>
              <p></p>
            </div>
          </div>
          <button onClick={onClose} className="close-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '0.5rem',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  background: message.type === 'user'
                    ? 'linear-gradient(90deg, #7c3aed 80%, #2563eb 100%)'
                    : '#444',
                  color: message.type === 'user' ? '#fff' : '#fff',
                  borderRadius: 20,
                  borderTopRightRadius: message.type === 'user' ? 0 : 20,
                  borderTopLeftRadius: message.type === 'bot' ? 0 : 20,
                  padding: '0.75rem 1rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {message.type === 'bot' ? (
                  <ReactMarkdown
                    components={{
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline ? (
                          <CodeBlock
                            language={match ? match[1] : 'text'}
                            code={String(children).replace(/\n$/, '')}
                          />
                        ) : (
                          <code className={className} {...props}>{children}</code>
                        )
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.5rem' }}>
              <div style={{
                maxWidth: '70%',
                background: '#444',
                color: '#fff',
                borderRadius: 20,
                borderTopLeftRadius: 0,
                padding: '0.75rem 1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                alignSelf: 'flex-start',
              }}>
                <TextShimmer className="font-thick font-inter text-sm">Thinking...</TextShimmer>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showTruncationMsg && (
          <div style={{ color: '#fbbf24', background: '#18181b', padding: '0.5rem 1rem', borderRadius: 8, margin: '0.5rem 0', fontSize: '0.95rem', textAlign: 'center' }}>
            Note: Only the first 4000 characters of your document are used for chat context.
          </div>
        )}

        <form onSubmit={handleSubmit} className="chatbot-input">
          <div className="input-container">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="chat-input"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="send-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Chatbot 