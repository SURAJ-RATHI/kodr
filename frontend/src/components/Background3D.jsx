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
    { position: [-4, 0, -4], rotation: [0, 0, 0], color: '#61DAFB', size: 1.2 }, // React blue
    { position: [4, 0, -4], rotation: [0, 0, 0], color: '#F7DF1E', size: 0.8 }, // JavaScript yellow
    { position: [0, 0, -6], rotation: [0, 0, 0], color: '#007ACC', size: 1 }, // TypeScript blue
    { position: [-6, 0, 0], rotation: [0, 0, 0], color: '#E34F26', size: 1.1 }, // HTML orange
    { position: [6, 0, 0], rotation: [0, 0, 0], color: '#264DE4', size: 0.9 }, // CSS blue
  ], [])

  const floatingTexts = useMemo(() => [
    { position: [-3, 2, -3], text: "Code", color: "#61DAFB" },
    { position: [3, -2, -3], text: "Debug", color: "#F7DF1E" },
    { position: [0, 3, -5], text: "Interview", color: "#007ACC" },
    { position: [-5, -3, 0], text: "Learn", color: "#E34F26" },
    { position: [5, 3, 0], text: "Grow", color: "#264DE4" },
  ], [])

  const interviewRings = useMemo(() => [
    { position: [-2, 1, -2], color: "#61DAFB" },
    { position: [2, -1, -2], color: "#F7DF1E" },
    { position: [0, 2, -4], color: "#007ACC" },
  ], [])

  const timers = useMemo(() => [
    { position: [-4, 2, -3], color: "#61DAFB" },
    { position: [4, -2, -3], color: "#F7DF1E" },
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
      <pointLight position={[-5, 5, 0]} intensity={0.5} color="#61DAFB" />
      <pointLight position={[5, -5, 0]} intensity={0.5} color="#007ACC" />

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