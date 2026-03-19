import { useEffect, useState } from "react";

import {
  fetchTransactions,
  type TransactionRecord,
} from "../services/transactions";
import { InfoCard } from "../ui/InfoCard";
import { PageHero } from "../ui/PageHero";


const today = new Date().toISOString().slice(0, 10);
const defaultMonth = today.slice(0, 7);


function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}


export function TransactionsPage() {
  const [month, setMonth] = useState(defaultMonth);
  const [day, setDay] = useState("");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (day) {
      params.set("day", day);
    } else {
      params.set("month", month);
    }

    setIsLoading(true);
    setErrorMessage("");

    fetchTransactions(params)
      .then((nextTransactions) => {
        setTransactions(nextTransactions);
      })
      .catch(() => {
        setErrorMessage("거래 목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [day, month]);

  return (
    <div className="page">
      <PageHero
        eyebrow="Ticket 17"
        title="거래 목록과 입력 흐름"
        description="월별 또는 일별 기준으로 거래를 조회할 수 있는 목록 UI를 연결했습니다. 다음 단계에서는 생성/수정 폼을 이 화면에 결합하면 됩니다."
      />
      <div className="filter-panel">
        <label className="field">
          <span>월 조회</span>
          <input
            onChange={(event) => {
              setMonth(event.target.value);
              setDay("");
            }}
            type="month"
            value={month}
          />
        </label>
        <label className="field">
          <span>일 조회</span>
          <input
            max={today}
            onChange={(event) => setDay(event.target.value)}
            type="date"
            value={day}
          />
        </label>
      </div>
      <div className="card-grid">
        <InfoCard
          title="거래 목록"
          description={
            isLoading
              ? "거래를 불러오는 중입니다."
              : `${transactions.length}건 조회됨`
          }
        />
        <InfoCard
          title="거래 생성"
          description="POST /transactions"
        />
        <InfoCard
          title="거래 수정 및 삭제"
          description="PATCH /transactions/:id, DELETE /transactions/:id"
        />
      </div>
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      <section className="data-panel">
        <div className="data-panel-head">
          <h3>거래 내역</h3>
          <p>{day ? `${day} 기준` : `${month} 기준`}</p>
        </div>
        <div className="transaction-list">
          {transactions.length === 0 && !isLoading ? (
            <p className="empty-state">표시할 거래가 없습니다.</p>
          ) : null}
          {transactions.map((transaction) => (
            <article className="transaction-row" key={transaction.id}>
              <div>
                <strong>
                  {transaction.transaction_type === "income" ? "수입" : "지출"}
                </strong>
                <p>{transaction.description || "메모 없음"}</p>
              </div>
              <div className="transaction-meta">
                <span>{transaction.occurred_at.slice(0, 10)}</span>
                <strong>{formatCurrency(transaction.amount)}원</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
