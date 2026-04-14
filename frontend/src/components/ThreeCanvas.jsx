import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 6;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) {
      console.warn('WebGL initialization failed:', e);
      return;
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 1);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    // Data Sphere Group
    const sphereGroup = new THREE.Group();

    // Geometry
    const sphereRadius = 2.5;
    const sphereGeometry = new THREE.IcosahedronGeometry(sphereRadius, 3);

    // Dots
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
    });
    const points = new THREE.Points(sphereGeometry, pointsMaterial);
    sphereGroup.add(points);

    // Outer Wireframe
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
    });
    const wireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(sphereGeometry),
      lineMaterial
    );
    sphereGroup.add(wireframe);

    // Inner Wireframe
    const innerGeometry = new THREE.IcosahedronGeometry(sphereRadius * 0.7, 2);
    const innerLineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
    });
    const innerWireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(innerGeometry),
      innerLineMaterial
    );
    sphereGroup.add(innerWireframe);

    scene.add(sphereGroup);

    // Particles
    const particlesGeom = new THREE.BufferGeometry();
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 20;
    }

    particlesGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.03,
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
    });
    const particlesMesh = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particlesMesh);

    // Parallax Interaction
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Responsive
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    let animationId;
    let disposed = false;

    function animate() {
      if (disposed) return;
      animationId = requestAnimationFrame(animate);

      sphereGroup.rotation.y += 0.002;
      sphereGroup.rotation.x += 0.001;

      const targetX = mouseX * 0.4;
      const targetY = -mouseY * 0.4;
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      const positions = particlesGeom.attributes.position.array;
      for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += Math.sin(Date.now() * 0.0005 + i) * 0.002;
      }
      particlesGeom.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }
    animate();

    // Cleanup
    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      sphereGeometry.dispose();
      pointsMaterial.dispose();
      lineMaterial.dispose();
      innerGeometry.dispose();
      innerLineMaterial.dispose();
      particlesGeom.dispose();
      particlesMat.dispose();
      
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        display: 'block'
      }}
    />
  );
}
