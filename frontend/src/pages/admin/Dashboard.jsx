// src/pages/admin/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { Home, Users, ChevronDown, Building, Menu, ScrollText, Calendar, CreditCard, User, LogOut, Ticket, Gift, X, ShieldCheck, MapPin } from "lucide-react";
// (Keep your sidebarMenus array exactly as is above this line)
const sidebarMenus = [
  { type: "link", label: "Dashboard", icon: Home, to: "/admin/dashboard" },
  { type: "link", label: "Devotees", icon: Users, to: "/admin/user/list" },
  { type: "dropdown", label: "Temple", icon: Building, items: [{ label: "Temple List", to: "/admin/temple" }, { label: "Bookings", to: "/admin/temple-booking" }] },
  { type: "dropdown", label: "Ritual", icon: ScrollText, items: [{ label: "Ritual List", to: "/admin/ritual" }, { label: "Packages", to: "/admin/ritual/package" }, { label: "Bookings", to: "/admin/ritual-booking" }] },
  { type: "dropdown", label: "Membership", icon: CreditCard, items: [{ label: "Plans", to: "/admin/membership-card" }, { label: "Subscriptions", to: "/admin/purchased-member-card" }] },
  { type: "dropdown", label: "Offers & Vouchers", icon: Gift, items: [{ label: "Offers", to: "/admin/offers" }, { label: "Vouchers", to: "/admin/voucher" }] },
  { type: "dropdown", label: "Events", icon: Calendar, items: [{ label: "Event List", to: "/admin/event" }, { label: "Bookings", to: "/admin/event-booking" }] },
  { type: "link", label: "Locations", icon: MapPin, to: "/admin/locations" },
  { type: "link", label: "My Profile", icon: User, to: "/admin/profile" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, dark } = useAdminAuth();

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("admin_sidebar_collapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { localStorage.setItem("admin_sidebar_collapsed", collapsed); }, [collapsed]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className={`h-screen w-full flex overflow-hidden ${dark ? 'bg-[#0a0a1a] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg"><ShieldCheck size={18} className="text-indigo-400" /></div>
          <span className="text-white font-black tracking-widest text-[10px] uppercase">Command Center</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 bg-slate-900 rounded-lg text-slate-300 hover:text-white border border-slate-800"><Menu size={20} /></button>
      </header>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-slate-950 border-r border-slate-800 relative z-20 transition-all duration-300 ease-in-out ${collapsed ? "w-20" : "w-72"}`}>
        <SidebarHeader collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <SidebarMenus collapsed={collapsed} menus={sidebarMenus} onLogout={handleLogout} />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 h-full bg-slate-950 border-r border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
              <span className="text-white font-black text-[10px] tracking-widest uppercase">Admin Panel</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"><X size={18} /></button>
            </div>
            <SidebarMenus collapsed={false} menus={sidebarMenus} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative scroll-smooth">
        <div className="pt-20 md:pt-10 px-4 md:px-8 pb-12 max-w-[1400px] mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Sidebar Header
|--------------------------------------------------------------------------
*/
function SidebarHeader({
  collapsed,
  onToggle,
}) {

  return (
    <div className="h-16 border-b border-slate-800 flex items-center justify-between px-4">

      {!collapsed && (
        <div>
          <h1 className="text-white font-black text-xs tracking-[0.25em]">
            SARVATIRTHAMAYI
          </h1>

          <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">
            Admin Panel
          </p>
        </div>
      )}

      <button
        onClick={onToggle}
        className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
      >
        <Menu size={18} />
      </button>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Sidebar Menus
|--------------------------------------------------------------------------
*/
function SidebarMenus({
  collapsed,
  menus,
  onLogout,
}) {

  return (
    <div className="flex flex-col h-full">

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1 scrollbar-hide">

        {menus.map((menu) => {

          if (menu.type === "link") {
            return (
              <SidebarLink
                key={menu.to}
                collapsed={collapsed}
                to={menu.to}
                icon={menu.icon}
              >
                {menu.label}
              </SidebarLink>
            );
          }

          return (
            <SidebarDropdown
              key={menu.label}
              collapsed={collapsed}
              title={menu.label}
              icon={menu.icon}
              items={menu.items}
            />
          );
        })}

      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-800">

        <button
          onClick={onLogout}
          className={`
            w-full flex items-center gap-3
            px-4 py-3 rounded-xl
            text-red-400 hover:text-red-300
            hover:bg-red-500/10
            transition-all
            ${collapsed ? "justify-center" : ""}
          `}
        >

          <LogOut size={18} />

          {!collapsed && (
            <span className="text-sm font-bold">
              Logout
            </span>
          )}

        </button>

      </div>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Sidebar Link
|--------------------------------------------------------------------------
*/
function SidebarLink({
  to,
  icon: Icon,
  children,
  collapsed,
}) {

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `
          flex items-center gap-3
          px-4 py-3 rounded-xl
          transition-all duration-200
          text-sm font-semibold
          ${
            isActive
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }
          ${collapsed ? "justify-center" : ""}
        `
      }
    >

      <Icon size={18} />

      {!collapsed && (
        <span>{children}</span>
      )}

    </NavLink>
  );
}

/*
|--------------------------------------------------------------------------
| Sidebar Dropdown
|--------------------------------------------------------------------------
*/
function SidebarDropdown({
  title,
  icon: Icon,
  items,
  collapsed,
}) {

  const location = useLocation();

  const hasActiveChild = useMemo(() => {
    return items.some((item) =>
      location.pathname.startsWith(item.to)
    );
  }, [items, location.pathname]);

  const [open, setOpen] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) {
      setOpen(true);
    }
  }, [hasActiveChild]);

  /*
  |--------------------------------------------------------------------------
  | COLLAPSED MODE
  |--------------------------------------------------------------------------
  */
  if (collapsed) {

    return (
      <div className="flex justify-center py-2">

        <div className="h-11 w-11 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors">

          <Icon size={18} />

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-1">

      <button
        onClick={() => setOpen(!open)}
        className={`
          w-full flex items-center justify-between
          px-4 py-3 rounded-xl
          transition-all duration-200
          ${
            hasActiveChild
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }
        `}
      >

        <div className="flex items-center gap-3">

          <Icon size={18} />

          <span className="text-sm font-semibold">
            {title}
          </span>

        </div>

        <ChevronDown
          size={16}
          className={`
            transition-transform duration-200
            ${open ? "rotate-180" : ""}
          `}
        />

      </button>

      {open && (
        <div className="ml-5 border-l border-slate-800 pl-3 space-y-1">

          {items.map((item) => (

            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `
                  block px-4 py-2 rounded-lg
                  text-xs uppercase tracking-wider
                  font-bold transition-all
                  ${
                    isActive
                      ? "text-indigo-400 bg-slate-800/60"
                      : "text-slate-500 hover:text-white"
                  }
                `
              }
            >
              {item.label}
            </NavLink>

          ))}

        </div>
      )}

    </div>
  );
}
