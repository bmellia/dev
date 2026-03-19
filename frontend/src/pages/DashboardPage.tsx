import { useCallback, useEffect, useState } from "react";

import { ApiError } from "../services/api";
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
import { PageHero } from "../ui/PageHero";
import { SummaryStat } from "../ui/SummaryStat";


const currentMonth = new Date().toISOString().slice(0, 7);


function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}


function formatTransactionType(type: TransactionRecord["transaction_type"]) {
  return type === "income" ? "수입" : "지출";
}


export function DashboardPage() {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
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
      const [nextSummary, nextAccounts, nextTransactions] = await Promise.all([
        fetchMonthlySummary(currentMonth),
        fetchAccountSummaries(),
        fetchTransactions(params),
      ]);
      setSummary(nextSummary);
      setAccounts(nextAccounts);
      setRecentTransactions(nextTransactions.slice(0, 5));
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
      <PageHero
        eyebrow="Ticket 16"
        title="월간 대시보드"
        description="월간 수입, 지출, 순합계와 계정별 잔액, 최근 거래를 한 화면에서 확인할 수 있도록 API를 연결했습니다."
      />
      <div className="toolbar-row">
        <p className="toolbar-copy">{currentMonth} 기준 요약</p>
        <button className="primary-button" onClick={() => void loadDashboard()} type="button">
          {isLoading ? "새로고침 중..." : "새로고침"}
        </button>
      </div>
      <div className="card-grid">
        <InfoCard
          title="월간 요약"
          description={
            isLoading
              ? "월간 요약을 불러오는 중입니다."
              : summary
              ? "수입, 지출, 순합계를 빠르게 확인합니다."
              : "표시할 월간 요약이 없습니다."
          }
          body={
            summary ? (
              <div className="summary-grid">
                <SummaryStat
                  label="수입"
                  tone="positive"
                  value={`${formatCurrency(summary.income_total)}원`}
                />
                <SummaryStat
                  label="지출"
                  tone="negative"
                  value={`${formatCurrency(summary.expense_total)}원`}
                />
                <SummaryStat
                  label="순합계"
                  tone={summary.net_total >= 0 ? "positive" : "negative"}
                  value={`${formatCurrency(summary.net_total)}원`}
                />
              </div>
            ) : null
          }
        />
        <InfoCard
          title="계정 요약"
          description={
            isLoading
              ? "계정 요약을 불러오는 중입니다."
              : accounts.length > 0
              ? "잔액이 큰 순서로 일부 계정을 먼저 보여줍니다."
              : "표시할 계정 요약이 없습니다."
          }
          body={
            accounts.length > 0 ? (
              <div className="compact-list">
                {accounts.slice(0, 4).map((account) => (
                  <div className="compact-row" key={account.account_id}>
                    <span>{account.name}</span>
                    <strong>{formatCurrency(account.balance)}원</strong>
                  </div>
                ))}
              </div>
            ) : null
          }
        />
        <InfoCard
          title="최근 거래"
          description={
            isLoading
              ? "최근 거래를 불러오는 중입니다."
              : recentTransactions.length > 0
              ? "가장 최근 거래 5건을 보여줍니다."
              : "최근 거래가 없습니다."
          }
          body={
            recentTransactions.length > 0 ? (
              <div className="compact-list">
                {recentTransactions.map((transaction) => (
                  <div className="compact-row" key={transaction.id}>
                    <span>
                      {formatTransactionType(transaction.transaction_type)}
                      {" · "}
                      {transaction.occurred_at.slice(5, 10)}
                    </span>
                    <strong>{formatCurrency(transaction.amount)}원</strong>
                  </div>
                ))}
              </div>
            ) : null
          }
        />
      </div>
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
    </div>
  );
}
