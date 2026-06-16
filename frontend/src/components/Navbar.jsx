import React, { useState, useEffect } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";
import { motion, AnimatePresence } from "framer-motion";
import { HiChevronDown, HiMoon, HiSun, HiMenuAlt3, HiX } from "react-icons/hi";
import { FiUser, FiLogOut, FiShoppingBag, FiStar, FiGrid } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, dark, setDark } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const isHomePage = location.pathname === "/";
  const isTransparent = isHomePage && !scrolled;

  const navLinks = [
    { name: "Home", to: "home", isScroll: true, path: "/" },
    { name: "About", path: "/about" },
    { name: "Temples", path: "/user/temples" },
  ];

  const servicesLinks = [
    { name: "Temple Assistant", href: "/user/temple-assistance", icon: <FiUser /> },
    { name: "Divine Rituals", href: "/user/rituals", icon: <FiStar /> },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/user/login");
  };

  // Helper to get initials safely
  const getUserInitial = () => {
    const name = user?.name || user?.first_name || "U";
    return name[0].toUpperCase();
  };

  return (
     <nav
  className={`
    fixed
    top-4
    left-1/2
    -translate-x-1/2
    w-[96%]
    max-w-7xl
    h-20
    z-[999]
    rounded-3xl
    transition-all
    duration-500
    ${
      scrolled
        ? "bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/20"
        : "bg-black/20 backdrop-blur-md border border-white/10"
    }
  `}
>
  <div className="h-full px-8 flex items-center justify-between">

    {/* Logo */}
    <RouterLink to="/" className="group">
      <div className="flex items-center">
        <span className="text-3xl font-black tracking-tight">
          <span className="text-indigo-600">SARVA</span>
          <span
            className={`${
              isTransparent
                ? "text-white"
                : "text-slate-900 dark:text-white"
            }`}
          >
            TIRTHAM
          </span>
        </span>
      </div>
    </RouterLink>

    {/* Desktop Navigation */}
    <div className="hidden lg:flex items-center gap-8">

      {navLinks.map((link) => (
        <RouterLink
          key={link.name}
          to={link.path}
          className={`
            text-sm
            font-semibold
            uppercase
            tracking-[0.15em]
            transition-all
            duration-300
            ${
              location.pathname === link.path
                ? "text-indigo-600"
                : isTransparent
                ? "text-white/80 hover:text-white"
                : "text-slate-600 dark:text-slate-300 hover:text-indigo-600"
            }
          `}
        >
          {link.name}
        </RouterLink>
      ))}

      {/* STM Club */}
      <RouterLink
        to="/user/stm-club"
        className="
          px-5
          py-2.5
          rounded-full
          bg-gradient-to-r
          from-amber-400
          to-yellow-500
          text-slate-900
          text-xs
          font-black
          uppercase
          tracking-widest
          shadow-lg
          hover:scale-105
          transition-all
        "
      >
        STM Club
      </RouterLink>

      {/* Services Dropdown */}
      <div
        className="relative"
        onMouseEnter={() => setActiveDropdown("services")}
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <button
          className={`
            flex
            items-center
            gap-1
            text-sm
            font-semibold
            uppercase
            tracking-[0.15em]
            ${
              isTransparent
                ? "text-white/80"
                : "text-slate-600 dark:text-slate-300"
            }
          `}
        >
          Services
          <HiChevronDown />
        </button>

        <AnimatePresence>
          {activeDropdown === "services" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="
                absolute
                top-full
                mt-4
                w-72
                rounded-3xl
                bg-white
                dark:bg-slate-900
                shadow-2xl
                border
                border-slate-100
                dark:border-slate-800
                p-3
              "
            >
              {servicesLinks.map((item) => (
                <RouterLink
                  key={item.name}
                  to={item.href}
                  className="
                    flex
                    items-center
                    gap-3
                    p-4
                    rounded-2xl
                    hover:bg-indigo-50
                    dark:hover:bg-slate-800
                    transition-all
                  "
                >
                  <span className="text-indigo-600">
                    {item.icon}
                  </span>

                  <span className="font-semibold">
                    {item.name}
                  </span>
                </RouterLink>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

    {/* Right Section */}
    <div className="flex items-center gap-3">

      {/* Dark Mode */}
      <button
        onClick={() => setDark(!dark)}
        className="
          w-11
          h-11
          rounded-2xl
          bg-white/10
          backdrop-blur-md
          border
          border-white/20
          flex
          items-center
          justify-center
          transition-all
          hover:scale-105
        "
      >
        {dark ? (
          <HiSun className="text-amber-400 text-lg" />
        ) : (
          <HiMoon
            className={`${
              isTransparent
                ? "text-white"
                : "text-slate-900 dark:text-white"
            }`}
          />
        )}
      </button>

      {/* User */}
      {user ? (
        <div
          className="relative"
          onMouseEnter={() => setActiveDropdown("profile")}
          onMouseLeave={() => setActiveDropdown(null)}
        >
          <button className="flex items-center gap-3">

            <div className="hidden md:block text-right">
              <p
                className={`text-[10px] uppercase font-bold ${
                  isTransparent
                    ? "text-white/60"
                    : "text-slate-400"
                }`}
              >
                Welcome
              </p>

              <p
                className={`text-sm font-semibold ${
                  isTransparent
                    ? "text-white"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                {user.name}
              </p>
            </div>

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-gradient-to-br
                from-indigo-600
                to-violet-600
                text-white
                font-bold
                flex
                items-center
                justify-center
                shadow-lg
              "
            >
              {getUserInitial()}
            </div>
          </button>

          <ProfileDropdown
            user={user}
            isOpen={activeDropdown === "profile"}
            onLogout={handleLogout}
          />
        </div>
      ) : (
        <RouterLink
          to="/user/login"
          className="
            px-6
            py-3
            rounded-2xl
            bg-indigo-600
            text-white
            font-bold
            hover:bg-indigo-700
            transition-all
          "
        >
          Login
        </RouterLink>
      )}

      {/* Mobile Menu */}
      <button
        className="
          lg:hidden
          w-11
          h-11
          rounded-2xl
          flex
          items-center
          justify-center
        "
        onClick={() =>
          setMobileMenuOpen(!mobileMenuOpen)
        }
      >
        {mobileMenuOpen ? (
          <HiX size={24} />
        ) : (
          <HiMenuAlt3 size={24} />
        )}
      </button>

    </div>
  </div>
</nav>
  );
}

function ProfileDropdown({ user, isOpen, onLogout }) {
  // Determine dashboard path based on user type
  const getDashboardPath = () => {
    if (user?.user_type === 1) return "/admin/dashboard";
    if (user?.user_type === 2) return "/temple-admin/dashboard";
    return "/profile";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 15, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          className="absolute right-0 mt-4 w-64 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-4"
        >
          <div className="px-4 py-3 mb-2 border-b dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</p>
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
              {user?.name || user?.first_name || "Divine Member"}
            </p>
            <p className="text-[10px] text-emerald-500 font-bold uppercase">Sovereign Active</p>
          </div>
          
          <RouterLink to={getDashboardPath()} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
            <FiGrid className="text-indigo-600" /> Dashboard
          </RouterLink>
          
          <RouterLink to="/user/rituals" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
            <FiShoppingBag className="text-emerald-500" /> My Bookings
          </RouterLink>

          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all mt-2">
            <FiLogOut /> Sign Out
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}