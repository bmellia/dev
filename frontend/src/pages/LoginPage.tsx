import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import { ApiError } from "../services/api";

const titleTransforms = [
  "translateY(-2px) rotate(-3deg)",
  "translateY(1px) rotate(2deg)",
  "translateY(-1px) rotate(-1.5deg)",
  "translateY(2px) rotate(2.4deg)",
  "translateY(-3px) rotate(-2deg)",
  "translateY(1px) rotate(1.3deg)",
  "translateY(-1px) rotate(-1deg)",
];


export function LoginPage() {
  const navigate = useNavigate();
  const { isLoading, login, session } = useAuth();
  const [username, setUsername] = useState("");
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
      <div className="login-layout">
        <section aria-label="관리자 로그인" className="login-card">
          <h1 aria-label="돈 세는 가계부" className="login-title">
            <span className="login-title-character" style={{ transform: titleTransforms[0] }}>
              돈
            </span>
            <span className="login-title-character" style={{ transform: titleTransforms[1] }}>
              {" "}
            </span>
            <span className="login-title-character" style={{ transform: titleTransforms[2] }}>
              <span className="login-title-correction">
                <span className="login-title-correction-base">새</span>
                <span aria-hidden="true" className="login-title-correction-mark" />
                <span className="login-title-correction-text">세</span>
              </span>
            </span>
            <span className="login-title-character" style={{ transform: titleTransforms[3] }}>
              는
            </span>
            <span className="login-title-character" style={{ transform: titleTransforms[4] }}>
              {" "}
            </span>
            <span className="login-title-character" style={{ transform: titleTransforms[5] }}>
              가
            </span>
            <span className="login-title-character" style={{ transform: titleTransforms[6] }}>
              계
            </span>
            <span className="login-title-character" style={{ transform: titleTransforms[0] }}>
              부
            </span>
          </h1>
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field">
              <span className="login-field-label">User ID</span>
              <span className="login-input-shell">
                <span aria-hidden="true" className="login-input-icon">
                  ID
                </span>
                <input
                  autoComplete="username"
                  className="login-input"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="admin"
                  value={username}
                />
              </span>
            </label>
            <label className="login-field">
              <span className="login-field-label">Password</span>
              <span className="login-input-shell">
                <span aria-hidden="true" className="login-input-icon">
                  PW
                </span>
                <input
                  autoComplete="current-password"
                  className="login-input"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="password"
                  type="password"
                  value={password}
                />
              </span>
            </label>
            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Loading..." : "Sign In"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
