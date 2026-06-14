import React, { createContext, useContext, useState } from 'react';

const DocumentTextContext = createContext();

export function DocumentTextProvider({ children }) {
    const [documentText, setDocumentText] = useState('');
    const [notebookId, setNotebookId] = useState(null);
    const [summaryText, setSummaryText] = useState('');
    const [flowchartData, setFlowchartData] = useState(null);

    return (
        <DocumentTextContext.Provider value={{
            documentText, setDocumentText,
            notebookId, setNotebookId,
            summaryText, setSummaryText,
            flowchartData, setFlowchartData,
        }}>
            {children}
        </DocumentTextContext.Provider>
    );
}

export function useDocumentText() {
    return useContext(DocumentTextContext);
}