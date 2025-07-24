import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Environment } from '@react-three/drei'
import { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import styled from '@emotion/styled'
import HomePage from './pages/HomePage'
import UserInfoPage from './pages/UserInfoPage'
import InterviewPanelPage from './pages/InterviewPanelPage'
import InterviewerDashboard from './pages/InterviewerDashboard'
import RoleSelection from './pages/RoleSelection'
import InterviewerLogin from './pages/InterviewerLogin'
import InterviewPage from './pages/InterviewPage'
import Background3D from './components/Background3D'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to bottom, #1a1a1a, #2d2d2d);
  color: #ffffff;
  overflow: hidden;
`

const CanvasContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`

const ContentContainer = styled.div`
  position: relative;
  z-index: 2;
`

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContainer>
          <CanvasContainer>
            <Canvas
              camera={{ position: [0, 0, 8], fov: 75 }}
              dpr={[1, 2]}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
                stencil: false,
                depth: false
              }}
            >
              <Suspense fallback={null}>
                <Environment preset="night" />
                <Stars 
                  radius={100} 
                  depth={50} 
                  count={3000} 
                  factor={4} 
                  saturation={0} 
                  fade 
                  speed={0.5}
                  size={0.3}
                />
                <Background3D />
                <OrbitControls 
                  enableZoom={false} 
                  enablePan={false} 
                  enableRotate={false}
                  autoRotate
                  autoRotateSpeed={0.3}
                />
              </Suspense>
            </Canvas>
          </CanvasContainer>
          <ContentContainer>
            <Routes>
              <Route path="/" element={<RoleSelection />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/userinfo" element={<UserInfoPage />} />
              <Route path="/login" element={<InterviewerLogin />} />
              <Route 
                path="/compiler" 
                element={
                  <ProtectedRoute>
                    <InterviewPanelPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/interview/:interviewId" 
                element={<InterviewPage />} 
              />
              <Route 
                path="/interviewer-dashboard" 
                element={
                  <ProtectedRoute requiredRole="interviewer">
                    <InterviewerDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </ContentContainer>
        </AppContainer>
      </AuthProvider>
    </Router>
  )
}

export default App
