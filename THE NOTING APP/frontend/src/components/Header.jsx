import React from 'react'

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <div className="nav-brand">
            <span style={{
              fontFamily: "'Satoshi-Bold', sans-serif",
              fontSize: '2rem',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.05em'
            }}>
              the noting app;
            </span>
          </div>
          <div className="nav-menu">
            <a href="#features" className="nav-link">Features</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#contact" className="nav-link">Contact</a>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header