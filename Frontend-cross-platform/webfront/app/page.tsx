"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Glasses, Search, User, Store, Camera, Calendar, FileText, Plus,
  MapPin, Clock, ChevronRight, SlidersHorizontal, Star, TrendingUp,
  Package, Sparkles, X, Edit3, Trash2, Layers, Phone, Navigation,
  Crosshair, ArrowUpRight, LogOut
} from 'lucide-react';
import AuthModal from './components/Auth/AuthModal';
import { useAuth } from '@/lib/auth-context';

import UserDashboard from './components/Dashboard/UserDashboard';
import OpticDashboard from './components/Dashboard/OpticDashboard';
import HeroVideo from './components/Hero/HeroVideo';
import Navbar from './components/Navbar/Navbar';
import Band from './components/Site/SiteBand';
import Footer from './components/Site/SiteFooter';
import { HomeSectionsTop, HomeSectionsBottom } from './components/Home/HomeSections';
// --- MOCK DATABASE ---
const MOCK_PRODUCTS = [
  {
    id: "p1",
    nom: "AeroTitan Ultra Light",
    slug: "aerotitan-ultra-light",
    marque: "Ray-Ban",
    categorie: "Titanium Series",
    type: "MONTURE",
    publicCible: "MIXTE",
    statut: "ACTIVE",
    prix: 480.000,
    devise: "TND",
    rating: 4.9,
    reviewsCount: 28,
    frameShape: "Aviator",
    material: "Titanium alloy",
    imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800",
    colorHex: "#00F2FE",
    lensCoating: "ANTI_REFLET",
    opticianStore: "Optique de Carthage",
    storeId: "store-1",
    city: "Carthage"
  },
  {
    id: "p2",
    nom: "CyberFlex Lumina",
    slug: "cyberflex-lumina",
    marque: "Oakley",
    categorie: "Sport Optics",
    type: "MONTURE",
    publicCible: "HOMME",
    statut: "ACTIVE",
    prix: 390.000,
    devise: "TND",
    rating: 4.8,
    reviewsCount: 42,
    frameShape: "Rectangular",
    material: "Acetate Flex",
    imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800",
    colorHex: "#00FF87",
    lensCoating: "LUMIERE_BLEUE",
    opticianStore: "Lunetterie Marsa Premium",
    storeId: "store-2",
    city: "La Marsa"
  },
  {
    id: "p3",
    nom: "Vintage Round Heritage",
    slug: "vintage-round-heritage",
    marque: "Persol",
    categorie: "Classic Collection",
    type: "MONTURE",
    publicCible: "FEMME",
    statut: "ACTIVE",
    prix: 560.000,
    devise: "TND",
    rating: 4.7,
    reviewsCount: 19,
    frameShape: "Round",
    material: "Italian Hand-crafted Acetate",
    imageUrl: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=800",
    colorHex: "#7928CA",
    lensCoating: "PHOTOCHROMIQUE",
    opticianStore: "Vision Care Ennasr",
    storeId: "store-3",
    city: "Ennasr"
  },
  {
    id: "p4",
    nom: "Elegance Gold CatEye",
    slug: "elegance-gold-cateye",
    marque: "Gucci",
    categorie: "Luxury Eyewear",
    type: "MONTURE",
    publicCible: "FEMME",
    statut: "ACTIVE",
    prix: 820.000,
    devise: "TND",
    rating: 5.0,
    reviewsCount: 15,
    frameShape: "Cat-Eye",
    material: "Gold Polished Steel",
    imageUrl: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&q=80&w=800",
    colorHex: "#FF0080",
    lensCoating: "PROTECTION_UV",
    opticianStore: "Lac 2 Vision Boutique",
    storeId: "store-4",
    city: "Les Berges du Lac 2"
  }
];

const MOCK_STORES = [
  {
    id: "store-1",
    nom: "Optique de Carthage",
    ville: "Grand Tunis",
    quartier: "Carthage",
    adresse: "Avenue Habib Bourguiba, Carthage",
    telephone: "+216 71 888 999",
    distanceKm: 2.4,
    rating: 4.9,
    reviewsCount: 54,
    verified: true,
    badge: "Master 3D Partner",
    isOpenNow: true,
    hoursToday: "08:30 - 19:30",
    image: "https://images.unsplash.com/photo-1582142407894-ec85a1260aee?auto=format&fit=crop&q=80&w=800",
    availableModelsCount: 42
  },
  {
    id: "store-2",
    nom: "Lunetterie Marsa Premium",
    ville: "Grand Tunis",
    quartier: "La Marsa",
    adresse: "Rue Hédi Chaker, La Marsa",
    telephone: "+216 71 777 333",
    distanceKm: 4.1,
    rating: 4.8,
    reviewsCount: 38,
    verified: true,
    badge: "Optometry Center",
    isOpenNow: true,
    hoursToday: "09:00 - 20:00",
    image: "https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&q=80&w=800",
    availableModelsCount: 68
  },
  {
    id: "store-3",
    nom: "Vision Care Ennasr",
    ville: "Ariana",
    quartier: "Ennasr 2",
    adresse: "Avenue Hédi Nouira, Ennasr 2",
    telephone: "+216 70 555 111",
    distanceKm: 6.8,
    rating: 4.7,
    reviewsCount: 29,
    verified: true,
    badge: "Certified Optician",
    isOpenNow: true,
    hoursToday: "08:30 - 19:00",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800",
    availableModelsCount: 31
  },
  {
    id: "store-4",
    nom: "Lac 2 Vision Boutique",
    ville: "Grand Tunis",
    quartier: "Les Berges du Lac 2",
    adresse: "Boulevard de la Feuille d'Érable, Lac 2",
    telephone: "+216 71 999 123",
    distanceKm: 1.2,
    rating: 5.0,
    reviewsCount: 62,
    verified: true,
    badge: "Chroma VIP Lounge",
    isOpenNow: true,
    hoursToday: "10:00 - 20:30",
    image: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=800",
    availableModelsCount: 89
  },
  {
    id: "store-5",
    nom: "Sousse Centre Optical",
    ville: "Sousse",
    quartier: "Sousse Ville",
    adresse: "Boulevard 14 Janvier, Sousse",
    telephone: "+216 73 222 444",
    distanceKm: 135.0,
    rating: 4.8,
    reviewsCount: 41,
    verified: true,
    badge: "Regional Hub",
    isOpenNow: false,
    hoursToday: "Ferme à 18:30",
    image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&q=80&w=800",
    availableModelsCount: 50
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
const { user: currentUser, status: authStatus, signIn, signOut } = useAuth();
const userRole = currentUser?.accountType ?? 'GUEST';
const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');

  // Theme mode: 'dark' (default studio look) or 'light'
  const [themeMode, setThemeMode] = useState('light');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(MOCK_PRODUCTS[0]);
  const [cartCount, setCartCount] = useState(2);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReservationModal, setActiveReservationModal] = useState(false);

  // Carousel State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const selectSlide = useCallback((index: number) => {
    const slideIndex = (index + MOCK_PRODUCTS.length) % MOCK_PRODUCTS.length;
    setCurrentSlideIndex(slideIndex);
    setSelectedProduct(MOCK_PRODUCTS[slideIndex]);
  }, []);
  const isDashboardTab = activeTab === 'user-dashboard' || activeTab === 'optician-dashboard';
  const renderedTab = isDashboardTab && authStatus !== 'loading'
    ? authStatus === 'guest'
      ? 'landing'
      : currentUser?.accountType === 'OPTICIAN'
        ? 'optician-dashboard'
        : 'user-dashboard'
    : activeTab;

  // Geolocation & Filter states
  const [selectedCityFilter, setSelectedCityFilter] = useState('ALL');
  const [maxDistanceRadius, setMaxDistanceRadius] = useState(15);
  const [onlyOpenStores, setOnlyOpenStores] = useState(false);
  const [userDetectedLocation, setUserDetectedLocation] = useState("Grand Tunis (Lac 2 / Ariana)");

  const [frameColor, setFrameColor] = useState('#D4AF37');
  const [lensCoating, setLensCoating] = useState('ANTI_REFLET');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const [filterShape, setFilterShape] = useState('ALL');
  const [filterPrice, setFilterPrice] = useState(1000);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');


  // CATEGORY HERO DATA WITH SVG SHELF RENDERS (Sophisticated Neutral Luxury Palette)
  const LUXURY_CATEGORIES = [
    {
      id: "MONTURE",
      name: "SUNGLASSES & MONTURES",
      subtitle: "Optiques UV400 & Polarisiés High-End",
      count: "12 Modèles",
      shapeMatch: "Aviator",
      svg: `<svg viewBox="0 0 200 80" class="w-full h-auto drop-shadow-2xl"><path d="M15,35 Q15,20 45,20 L75,20 Q105,20 105,38 Q105,62 75,62 L45,62 Q15,62 15,35 Z" fill="rgba(212,175,55,0.25)" stroke="#D4AF37" stroke-width="3.5"/><path d="M185,35 Q185,20 155,20 L125,20 Q95,20 95,38 Q95,62 125,62 L155,62 Q185,62 185,35 Z" fill="rgba(212,175,55,0.25)" stroke="#D4AF37" stroke-width="3.5"/><path d="M105,30 Q100,22 95,30" stroke="#D4AF37" stroke-width="3.5" fill="none"/><line x1="2" y1="26" x2="15" y2="28" stroke="#D4AF37" stroke-width="3.5"/><line x1="198" y1="26" x2="185" y2="28" stroke="#D4AF37" stroke-width="3.5"/></svg>`
    },
    {
      id: "VERRE",
      name: "OPTICAL LENSES",
      subtitle: "Filtres Anti-Reflet & Lumière Bleue",
      count: "8 Verres Technologiques",
      shapeMatch: "Round",
      svg: `<svg viewBox="0 0 200 80" class="w-full h-auto drop-shadow-2xl"><circle cx="52" cy="40" r="24" fill="rgba(228,228,231,0.2)" stroke="#E4E4E7" stroke-width="4"/><circle cx="148" cy="40" r="24" fill="rgba(228,228,231,0.2)" stroke="#E4E4E7" stroke-width="4"/><path d="M76,38 Q100,30 124,38" stroke="#E4E4E7" stroke-width="3.5" fill="none"/><line x1="2" y1="36" x2="28" y2="38" stroke="#E4E4E7" stroke-width="3.5"/><line x1="198" y1="36" x2="172" y2="38" stroke="#E4E4E7" stroke-width="3.5"/></svg>`
    },
    {
      id: "LIMITED",
      name: "LIMITED EDITION",
      subtitle: "Finitions Or 24K & Titane Brossé",
      count: "4 Pièces Exclusives",
      shapeMatch: "Cat-Eye",
      svg: `<svg viewBox="0 0 200 80" class="w-full h-auto drop-shadow-2xl"><path d="M18,28 Q50,15 82,28 Q88,58 50,65 Q18,58 18,28 Z" fill="rgba(212,175,55,0.3)" stroke="#FEF08A" stroke-width="4"/><path d="M182,28 Q150,15 118,28 Q112,58 150,65 Q182,58 182,28 Z" fill="rgba(212,175,55,0.3)" stroke="#FEF08A" stroke-width="4"/><path d="M82,26 L118,26 M84,32 L116,32" stroke="#FEF08A" stroke-width="3.5"/><line x1="2" y1="28" x2="18" y2="28" stroke="#FEF08A" stroke-width="3.5"/><line x1="198" y1="28" x2="182" y2="28" stroke="#FEF08A" stroke-width="3.5"/></svg>`
    },
    {
      id: "TITANIUM",
      name: "TITANIUM SERIES",
      subtitle: "Structures Hexagonales Ultra-Légères",
      count: "6 Modèles Ultra Light",
      shapeMatch: "Rectangular",
      svg: `<svg viewBox="0 0 200 80" class="w-full h-auto drop-shadow-2xl"><polygon points="20,40 36,22 66,22 82,40 66,58 36,58" fill="rgba(161,161,170,0.25)" stroke="#A1A1AA" stroke-width="3.5"/><polygon points="118,40 134,22 164,22 180,40 164,58 134,58" fill="rgba(161,161,170,0.25)" stroke="#A1A1AA" stroke-width="3.5"/><line x1="82" y1="36" x2="118" y2="36" stroke="#A1A1AA" stroke-width="3.5"/><line x1="2" y1="34" x2="20" y2="40" stroke="#A1A1AA" stroke-width="3.5"/><line x1="198" y1="34" x2="180" y2="40" stroke="#A1A1AA" stroke-width="3.5"/></svg>`
    }
  ];

  // Variante claire des icônes (les traits clairs deviennent lisibles sur fond ivoire)
  const themedSvg = (svg: string) =>
    themeMode === 'dark'
      ? svg
      : svg
          .replace(/#E4E4E7/g, '#6B7280')
          .replace(/rgba\(228,228,231,0\.2\)/g, 'rgba(107,114,128,0.12)')
          .replace(/#FEF08A/g, '#B8860B');

  const handleCategorySelect = (cat: (typeof LUXURY_CATEGORIES)[number]) => {
    if (cat.shapeMatch) {
      setFilterShape(cat.shapeMatch);
    } else {
      setFilterShape('ALL');
    }
    setActiveCategoryFilter(cat.id);
    setActiveTab('catalog');
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated Background Light Particles with Fade & Bloom Effect
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Generate floating particles with positions, velocities, bloom radius & fade cycles
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.5 + 1.5,
      vx: (Math.random() - 0.5) * 0.15, // Reduced horizontal drift velocity
      vy: -Math.random() * 0.2 - 0.05,  // Reduced upward float speed for gentle motion
      alpha: Math.random(),
      fadeSpeed: Math.random() * 0.003 + 0.001, // Slower fade speed for longer fade-in/out cycles
      fadeIn: Math.random() > 0.5,
      maxAlpha: Math.random() * 0.65 + 0.25,
      glowColor: Math.random() > 0.3 ? 'rgba(212, 175, 55,' : 'rgba(255, 245, 220,'
    }));

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        // Position update
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen boundaries
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        // Smooth Opacity Fade In / Fade Out Cycle
        if (p.fadeIn) {
          p.alpha += p.fadeSpeed;
          if (p.alpha >= p.maxAlpha) p.fadeIn = false;
        } else {
          p.alpha -= p.fadeSpeed;
          if (p.alpha <= 0.05) p.fadeIn = true;
        }

        const isDark = themeMode === 'dark';
        const currentAlpha = isDark ? p.alpha : p.alpha * 0.6;

        // Radial gradient for bloom effect around each particle
        const glowRadius = p.radius * 6;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        grad.addColorStop(0, `${p.glowColor}${currentAlpha})`);
        grad.addColorStop(0.4, `${p.glowColor}${currentAlpha * 0.4})`);
        grad.addColorStop(1, `${p.glowColor}0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core sharp particle center
        ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${currentAlpha})` : `rgba(212, 175, 55, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animateParticles);
    };

    animateParticles();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [themeMode]);

  // Auto-play hero carousel every 6 seconds
  useEffect(() => {
    if (renderedTab !== 'landing') return;
    const carouselTimer = setInterval(() => {
      selectSlide(currentSlideIndex + 1);
    }, 6000);
    return () => clearInterval(carouselTimer);
  }, [currentSlideIndex, renderedTab, selectSlide]);

  // 3D Canvas Visual Refinement with Refined Studio Lighting
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Subtle Warm Dark Grid pattern in canvas background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw avatar face silhouette
      if (!isCameraActive) {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 135, 180, 0, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(23, 21, 20, 0.85)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Biometric Face Tracking Points
        ctx.fillStyle = 'rgba(212, 175, 55, 0.7)';
        ctx.beginPath();
        ctx.arc(centerX - 50, centerY - 25, 3.5, 0, 2 * Math.PI);
        ctx.arc(centerX + 50, centerY - 25, 3.5, 0, 2 * Math.PI);
        ctx.arc(centerX, centerY + 30, 3.5, 0, 2 * Math.PI);
        ctx.fill();

        // PD Measure line
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(centerX - 50, centerY - 25);
        ctx.lineTo(centerX + 50, centerY - 25);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Dynamic Frame math
      const offset = Math.sin((performance.now() / 1000) * 0.75) * 16;
      const frameWidth = 250;
      const frameHeight = 82;
      const posX = centerX - frameWidth / 2 + offset;
      const posY = centerY - 65;

      // Refined Studio Frame Accent Glow
      ctx.shadowColor = frameColor;
      ctx.shadowBlur = 10;

      // Main Glasses Frame
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.roundRect(posX, posY, 110, frameHeight, 18);
      ctx.roundRect(posX + 140, posY, 110, frameHeight, 18);
      ctx.stroke();

      // Reset Glow for internal components
      ctx.shadowBlur = 0;

      // Bridge Connector
      ctx.beginPath();
      ctx.moveTo(posX + 110, posY + 20);
      ctx.quadraticCurveTo(posX + 125, posY + 10, posX + 140, posY + 20);
      ctx.lineWidth = 6;
      ctx.stroke();

      // Lens Tinting Shader
      let tintStyle = 'rgba(255, 255, 255, 0.06)';
      if (lensCoating === 'LUMIERE_BLEUE') tintStyle = 'rgba(186, 210, 235, 0.25)';
      if (lensCoating === 'PHOTOCHROMIQUE') tintStyle = 'rgba(28, 25, 23, 0.85)';
      if (lensCoating === 'PROTECTION_UV') tintStyle = 'rgba(212, 175, 55, 0.2)';

      ctx.fillStyle = tintStyle;
      ctx.beginPath();
      ctx.roundRect(posX + 5, posY + 5, 100, frameHeight - 10, 14);
      ctx.roundRect(posX + 145, posY + 5, 100, frameHeight - 10, 14);
      ctx.fill();

      // Metallic Specular Flare
      const grad = ctx.createLinearGradient(posX, posY, posX + frameWidth, posY + frameHeight);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.5)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(posX + 15, posY + 12);
      ctx.lineTo(posX + 50, posY + 55);
      ctx.moveTo(posX + 155, posY + 12);
      ctx.lineTo(posX + 190, posY + 55);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [frameColor, lensCoating, isCameraActive]);

const handleLogout = () => {
  signOut();
  setActiveTab('landing');
};

  const filteredStores = MOCK_STORES

    .filter(st => selectedCityFilter === 'ALL' || st.ville === selectedCityFilter)
    .filter(st => st.distanceKm <= maxDistanceRadius)
    .filter(st => !onlyOpenStores || st.isOpenNow);

  return (
    <div className={`min-h-screen font-sans selection:bg-amber-200 selection:text-stone-950 antialiased overflow-x-hidden transition-colors duration-300 relative ${
      themeMode === 'dark'
        ? 'dark bg-[#121110] text-stone-200'
        : 'bg-[#FBFAF7] text-stone-800'
    }`}>

      {/* AMBIANCE CLAIRE : halos pastel doux */}
      {themeMode !== 'dark' && (
        <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-32 w-[620px] h-[620px] rounded-full bg-amber-200/35 blur-[120px]" />
          <div className="absolute top-1/3 -left-40 w-[520px] h-[520px] rounded-full bg-sky-200/30 blur-[120px]" />
          <div className="absolute -bottom-40 right-1/4 w-[560px] h-[560px] rounded-full bg-rose-200/25 blur-[130px]" />
        </div>
      )}

      {/* BACKGROUND FLOATING LIGHT PARTICLES CANVAS WITH BLOOM */}
      <canvas
        ref={particleCanvasRef}
        className={`fixed inset-0 pointer-events-none z-0 ${themeMode === 'dark' ? 'mix-blend-screen opacity-90' : 'opacity-40'}`}
      />

      {/* HEADER NAVBAR 2026 : pilule flottante liquid glass */}
      <Navbar
        themeMode={themeMode}
        onToggleTheme={() => setThemeMode(prev => prev === 'dark' ? 'light' : 'dark')}
        activeTab={renderedTab}
        onNavigate={setActiveTab}
        userRole={userRole}
        userName={currentUser?.name}
        onLogin={() => { setAuthInitialMode('login'); setIsAuthModalOpen(true); }}
        onLogout={handleLogout}
      />

      {/* Custom Styles */}
      <style>{`
        /* Atmospheric Soft Glow & Bloom Utilities */
        .studio-bloom {
          filter: drop-shadow(0 0 25px rgba(212, 175, 55, 0.45)) drop-shadow(0 0 45px rgba(255, 245, 220, 0.25));
        }
        .shelf-spotlight-wide {
          background: conic-gradient(
            from 130deg at 50% 0%,
            transparent 0deg,
            rgba(255, 255, 255, 0.08) 10deg,
            rgba(255, 245, 220, 0.35) 30deg,
            rgba(255, 250, 240, 0.65) 50deg,
            rgba(255, 245, 220, 0.35) 70deg,
            rgba(255, 255, 255, 0.08) 90deg,
            transparent 100deg
          );
          filter: blur(8px);
          mix-blend-mode: screen;
        }
      `}</style>

      {/* MAIN CONTENT AREA */}
      <main className={`relative z-10 ${renderedTab === 'landing' ? '' : 'pb-20 space-y-20 pt-28'}`}>

        {/* LANDING VIEW */}
        {renderedTab === 'landing' && (
          <div>

            {/* HERO VIDEO PLEIN ÉCRAN (style Nike) : sans titre, sans son */}
            <HeroVideo />

            {/* LUXURY CATEGORIES SHELF SECTION */}
            <Band dark={themeMode === 'dark'} tone="plain" id="collection">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-200 uppercase tracking-[0.3em] block mb-1">
                  Collection Exclusive
                </span>
                <h2 className={`text-3xl sm:text-4xl font-light font-display tracking-wider ${
                  themeMode === 'dark' ? 'text-white' : 'text-stone-900'
                }`}>
                  SÉLECTIONNEZ UNE CATÉGORIE
                </h2>
                <p className={`text-xs uppercase tracking-widest mt-2 ${
                  themeMode === 'dark' ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  Cliquez sur une monture pour explorer la collection
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 xl:gap-14">
                {LUXURY_CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat)}
                    className="relative flex flex-col items-center cursor-pointer group select-none py-2"
                  >
                    {/* Extra Wide Vertical Spotlight Beam directly centered above glasses */}
                    <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-96 h-72 shelf-spotlight-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

                    {/* Radial Spotlight Bloom Aura */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full bg-amber-200/20 dark:bg-amber-100/25 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />

                    {/* SVG Glasses Icon with Enhanced Atmospheric Bloom */}
                    <div className="relative w-full h-36 flex items-center justify-center px-2">
                      <div
                        className={`w-full max-w-[210px] xl:max-w-[300px] z-10 transform group-hover:-translate-y-3 group-hover:scale-108 transition-all duration-450 ease-out studio-bloom filter ${themeMode === 'dark' ? 'drop-shadow-[0_16px_24px_rgba(0,0,0,0.85)]' : 'drop-shadow-[0_14px_16px_rgba(90,70,30,0.22)]'}`}
                        dangerouslySetInnerHTML={{ __html: themedSvg(cat.svg) }}
                      />

                      {/* Mirror Reflection under Shelf */}
                      <div
                        className="absolute bottom-1 w-full max-w-[210px] xl:max-w-[300px] pointer-events-none z-0 opacity-30 blur-[1.5px] transform scale-y-[-0.45] translate-y-1/2 transition-opacity duration-300 group-hover:opacity-60"
                        dangerouslySetInnerHTML={{ __html: themedSvg(cat.svg) }}
                      />
                    </div>

                    {/* High-Contrast Translucent Acrylic Glass Shelf */}
                    <div className={`relative w-full h-3.5 backdrop-blur-xl rounded-sm z-20 flex items-center justify-between px-3 border-t border-b group-hover:from-amber-200/90 group-hover:via-amber-400 group-hover:to-amber-600 group-hover:shadow-[0_0_50px_rgba(255,215,120,0.95),0_0_24px_rgba(245,150,48,0.9)] transition-all duration-400 ${
                      themeMode === 'dark'
                        ? 'bg-gradient-to-b from-white/70 via-white/30 to-white/50 border-t-white border-b-white/40'
                        : 'bg-gradient-to-b from-stone-400/80 via-stone-300/40 to-stone-400/60 border-t-stone-500 border-b-stone-400/40'
                    }`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                    </div>

                    {/* Direct Contact & Straight Vertical Wall Shadow */}
                    <div className={`w-full h-3 -mt-0.5 bg-gradient-to-b ${themeMode === 'dark' ? 'from-black/95' : 'from-stone-400/40'} to-transparent blur-[2px] z-10 pointer-events-none`} />
                    <div className={`w-[102%] h-14 -mt-2.5 bg-gradient-to-b ${themeMode === 'dark' ? 'from-black/95 via-black/80' : 'from-stone-400/30 via-stone-300/15'} to-transparent blur-[8px] z-0 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity`} />

                    {/* Label & Redirection Action */}
                    <div className="mt-6 text-center flex flex-col items-center z-20">
                      <span className={`text-sm font-bold tracking-[0.2em] font-display group-hover:text-amber-500 dark:group-hover:text-amber-200 transition-colors duration-300 uppercase ${
                        themeMode === 'dark' ? 'text-white' : 'text-stone-900'
                      }`}>
                        {cat.name}
                      </span>
                      <span className={`text-[11px] font-medium mt-1 tracking-wider ${
                        themeMode === 'dark' ? 'text-stone-400' : 'text-stone-500'
                      }`}>
                        {cat.count}
                      </span>
                      <span className={`mt-3 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border transition-all duration-300 shadow-lg ${
                        themeMode === 'dark'
                          ? 'bg-white/10 group-hover:bg-amber-200 group-hover:text-stone-950 text-white border-white/15'
                          : 'bg-stone-200 group-hover:bg-stone-900 group-hover:text-white text-stone-900 border-stone-300'
                      }`}>
                        Explore Collection →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Band>

            {/* HERO CAROUSEL SECTION */}
            <Band dark={themeMode === 'dark'} tone="soft">
              <div className={`border rounded-3xl p-8 sm:p-12 relative overflow-hidden backdrop-blur-2xl shadow-2xl transition-colors duration-300 ${
                themeMode === 'dark'
                  ? 'bg-[#1A1816]/90 border-white/10'
                  : 'bg-white/80 border-stone-200'
              }`}>

                {/* Background Carousel Warm Accent */}
                <div
                  className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-700 opacity-20 bg-amber-400"
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 relative">

                  {/* Left Column Slide Details */}
                  <div className="lg:col-span-7 space-y-6">

                    <div className="flex items-center gap-3">
                      <span className={`px-3.5 py-1 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase border ${
                        themeMode === 'dark'
                          ? 'bg-white/10 text-amber-200 border-white/15'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {MOCK_PRODUCTS[currentSlideIndex].categorie}
                      </span>
                      <span className={`text-xs font-semibold flex items-center gap-1 ${
                        themeMode === 'dark' ? 'text-stone-400' : 'text-stone-500'
                      }`}>
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {MOCK_PRODUCTS[currentSlideIndex].rating} ({MOCK_PRODUCTS[currentSlideIndex].reviewsCount} avis)
                      </span>
                    </div>

                    <h1 className={`text-4xl sm:text-6xl font-normal tracking-wide font-display leading-tight ${
                      themeMode === 'dark' ? 'text-white' : 'text-stone-900'
                    }`}>
                      {MOCK_PRODUCTS[currentSlideIndex].nom}
                    </h1>

                    <p className={`text-sm sm:text-base leading-relaxed max-w-xl ${
                      themeMode === 'dark' ? 'text-stone-300' : 'text-stone-600'
                    }`}>
                      Conception haut de gamme signée <strong className={themeMode === 'dark' ? 'text-white' : 'text-stone-900'}>{MOCK_PRODUCTS[currentSlideIndex].marque}</strong>.
                      Fabriquée en {MOCK_PRODUCTS[currentSlideIndex].material} avec traitement d&apos;optique avancée <span className="text-amber-600 dark:text-amber-200 font-semibold">{MOCK_PRODUCTS[currentSlideIndex].lensCoating}</span>.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(MOCK_PRODUCTS[currentSlideIndex]);
                          setActiveTab('tryon');
                        }}
                        className={`px-8 py-4 font-bold rounded-2xl flex items-center gap-2 shadow-xl transition-all text-xs tracking-wider uppercase ${
                          themeMode === 'dark'
                            ? 'bg-stone-100 hover:bg-amber-100 text-stone-950'
                            : 'bg-stone-900 hover:bg-stone-800 text-white'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Essayer en 3D Immédiatement
                      </button>

                      <button
                        onClick={() => {
                          setSelectedProduct(MOCK_PRODUCTS[currentSlideIndex]);
                          setActiveReservationModal(true);
                        }}
                        className={`px-8 py-4 border font-semibold rounded-2xl flex items-center gap-2 transition-all text-xs tracking-wider uppercase ${
                          themeMode === 'dark'
                            ? 'bg-white/5 border-white/10 hover:border-white/20 text-white'
                            : 'bg-stone-100 border-stone-300 hover:border-stone-400 text-stone-800'
                        }`}
                      >
                        <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-200" />
                        Réserver en Magasin ({MOCK_PRODUCTS[currentSlideIndex].prix.toFixed(3)} TND)
                      </button>
                    </div>

                    {/* Specifications Grid */}
                    <div className={`pt-6 border-t grid grid-cols-3 gap-6 ${
                      themeMode === 'dark' ? 'border-white/10' : 'border-stone-200'
                    }`}>
                      <div>
                        <div className={`text-xs font-medium ${themeMode === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>Forme Monture</div>
                        <div className={`text-base font-semibold mt-0.5 ${themeMode === 'dark' ? 'text-white' : 'text-stone-900'}`}>{MOCK_PRODUCTS[currentSlideIndex].frameShape}</div>
                      </div>
                      <div>
                        <div className={`text-xs font-medium ${themeMode === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>Traitement Verre</div>
                        <div className="text-base font-semibold text-amber-600 dark:text-amber-200 mt-0.5">{MOCK_PRODUCTS[currentSlideIndex].lensCoating}</div>
                      </div>
                      <div>
                        <div className={`text-xs font-medium ${themeMode === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>Localisation</div>
                        <div className={`text-base font-semibold mt-0.5 ${themeMode === 'dark' ? 'text-white' : 'text-stone-900'}`}>{MOCK_PRODUCTS[currentSlideIndex].city}</div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column Interactive 3D Canvas Preview */}
                  <div className="lg:col-span-5 relative">
                    <div
                      className="absolute -inset-2 rounded-3xl opacity-20 blur-3xl transition-colors duration-700 bg-amber-200/30"
                    ></div>

                    <div className={`border rounded-3xl p-6 shadow-2xl backdrop-blur-2xl transition-colors duration-300 ${
                      themeMode === 'dark'
                        ? 'bg-[#171514]/90 border-white/15'
                        : 'bg-stone-50 border-stone-200'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                          <span className={`text-xs font-semibold ${themeMode === 'dark' ? 'text-white' : 'text-stone-900'}`}>Simulateur Live Studio</span>
                        </div>
                        <span
                          className={`px-3 py-1 border rounded-lg text-[10px] font-semibold uppercase tracking-wider ${
                            themeMode === 'dark'
                              ? 'border-white/15 text-amber-200 bg-white/5'
                              : 'border-stone-300 text-amber-800 bg-stone-200/60'
                          }`}
                        >
                          {MOCK_PRODUCTS[currentSlideIndex].marque}
                        </span>
                      </div>

                      <div className={`relative rounded-2xl overflow-hidden aspect-[4/3] border flex items-center justify-center ${
                        themeMode === 'dark' ? 'bg-[#100f0e] border-white/10' : 'bg-stone-200 border-stone-300'
                      }`}>
                        <canvas
                          ref={canvasRef}
                          width={440}
                          height={330}
                          className="w-full h-full object-cover"
                        />

                        <div className={`absolute bottom-3 left-3 right-3 backdrop-blur-xl p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                          themeMode === 'dark'
                            ? 'bg-[#171514]/90 border-white/10'
                            : 'bg-white/90 border-stone-200'
                        }`}>
                          <div>
                            <div className={`font-semibold truncate max-w-[170px] ${themeMode === 'dark' ? 'text-white' : 'text-stone-900'}`}>{MOCK_PRODUCTS[currentSlideIndex].nom}</div>
                            <div className="text-amber-600 dark:text-amber-200 font-bold">{MOCK_PRODUCTS[currentSlideIndex].prix.toFixed(3)} {MOCK_PRODUCTS[currentSlideIndex].devise}</div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedProduct(MOCK_PRODUCTS[currentSlideIndex]);
                              setActiveTab('tryon');
                            }}
                            className={`px-4 py-2 font-bold rounded-xl transition-colors text-xs tracking-wider uppercase ${
                              themeMode === 'dark'
                                ? 'bg-stone-100 hover:bg-amber-100 text-stone-950'
                                : 'bg-stone-900 hover:bg-stone-800 text-white'
                            }`}
                          >
                            Studio 3D Full
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Carousel Controls & Indicators Footer */}
                <div className={`mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-6 z-10 relative ${
                  themeMode === 'dark' ? 'border-white/10' : 'border-stone-200'
                }`}>

                {/* Thumbnails list */}
                <div className="flex items-center gap-3 overflow-x-auto overflow-y-hidden max-w-full py-3 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {MOCK_PRODUCTS.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => selectSlide(idx)}
                      className={`shrink-0 flex items-center gap-3 p-2 px-3 rounded-2xl border transition-all text-left ${
                        currentSlideIndex === idx
                          ? (themeMode === 'dark'
                              ? 'border-amber-200 bg-amber-200/10 shadow-lg ring-1 ring-amber-200/40'
                              : 'border-amber-500 bg-amber-50 shadow-lg ring-1 ring-amber-500/30')
                          : (themeMode === 'dark'
                              ? 'border-white/10 bg-[#100f0e]/80 opacity-60 hover:opacity-100'
                              : 'border-stone-200 bg-stone-100 opacity-70 hover:opacity-100')
                      }`}
                    >
                      <img src={item.imageUrl} alt={item.nom} className="w-9 h-9 object-cover rounded-xl" />
                      <div className="hidden sm:block">
                        <div className={`text-[10px] font-semibold truncate max-w-[100px] ${themeMode === 'dark' ? 'text-white' : 'text-stone-900'}`}>{item.nom}</div>
                        <div className="text-[9px] text-amber-600 dark:text-amber-200 font-bold">{item.prix.toFixed(0)} TND</div>
                      </div>
                    </button>
                  ))}
                </div>

                  {/* Navigation Arrows */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => selectSlide(currentSlideIndex - 1)}
                      className={`p-3 border rounded-2xl transition-all ${
                        themeMode === 'dark'
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-300 hover:text-white'
                          : 'bg-stone-200/60 hover:bg-stone-300/80 border-stone-300 text-stone-700'
                      }`}
                      aria-label="Previous Slide"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>

                    <div className="flex items-center gap-1.5 px-2">
                      {MOCK_PRODUCTS.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectSlide(idx)}
                          className={`h-2 rounded-full transition-all ${
                            currentSlideIndex === idx
                              ? (themeMode === 'dark' ? 'w-8 bg-amber-200' : 'w-8 bg-stone-900')
                              : (themeMode === 'dark' ? 'w-2 bg-white/20' : 'w-2 bg-stone-300')
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => selectSlide(currentSlideIndex + 1)}
                      className={`p-3 border rounded-2xl transition-all ${
                        themeMode === 'dark'
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-300 hover:text-white'
                          : 'bg-stone-200/60 hover:bg-stone-300/80 border-stone-300 text-stone-700'
                      }`}
                      aria-label="Next Slide"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                </div>

              </div>
            </Band>

            {/* SECTIONS ÉDITORIALES (partie haute) : recommandés, nouveautés, tendance + publicité */}
            <HomeSectionsTop
              themeMode={themeMode}
              products={MOCK_PRODUCTS}
              onTryOn={(p) => { setSelectedProduct(p); setActiveTab('tryon'); }}
              onReserve={(p) => { setSelectedProduct(p); setActiveReservationModal(true); }}
              onCatalog={() => setActiveTab('catalog')}
            />

            {/* LOCATION-FILTERED NEARBY OPTICIANS */}
            <Band dark={themeMode === 'dark'} tone="plain" id="nearby-opticians">
              <div className={`border rounded-3xl p-8 sm:p-12 relative overflow-hidden backdrop-blur-2xl transition-colors duration-300 ${
                themeMode === 'dark'
                  ? 'bg-[#1A1816]/70 border-white/10'
                  : 'bg-white/80 border-stone-200'
              }`}>

                <div className={`flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 pb-8 border-b ${
                  themeMode === 'dark' ? 'border-white/10' : 'border-stone-200'
                }`}>
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-200 uppercase tracking-widest mb-2">
                      <Crosshair className="w-4 h-4 animate-spin text-amber-500" /> Géolocalisation Intelligente
                    </div>
                    <h2 className={`text-3xl sm:text-4xl font-normal font-display ${themeMode === 'dark' ? 'text-white' : 'text-stone-900'}`}>Opticiens Près de Vous</h2>
                    <p className={`text-sm mt-2 ${themeMode === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                      Emplacement détecté: <span className="text-amber-600 dark:text-amber-200 font-semibold">{userDetectedLocation}</span>
                    </p>
                  </div>

                  {/* Geolocation Filter Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className={`border rounded-2xl p-1.5 flex items-center gap-2 ${
                      themeMode === 'dark' ? 'bg-[#121110] border-white/10' : 'bg-stone-100 border-stone-300'
                    }`}>
                      <MapPin className="w-4 h-4 text-amber-500 ml-2" />
                      <select
                        value={selectedCityFilter}
                        onChange={(e) => setSelectedCityFilter(e.target.value)}
                        className={`bg-transparent text-xs font-semibold outline-none pr-3 cursor-pointer ${
                          themeMode === 'dark' ? 'text-white' : 'text-stone-800'
                        }`}
                      >
                        <option value="ALL" className={themeMode === 'dark' ? 'bg-[#121110]' : 'bg-white'}>Toutes les villes (TN)</option>
                        <option value="Grand Tunis" className={themeMode === 'dark' ? 'bg-[#121110]' : 'bg-white'}>Grand Tunis</option>
                        <option value="Ariana" className={themeMode === 'dark' ? 'bg-[#121110]' : 'bg-white'}>Ariana</option>
                        <option value="Sousse" className={themeMode === 'dark' ? 'bg-[#121110]' : 'bg-white'}>Sousse</option>
                      </select>
                    </div>

                    <div className={`border rounded-2xl px-4 py-2 flex items-center gap-3 ${
                      themeMode === 'dark' ? 'bg-[#121110] border-white/10' : 'bg-stone-100 border-stone-300'
                    }`}>
                      <span className={`text-xs font-medium ${themeMode === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>Rayon:</span>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={maxDistanceRadius}
                        onChange={(e) => setMaxDistanceRadius(Number(e.target.value))}
                        className="w-20 accent-amber-500"
                      />
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-200">{maxDistanceRadius} km</span>
                    </div>

                    <button
                      onClick={() => setOnlyOpenStores(!onlyOpenStores)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                        onlyOpenStores
                          ? (themeMode === 'dark' ? 'bg-amber-200/10 border-amber-200/40 text-amber-200' : 'bg-amber-100 border-amber-300 text-amber-800')
                          : (themeMode === 'dark' ? 'bg-[#121110] border-white/10 text-stone-400' : 'bg-stone-100 border-stone-300 text-stone-600')
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Ouverts Maintenant
                    </button>
                  </div>
                </div>

                {/* STORES CARDS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStores.length > 0 ? (
                    filteredStores.map((store) => (
                      <div
                        key={store.id}
                        className={`border rounded-3xl p-6 transition-all group flex flex-col justify-between shadow-xl ${
                          themeMode === 'dark'
                            ? 'bg-[#121110]/90 border-white/10 hover:border-amber-200/40'
                            : 'bg-white border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <div>
                          <div className={`relative aspect-[16/9] rounded-2xl overflow-hidden mb-5 border ${
                            themeMode === 'dark' ? 'border-white/10' : 'border-stone-200'
                          }`}>
                            <img src={store.image} alt={store.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <span className={`absolute top-3 left-3 px-3 py-1 backdrop-blur-md rounded-xl text-[10px] font-bold border flex items-center gap-1.5 ${
                              themeMode === 'dark'
                                ? 'bg-[#121110]/80 text-amber-200 border-white/10'
                                : 'bg-white/90 text-amber-800 border-stone-200'
                            }`}>
                              <Navigation className="w-3 h-3" /> {store.distanceKm} km
                            </span>
                            <span className={`absolute top-3 right-3 px-3 py-1 rounded-xl text-[10px] font-semibold backdrop-blur-md ${
                              store.isOpenNow ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/30' : 'bg-rose-900/80 text-rose-200 border border-rose-500/30'
                            }`}>
                              {store.isOpenNow ? 'Ouvert' : 'Fermé'}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-200 uppercase tracking-wider">{store.badge}</span>
                              <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                                <Star className="w-3.5 h-3.5 fill-amber-400" /> {store.rating} ({store.reviewsCount})
                              </span>
                            </div>

                            <h3 className={`text-xl font-bold transition-colors ${
                              themeMode === 'dark' ? 'text-white group-hover:text-amber-200' : 'text-stone-900 group-hover:text-amber-700'
                            }`}>{store.nom}</h3>
                            <p className={`text-xs flex items-center gap-1.5 ${themeMode === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                              <MapPin className="w-3.5 h-3.5 text-stone-500" /> {store.adresse}
                            </p>
                            <p className={`text-xs flex items-center gap-1.5 ${themeMode === 'dark' ? 'text-stone-500' : 'text-stone-500'}`}>
                              <Phone className="w-3.5 h-3.5 text-stone-500" /> {store.telephone}
                            </p>
                          </div>
                        </div>

                        <div className={`pt-6 mt-6 border-t flex items-center justify-between ${
                          themeMode === 'dark' ? 'border-white/10' : 'border-stone-200'
                        }`}>
                          <div className={`text-[11px] ${themeMode === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                            Modèles 3D en stock: <strong className={themeMode === 'dark' ? 'text-white' : 'text-stone-900'}>{store.availableModelsCount}</strong>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedProduct(MOCK_PRODUCTS.find(p => p.storeId === store.id) || MOCK_PRODUCTS[0]);
                              setActiveReservationModal(true);
                            }}
                            className={`px-4 py-2.5 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 tracking-wider uppercase ${
                              themeMode === 'dark'
                                ? 'bg-stone-100 hover:bg-amber-100 text-stone-950'
                                : 'bg-stone-900 hover:bg-stone-800 text-white'
                            }`}
                          >
                            Réserver <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`col-span-full py-12 text-center ${themeMode === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                      Aucun opticien ne correspond aux filtres de distance choisis.
                    </div>
                  )}
                </div>

              </div>
            </Band>

            {/* SECTIONS ÉDITORIALES (partie basse) : indépendants, meilleures ventes, sponsorisés */}
            <HomeSectionsBottom
              themeMode={themeMode}
              products={MOCK_PRODUCTS}
              stores={MOCK_STORES}
              onTryOn={(p) => { setSelectedProduct(p); setActiveTab('tryon'); }}
              onReserve={(p) => { setSelectedProduct(p); setActiveReservationModal(true); }}
              onCatalog={() => setActiveTab('catalog')}
              onStore={(id) => { setSelectedProduct(MOCK_PRODUCTS.find(p => p.storeId === id) || MOCK_PRODUCTS[0]); setActiveReservationModal(true); }}
            />

          </div>
        )}

    {/* 3D TRY-ON STUDIO */}
    {renderedTab === 'tryon' && (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-light font-display flex items-center gap-3 ${
              themeMode === 'dark' ? 'text-white' : 'text-stone-900'
            }`}>
              Studio Virtuel 3D
              <span className={`px-3 py-1 border text-xs rounded-full font-semibold ${
                themeMode === 'dark' ? 'bg-amber-200/10 border-amber-200/30 text-amber-200' : 'bg-amber-100 border-amber-300 text-amber-800'
              }`}>
                Studio Engine Live
              </span>
            </h1>
            <p className={`text-sm ${themeMode === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>Ajustement anatomique en temps réel selon la morphologie de votre visage</p>
          </div>

          <button
            onClick={() => setIsCameraActive(!isCameraActive)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all ${
              isCameraActive
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : (themeMode === 'dark' ? 'bg-stone-100 text-stone-950 border-stone-200' : 'bg-stone-900 text-white border-stone-800')
            }`}
          >
            <Camera className="w-4 h-4" />
            {isCameraActive ? 'Désactiver Webcam' : 'Activer Webcam Live'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <div className={`border rounded-3xl p-6 relative flex flex-col justify-between shadow-2xl ${
            themeMode === 'dark' ? 'bg-[#171514]/90 border-white/10' : 'bg-white border-stone-200'
          }`}>

            <div className={`relative rounded-2xl overflow-hidden aspect-[16/10] border flex items-center justify-center ${
              themeMode === 'dark' ? 'bg-[#100f0e] border-white/10' : 'bg-stone-200 border-stone-300'
            }`}>
              <canvas
                ref={canvasRef}
                width={720}
                height={450}
                className="w-full h-full object-cover"
              />

              <div className={`absolute top-4 left-4 backdrop-blur-xl px-4 py-3 rounded-2xl border text-xs space-y-1 ${
                themeMode === 'dark'
                  ? 'bg-[#171514]/90 border-white/10 text-stone-300'
                  : 'bg-white/90 border-stone-200 text-stone-700'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>Écart Pupillaire (PD): <strong>63.5 mm</strong></span>
                </div>
                <div className={themeMode === 'dark' ? 'text-stone-400' : 'text-stone-500'}>Largeur Monture: <strong>140 mm</strong></div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border ${
                themeMode === 'dark' ? 'bg-[#100f0e] border-white/10' : 'bg-stone-100 border-stone-200'
              }`}>
                <label className={`text-xs font-bold block mb-2 ${themeMode === 'dark' ? 'text-stone-300' : 'text-stone-700'}`}>Couleur de Monture</label>
                <div className="flex items-center gap-3">
                  {[
                    { name: 'Warm Gold', hex: '#D4AF37' },
                    { name: 'Classic Black', hex: '#1C1917' },
                    { name: 'Champagne Silver', hex: '#E4E4E7' },
                    { name: 'Rose Gold', hex: '#E0A96D' }
                  ].map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setFrameColor(color.hex)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        frameColor === color.hex ? 'border-amber-500 scale-110 shadow-lg' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${
                themeMode === 'dark' ? 'bg-[#100f0e] border-white/10' : 'bg-stone-100 border-stone-200'
              }`}>
                <label className={`text-xs font-bold block mb-2 ${themeMode === 'dark' ? 'text-stone-300' : 'text-stone-700'}`}>Traitement des Verres</label>
                <select
                  value={lensCoating}
                  onChange={(e) => setLensCoating(e.target.value)}
                  className={`w-full border text-xs rounded-xl p-2.5 outline-none font-semibold ${
                    themeMode === 'dark'
                      ? 'bg-[#121110] border-white/10 text-stone-200'
                      : 'bg-white border-stone-300 text-stone-800'
                  }`}
                >
                  <option value="ANTI_REFLET">Anti-Reflet Standard</option>
                  <option value="LUMIERE_BLEUE">Filtre Lumière Bleue</option>
                  <option value="PHOTOCHROMIQUE">Photochromique (Soleil)</option>
                  <option value="PROTECTION_UV">Protection UV400 Polarisé</option>
                </select>
              </div>
            </div>

          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className={`border rounded-3xl p-6 space-y-6 shadow-2xl ${
              themeMode === 'dark' ? 'bg-[#171514]/90 border-white/10' : 'bg-white border-stone-200'
            }`}>
              <div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-200 uppercase tracking-widest">{selectedProduct.marque}</span>
                <h2 className={`text-2xl font-bold mt-1 ${themeMode === 'dark' ? 'text-white' : 'text-stone-900'}`}>{selectedProduct.nom}</h2>
              </div>

              <div className={`p-4 rounded-2xl border space-y-2 ${
                themeMode === 'dark' ? 'bg-[#100f0e] border-white/10' : 'bg-stone-100 border-stone-200'
              }`}>
                <div className="flex justify-between text-xs">
                  <span className={themeMode === 'dark' ? 'text-stone-400' : 'text-stone-600'}>Prix Monture:</span>
                  <span className={`font-bold ${themeMode === 'dark' ? 'text-white' : 'text-stone-900'}`}>{selectedProduct.prix.toFixed(3)} TND</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className={themeMode === 'dark' ? 'text-stone-400' : 'text-stone-600'}>Traitement ({lensCoating}):</span>
                  <span className="font-bold text-amber-600 dark:text-amber-200">+ 45.000 TND</span>
                </div>
                <div className={`pt-2 border-t flex justify-between items-center ${
                  themeMode === 'dark' ? 'border-white/10' : 'border-stone-200'
                }`}>
                  <span className={`text-xs font-bold ${themeMode === 'dark' ? 'text-stone-300' : 'text-stone-700'}`}>Total Estimation:</span>
                  <span className={`text-xl font-bold ${themeMode === 'dark' ? 'text-white' : 'text-stone-900'}`}>{(selectedProduct.prix + 45).toFixed(3)} TND</span>
                </div>
              </div>

              <button
                onClick={() => setActiveReservationModal(true)}
                className={`w-full py-4 font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 text-xs tracking-wider uppercase ${
                  themeMode === 'dark'
                    ? 'bg-stone-100 hover:bg-amber-100 text-stone-950'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
              >
                <Calendar className="w-4 h-4 text-amber-500" />
                Réserver chez l&apos;Opticien Proche
              </button>
            </div>
          </div>

        </div>
      </div>
    )}

    {/* CATALOG VIEW */}
    {renderedTab === 'catalog' && (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setFilterShape('ALL'); setActiveTab('landing'); }}
                className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-200 hover:underline"
              >
                ← Retour aux Catégories
              </button>
            </div>
            <h1 className={`text-3xl font-light font-display mt-2 ${themeMode === 'dark' ? 'text-white' : 'text-stone-900'}`}>Catalogue Général & Opticiens</h1>
            <p className={`text-sm mt-1 ${themeMode === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>Rechercher parmi les magasins partenaires en Tunisie</p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher marque, modèle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-2xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-amber-500 ${
                themeMode === 'dark'
                  ? 'bg-[#121110] border-white/10 text-stone-200'
                  : 'bg-white border-stone-300 text-stone-800'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className={`border rounded-3xl p-6 space-y-6 ${
              themeMode === 'dark' ? 'bg-[#171514]/90 border-white/10' : 'bg-white border-stone-200'
            }`}>
              <div className={`text-sm font-bold flex items-center gap-2 pb-3 border-b ${
                themeMode === 'dark' ? 'text-white border-white/10' : 'text-stone-900 border-stone-200'
              }`}>
                <SlidersHorizontal className="w-4 h-4 text-amber-500" /> Filtres Avancés
              </div>

              <div>
                <label className={`text-xs font-bold block mb-2 ${themeMode === 'dark' ? 'text-stone-300' : 'text-stone-700'}`}>Forme de Monture</label>
                <select
                  value={filterShape}
                  onChange={(e) => setFilterShape(e.target.value)}
                  className={`w-full border text-xs rounded-2xl p-3 outline-none font-semibold ${
                    themeMode === 'dark'
                      ? 'bg-[#100f0e] border-white/10 text-stone-200'
                      : 'bg-stone-100 border-stone-300 text-stone-800'
                  }`}
                >
                  <option value="ALL">Toutes les formes</option>
                  <option value="Aviator">Aviator</option>
                  <option value="Rectangular">Rectangulaire</option>
                  <option value="Round">Ronde</option>
                  <option value="Cat-Eye">Cat-Eye</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MOCK_PRODUCTS
                .filter(p => filterShape === 'ALL' || p.frameShape === filterShape)
                .filter(p => p.nom.toLowerCase().includes(searchQuery.toLowerCase()) || p.marque.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((product) => (
                  <div key={product.id} className={`border rounded-3xl overflow-hidden hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-xl ${
                    themeMode === 'dark' ? 'bg-[#171514]/90 border-white/10' : 'bg-white border-stone-200'
                  }`}>
                    <div>
                      <div className={`relative aspect-[4/3] overflow-hidden ${themeMode === 'dark' ? 'bg-[#100f0e]' : 'bg-stone-100'}`}>
                        <img src={product.imageUrl} alt={product.nom} className="w-full h-full object-cover" />
                        <span className={`absolute top-3 left-3 px-3 py-1 backdrop-blur-md rounded-xl text-[10px] font-semibold border ${
                          themeMode === 'dark' ? 'bg-[#121110]/80 text-stone-300 border-white/10' : 'bg-white/90 text-stone-700 border-stone-200'
                        }`}>
                          {product.marque}
                        </span>
                      </div>

                      <div className="p-6">
                        <h3 className={`font-bold text-base ${themeMode === 'dark' ? 'text-white' : 'text-stone-900'}`}>{product.nom}</h3>
                        <p className={`text-xs mt-2 flex items-center gap-1.5 ${themeMode === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
                          <MapPin className="w-3.5 h-3.5 text-stone-500" /> {product.opticianStore}
                        </p>
                      </div>
                    </div>

                    <div className={`p-6 pt-0 flex items-center justify-between border-t mt-3 ${
                      themeMode === 'dark' ? 'border-white/10' : 'border-stone-200'
                    }`}>
                      <span className={`text-lg font-bold ${themeMode === 'dark' ? 'text-white' : 'text-stone-900'}`}>{product.prix.toFixed(3)} <span className="text-xs text-amber-600 dark:text-amber-200">TND</span></span>
                      <button
                        onClick={() => { setSelectedProduct(product); setActiveReservationModal(true); }}
                        className={`px-4 py-2.5 font-bold text-xs rounded-xl transition-colors uppercase tracking-wider ${
                          themeMode === 'dark' ? 'bg-stone-100 text-stone-950 hover:bg-amber-100' : 'bg-stone-900 text-white hover:bg-stone-800'
                        }`}
                      >
                        Réserver
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    )}


      {/* USER DASHBOARD VIEW */}
      {renderedTab === 'user-dashboard' && currentUser?.accountType === 'CLIENT' && (
        <UserDashboard
          user={currentUser}
          dark={themeMode === 'dark'}
          onNavigate={setActiveTab}
          onLogout={handleLogout}
        />
      )}


    {/* OPTICIAN DASHBOARD VIEW */}
        {renderedTab === 'optician-dashboard' && currentUser?.accountType === 'OPTICIAN' && (
      <OpticDashboard
        user={currentUser}
        dark={themeMode === 'dark'}
        initialInventory={MOCK_PRODUCTS}
      />
    )}


  </main>

  <Footer dark={themeMode === 'dark'} onNavigate={setActiveTab} />


{/* AUTHENTICATION MODAL */}
  {isAuthModalOpen && <AuthModal
    open={isAuthModalOpen}
    dark={themeMode === 'dark'}
    initialMode={authInitialMode}
    onClose={() => setIsAuthModalOpen(false)}
    onSuccess={(user, accountType) => {
  signIn(user, accountType);
  setActiveTab(accountType === 'OPTICIAN' ? 'optician-dashboard' : 'user-dashboard');
  setIsAuthModalOpen(false);
}}
  />}
  {/* RESERVATION MODAL */}
  {activeReservationModal && (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`border w-full max-w-lg rounded-3xl p-8 shadow-2xl relative space-y-6 ${
        themeMode === 'dark' ? 'bg-[#171514] border-white/10' : 'bg-white border-stone-200'
      }`}>
        <button onClick={() => setActiveReservationModal(false)} className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-200 uppercase tracking-wider">Réservation d&apos;Essayage 3D</span>
          <h2 className={`text-2xl font-bold mt-1 ${themeMode === 'dark' ? 'text-white' : 'text-stone-900'}`}>Chez {selectedProduct.opticianStore}</h2>
          <p className="text-xs text-stone-500 mt-1">Monture préservée en stock pour 48h sans obligation d&apos;achat.</p>
        </div>

        <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
          themeMode === 'dark' ? 'bg-[#100f0e] border-white/10' : 'bg-stone-50 border-stone-200'
        }`}>
          <img src={selectedProduct.imageUrl} alt={selectedProduct.nom} className="w-16 h-16 object-cover rounded-xl border border-stone-300 dark:border-white/10" />
          <div>
            <div className={`font-bold text-sm ${themeMode === 'dark' ? 'text-white' : 'text-stone-900'}`}>{selectedProduct.nom}</div>
            <div className="text-xs text-amber-600 dark:text-amber-200 font-bold">{selectedProduct.prix.toFixed(3)} {selectedProduct.devise}</div>
          </div>
        </div>

        <button
          onClick={() => { setActiveReservationModal(false); setActiveTab('user-dashboard'); }}
          className={`w-full py-4 font-bold rounded-2xl text-xs uppercase tracking-wider shadow-xl ${
            themeMode === 'dark' ? 'bg-stone-100 hover:bg-amber-100 text-stone-950' : 'bg-stone-900 hover:bg-stone-800 text-white'
          }`}
        >
          Confirmer la Réservation en Magasin
        </button>
      </div>
    </div>
  )}

</div>
);
}