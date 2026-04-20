import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function getMonthLabel(month: string) {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString("ko-KR", {
    month: "long",
    year: "numeric",
  });
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildCalendarDays(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const cells = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(null);
  }

  for (let date = 1; date <= daysInMonth; date += 1) {
    cells.push(new Date(year, monthIndex, date));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function groupTotalsByDay(transactions: TransactionRecord[]) {
  const totals = new Map<
    string,
    { income: number; expense: number; transactions: TransactionRecord[] }
  >();

  transactions.forEach((transaction) => {
    const key = transaction.occurred_at.slice(0, 10);
    const existing = totals.get(key) ?? {
      income: 0,
      expense: 0,
      transactions: [],
    };

    if (transaction.transaction_type === "income") {
      existing.income += transaction.amount;
    } else {
      existing.expense += transaction.amount;
    }

    existing.transactions.push(transaction);
    totals.set(key, existing);
  });

  return totals;
}

function formatSignedAmount(transaction: TransactionRecord) {
  const prefix = transaction.transaction_type === "income" ? "+" : "-";
  return `${prefix}${formatCurrency(transaction.amount)}원`;
}

function shiftMonth(month: string, diff: number) {
  const date = new Date(`${month}-01T00:00:00`);
  date.setMonth(date.getMonth() + diff);
  return date.toISOString().slice(0, 7);
}

export function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const defaultSelectedDate =
      today.startsWith(month) ? today : `${month}-01`;
    setSelectedDate(defaultSelectedDate);
  }, [month, today]);

  useEffect(() => {
    const params = new URLSearchParams({ month });
    setIsLoading(true);
    setErrorMessage("");

    Promise.all([
      fetchMonthlySummary(month),
      fetchAccountSummaries(),
      fetchTransactions(params),
    ])
      .then(([nextSummary, nextAccounts, nextTransactions]) => {
        setSummary(nextSummary);
        setAccounts(nextAccounts.filter((account) => account.is_active));
        setTransactions(nextTransactions);
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "캘린더 데이터를 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [month]);

  const calendarDays = buildCalendarDays(month);
  const groupedTotals = groupTotalsByDay(transactions);
  const selectedDayData = groupedTotals.get(selectedDate);
  const budgetLeft =
    (summary?.income_total ?? 0) - (summary?.expense_total ?? 0);

  return (
    <div className="page page-calendar-ledger">
      <header className="calendar-page-hero fade-in-up">
        <div>
          <p className="calendar-page-kicker">한글 캘린더 가계부</p>
          <h2>{getMonthLabel(month)}</h2>
          <p>날짜별 수입과 지출을 한눈에 확인하고 바로 입력 화면으로 이어집니다.</p>
        </div>
        <div className="calendar-page-hero-actions">
          <Link className="ghost-link" to="/analysis">
            월 흐름 보기
          </Link>
          <Link className="primary-link" to={`/transactions?day=${today}`}>
            오늘 작성하기
          </Link>
        </div>
      </header>

      <section className="calendar-summary-strip fade-in-up fade-in-up-delay-1">
        <article className="calendar-summary-card calendar-summary-card-income">
          <span>총 수입</span>
          <strong>{formatCurrency(summary?.income_total ?? 0)}원</strong>
        </article>
        <article className="calendar-summary-card calendar-summary-card-expense">
          <span>총 지출</span>
          <strong>{formatCurrency(summary?.expense_total ?? 0)}원</strong>
        </article>
        <article className="calendar-summary-card">
          <span>잔여 예산</span>
          <strong>{formatCurrency(budgetLeft)}원</strong>
        </article>
      </section>

      <section className="calendar-board fade-in-up fade-in-up-delay-2">
        <div className="calendar-board-head">
          <div className="calendar-board-nav">
            <button
              className="ghost-button ghost-button-light"
              onClick={() => setMonth(shiftMonth(month, -1))}
              type="button"
            >
              이전
            </button>
            <strong>{getMonthLabel(month)}</strong>
            <button
              className="ghost-button ghost-button-light"
              onClick={() => setMonth(shiftMonth(month, 1))}
              type="button"
            >
              다음
            </button>
          </div>
          <button
            className="ghost-button ghost-button-light"
            onClick={() => setMonth(today.slice(0, 7))}
            type="button"
          >
            이번 달
          </button>
        </div>
        <div className="calendar-weekdays" aria-hidden="true">
          {["일", "월", "화", "수", "목", "금", "토"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div className="calendar-day calendar-day-empty" key={`empty-${index}`} />;
            }

            const key = getDateKey(date);
            const totals = groupedTotals.get(key);
            const isToday = key === today;
            const isSelected = key === selectedDate;

            return (
              <button
                className={
                  isSelected
                    ? "calendar-day calendar-day-selected"
                    : isToday
                      ? "calendar-day calendar-day-today"
                      : "calendar-day"
                }
                key={key}
                onClick={() => setSelectedDate(key)}
                type="button"
              >
                <span className="calendar-day-number">{date.getDate()}</span>
                <span className="calendar-day-income">
                  {totals?.income ? `+${formatCurrency(totals.income)}` : ""}
                </span>
                <span className="calendar-day-expense">
                  {totals?.expense ? `-${formatCurrency(totals.expense)}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="calendar-sheet fade-in-up fade-in-up-delay-3">
        <div className="calendar-sheet-head">
          <div>
            <p className="calendar-sheet-kicker">선택한 날짜</p>
            <h3>{selectedDate}</h3>
          </div>
          <Link className="primary-link" to={`/transactions?day=${selectedDate}`}>
            상세 추가
          </Link>
        </div>
        <div className="calendar-sheet-summary">
          <div>
            <span>수입</span>
            <strong>{formatCurrency(selectedDayData?.income ?? 0)}원</strong>
          </div>
          <div>
            <span>지출</span>
            <strong>{formatCurrency(selectedDayData?.expense ?? 0)}원</strong>
          </div>
          <div>
            <span>건수</span>
            <strong>{selectedDayData?.transactions.length ?? 0}건</strong>
          </div>
        </div>
        <div className="calendar-sheet-list">
          {selectedDayData?.transactions.length ? (
            selectedDayData.transactions
              .slice()
              .sort((left, right) => right.occurred_at.localeCompare(left.occurred_at))
              .map((transaction) => (
                <article className="calendar-sheet-item" key={transaction.id}>
                  <div>
                    <strong>{transaction.description || "거래 메모 없음"}</strong>
                    <p>{transaction.occurred_at.slice(11, 16)}</p>
                  </div>
                  <strong
                    className={
                      transaction.transaction_type === "income"
                        ? "amount-income"
                        : "amount-expense"
                    }
                  >
                    {formatSignedAmount(transaction)}
                  </strong>
                </article>
              ))
          ) : (
            <div className="empty-state-block">
              <p className="empty-state">선택한 날짜에 등록된 거래가 없습니다.</p>
              <Link className="ghost-link ghost-link-block" to={`/transactions?day=${selectedDate}`}>
                이 날짜에 입력하기
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="calendar-account-strip fade-in-up fade-in-up-delay-3">
        <div className="calendar-sheet-head">
          <div>
            <p className="calendar-sheet-kicker">자산 현황</p>
            <h3>계정별 잔액</h3>
          </div>
          <Link className="ghost-link" to="/settings">
            계정 관리
          </Link>
        </div>
        <div className="calendar-account-list">
          {accounts.length ? (
            accounts.map((account) => (
              <article className="calendar-account-item" key={account.account_id}>
                <div>
                  <strong>{account.name}</strong>
                  <p>{account.account_type}</p>
                </div>
                <strong>{formatCurrency(account.balance)}원</strong>
              </article>
            ))
          ) : (
            <p className="empty-state">등록된 계정이 없습니다.</p>
          )}
        </div>
      </section>

      <Link className="calendar-fab" to={`/transactions?day=${today}`}>
        작성하기 +
      </Link>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {isLoading ? <p className="toolbar-copy">캘린더를 불러오는 중입니다.</p> : null}
    </div>
  );
}
