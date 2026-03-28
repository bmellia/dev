import { useEffect, useState, type FormEvent } from "react";

import {
  createAccount,
  deactivateAccount,
  fetchAccounts,
  updateAccount,
  type Account,
} from "../services/accounts";
import {
  createCategory,
  deactivateCategory,
  fetchCategories,
  updateCategory,
  type Category,
} from "../services/categories";
import { apiBaseUrl } from "../config";
import { changePassword } from "../services/auth";
import { ApiError } from "../services/api";
import { InfoCard } from "../ui/InfoCard";
import { PageHero } from "../ui/PageHero";


const accountTypeOptions: Account["account_type"][] = [
  "cash",
  "bank",
  "card",
  "ewallet",
  "liability",
];

const categoryTypeOptions: Category["category_type"][] = ["income", "expense"];

function formatAccountTypeLabel(type: Account["account_type"]) {
  switch (type) {
    case "cash":
      return "현금";
    case "bank":
      return "은행";
    case "card":
      return "카드";
    case "ewallet":
      return "전자지갑";
    case "liability":
      return "부채";
    default:
      return type;
  }
}

function formatCategoryTypeLabel(type: Category["category_type"]) {
  return type === "income" ? "수입" : "지출";
}

export function SettingsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lastBackupAt, setLastBackupAt] = useState("");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<Account["account_type"]>("bank");
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<Category["category_type"]>("expense");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const activeAccounts = accounts.filter((account) => account.is_active);
  const inactiveAccounts = accounts.filter((account) => !account.is_active);
  const activeCategories = categories.filter((category) => category.is_active);
  const inactiveCategories = categories.filter((category) => !category.is_active);

  const loadData = async () => {
    try {
      const [nextAccounts, nextCategories] = await Promise.all([
        fetchAccounts(),
        fetchCategories(),
      ]);
      setAccounts(nextAccounts);
      setCategories(nextCategories);
      setLastBackupAt(new Date().toLocaleString("ko-KR"));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "설정 데이터를 불러오지 못했습니다.",
      );
    }
  };

  const handleDeactivateAccount = async (accountId: number) => {
    try {
      const account = accounts.find((item) => item.id === accountId);
      if (!account) {
        return;
      }

      if (account.is_active) {
        await deactivateAccount(accountId);
        setStatusMessage("계정을 비활성화했습니다.");
      } else {
        await updateAccount(accountId, { is_active: true });
        setStatusMessage("계정을 다시 활성화했습니다.");
      }
      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "계정 상태 변경에 실패했습니다.",
      );
    }
  };

  const handleDeactivateCategory = async (categoryId: number) => {
    try {
      const category = categories.find((item) => item.id === categoryId);
      if (!category) {
        return;
      }

      if (category.is_active) {
        await deactivateCategory(categoryId);
        setStatusMessage("카테고리를 비활성화했습니다.");
      } else {
        await updateCategory(categoryId, { is_active: true });
        setStatusMessage("카테고리를 다시 활성화했습니다.");
      }
      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "카테고리 상태 변경에 실패했습니다.",
      );
    }
  };

  useEffect(() => {
    setBiometricEnabled(window.localStorage.getItem("equity-ledger-biometric") === "true");
    void loadData();
  }, []);

  const toggleBiometric = () => {
    const nextValue = !biometricEnabled;
    setBiometricEnabled(nextValue);
    window.localStorage.setItem("equity-ledger-biometric", String(nextValue));
    setStatusMessage(
      nextValue ? "생체 인증 선호 설정을 켰습니다." : "생체 인증 선호 설정을 껐습니다.",
    );
  };

  const handleAccountSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (editingAccountId === null) {
        await createAccount({ name: accountName, account_type: accountType });
      } else {
        await updateAccount(editingAccountId, {
          name: accountName,
          account_type: accountType,
        });
      }

      setAccountName("");
      setAccountType("bank");
      setEditingAccountId(null);
      setStatusMessage("계정을 저장했습니다.");
      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "계정 저장에 실패했습니다.",
      );
    }
  };

  const handleCategorySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (editingCategoryId === null) {
        await createCategory({ name: categoryName, category_type: categoryType });
      } else {
        await updateCategory(editingCategoryId, {
          name: categoryName,
          category_type: categoryType,
        });
      }

      setCategoryName("");
      setCategoryType("expense");
      setEditingCategoryId(null);
      setStatusMessage("카테고리를 저장했습니다.");
      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "카테고리 저장에 실패했습니다.",
      );
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setErrorMessage("");
      setStatusMessage("비밀번호를 변경했습니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "비밀번호 변경에 실패했습니다.",
      );
    }
  };

  return (
    <div className="page">
      <PageHero
        eyebrow="설정"
        title="운영 관리"
        description="프로필, 기준 데이터, 백업, 보안 설정을 한 화면에서 정리하는 관리 콘솔입니다."
      />
      <div className="toolbar-row">
        <p className="toolbar-copy">운영 관리와 백업 작업을 한곳에서 정리합니다.</p>
        <button className="primary-button" onClick={() => void loadData()} type="button">
          새로고침
        </button>
      </div>
      <div className="card-grid">
        <InfoCard
          title="프로필"
          description="단일 관리자"
          body={
            <div className="profile-card">
              <div className="profile-avatar">관</div>
              <div className="profile-copy">
                <strong>{accounts.length > 0 ? "운영 워크스페이스" : "초기 설정 단계"}</strong>
                <p>{biometricEnabled ? "생체 인증 선호 켜짐" : "생체 인증 선호 꺼짐"}</p>
              </div>
            </div>
          }
        />
        <InfoCard
          title="계정"
          description={`${accounts.length}개`}
          body={
            <div className="compact-list">
              <div className="compact-row">
                <span>활성</span>
                <strong>{activeAccounts.length}</strong>
              </div>
              <div className="compact-row">
                <span>보관</span>
                <strong>{inactiveAccounts.length}</strong>
              </div>
            </div>
          }
        />
        <InfoCard
          title="카테고리"
          description={`${categories.length}개`}
          body={
            <div className="compact-list">
              <div className="compact-row">
                <span>활성</span>
                <strong>{activeCategories.length}</strong>
              </div>
              <div className="compact-row">
                <span>보관</span>
                <strong>{inactiveCategories.length}</strong>
              </div>
            </div>
          }
        />
        <InfoCard
          title="데이터 및 백업"
          description={lastBackupAt ? `마지막 새로고침: ${lastBackupAt}` : "백업 상태 미확인"}
          footer={
            <a
              className="primary-link"
              href={`${apiBaseUrl}/exports/transactions.csv`}
              rel="noreferrer"
              target="_blank"
            >
              CSV 내보내기
            </a>
          }
        />
      </div>
      {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      <div className="settings-grid">
        <section className="data-panel">
          <div className="data-panel-head">
            <h3>계정 관리</h3>
            <p>{editingAccountId ? "수정 모드" : "생성 모드"}</p>
          </div>
          <form className="stack-form" onSubmit={handleAccountSubmit}>
            <label className="field">
              <span>Account name</span>
              <input
                onChange={(event) => setAccountName(event.target.value)}
                value={accountName}
              />
            </label>
            <label className="field">
              <span>계정 유형</span>
              <select
                onChange={(event) =>
                  setAccountType(event.target.value as Account["account_type"])
                }
                value={accountType}
              >
                {accountTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatAccountTypeLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="submit">
              {editingAccountId ? "계정 수정" : "계정 추가"}
            </button>
            {editingAccountId ? (
              <button
                className="ghost-button ghost-button-light"
                onClick={() => {
                  setEditingAccountId(null);
                  setAccountName("");
                  setAccountType("bank");
                }}
                type="button"
              >
                취소
              </button>
            ) : null}
          </form>
          <div className="transaction-list">
            {accounts.map((account) => (
              <article className="transaction-row" key={account.id}>
                <div>
                  <strong>{account.name}</strong>
                  <p>
                    {formatAccountTypeLabel(account.account_type)} · {account.is_active ? "활성" : "보관"}
                  </p>
                </div>
                <div className="action-row">
                  <button
                    className="ghost-button"
                    onClick={() => {
                      setEditingAccountId(account.id);
                      setAccountName(account.name);
                      setAccountType(account.account_type);
                    }}
                    type="button"
                  >
                    수정
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => void handleDeactivateAccount(account.id)}
                    type="button"
                  >
                    {account.is_active ? "보관" : "복원"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="data-panel">
          <div className="data-panel-head">
            <h3>카테고리 관리</h3>
            <p>{editingCategoryId ? "수정 모드" : "생성 모드"}</p>
          </div>
          <form className="stack-form" onSubmit={handleCategorySubmit}>
            <label className="field">
              <span>카테고리명</span>
              <input
                onChange={(event) => setCategoryName(event.target.value)}
                value={categoryName}
              />
            </label>
            <label className="field">
              <span>카테고리 유형</span>
              <select
                onChange={(event) =>
                  setCategoryType(event.target.value as Category["category_type"])
                }
                value={categoryType}
              >
                {categoryTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatCategoryTypeLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="submit">
              {editingCategoryId ? "카테고리 수정" : "카테고리 추가"}
            </button>
            {editingCategoryId ? (
              <button
                className="ghost-button ghost-button-light"
                onClick={() => {
                  setEditingCategoryId(null);
                  setCategoryName("");
                  setCategoryType("expense");
                }}
                type="button"
              >
                취소
              </button>
            ) : null}
          </form>
          <div className="transaction-list">
            {categories.map((category) => (
              <article className="transaction-row" key={category.id}>
                <div>
                  <strong>{category.name}</strong>
                  <p>
                    {formatCategoryTypeLabel(category.category_type)} · {category.is_active ? "활성" : "보관"}
                  </p>
                </div>
                <div className="action-row">
                  <button
                    className="ghost-button"
                    onClick={() => {
                      setEditingCategoryId(category.id);
                      setCategoryName(category.name);
                      setCategoryType(category.category_type);
                    }}
                    type="button"
                  >
                    수정
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => void handleDeactivateCategory(category.id)}
                    type="button"
                  >
                    {category.is_active ? "보관" : "복원"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="data-panel">
          <div className="data-panel-head">
            <h3>보안</h3>
            <p>비밀번호와 기기 선호 설정</p>
          </div>
          <div className="security-toggle">
            <div>
              <strong>생체 인증</strong>
              <p className="toolbar-copy">로컬 선호 설정만 저장합니다.</p>
            </div>
            <button
              className={biometricEnabled ? "primary-button" : "ghost-button ghost-button-light"}
              onClick={toggleBiometric}
              type="button"
            >
              {biometricEnabled ? "켜짐" : "꺼짐"}
            </button>
          </div>
          <form className="stack-form" onSubmit={handlePasswordSubmit}>
            <label className="field">
              <span>현재 비밀번호</span>
              <input
                onChange={(event) => setCurrentPassword(event.target.value)}
                type="password"
                value={currentPassword}
              />
            </label>
            <label className="field">
              <span>새 비밀번호</span>
              <input
                minLength={8}
                onChange={(event) => setNewPassword(event.target.value)}
                type="password"
                value={newPassword}
              />
            </label>
            <button className="primary-button" type="submit">
              비밀번호 변경
            </button>
          </form>
        </section>
        <section className="data-panel">
          <div className="data-panel-head">
            <h3>운영 가이드</h3>
            <p>백업 / 배포</p>
          </div>
          <div className="info-stack">
            <p className="empty-state">
              단일 관리자 운영 기준입니다. 배포 전에 관리자 비밀번호와 세션 환경 변수를 먼저 점검하세요.
            </p>
            <div className="guide-callout">
              <strong>권장 백업 순서</strong>
              <ol className="guide-list">
                <li>이 화면에서 거래 CSV를 먼저 내려받습니다.</li>
                <li>MariaDB 볼륨 또는 dump를 별도로 백업합니다.</li>
                <li>복구 절차를 runbook 기준으로 주기적으로 점검합니다.</li>
              </ol>
            </div>
            <div className="guide-callout">
              <strong>데모 데이터</strong>
              <p>
                실행 중인 compose 환경에서 <code>/data/dev/scripts/seed-demo-data.sh</code>를
                실행하면 샘플 거래를 채울 수 있습니다. 기존 거래가 있으면 자동으로 건너뜁니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
