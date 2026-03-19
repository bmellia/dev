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
          body={
            <div className="info-stack">
              <p>브라우저 세션 쿠키를 기준으로 인증 상태를 유지합니다.</p>
              <code>credentials: include</code>
            </div>
          }
        />
        <InfoCard
          title="빠른 시작"
          description="기본 관리자 계정으로 바로 로그인할 수 있습니다."
          body={
            <div className="info-stack">
              <p>
                기본 계정은 <code>admin</code> / <code>1234*</code> 입니다.
              </p>
              <p>
                로그인 후에는 설정 화면에서 비밀번호를 먼저 변경하는 편이 안전합니다.
              </p>
            </div>
          }
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
          <button
            className="ghost-button ghost-button-light"
            onClick={() => {
              setUsername("admin");
              setPassword("1234*");
            }}
            type="button"
          >
            데모 비밀번호 채우기
          </button>
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
