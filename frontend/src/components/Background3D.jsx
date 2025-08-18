import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Text, MeshDistortMaterial, Torus } from '@react-three/drei'
import * as THREE from 'three'

function CodeBlock({ position, rotation, color, size = 1 }) {
  const meshRef = useRef()

  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta * 0.1
    meshRef.current.rotation.y += delta * 0.15
    meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.001
  })

  return (
    <Box
      ref={meshRef}
      position={position}
      rotation={rotation}
      args={[size, size * 0.6, size * 0.1]}
    >
      <meshStandardMaterial
        color={color}
        metalness={0.7}
        roughness={0.2}
        transparent
        opacity={0.15}
        envMapIntensity={1}
      />
    </Box>
  )
}

function InterviewRing({ position, color }) {
  const meshRef = useRef()

  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta * 0.2
    meshRef.current.rotation.z += delta * 0.1
    meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.002
  })

  return (
    <Torus
      ref={meshRef}
      position={position}
      args={[1, 0.2, 16, 32]}
    >
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
        transparent
        opacity={0.2}
      />
    </Torus>
  )
}

function FloatingText({ position, text, color }) {
  const meshRef = useRef()

  useFrame((state, delta) => {
    meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.002
    meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
  })

  return (
    <Text
      ref={meshRef}
      position={position}
      fontSize={0.5}
      color={color}
      anchorX="center"
      anchorY="middle"
      font="/fonts/Inter-Bold.woff"
    >
      {text}
    </Text>
  )
}

function InterviewTimer({ position, color }) {
  const meshRef = useRef()

  useFrame((state, delta) => {
    meshRef.current.rotation.y += delta * 0.5
    meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.003
  })

  return (
    <group ref={meshRef} position={position}>
      <Torus args={[0.8, 0.1, 16, 32]}>
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.3}
        />
      </Torus>
      <Text
        position={[0, 0, 0.1]}
        fontSize={0.3}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        60:00
      </Text>
    </group>
  )
}

export default function Background3D() {
  const codeBlocks = useMemo(() => [
    { position: [-4, 0, -4], rotation: [0, 0, 0], color: '#ffffff', size: 1.2 }, // White
    { position: [4, 0, -4], rotation: [0, 0, 0], color: '#cccccc', size: 0.8 }, // Light gray
    { position: [0, 0, -6], rotation: [0, 0, 0], color: '#999999', size: 1 }, // Gray
    { position: [-6, 0, 0], rotation: [0, 0, 0], color: '#666666', size: 1.1 }, // Dark gray
    { position: [6, 0, 0], rotation: [0, 0, 0], color: '#444444', size: 0.9 }, // Darker gray
  ], [])

  const floatingTexts = useMemo(() => [
    { position: [-3, 2, -3], text: "Code", color: "#ffffff" },
    { position: [3, -2, -3], text: "Debug", color: "#cccccc" },
    { position: [0, 3, -5], text: "Interview", color: "#999999" },
    { position: [-5, -3, 0], text: "Learn", color: "#666666" },
    { position: [5, 3, 0], text: "Grow", color: "#444444" },
  ], [])

  const interviewRings = useMemo(() => [
    { position: [-2, 1, -2], color: "#ffffff" },
    { position: [2, -1, -2], color: "#cccccc" },
    { position: [0, 2, -4], color: "#999999" },
  ], [])

  const timers = useMemo(() => [
    { position: [-4, 2, -3], color: "#ffffff" },
    { position: [4, -2, -3], color: "#cccccc" },
  ], [])

  return (
    <>
      {/* Ambient light for better visibility */}
      <ambientLight intensity={0.5} />
      
      {/* Main directional light */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Point lights for better illumination */}
      <pointLight position={[-5, 5, 0]} intensity={0.5} color="#ffffff" />
      <pointLight position={[5, -5, 0]} intensity={0.5} color="#cccccc" />

      {/* Code blocks */}
      {codeBlocks.map((block, index) => (
        <CodeBlock key={`block-${index}`} {...block} />
      ))}

      {/* Interview rings */}
      {interviewRings.map((ring, index) => (
        <InterviewRing key={`ring-${index}`} {...ring} />
      ))}

      {/* Interview timers */}
      {timers.map((timer, index) => (
        <InterviewTimer key={`timer-${index}`} {...timer} />
      ))}

      {/* Floating text */}
      {floatingTexts.map((text, index) => (
        <FloatingText key={`text-${index}`} {...text} />
      ))}

      {/* Add a subtle fog effect */}
      <fog attach="fog" args={['#1a1a1a', 5, 20]} />
    </>
  )
} 