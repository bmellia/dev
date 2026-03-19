import { useEffect, useState } from "react";

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


const currentMonth = new Date().toISOString().slice(0, 7);


function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}


export function DashboardPage() {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<
    TransactionRecord[]
  >([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ month: currentMonth });

    Promise.all([
      fetchMonthlySummary(currentMonth),
      fetchAccountSummaries(),
      fetchTransactions(params),
    ])
      .then(([nextSummary, nextAccounts, nextTransactions]) => {
        setSummary(nextSummary);
        setAccounts(nextAccounts);
        setRecentTransactions(nextTransactions.slice(0, 5));
      })
      .catch(() => {
        setErrorMessage("대시보드 데이터를 불러오지 못했습니다.");
      });
  }, []);

  return (
    <div className="page">
      <PageHero
        eyebrow="Ticket 16"
        title="월간 대시보드"
        description="월간 수입, 지출, 순합계와 계정별 잔액, 최근 거래를 한 화면에서 확인할 수 있도록 API를 연결했습니다."
      />
      <div className="card-grid">
        <InfoCard
          title="월간 요약"
          description={
            summary
              ? `수입 ${formatCurrency(summary.income_total)}원 · 지출 ${formatCurrency(summary.expense_total)}원 · 순합계 ${formatCurrency(summary.net_total)}원`
              : "월간 요약을 불러오는 중입니다."
          }
        />
        <InfoCard
          title="계정 요약"
          description={
            accounts.length > 0
              ? accounts
                  .slice(0, 3)
                  .map(
                    (account) =>
                      `${account.name} ${formatCurrency(account.balance)}원`,
                  )
                  .join(" · ")
              : "계정 요약을 불러오는 중입니다."
          }
        />
        <InfoCard
          title="최근 거래"
          description={
            recentTransactions.length > 0
              ? recentTransactions
                  .map(
                    (transaction) =>
                      `${transaction.transaction_type === "income" ? "수입" : "지출"} ${formatCurrency(transaction.amount)}원`,
                  )
                  .join(" · ")
              : "최근 거래를 불러오는 중입니다."
          }
        />
      </div>
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
    </div>
  );
}
