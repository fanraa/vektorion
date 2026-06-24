import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './lib/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import { NavbarProvider } from './lib/NavbarContext';
import { PageTransition } from './components/PageTransition';
import SuspenseFallback from './components/SuspenseFallback';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load all pages for high performance code-splitting
const Home = lazy(() => import('./pages/Home'));
const Anggota = lazy(() => import('./pages/Anggota'));
const Struktur = lazy(() => import('./pages/Struktur'));
const Kas = lazy(() => import('./pages/Kas'));
const Bendahara = lazy(() => import('./pages/Bendahara'));
const Pengumuman = lazy(() => import('./pages/Pengumuman'));
const Praktikum = lazy(() => import('./pages/Praktikum'));
const Login = lazy(() => import('./pages/Login'));
const Galeri = lazy(() => import('./pages/Galeri'));
const Info = lazy(() => import('./pages/Info'));
const Agenda = lazy(() => import('./pages/Agenda'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Aspirasi = lazy(() => import('./pages/Aspirasi'));

export default function App() {
  return (
    <HelmetProvider>
      <NavbarProvider>
        <AuthProvider>
          <Router>
            <Layout>
              <Suspense fallback={<SuspenseFallback />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/home" replace />} />
                  <Route path="/home" element={<ErrorBoundary><PageTransition><Home /></PageTransition></ErrorBoundary>} />
                  <Route path="/anggota" element={<ErrorBoundary><PageTransition><Anggota /></PageTransition></ErrorBoundary>} />
                  <Route path="/struktur" element={<ErrorBoundary><PageTransition><Struktur /></PageTransition></ErrorBoundary>} />
                  <Route path="/kas" element={<ErrorBoundary><PageTransition><Kas /></PageTransition></ErrorBoundary>} />
                  <Route path="/bendahara" element={<ErrorBoundary><PageTransition><Bendahara /></PageTransition></ErrorBoundary>} />
                  <Route path="/pengumuman" element={<ErrorBoundary><PageTransition><Pengumuman /></PageTransition></ErrorBoundary>} />
                  <Route path="/praktikum" element={<ErrorBoundary><PageTransition><Praktikum /></PageTransition></ErrorBoundary>} />
                  <Route path="/galeri" element={<ErrorBoundary><PageTransition><Galeri /></PageTransition></ErrorBoundary>} />
                  <Route path="/agenda" element={<ErrorBoundary><PageTransition><Agenda /></PageTransition></ErrorBoundary>} />
                  <Route path="/info" element={<ErrorBoundary><PageTransition><Info /></PageTransition></ErrorBoundary>} />
                  <Route path="/aspirasi" element={<ErrorBoundary><PageTransition><Aspirasi /></PageTransition></ErrorBoundary>} />
                  <Route path="/privacy" element={<ErrorBoundary><PageTransition><Privacy /></PageTransition></ErrorBoundary>} />
                  <Route path="/terms" element={<ErrorBoundary><PageTransition><Terms /></PageTransition></ErrorBoundary>} />
                  <Route path="/login" element={<ErrorBoundary><PageTransition><Login /></PageTransition></ErrorBoundary>} />
                  <Route path="/profile" element={<ErrorBoundary><PageTransition><Profile /></PageTransition></ErrorBoundary>} />
                  {/* Default fallback */}
                  <Route path="*" element={<ErrorBoundary><PageTransition><NotFound /></PageTransition></ErrorBoundary>} />
                </Routes>
              </Suspense>
            </Layout>
          </Router>
        </AuthProvider>
      </NavbarProvider>
    </HelmetProvider>
  );
}

