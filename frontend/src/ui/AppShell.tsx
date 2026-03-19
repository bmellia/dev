import { Link, NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";

const navigationItems = [
  { to: "/", label: "대시보드", end: true },
  { to: "/transactions", label: "거래" },
  { to: "/settings", label: "설정" },
];


export function AppShell() {
  const { logout, session } = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-top">
          <div className="brand-block">
            <p className="eyebrow">Self-hosted Ledger</p>
            <h1>가계부 운영 콘솔</h1>
            <p className="brand-copy">
              로그인, 거래 관리, 설정 화면을 같은 정보 구조 위에 올릴 수 있도록
              스캐폴드를 준비했습니다.
            </p>
          </div>
          <nav className="nav-list" aria-label="주요 메뉴">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
                end={item.end}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <section className="sidebar-panel">
            <p className="sidebar-label">빠른 작업</p>
            <div className="sidebar-action-list">
              <Link className="sidebar-action-link" to="/transactions">
                거래 입력 열기
              </Link>
              <Link className="sidebar-action-link" to="/settings">
                계정 / 카테고리 정리
              </Link>
            </div>
          </section>
          <section className="sidebar-panel">
            <p className="sidebar-label">운영 체크</p>
            <ul className="sidebar-checklist">
              <li>기본 비밀번호는 설정에서 먼저 변경</li>
              <li>중요 데이터는 CSV와 DB를 함께 백업</li>
              <li>데모 확인이 필요하면 시드 데이터 사용</li>
            </ul>
          </section>
        </div>
        <div className="sidebar-footer">
          <div>
            <p className="sidebar-label">현재 세션</p>
            <strong>{session?.username}</strong>
          </div>
          <button className="ghost-button" onClick={() => void logout()} type="button">
            로그아웃
          </button>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
