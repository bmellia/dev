import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import { ApiError } from "../services/api";
import { InfoCard } from "../ui/InfoCard";
import { PageHero } from "../ui/PageHero";


export function LoginPage() {
  const navigate = useNavigate();
  const { isLoading, login, session } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && session !== null) {
    return <Navigate replace to="/" />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("로그인에 실패했습니다. 계정 정보와 비밀번호를 확인하세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page page-login">
      <PageHero
        eyebrow="Ticket 15"
        title="관리자 로그인"
        description="세션 쿠키 기반 로그인 흐름을 연결했습니다. 로그인 성공 시 대시보드로 이동하고, 실패 시 오류 메시지를 보여줍니다."
      />
      <div className="login-grid">
        <InfoCard
          title="연결 API"
          description="POST /auth/login, POST /auth/logout, GET /auth/me"
          footer={<code>credentials: include</code>}
        />
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>관리자 아이디</span>
            <input
              autoComplete="username"
              onChange={(event) => setUsername(event.target.value)}
              value={username}
            />
          </label>
          <label className="field">
            <span>비밀번호</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
