import React from 'react'
import GlassSurface from './ui/GlassSurface'

const Header = () => {
  return (
    <header className="header">
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={50}
        backgroundOpacity={0.15}
        saturation={1.8}
        distortionScale={-80}
        brightness={50}
        className="w-full"
      >
        <div className="container" style={{ width: '100%', padding: '0.75rem 2rem' }}>
          <nav className="nav">
            <div className="nav-brand">
              <span style={{
                fontFamily: "'Satoshi-Bold', sans-serif",
                fontSize: '2rem',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '-0.05em'
              }}>
                the noting app <span style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>;</span>
              </span>
            </div>
            <div className="nav-menu">
              <a href="#about" className="nav-link">About</a>
              <a href="#contact" className="nav-link">Contact</a>
            </div>
          </nav>
        </div>
      </GlassSurface>
    </header>
  )
}

export default Header