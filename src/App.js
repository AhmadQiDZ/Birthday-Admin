import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Calendar, Users, Building2, 
  Settings, LogOut, Menu, X, Image as ImageIcon
} from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Packages from './pages/Packages';
import Bookings from './pages/Bookings';
import Partners from './pages/Partners';
import Cities from './pages/Cities';
import CitiesHero from './pages/CitiesHero';
import Profile from './pages/Profile';

// Sidebar Component
function Sidebar({ isOpen, onClose, onLogout }) {
  const location = useLocation();
  
  const menuItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/packages', icon: <Package size={20} />, label: 'Packages' },
    { path: '/bookings', icon: <Calendar size={20} />, label: 'Bookings' },
    { path: '/partners', icon: <Users size={20} />, label: 'Partner Requests' },
    { path: '/cities', icon: <Building2 size={20} />, label: 'Cities' },
    { path: '/cities-hero', icon: <ImageIcon size={20} />, label: 'Cities Hero' },
    { path: '/profile', icon: <Settings size={20} />, label: 'Profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50
        w-64 h-full bg-primary text-white
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 md:p-6 border-b border-white/20 flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">theQapp</h1>
            <p className="text-xs opacity-75 mt-0.5">Admin Panel</p>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden text-white/80 hover:text-white p-1"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="p-3 md:p-4 overflow-y-auto h-[calc(100%-80px)]">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3 md:p-4 py-2.5 md:py-3 rounded-lg mb-1.5 transition-all text-sm
                ${isActive(item.path) 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 md:p-4 py-2.5 md:py-3 rounded-lg mt-4 text-white/80 hover:bg-white/10 hover:text-white transition-all text-sm"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
}

// Layout Component
function Layout({ children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-primary text-white p-3 flex items-center gap-3">
        <button onClick={toggleSidebar} className="p-1">
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-bold">theQapp Admin</h1>
      </header>

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onLogout={onLogout} 
      />
      
      <main className="lg:ml-64 min-h-screen">
        <div className="p-3 md:p-6 lg:p-8 pt-16 lg:pt-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('adminUser');
    if (user) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/cities" element={<Cities />} />
          <Route path="/cities-hero" element={<CitiesHero />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;