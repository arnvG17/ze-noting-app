import React from 'react';

export const BrowserMockup = ({ children, style = {}, title = "notebook-ai.app" }) => {
  return (
    <div 
      className="remotion-glass" 
      style={{
        width: '85%',
        height: '75%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        ...style
      }}
    >
      <div className="remotion-glass-border" />
      
      {/* Browser Header */}
      <div style={{
        height: '50px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        backgroundColor: 'rgba(20, 20, 25, 0.4)',
        gap: '15px'
      }}>
        {/* Window Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#eab308' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
        </div>
        
        {/* Address Bar */}
        <div style={{
          flex: 1,
          maxWidth: '500px',
          height: '28px',
          borderRadius: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#a1a1aa',
          fontSize: '13px',
          letterSpacing: '0.5px'
        }}>
          {title}
        </div>
      </div>
      
      {/* Browser Body Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
};
