import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Lightbulb, BarChart2, Settings, PlayCircle } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/trends", icon: TrendingUp, label: "Trends" },
  { to: "/content", icon: Lightbulb, label: "Content" },
  { to: "/analytics", icon: BarChart2, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-gray-900 border-r border-gray-800">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-800">
          <PlayCircle className="text-red-500" size={24} />
          <span className="font-bold text-white text-sm tracking-wide">YT Manager</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-red-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-600">
          v1.0.0
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <Outlet />
      </main>
    </div>
  );
}
