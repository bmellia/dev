import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "./AuthProvider";


export function RequireAuth({ children }: { children: ReactElement }) {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return (
      <div className="centered-state">
        <p className="eyebrow">세션 확인 중</p>
        <h2>로그인 상태를 확인하고 있습니다.</h2>
      </div>
    );
  }

  if (session === null) {
    return <Navigate replace to="/login" />;
  }

  return children;
}
