import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { useEffect } from 'react';
import { useSEO } from './hooks/useSEO';
import LoadingScreen from './components/LoadingScreen';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Dice from './pages/games/Dice';
import Limbo from './pages/games/Limbo';
import Crash from './pages/games/Crash';
import Blackjack from './pages/games/Blackjack';
import Plinko from './pages/games/Plinko';
import SpinWheel from './pages/games/SpinWheel';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import Changelog from './pages/Changelog';
import Suggestions from './pages/Suggestions';
import DiceProbabilityCalculator from './pages/DiceProbabilityCalculator';
import CrashGameStrategy from './pages/CrashGameStrategy';
import MartingaleCalculator from './pages/MartingaleCalculator';
import BlackjackBasicStrategy from './pages/BlackjackBasicStrategy';
import CasinoOddsCalculator from './pages/CasinoOddsCalculator';
import PlinkoStrategy from './pages/PlinkoStrategy';
import Sitemap from './pages/Sitemap';
import EarnBalance from './pages/EarnBalance';
import LandingPages from './pages/LandingPages';
import Donate from './pages/Donate';

// Component to scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AppContent = () => {
  const { loading } = useAuth();
  useSEO(); // Apply SEO settings

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <ScrollToTop />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dice" element={<Dice />} />
          <Route path="/limbo" element={<Limbo />} />
          <Route path="/crash" element={<Crash />} />
          <Route path="/blackjack" element={<Blackjack />} />
          <Route path="/plinko" element={<Plinko />} />
          <Route path="/spin-wheel" element={<SpinWheel />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="/dice-probability-calculator" element={<DiceProbabilityCalculator />} />
          <Route path="/crash-game-strategy" element={<CrashGameStrategy />} />
          <Route path="/martingale-calculator" element={<MartingaleCalculator />} />
          <Route path="/blackjack-basic-strategy" element={<BlackjackBasicStrategy />} />
          <Route path="/casino-odds-calculator" element={<CasinoOddsCalculator />} />
          <Route path="/plinko-strategy" element={<PlinkoStrategy />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="/earn-balance" element={<EarnBalance />} />
          <Route path="/landing-pages" element={<LandingPages />} />
          <Route path="/donate" element={<Donate />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};
function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <Router>
          <AppContent />
        </Router>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;