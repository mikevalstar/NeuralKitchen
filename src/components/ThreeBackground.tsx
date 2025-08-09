import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import type * as THREE from "three";
import { isBackgroundEnabledAtom } from "~/lib/atoms/ui";

export function ThreeBackground() {
  const [isEnabled] = useAtom(isBackgroundEnabledAtom);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!containerRef.current || !isEnabled) return;

    // Dynamically import Three.js
    const loadThreeJS = async () => {
      const THREE = await import("three");

      // Scene setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      containerRef.current?.appendChild(renderer.domElement);

      sceneRef.current = scene;
      rendererRef.current = renderer;

      // Create neural network nodes
      const nodeGeometry = new THREE.SphereGeometry(0.15, 32, 32); // Reduced from 16x16 to 8x8
      const nodeMaterial = new THREE.MeshBasicMaterial({
        color: 0x667eea,
        transparent: true,
        opacity: 0.6,
      });

      const nodes: THREE.Mesh[] = [];
      // Detect device performance and adjust node count accordingly
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLowPerformance = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
      const nodeCount = isMobile || isLowPerformance ? 30 : 50; // Reduced from 80
      const spread = 25;

      // Create nodes - share material instead of cloning for better performance
      for (let i = 0; i < nodeCount; i++) {
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.x = (Math.random() - 0.5) * spread;
        node.position.y = (Math.random() - 0.5) * spread;
        node.position.z = (Math.random() - 0.5) * spread;

        // Store original position and random properties
        node.userData = {
          originalPos: node.position.clone(),
          phase: Math.random() * Math.PI * 2,
          amplitude: 0.5 + Math.random() * 0.5,
          speed: 0.5 + Math.random() * 0.5,
        };

        scene.add(node);
        nodes.push(node);
      }

      // Create connections between nodes
      const connectionMaterial = new THREE.LineBasicMaterial({
        color: 0x667eea,
        transparent: true,
        opacity: 0.15,
      });

      interface Connection {
        line: THREE.Line;
        start: THREE.Mesh;
        end: THREE.Mesh;
        geometry: THREE.BufferGeometry;
      }

      const connections: Connection[] = [];
      const maxDistance = 5;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const distance = nodes[i].position.distanceTo(nodes[j].position);
          if (distance < maxDistance) {
            const geometry = new THREE.BufferGeometry().setFromPoints([nodes[i].position, nodes[j].position]);
            const line = new THREE.Line(geometry, connectionMaterial);
            scene.add(line);
            connections.push({
              line: line,
              start: nodes[i],
              end: nodes[j],
              geometry: geometry,
            });
          }
        }
      }

      // Create accent material for glowing nodes
      const accentMaterial = new THREE.MeshBasicMaterial({
        color: 0x764ba2,
        transparent: true,
        opacity: 0.8,
      });

      // Add some accent nodes that glow more
      for (let i = 0; i < 5; i++) {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        randomNode.material = accentMaterial;
      }

      camera.position.z = 15;

      // Mouse interaction
      let mouseX = 0;
      let mouseY = 0;

      const handleMouseMove = (event: MouseEvent) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      };

      document.addEventListener("mousemove", handleMouseMove);

      // Performance tracking
      let lastTime = 0;
      let frameCount = 0;
      let fps = 60;
      let performanceMode = false;

      // FPS capping variables
      const targetFPS = 40;
      const targetFrameTime = 1000 / targetFPS; // 25ms per frame
      let lastFrameTime = 0;

      // Animation
      const animate = (currentTime = 0) => {
        animationFrameRef.current = requestAnimationFrame(animate);

        // Pause animation when window doesn't have focus
        if (!document.hasFocus()) {
          return;
        }

        // FPS capping - skip frame if not enough time has passed
        if (currentTime - lastFrameTime < targetFrameTime) {
          return;
        }
        lastFrameTime = currentTime;

        // Calculate FPS every 60 frames
        frameCount++;
        if (frameCount % 60 === 0) {
          const deltaTime = currentTime - lastTime;
          fps = 60000 / deltaTime;
          lastTime = currentTime;

          // Enable performance mode if FPS drops below 45
          performanceMode = fps < 45;
        }

        const time = Date.now() * 0.001;

        // Animate nodes with performance optimizations
        nodes.forEach((node) => {
          const userData = node.userData;

          // Distance culling - only animate nodes within view distance
          const distanceToCamera = camera.position.distanceTo(node.position);
          if (distanceToCamera > 30) {
            node.visible = false;
            return;
          }
          node.visible = true;

          // Floating animation
          node.position.x =
            userData.originalPos.x + Math.sin(time * userData.speed + userData.phase) * userData.amplitude;
          node.position.y =
            userData.originalPos.y + Math.cos(time * userData.speed + userData.phase) * userData.amplitude;
          node.position.z =
            userData.originalPos.z + Math.sin(time * userData.speed * 0.5 + userData.phase) * userData.amplitude * 0.5;

          // Skip pulse effect in performance mode
          if (!performanceMode) {
            const scale = 1 + Math.sin(time * 2 + userData.phase) * 0.1;
            node.scale.set(scale, scale, scale);
          }
        });

        // Update connections with caching and performance optimizations
        connections.forEach((connection) => {
          // Skip invisible connections
          if (!connection.start.visible || !connection.end.visible) {
            connection.line.visible = false;
            return;
          }
          connection.line.visible = true;

          // Update positions only if nodes moved significantly
          const startPos = connection.start.position;
          const endPos = connection.end.position;

          const positions = new Float32Array(6);
          positions[0] = startPos.x;
          positions[1] = startPos.y;
          positions[2] = startPos.z;
          positions[3] = endPos.x;
          positions[4] = endPos.y;
          positions[5] = endPos.z;
          connection.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

          // Update opacity less frequently in performance mode
          if (!performanceMode || frameCount % 3 === 0) {
            const distance = startPos.distanceTo(endPos);
            const material = connection.line.material as THREE.LineBasicMaterial;
            material.opacity = Math.max(0, (1 - distance / maxDistance) * 0.2);
          }
        });

        // Reduce mouse interaction intensity in performance mode
        const mouseIntensity = performanceMode ? 0.01 : 0.02;
        camera.position.x += (mouseX * 2 - camera.position.x) * mouseIntensity;
        camera.position.y += (mouseY * 2 - camera.position.y) * mouseIntensity;
        camera.lookAt(scene.position);

        // Reduce scene rotation speed in performance mode
        const rotationSpeed = performanceMode ? 0.025 : 0.05;
        scene.rotation.y = time * rotationSpeed;

        renderer.render(scene, camera);
      };

      animate();

      // Handle window resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener("resize", handleResize);

      // Cleanup function
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    };

    loadThreeJS();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [isEnabled]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none bg-background"
      style={{
        zIndex: 1,
      }}
    />
  );
}
