import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import FloatingHearts from "./FloatingHearts";
import IdentityPicker from "./IdentityPicker";
import { HUB_TITLE } from "../lib/config";

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-svh">
      <FloatingHearts />
      <IdentityPicker />

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/70 backdrop-blur border-b border-rose-2/60">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-2xl"
          aria-label="Open menu"
        >
          ☰
        </button>
        <span className="font-[Quicksand] font-bold text-love-deep">
          {HUB_TITLE}
        </span>
        <span className="w-6" />
      </div>

      <div className="relative z-10 md:flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-72 shrink-0 h-svh sticky top-0 bg-white/60 backdrop-blur-md border-r border-rose-2/60">
          <Sidebar />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-love-deep/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl animate-pop">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
