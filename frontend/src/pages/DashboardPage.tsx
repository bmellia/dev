import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ApiError } from "../services/api";
import { fetchCategories, type Category } from "../services/categories";
import {
  fetchAccountSummaries,
  fetchMonthlySummary,
  type AccountSummary,
  type MonthlySummary,
} from "../services/dashboard";
import {
  fetchTransactions,
  type TransactionRecord,
} from "../services/transactions";
import { InfoCard } from "../ui/InfoCard";
import { SummaryStat } from "../ui/SummaryStat";


const currentMonth = new Date().toISOString().slice(0, 7);


function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatAccountType(type: AccountSummary["account_type"]) {
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


function formatTransactionType(type: TransactionRecord["transaction_type"]) {
  return type === "income" ? "수입" : "지출";
}


export function DashboardPage() {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<
    TransactionRecord[]
  >([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    const params = new URLSearchParams({ month: currentMonth });
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [nextSummary, nextAccounts, nextTransactions, nextCategories] = await Promise.all([
        fetchMonthlySummary(currentMonth),
        fetchAccountSummaries(),
        fetchTransactions(params),
        fetchCategories(),
      ]);
      setSummary(nextSummary);
      setAccounts(nextAccounts);
      setRecentTransactions(nextTransactions.slice(0, 5));
      setCategories(nextCategories);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "대시보드 데이터를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-kicker">{currentMonth} 기준</p>
          <h2 className="dashboard-title">자산 현황</h2>
          <p className="dashboard-description">
            이번 달 흐름과 최근 활동을 빠르게 훑을 수 있는 최소 대시보드입니다.
          </p>
        </div>
        <div className="toolbar-actions">
          <Link className="ghost-link" to="/transactions">
            거래 보기
          </Link>
          <Link className="ghost-link" to="/analysis">
            분석 보기
          </Link>
          <Link className="ghost-link" to="/settings">
            설정
          </Link>
          <button className="primary-button" onClick={() => void loadDashboard()} type="button">
            {isLoading ? "새로고침 중..." : "새로고침"}
          </button>
        </div>
      </header>
      <section className="dashboard-summary-strip" aria-label="월간 요약">
        <SummaryStat
          label="수입"
          tone="positive"
          value={`${formatCurrency(summary?.income_total ?? 0)}원`}
        />
        <SummaryStat
          label="지출"
          tone="negative"
          value={`${formatCurrency(summary?.expense_total ?? 0)}원`}
        />
        <SummaryStat
          label="순합계"
          tone={(summary?.net_total ?? 0) >= 0 ? "positive" : "negative"}
          value={`${formatCurrency(summary?.net_total ?? 0)}원`}
        />
      </section>
      <div className="dashboard-grid">
        <InfoCard
          title="계정 자산"
          description={
            isLoading
              ? "계정 잔액을 불러오는 중입니다."
              : accounts.length > 0
              ? "현재 잔액을 계정 단위로 바로 확인합니다."
              : "등록된 계정이 없습니다."
          }
          body={
            accounts.length > 0 ? (
              <div className="asset-grid">
                {accounts.slice(0, 4).map((account) => (
                  <div className="asset-card" key={account.account_id}>
                    <span className="asset-card-label">{formatAccountType(account.account_type)}</span>
                    <strong>{account.name}</strong>
                    <p>{formatCurrency(account.balance)}원</p>
                  </div>
                ))}
              </div>
            ) : !isLoading ? (
              <div className="empty-state-block">
                <p className="empty-state">아직 계정이 없습니다.</p>
                <Link className="ghost-link ghost-link-block" to="/settings">
                  계정 만들기
                </Link>
              </div>
            ) : null
          }
        />
        <InfoCard
          title="최근 활동"
          description={
            isLoading
              ? "최근 거래를 불러오는 중입니다."
              : recentTransactions.length > 0
              ? "마지막 5건을 카테고리와 함께 보여줍니다."
              : "최근 거래가 없습니다."
          }
          body={
            recentTransactions.length > 0 ? (
              <div className="compact-list">
                {recentTransactions.map((transaction) => (
                  <div className="activity-row" key={transaction.id}>
                    <span className={`activity-icon activity-icon-${transaction.transaction_type}`}>
                      {transaction.transaction_type === "income" ? "+" : "-"}
                    </span>
                    <div className="activity-copy">
                      <strong>
                        {categories.find((category) => category.id === transaction.category_id)?.name ??
                          formatTransactionType(transaction.transaction_type)}
                      </strong>
                      <p>{transaction.description || transaction.occurred_at.slice(5, 10)}</p>
                    </div>
                    <strong>{formatCurrency(transaction.amount)}원</strong>
                  </div>
                ))}
              </div>
            ) : !isLoading ? (
              <div className="empty-state-block">
                <p className="empty-state">아직 최근 활동이 없습니다.</p>
                <Link className="primary-link" to="/transactions">
                  첫 거래 입력
                </Link>
              </div>
            ) : null
          }
        />
        <InfoCard
          title="빠른 이동"
          description="빠른 입력, 분석, 설정 이동을 한 줄에 모았습니다."
          body={
            <div className="quick-link-grid">
              <Link className="primary-link" to="/transactions">
                거래 입력
              </Link>
              <Link className="ghost-link ghost-link-block" to="/analysis">
                분석 보기
              </Link>
              <Link className="ghost-link ghost-link-block" to="/settings">
                설정 관리
              </Link>
            </div>
          }
        />
      </div>
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
    </div>
  );
}
