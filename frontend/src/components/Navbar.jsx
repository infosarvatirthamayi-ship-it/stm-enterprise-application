import React, { useState, useEffect } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sun, Moon, Menu, X, ChevronDown, 
  User, LogOut, ShoppingBag, LayoutDashboard, 
  Sparkles, ShieldCheck, MapPin
} from "lucide-react";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { user, logout } = useUserAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const ENABLE_MEMBERSHIP = false;
  
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const isHomePage = location.pathname === "/";
  const isTransparent = isHomePage && !scrolled;

  // Frontend routes perfectly matching UserRoutes.jsx
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Temples", path: "/user/temples" },
  ];

  const servicesLinks = [
    { name: "Temple Assistant", href: "/user/temple-assistance", icon: <User size={18} /> },
    { name: "Divine Rituals", href: "/user/rituals", icon: <Sparkles size={18} /> },
  ];

  // Scroll Listener for Glassmorphism effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      setActiveDropdown(null);
      setMobileMenuOpen(false);
      await logout(); // Calls API internally via context
      navigate("/user/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getUserInitial = () => {
    const name = user?.name || user?.first_name || "U";
    return name[0].toUpperCase();
  };

  return (
    <>
      <nav
        className={`fixed top-4 left-1/2 -translate-x-1/2 w-[96%] max-w-7xl h-20 z-[999] rounded-[2rem] transition-all duration-500
          ${scrolled
              ? "bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/20 dark:border-slate-800"
              : "bg-black/10 backdrop-blur-md border border-white/10"
          }
        `}
      >
        <div className="h-full px-6 md:px-8 flex items-center justify-between">

          {/* 1. LOGO */}
          <RouterLink to="/" className="group flex items-center">
            <span className="text-2xl md:text-3xl font-black tracking-tight flex items-center">
              <span className="text-indigo-500">SARVA</span>
              <span className={`transition-colors ${isTransparent ? "text-white" : "text-slate-900 dark:text-white"}`}>
                TIRTHAM
              </span>
            </span>
          </RouterLink>

          {/* 2. DESKTOP NAVIGATION */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <RouterLink
                  key={link.name}
                  to={link.path}
                  className={`text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 relative py-2
                    ${isActive ? "text-indigo-500" : (isTransparent ? "text-white/80 hover:text-white" : "text-slate-600 dark:text-slate-300 hover:text-indigo-500")}
                  `}
                >
                  {link.name}
                  {isActive && (
                    <motion.div layoutId="nav-indicator" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                  )}
                </RouterLink>
              );
            })}

            {/* Services Dropdown */}
            <div 
              className="relative py-4"
              onMouseEnter={() => setActiveDropdown("services")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className={`flex items-center gap-1 text-xs font-black uppercase tracking-[0.15em] transition-colors
                  ${isTransparent ? "text-white/80 hover:text-white" : "text-slate-600 dark:text-slate-300 hover:text-indigo-500"}
              `}>
                Services <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'services' ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {activeDropdown === "services" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full -left-4 w-64 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 p-3"
                  >
                    {servicesLinks.map((item) => (
                      <RouterLink
                        key={item.name}
                        to={item.href}
                        className="flex items-center gap-3 p-4 rounded-2xl hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all group"
                      >
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                          {item.icon}
                        </div>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {item.name}
                        </span>
                      </RouterLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* STM Club Upsell (Hidden behind feature flag) */}
{ENABLE_MEMBERSHIP && (
  <RouterLink 
    to="/user/stm-club" 
    className="relative group overflow-hidden px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all hover:-translate-y-0.5"
  >
    <span className="relative z-10 flex items-center gap-1.5">
      <ShieldCheck size={14}/> STM Club
    </span>
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
  </RouterLink>
)}
          </div>

          {/* 3. RIGHT ACTION SECTION */}
          <div className="flex items-center gap-3">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95
                ${isTransparent ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700"}
              `}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Desktop User Profile */}
            <div className="hidden lg:block">
              {user ? (
                <div 
                  className="relative py-2"
                  onMouseEnter={() => setActiveDropdown("profile")}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button className="flex items-center gap-3 pl-2">
                    <div className="text-right">
                      <p className={`text-[9px] uppercase font-black tracking-widest ${isTransparent ? "text-white/60" : "text-slate-400"}`}>Welcome</p>
                      <p className={`text-xs font-black truncate max-w-[100px] ${isTransparent ? "text-white" : "text-slate-900 dark:text-white"}`}>{user.name}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-black flex items-center justify-center shadow-md border-2 border-white/20">
                      {getUserInitial()}
                    </div>
                  </button>

                  <ProfileDropdown user={user} isOpen={activeDropdown === "profile"} onLogout={handleLogout} />
                </div>
              ) : (
                <RouterLink to="/user/login" className="px-6 py-2.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md">
                  Login
                </RouterLink>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className={`lg:hidden w-10 h-10 rounded-full flex items-center justify-center transition-colors
                ${isTransparent ? "bg-white/10 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"}
              `}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

          </div>
        </div>
      </nav>

      {/* =========================================================================
          📱 MOBILE FULLSCREEN MENU (Appears strictly on small screens)
          ========================================================================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-28 z-[990] lg:hidden bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              
              {/* Mobile User Header */}
              {user ? (
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-black flex items-center justify-center text-lg">
                    {getUserInitial()}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Divine Member</p>
                    <p className="text-base font-black text-slate-800 dark:text-white truncate">{user.name}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <RouterLink to="/user/login" className="flex-1 text-center py-3.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Login</RouterLink>
                  <RouterLink to="/signup" className="flex-1 text-center py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest">Sign Up</RouterLink>
                </div>
              )}

              {/* Mobile Links */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 mb-2">Navigation</p>
                {navLinks.map((link) => (
                  <RouterLink key={link.name} to={link.path} className="block px-4 py-3 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    {link.name}
                  </RouterLink>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 mb-2">Services</p>
                {servicesLinks.map((item) => (
                  <RouterLink key={item.name} to={item.href} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-indigo-500">{item.icon}</span> {item.name}
                  </RouterLink>
                ))}
              </div>

              {/* Mobile STM Club */}
              <RouterLink to="/user/stm-club" className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl text-slate-900 shadow-md">
                <div className="flex items-center gap-2 font-black uppercase tracking-widest text-xs">
                  <ShieldCheck size={18} /> STM Club Access
                </div>
              </RouterLink>

              {/* Mobile Logout */}
              {user && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-colors">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ----------------------------------------------------------------------------
// DESKTOP PROFILE DROPDOWN COMPONENT
// ----------------------------------------------------------------------------
function ProfileDropdown({ user, isOpen, onLogout }) {
  // Routes user correctly to Admin Dashboard or Standard Profile
  const getDashboardPath = () => {
    if (user?.user_type === 1) return "/admin/dashboard";
    if (user?.user_type === 2) return "/temple-admin/dashboard";
    return "/user/profile";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 15, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 mt-4 w-64 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-3 overflow-hidden"
        >
          <div className="px-4 py-4 mb-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Account Details</p>
            <p className="text-sm font-black text-slate-800 dark:text-white truncate">
              {user?.name || "Divine Member"}
            </p>
            <p className="text-[9px] text-emerald-500 font-black uppercase mt-1 tracking-wider flex items-center gap-1">
              <ShieldCheck size={10}/> Active Status
            </p>
          </div>
          
          <div className="space-y-1">
            <RouterLink to={getDashboardPath()} className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 rounded-xl transition-all">
              <LayoutDashboard size={16} className="text-indigo-500" /> Dashboard
            </RouterLink>
            
            <RouterLink to="/user/rituals" className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 rounded-xl transition-all">
              <ShoppingBag size={16} className="text-indigo-500" /> My Bookings
            </RouterLink>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}