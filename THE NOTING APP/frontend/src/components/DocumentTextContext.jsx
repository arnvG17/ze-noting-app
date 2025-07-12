import React, { createContext, useContext, useState } from 'react';

const DocumentTextContext = createContext();

export function useDocumentText() {
  return useContext(DocumentTextContext);
}

export function DocumentTextProvider({ children }) {
  const [documentText, setDocumentText] = useState('');
  return (
    <DocumentTextContext.Provider value={{ documentText, setDocumentText }}>
      {children}
    </DocumentTextContext.Provider>
  );
} 