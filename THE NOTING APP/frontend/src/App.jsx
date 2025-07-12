import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Chatbot from './components/Chatbot'
import './App.css'
import './components.css'
import { DocumentTextProvider } from './components/DocumentTextContext';

function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)

  return (
    <DocumentTextProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
        {/* Floating Chatbot Button */}
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="floating-chatbot-btn"
          aria-label="Open chatbot"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        {/* Chatbot Modal */}
        {isChatbotOpen && (
          <Chatbot onClose={() => setIsChatbotOpen(false)} />
        )}
      </div>
    </DocumentTextProvider>
  )
}

export default App 