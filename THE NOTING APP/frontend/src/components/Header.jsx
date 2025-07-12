import React from 'react'
import { useTheme } from 'next-themes'
import { TextPressure } from "./ui/interactive-text-pressure"

const Header = () => {
  const { theme } = useTheme()
  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <div className="nav-brand">
            <TextPressure
              text="NotingApp"
              flex={false}
              alpha={false}
              stroke={false}
              width={true}
              weight={true}
              italic={true}
              textColor={theme === "dark" ? "#fff" : "#111"}
              minFontSize={66}
              className="cursor-default"
            />
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