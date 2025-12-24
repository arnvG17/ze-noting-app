import React from 'react'

const Features = () => {
  const features = [
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10,9 9,9 8,9" />
        </svg>
      ),
      title: 'Smart Document Processing',
      description: 'Upload PDF, DOCX, or TXT files and get instant AI-powered summaries and organized notes.'
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4" />
          <path d="M21 12c-1 0-2.4-.4-3.5-1.5S16 8 16 7s.4-2.5 1.5-3.5S20 2 21 2s2.4.4 3.5 1.5S26 6 26 7s-.4 2.5-1.5 3.5S22 12 21 12z" />
          <path d="M3 12c1 0 2.4-.4 3.5-1.5S8 8 8 7s-.4-2.5-1.5-3.5S2 2 1 2s-2.4.4-3.5 1.5S-4 6-4 7s.4 2.5 1.5 3.5S2 12 3 12z" />
        </svg>
      ),
      title: 'AI-Powered Summaries',
      description: 'Get comprehensive summaries with key points, main ideas, and important insights extracted automatically.'
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      title: 'Interactive Chatbot',
      description: 'Ask questions about your documents and get instant answers from our AI assistant.'
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        </svg>
      ),
      title: 'Inbuilt Quiz Generator',
      description: 'Test your understanding with automatically generated quizzes based on your uploaded documents.'
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7,10 12,15 17,10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      title: 'Easy Download',
      description: 'Download your summarized notes as PDF files for offline reading and sharing.'
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21,15 16,10 5,21" />
        </svg>
      ),
      title: 'Beautiful Notes',
      description: 'Get professionally formatted notes with clear structure and easy-to-read layout.'
    }

  ]

  return (
    <section id="features" className="features-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title swoop-in-blur swoop-delay-1">
            Why Choose <span style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>NotingApp</span>?
          </h2>
          <p className="section-subtitle swoop-in-blur swoop-delay-2">
            Transform the way you process and understand documents with our advanced AI technology
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card card fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features 