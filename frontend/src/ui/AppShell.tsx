import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";

const navigationItems = [
  { to: "/", label: "대시보드", end: true },
  { to: "/transactions", label: "거래", end: false },
  { to: "/analysis", label: "분석" },
  { to: "/settings", label: "설정" },
];


export function AppShell() {
  const { logout, session } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-brand">
            <p className="app-brand-kicker">정밀한 자산 관리 화면</p>
            <h1>자산 원장</h1>
          </div>
          <nav className="top-nav" aria-label="주요 메뉴">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  isActive ? "top-nav-link top-nav-link-active" : "top-nav-link"
                }
                end={item.end}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="app-session">
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
      <footer className="app-footer">
        <div className="app-container app-footer-inner">
          <span>단일 관리자용 자산 관리 화면</span>
          <span>빠른 입력, 요약 확인, CSV 백업 중심</span>
        </div>
      </footer>
    </div>
  );
}
