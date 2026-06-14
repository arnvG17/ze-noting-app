import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import WorkspacePage from './components/workspace/WorkspacePage'
import './App.css'
import './components.css'
import { DocumentTextProvider } from './components/DocumentTextContext';

function App() {
  return (
    <DocumentTextProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/workspace/:notebookId" element={<WorkspacePage />} />
        </Routes>
      </div>
    </DocumentTextProvider>
  )
}

export default App