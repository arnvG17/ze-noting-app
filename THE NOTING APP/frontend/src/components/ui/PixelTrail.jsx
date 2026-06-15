/* eslint-disable react/no-unknown-property */
import { useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { shaderMaterial, useTrailTexture } from '@react-three/drei';
import * as THREE from 'three';

import './PixelTrail.css';

const GooeyFilter = ({ id = 'goo-filter', strength = 10 }) => {
  return (
    <svg className="goo-filter-container">
      <defs>
        <filter id={id}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={strength} result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
};

const DotMaterial = shaderMaterial(
  {
    resolution: new THREE.Vector2(),
    mouseTrail: null,
    gridSize: 100,
    pixelColor: new THREE.Color('#ffffff')
  },
  `
    varying vec2 vUv;
    void main() {
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  `
    uniform vec2 resolution;
    uniform sampler2D mouseTrail;
    uniform float gridSize;
    uniform vec3 pixelColor;

    void main() {
      vec2 screenUv = gl_FragCoord.xy / resolution;

      // Center of the current grid cell in screen UV space
      vec2 gridUvCenter = (floor(screenUv * gridSize) + 0.5) / gridSize;

      // Coordinate inside the current grid cell [0.0, 1.0]
      vec2 gridUv = fract(screenUv * gridSize);

      // Fetch trail intensity at the center of the cell
      float trail = texture2D(mouseTrail, gridUvCenter).r;

      // Draw a circular dot in the center of the grid cell
      float dist = length(gridUv - 0.5);
      
      // Radius of 0.25 (diameter 0.5 of the cell size) for a subtle dot matrix
      float dotMask = smoothstep(0.35, 0.25, dist);

      gl_FragColor = vec4(pixelColor, trail * dotMask);
    }
  `
);

function Scene({ gridSize, trailSize, maxAge, interpolate, easingFunction, pixelColor }) {
  const size = useThree(s => s.size);
  const viewport = useThree(s => s.viewport);

  const dotMaterial = useMemo(() => {
    const mat = new DotMaterial();
    mat.transparent = true;
    mat.depthWrite = false;
    mat.depthTest = false;
    return mat;
  }, []);

  // Update uniforms safely
  useEffect(() => {
    if (dotMaterial) {
      dotMaterial.uniforms.pixelColor.value.set(pixelColor);
    }
  }, [pixelColor, dotMaterial]);

  useEffect(() => {
    if (dotMaterial) {
      dotMaterial.uniforms.gridSize.value = gridSize;
    }
  }, [gridSize, dotMaterial]);

  const [trail, onMove] = useTrailTexture({
    size: 512,
    radius: trailSize,
    maxAge: maxAge,
    interpolate: interpolate || 0.1,
    ease: easingFunction || (x => x)
  });

  if (trail) {
    trail.minFilter = THREE.NearestFilter;
    trail.magFilter = THREE.NearestFilter;
    trail.wrapS = THREE.ClampToEdgeWrapping;
    trail.wrapT = THREE.ClampToEdgeWrapping;
  }

  useEffect(() => {
    if (dotMaterial && trail) {
      dotMaterial.uniforms.mouseTrail.value = trail;
    }
  }, [trail, dotMaterial]);

  useEffect(() => {
    if (dotMaterial) {
      dotMaterial.uniforms.resolution.value.set(size.width * viewport.dpr, size.height * viewport.dpr);
    }
  }, [size, viewport, dotMaterial]);

  // Set up global mouse listener since pointer-events is none!
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      // Map screen clientX/clientY to UV (0 to 1)
      const x = e.clientX / window.innerWidth;
      // In Three.js/WebGL, Y goes from bottom to top, so invert it
      const y = 1 - (e.clientY / window.innerHeight);

      // Call onMove with a mocked event containing uv
      onMove({ uv: new THREE.Vector2(x, y) });
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [onMove]);

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <primitive object={dotMaterial} />
    </mesh>
  );
}

export default function PixelTrail({
  gridSize = 40,
  trailSize = 0.1,
  maxAge = 250,
  interpolate = 5,
  easingFunction = x => x,
  canvasProps = {},
  glProps = {
    antialias: false,
    powerPreference: 'high-performance',
    alpha: true
  },
  gooeyFilter,
  color = '#ffffff',
  className = ''
}) {
  return (
    <>
      {gooeyFilter && <GooeyFilter id={gooeyFilter.id} strength={gooeyFilter.strength} />}
      <Canvas
        {...canvasProps}
        gl={glProps}
        className={`pixel-canvas ${className}`}
        style={gooeyFilter && { filter: `url(#${gooeyFilter.id})` }}
      >
        <Scene
          gridSize={gridSize}
          trailSize={trailSize}
          maxAge={maxAge}
          interpolate={interpolate}
          easingFunction={easingFunction}
          pixelColor={color}
        />
      </Canvas>
    </>
  );
}
