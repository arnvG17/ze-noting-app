import React from "react";

const AnimatedBackground = () => (
  <div className="animated-bg" aria-hidden="true">
    {/* Removed SVG flowing lines */}
    <div className="gradient-blob blob1"></div>
    <div className="gradient-blob blob2"></div>
  </div>
);

export default AnimatedBackground; 