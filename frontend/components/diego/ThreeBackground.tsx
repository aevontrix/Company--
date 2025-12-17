'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * ThreeBackground - Three.js particle system из diego.html
 *
 * Особенности:
 * - 2000 particles
 * - Radial spread (15 units)
 * - Cyan color (0x4DBDFF)
 * - Mouse parallax interaction
 * - Auto-rotation
 * - Additive blending
 *
 * Optimize: Lazy load Three.js (580KB) only when visible and on desktop
 */
export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Optimize: Don't load on mobile/tablet to save bandwidth
    const isMobile = window.innerWidth < 1024 || 'ontouchstart' in window;
    if (isMobile) return;

    // Optimize: Use Intersection Observer to load only when visible
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Optimize: Add 500ms delay to prioritize critical content
          setTimeout(() => {
            setShouldLoad(true);
          }, 500);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!shouldLoad || !containerRef.current) return;

    // Dynamic import Three.js only when needed
    import('three').then((THREE) => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

      renderer.setSize(window.innerWidth, window.innerHeight);
      containerRef.current?.appendChild(renderer.domElement);

      // Particles Geometry
      const geometry = new THREE.BufferGeometry();
      const particlesCount = 2000;
      const posArray = new Float32Array(particlesCount * 3);

      for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 15; // Spread
      }

      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(posArray, 3)
      );

      // Material
      const material = new THREE.PointsMaterial({
        size: 0.02,
        color: 0x4dbdff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });

      // Mesh
      const particlesMesh = new THREE.Points(geometry, material);
      scene.add(particlesMesh);

      camera.position.z = 5;

      // Mouse interaction
      let mouseX = 0;
      let mouseY = 0;

      const handleMouseMove = (event: MouseEvent) => {
        mouseX = event.clientX / window.innerWidth - 0.5;
        mouseY = event.clientY / window.innerHeight - 0.5;
      };

      document.addEventListener('mousemove', handleMouseMove);

      // Animation Loop
      const clock = new THREE.Clock();

      const animate = () => {
        const elapsedTime = clock.getElapsedTime();

        // Rotate entire mesh
        particlesMesh.rotation.y = elapsedTime * 0.05;

        // Mouse reaction
        particlesMesh.rotation.x += 0.05 * (mouseY - particlesMesh.rotation.x);
        particlesMesh.rotation.y += 0.05 * (mouseX - particlesMesh.rotation.y);

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };

      animate();

      // Resize handler
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    });
  }, [shouldLoad]);

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 w-screen h-screen -z-10 opacity-60"
      aria-hidden="true"
    />
  );
}
