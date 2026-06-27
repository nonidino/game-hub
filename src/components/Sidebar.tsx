import { NavLink, useLocation } from "react-router-dom";
import { NAV, type NavItem } from "../navConfig";
import { HUB_TITLE } from "../lib/config";
import { useIdentity, personLabel, personEmoji, clearIdentity } from "../lib/identity";
import { lock } from "../auth/Gate";

function isActiveParent(item: NavItem, pathname: string): boolean {
  if (item.path === "/") return pathname === "/";
  return pathname === item.path || pathname.startsWith(item.path + "/");
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const identity = useIdentity();

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-4">
        <div className="text-2xl font-[Quicksand] font-bold text-love-deep">
          {HUB_TITLE}
        </div>
        <div className="text-xs text-ink-soft mt-0.5">our little universe</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {NAV.map((item) => {
          const open = isActiveParent(item, pathname);
          return (
            <div key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 font-semibold transition ${
                    isActive || open
                      ? "bg-love text-white shadow-md shadow-love/30"
                      : "text-ink hover:bg-rose/50"
                  }`
                }
              >
                <span className="text-lg">{item.emoji}</span>
                <span>{item.label}</span>
              </NavLink>

              {item.children && open && (
                <div className="ml-4 mt-1 mb-1 space-y-0.5 border-l-2 border-rose-2 pl-2">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.path + child.label}
                      to={child.path}
                      end
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                          isActive
                            ? "bg-sea-mist text-sea-deep font-bold"
                            : "text-ink-soft hover:text-sea-deep hover:bg-sea-mist/60"
                        }`
                      }
                    >
                      <span>{child.emoji}</span>
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-rose-2/60 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-soft">
            {personEmoji(identity)} {personLabel(identity)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={clearIdentity}
              className="text-xs text-sea-deep hover:underline"
              title="Switch who you are"
            >
              switch
            </button>
            <button
              onClick={lock}
              className="text-xs text-love-deep hover:underline"
              title="Lock the hub"
            >
              lock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
