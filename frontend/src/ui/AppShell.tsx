import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";

const navigationItems = [
  { to: "/", label: "캘린더", end: true },
  { to: "/transactions", label: "작성", end: false },
  { to: "/analysis", label: "분석" },
  { to: "/settings", label: "설정" },
];


export function AppShell() {
  const { logout, session } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-session">
            <span className="app-session-avatar" aria-hidden="true">
              {session?.username?.slice(0, 1).toUpperCase() ?? "A"}
            </span>
            <div className="app-brand">
              <p className="app-brand-kicker">캘린더 가계부 워크스페이스</p>
              <h1>돈 세는 가계부</h1>
            </div>
          </div>
          <div className="app-header-actions">
            <span className="app-session-user">{session?.username}</span>
            <button className="ghost-button ghost-button-light" onClick={() => void logout()} type="button">
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        <div className="app-container">
          <Outlet />
        </div>
      </main>
      <footer className="app-footer app-bottom-nav">
        <div className="app-container app-footer-inner">
          <nav className="bottom-nav" aria-label="하단 메뉴">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  isActive
                    ? item.to === "/transactions"
                      ? "bottom-nav-link bottom-nav-link-active bottom-nav-link-primary"
                      : "bottom-nav-link bottom-nav-link-active"
                    : item.to === "/transactions"
                      ? "bottom-nav-link bottom-nav-link-primary"
                      : "bottom-nav-link"
                }
                end={item.end}
                to={item.to}
              >
                <span className="bottom-nav-icon" aria-hidden="true">
                  {item.to === "/" ? "달력" : item.to === "/transactions" ? "추가" : item.to === "/analysis" ? "분석" : "설정"}
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
