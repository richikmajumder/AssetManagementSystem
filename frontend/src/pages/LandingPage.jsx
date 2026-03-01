import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight } from 'lucide-react';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_equipment-tracker-59/artifacts/hrjwe66k_Logo.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [showSubtext, setShowSubtext] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const fullText = "Intelligent Decision and Algorithmic Learning";
  const idealText = "IDEAL";

  useEffect(() => {
    let timeout;
    
    if (phase === 0) {
      // Phase 0: Type "Intelligent Decision and Algorithmic Learning"
      let currentIndex = 0;
      const typeInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setDisplayText(fullText.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => setPhase(1), 1000);
        }
      }, 50);
      return () => clearInterval(typeInterval);
    } else if (phase === 1) {
      // Phase 1: Show "IDEAL"
      setShowSubtext(true);
      setTimeout(() => setPhase(2), 1500);
    } else if (phase === 2) {
      // Phase 2: Show logo
      setShowLogo(true);
      setTimeout(() => setShowButton(true), 800);
    }
    
    return () => clearTimeout(timeout);
  }, [phase]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Logo */}
      <div className={`transition-all duration-1000 ease-out ${showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <img 
          src={LOGO_URL} 
          alt="IDEAL Lab Logo" 
          className="w-64 h-64 md:w-80 md:h-80 object-contain mb-8"
        />
      </div>

      {/* Main Title - Typewriter */}
      <div className="text-center max-w-4xl">
        <h1 
          className="text-lg md:text-2xl lg:text-3xl font-light tracking-widest mb-4"
          style={{ 
            fontFamily: 'Chivo, sans-serif',
            color: '#90EE90',
            minHeight: '2em'
          }}
        >
          {displayText}
          {phase === 0 && <span className="animate-pulse">|</span>}
        </h1>

        {/* IDEAL Text */}
        <div className={`transition-all duration-700 ease-out ${showSubtext ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight"
            style={{ 
              fontFamily: 'Chivo, sans-serif',
              background: 'linear-gradient(135deg, #DAA520 0%, #FFD700 50%, #DAA520 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {idealText}
          </h2>
          <p 
            className="text-xl md:text-2xl mt-2 tracking-wide"
            style={{ color: '#90EE90' }}
          >
            LAB
          </p>
        </div>
      </div>

      {/* Enter Button */}
      <div className={`mt-12 transition-all duration-700 ease-out ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <Button
          onClick={() => navigate('/login')}
          className="px-8 py-6 text-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold rounded-full shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:scale-105"
          data-testid="enter-btn"
        >
          Enter Lab Portal
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* Subtle footer */}
      <div className={`absolute bottom-6 text-center transition-all duration-700 ${showButton ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-slate-500 text-sm">
          Inventory Management System
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
