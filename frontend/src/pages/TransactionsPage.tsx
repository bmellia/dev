import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { ApiError } from "../services/api";
import { fetchAccounts, type Account } from "../services/accounts";
import { fetchCategories, type Category } from "../services/categories";
import {
  createTransaction,
  deleteTransaction,
  fetchTransactions,
  type TransactionRecord,
} from "../services/transactions";

type DraftRow = {
  id: string;
  occurredAt: string;
  transactionType: TransactionRecord["transaction_type"];
  accountId: string;
  categoryId: string;
  amount: string;
  merchant: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function normalizeAmountInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

function formatAmountInput(value: string) {
  if (!value) {
    return "";
  }

  return new Intl.NumberFormat("ko-KR").format(Number(value));
}

function createDraftRow(
  date: string,
  transactionType: TransactionRecord["transaction_type"],
  accountId = "",
): DraftRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    occurredAt: date,
    transactionType,
    accountId,
    categoryId: "",
    amount: "",
    merchant: "",
  };
}

function getMonthLabel(day: string) {
  return new Date(`${day}T00:00:00`).toLocaleDateString("ko-KR", {
    month: "long",
    year: "numeric",
  });
}

export function TransactionsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDay = searchParams.get("day") ?? today;
  const [selectedDate, setSelectedDate] = useState(initialDay);
  const [transactionType, setTransactionType] =
    useState<TransactionRecord["transaction_type"]>("expense");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const currentMonth = selectedDate.slice(0, 7);

  useEffect(() => {
    const next = new URLSearchParams();
    next.set("day", selectedDate);
    setSearchParams(next);
  }, [selectedDate, setSearchParams]);

  useEffect(() => {
    Promise.all([fetchAccounts(), fetchCategories()])
      .then(([nextAccounts, nextCategories]) => {
        const activeAccounts = nextAccounts.filter((item) => item.is_active);
        const activeCategories = nextCategories.filter((item) => item.is_active);
        setAccounts(activeAccounts);
        setCategories(activeCategories);
        setAccountId((current) => current || String(activeAccounts[0]?.id ?? ""));
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "거래 입력용 기준 데이터를 불러오지 못했습니다.",
        );
      });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage("");
    fetchTransactions(new URLSearchParams({ month: currentMonth }))
      .then((nextTransactions) => {
        setTransactions(nextTransactions);
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "거래 목록을 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentMonth]);

  useEffect(() => {
    setCategoryId("");
  }, [transactionType]);

  const filteredCategories = categories.filter(
    (item) => item.category_type === transactionType,
  );
  const selectedDayTransactions = transactions
    .filter((transaction) => transaction.occurred_at.slice(0, 10) === selectedDate)
    .sort((left, right) => right.occurred_at.localeCompare(left.occurred_at));

  const selectedDayIncome = selectedDayTransactions.reduce((sum, transaction) => {
    if (transaction.transaction_type === "income") {
      return sum + transaction.amount;
    }

    return sum;
  }, 0);
  const selectedDayExpense = selectedDayTransactions.reduce((sum, transaction) => {
    if (transaction.transaction_type === "expense") {
      return sum + transaction.amount;
    }

    return sum;
  }, 0);

  const queueIncome = draftRows.reduce((sum, row) => {
    if (row.transactionType === "income") {
      return sum + Number(row.amount || 0);
    }

    return sum;
  }, 0);
  const queueExpense = draftRows.reduce((sum, row) => {
    if (row.transactionType === "expense") {
      return sum + Number(row.amount || 0);
    }

    return sum;
  }, 0);

  const canSubmit = accounts.length > 0;

  const handleAddDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (!accountId || Number(amount) <= 0) {
      setErrorMessage("계정과 1원 이상의 금액을 입력하세요.");
      return;
    }

    const nextRow = createDraftRow(selectedDate, transactionType, accountId);
    nextRow.categoryId = categoryId;
    nextRow.amount = amount;
    nextRow.merchant = merchant.trim();

    setDraftRows((current) => [nextRow, ...current]);
    setCategoryId("");
    setMerchant("");
    setAmount("");
    setStatusMessage("입력 대기 목록에 추가했습니다.");
  };

  const handleDraftChange = (
    rowId: string,
    key: keyof DraftRow,
    value: string,
  ) => {
    setDraftRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [key]: key === "amount" ? normalizeAmountInput(value) : value,
            }
          : row,
      ),
    );
  };

  const handleAddSpreadsheetRow = () => {
    setDraftRows((current) => [
      ...current,
      createDraftRow(selectedDate, transactionType, accountId),
    ]);
    setIsDetailMode(true);
  };

  const handleSaveDrafts = async () => {
    setErrorMessage("");
    setStatusMessage("");

    if (draftRows.length === 0) {
      setErrorMessage("저장할 항목이 없습니다.");
      return;
    }

    const hasInvalidRow = draftRows.some(
      (row) => !row.accountId || !row.occurredAt || Number(row.amount) <= 0,
    );

    if (hasInvalidRow) {
      setErrorMessage("모든 행에 날짜, 계정, 금액을 올바르게 입력하세요.");
      setIsDetailMode(true);
      return;
    }

    setIsSaving(true);

    try {
      for (const row of draftRows) {
        await createTransaction({
          occurred_at: `${row.occurredAt}T09:00:00`,
          transaction_type: row.transactionType,
          account_id: Number(row.accountId),
          category_id: row.categoryId ? Number(row.categoryId) : null,
          amount: Number(row.amount),
          description: row.merchant.trim() || null,
        });
      }

      setDraftRows([]);
      setStatusMessage(`${draftRows.length}건을 저장했습니다.`);
      const nextTransactions = await fetchTransactions(
        new URLSearchParams({ month: currentMonth }),
      );
      setTransactions(nextTransactions);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "다중 거래 저장에 실패했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const categoryOptionsByType = (
    type: TransactionRecord["transaction_type"],
  ) => categories.filter((item) => item.category_type === type);

  return (
    <div className="page page-batch-entry">
      <header className="batch-entry-hero fade-in-up">
        <div>
          <p className="calendar-page-kicker">다중 거래 내역 입력</p>
          <h2>{selectedDate}</h2>
          <p>{getMonthLabel(selectedDate)} 거래를 빠르게 쌓고, 필요하면 스프레드시트 뷰로 확장합니다.</p>
        </div>
        <div className="calendar-page-hero-actions">
          <Link className="ghost-link" to="/">
            캘린더로 돌아가기
          </Link>
          <button
            className="primary-button"
            onClick={() => setIsDetailMode((current) => !current)}
            type="button"
          >
            {isDetailMode ? "간단 입력 보기" : "상세 추가"}
          </button>
        </div>
      </header>

      <section className="batch-entry-overview fade-in-up fade-in-up-delay-1">
        <article className="calendar-summary-card calendar-summary-card-income">
          <span>오늘 수입</span>
          <strong>{formatCurrency(selectedDayIncome)}원</strong>
        </article>
        <article className="calendar-summary-card calendar-summary-card-expense">
          <span>오늘 지출</span>
          <strong>{formatCurrency(selectedDayExpense)}원</strong>
        </article>
        <article className="calendar-summary-card">
          <span>입력 대기</span>
          <strong>{draftRows.length}건</strong>
        </article>
      </section>

      <section className="batch-sheet fade-in-up fade-in-up-delay-2">
        <div className="calendar-sheet-head">
          <div>
            <p className="calendar-sheet-kicker">입력 기준일</p>
            <h3>{selectedDate}</h3>
          </div>
          <label className="field field-inline">
            <span>날짜</span>
            <input
              max={today}
              onChange={(event) => setSelectedDate(event.target.value)}
              type="date"
              value={selectedDate}
            />
          </label>
        </div>

        <div className="draft-pill-list">
          {draftRows.length ? (
            draftRows.map((row) => (
              <article className="draft-pill-card" key={row.id}>
                <div>
                  <strong>{row.merchant || "사용처 미입력"}</strong>
                  <p>
                    {row.transactionType === "income" ? "수입" : "지출"} ·{" "}
                    {formatAmountInput(row.amount) || "0"}원
                  </p>
                </div>
                <button
                  className="ghost-button"
                  onClick={() =>
                    setDraftRows((current) => current.filter((item) => item.id !== row.id))
                  }
                  type="button"
                >
                  제거
                </button>
              </article>
            ))
          ) : (
            <p className="empty-state">아직 추가된 거래가 없습니다.</p>
          )}
        </div>
      </section>

      <div className="batch-entry-layout fade-in-up fade-in-up-delay-3">
        <form className="batch-entry-quick-form" onSubmit={handleAddDraft}>
          <div className="data-panel-head">
            <div>
              <h3>빠른 입력</h3>
              <p>하단 시트처럼 필요한 항목만 빠르게 추가합니다.</p>
            </div>
          </div>

          {!canSubmit ? (
            <div className="guide-callout">
              <strong>계정이 필요합니다.</strong>
              <p>거래 저장을 위해 설정에서 계정을 먼저 추가해야 합니다.</p>
              <Link className="primary-link" to="/settings">
                설정 열기
              </Link>
            </div>
          ) : null}

          <div className="transaction-type-toggle" role="tablist" aria-label="거래 유형">
            <button
              className={
                transactionType === "expense"
                  ? "transaction-type-option transaction-type-option-active"
                  : "transaction-type-option"
              }
              onClick={() => setTransactionType("expense")}
              type="button"
            >
              지출
            </button>
            <button
              className={
                transactionType === "income"
                  ? "transaction-type-option transaction-type-option-active"
                  : "transaction-type-option"
              }
              onClick={() => setTransactionType("income")}
              type="button"
            >
              수입
            </button>
          </div>

          <label className="field">
            <span>금액</span>
            <input
              inputMode="numeric"
              onChange={(event) => setAmount(normalizeAmountInput(event.target.value))}
              placeholder="0"
              value={formatAmountInput(amount)}
            />
          </label>

          <label className="field">
            <span>카테고리</span>
            <select
              onChange={(event) => setCategoryId(event.target.value)}
              value={categoryId}
            >
              <option value="">선택 안 함</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>사용처</span>
            <input
              onChange={(event) => setMerchant(event.target.value)}
              placeholder="예: 스타벅스"
              value={merchant}
            />
          </label>

          <label className="field">
            <span>계정</span>
            <select
              onChange={(event) => setAccountId(event.target.value)}
              value={accountId}
            >
              <option value="">선택</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>

          <div className="quick-link-grid">
            <button className="primary-button" disabled={!canSubmit} type="submit">
              항목 추가
            </button>
            <button
              className="ghost-button ghost-button-light"
              onClick={handleAddSpreadsheetRow}
              type="button"
            >
              상세 추가
            </button>
          </div>
        </form>

        <section className="batch-entry-detail">
          <div className="data-panel-head">
            <div>
              <h3>상세 거래 입력</h3>
              <p>스프레드시트 뷰에서 행 단위로 수정하고 한꺼번에 저장합니다.</p>
            </div>
            <button
              className="primary-button"
              disabled={isSaving}
              onClick={() => void handleSaveDrafts()}
              type="button"
            >
              {isSaving ? "저장 중..." : "완료"}
            </button>
          </div>

          {isDetailMode ? (
            <div className="spreadsheet-shell">
              <div className="spreadsheet-toolbar">
                <button
                  className="ghost-button ghost-button-light"
                  onClick={handleAddSpreadsheetRow}
                  type="button"
                >
                  행 추가
                </button>
                <div className="spreadsheet-metrics">
                  <span>수입 {formatCurrency(queueIncome)}원</span>
                  <span>지출 {formatCurrency(queueExpense)}원</span>
                </div>
              </div>
              <div className="spreadsheet-table-wrap">
                <div className="spreadsheet-table">
                  <div className="spreadsheet-row spreadsheet-row-head">
                    <span>날짜</span>
                    <span>유형</span>
                    <span>계정</span>
                    <span>카테고리</span>
                    <span>사용처</span>
                    <span>금액</span>
                    <span>삭제</span>
                  </div>
                  {draftRows.map((row) => (
                    <div className="spreadsheet-row" key={row.id}>
                      <input
                        max={today}
                        onChange={(event) =>
                          handleDraftChange(row.id, "occurredAt", event.target.value)
                        }
                        type="date"
                        value={row.occurredAt}
                      />
                      <select
                        onChange={(event) =>
                          handleDraftChange(row.id, "transactionType", event.target.value)
                        }
                        value={row.transactionType}
                      >
                        <option value="expense">지출</option>
                        <option value="income">수입</option>
                      </select>
                      <select
                        onChange={(event) =>
                          handleDraftChange(row.id, "accountId", event.target.value)
                        }
                        value={row.accountId}
                      >
                        <option value="">선택</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                      </select>
                      <select
                        onChange={(event) =>
                          handleDraftChange(row.id, "categoryId", event.target.value)
                        }
                        value={row.categoryId}
                      >
                        <option value="">선택 안 함</option>
                        {categoryOptionsByType(row.transactionType).map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <input
                        onChange={(event) =>
                          handleDraftChange(row.id, "merchant", event.target.value)
                        }
                        placeholder="사용처"
                        value={row.merchant}
                      />
                      <input
                        inputMode="numeric"
                        onChange={(event) =>
                          handleDraftChange(row.id, "amount", event.target.value)
                        }
                        placeholder="0"
                        value={formatAmountInput(row.amount)}
                      />
                      <button
                        className="ghost-button"
                        onClick={() =>
                          setDraftRows((current) => current.filter((item) => item.id !== row.id))
                        }
                        type="button"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {!draftRows.length ? (
                <p className="empty-state">상세 입력에 추가된 행이 없습니다.</p>
              ) : null}
            </div>
          ) : (
            <div className="guide-callout">
              <strong>상세 추가 대기</strong>
              <p>여러 건을 한 번에 수정하려면 상세 추가 버튼을 눌러 스프레드시트 뷰를 여세요.</p>
            </div>
          )}
        </section>
      </div>

      {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      <section className="batch-history fade-in-up fade-in-up-delay-3">
        <div className="data-panel-head">
          <div>
            <h3>{selectedDate} 저장 내역</h3>
            <p>같은 날짜에 저장된 거래를 바로 확인하고 정리할 수 있습니다.</p>
          </div>
        </div>
        <div className="calendar-sheet-list">
          {selectedDayTransactions.length ? (
            selectedDayTransactions.map((transaction) => (
              <article className="calendar-sheet-item" key={transaction.id}>
                <div>
                  <strong>{transaction.description || "거래 메모 없음"}</strong>
                  <p>
                    {transaction.transaction_type === "income" ? "수입" : "지출"} ·{" "}
                    {transaction.occurred_at.slice(11, 16)}
                  </p>
                </div>
                <div className="batch-history-actions">
                  <strong
                    className={
                      transaction.transaction_type === "income"
                        ? "amount-income"
                        : "amount-expense"
                    }
                  >
                    {formatCurrency(transaction.amount)}원
                  </strong>
                  <button
                    className="ghost-button"
                    onClick={() =>
                      void deleteTransaction(transaction.id)
                        .then(async () => {
                          setStatusMessage("거래를 삭제했습니다.");
                          const nextTransactions = await fetchTransactions(
                            new URLSearchParams({ month: currentMonth }),
                          );
                          setTransactions(nextTransactions);
                        })
                        .catch((error) => {
                          setErrorMessage(
                            error instanceof ApiError
                              ? error.message
                              : "거래 삭제에 실패했습니다.",
                          );
                        })
                    }
                    type="button"
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))
          ) : !isLoading ? (
            <p className="empty-state">이 날짜에 저장된 거래가 없습니다.</p>
          ) : (
            <p className="toolbar-copy">거래 내역을 불러오는 중입니다.</p>
          )}
        </div>
      </section>
    </div>
  );
}
