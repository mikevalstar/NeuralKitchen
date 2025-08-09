import { useEffect, useRef } from "react";

export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!containerRef.current) return;

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
      const nodeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      const nodeMaterial = new THREE.MeshBasicMaterial({
        color: 0x667eea,
        transparent: true,
        opacity: 0.6,
      });

      const nodes: any[] = [];
      const nodeCount = 80;
      const spread = 25;

      // Create nodes
      for (let i = 0; i < nodeCount; i++) {
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
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

      const connections: any[] = [];
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

      // Add some accent nodes that glow more
      for (let i = 0; i < 5; i++) {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        randomNode.material.color.setHex(0x764ba2);
        randomNode.material.opacity = 0.8;
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

      // Animation
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);

        const time = Date.now() * 0.001;

        // Animate nodes
        nodes.forEach((node) => {
          const userData = node.userData;

          // Floating animation
          node.position.x =
            userData.originalPos.x + Math.sin(time * userData.speed + userData.phase) * userData.amplitude;
          node.position.y =
            userData.originalPos.y + Math.cos(time * userData.speed + userData.phase) * userData.amplitude;
          node.position.z =
            userData.originalPos.z + Math.sin(time * userData.speed * 0.5 + userData.phase) * userData.amplitude * 0.5;

          // Pulse effect
          const scale = 1 + Math.sin(time * 2 + userData.phase) * 0.1;
          node.scale.set(scale, scale, scale);
        });

        // Update connections
        connections.forEach((connection) => {
          const positions = new Float32Array(6);
          positions[0] = connection.start.position.x;
          positions[1] = connection.start.position.y;
          positions[2] = connection.start.position.z;
          positions[3] = connection.end.position.x;
          positions[4] = connection.end.position.y;
          positions[5] = connection.end.position.z;
          connection.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

          // Pulse connection opacity based on distance
          const distance = connection.start.position.distanceTo(connection.end.position);
          connection.line.material.opacity = Math.max(0, (1 - distance / maxDistance) * 0.2);
        });

        // Subtle camera movement based on mouse
        camera.position.x += (mouseX * 2 - camera.position.x) * 0.02;
        camera.position.y += (mouseY * 2 - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        // Rotate the entire scene slowly
        scene.rotation.y = time * 0.05;

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
  }, []);

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
