import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import './App.css'
import './components.css'
import { DocumentTextProvider } from './components/DocumentTextContext';

function App() {
  return (
    <DocumentTextProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </div>
    </DocumentTextProvider>
  )
}

export default App 