import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { fetchAccounts, type Account } from "../services/accounts";
import { fetchCategories, type Category } from "../services/categories";
import { ApiError } from "../services/api";
import {
  createTransaction,
  deleteTransaction,
  fetchTransactions,
  type TransactionRecord,
  updateTransaction,
} from "../services/transactions";
import { InfoCard } from "../ui/InfoCard";
import { PageHero } from "../ui/PageHero";


const today = new Date().toISOString().slice(0, 10);
const defaultMonth = today.slice(0, 7);
const quickAmountOptions = {
  expense: [10000, 30000, 50000, 100000],
  income: [100000, 500000, 1000000, 3000000],
} as const;


function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}


export function TransactionsPage() {
  const [month, setMonth] = useState(defaultMonth);
  const [day, setDay] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionRecord["transaction_type"]>("all");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest" | "amount_desc" | "amount_asc">("latest");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [occurredAt, setOccurredAt] = useState(`${today}T09:00`);
  const [transactionType, setTransactionType] = useState<
    TransactionRecord["transaction_type"]
  >("expense");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = async () => {
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
  };

  useEffect(() => {
    void loadTransactions();
  }, [day, month]);

  useEffect(() => {
    Promise.all([fetchAccounts(), fetchCategories()])
      .then(([nextAccounts, nextCategories]) => {
        setAccounts(nextAccounts.filter((account) => account.is_active));
        setCategories(nextCategories.filter((category) => category.is_active));
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
    if (!accountId && accounts.length > 0) {
      setAccountId(String(accounts[0].id));
    }
  }, [accountId, accounts]);

  useEffect(() => {
    setCategoryId("");
  }, [transactionType]);

  const filteredCategories = useMemo(
    () =>
      categories.filter((category) => category.category_type === transactionType),
    [categories, transactionType],
  );

  const accountNameById = useMemo(
    () =>
      new Map(accounts.map((account) => [account.id, account.name])),
    [accounts],
  );

  const categoryNameById = useMemo(
    () =>
      new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const selectedAccountName =
    accounts.find((account) => String(account.id) === accountId)?.name ?? "미선택";
  const selectedCategoryName =
    filteredCategories.find((category) => String(category.id) === categoryId)?.name ??
    "선택 안 함";

  const visibleTransactions = useMemo(() => {
    const filtered =
      typeFilter === "all"
        ? transactions
        : transactions.filter((transaction) => transaction.transaction_type === typeFilter);

    return [...filtered].sort((left, right) => {
      if (sortOrder === "oldest") {
        return left.occurred_at.localeCompare(right.occurred_at);
      }

      if (sortOrder === "amount_desc") {
        return right.amount - left.amount;
      }

      if (sortOrder === "amount_asc") {
        return left.amount - right.amount;
      }

      return right.occurred_at.localeCompare(left.occurred_at);
    });
  }, [sortOrder, transactions, typeFilter]);

  const summary = useMemo(() => {
    return visibleTransactions.reduce(
      (accumulator, transaction) => {
        if (transaction.transaction_type === "income") {
          accumulator.income += transaction.amount;
        } else {
          accumulator.expense += transaction.amount;
        }
        return accumulator;
      },
      { income: 0, expense: 0 },
    );
  }, [visibleTransactions]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (!accountId || Number(amount) <= 0) {
      setErrorMessage("계정과 1원 이상의 금액을 입력하세요.");
      return;
    }

    const payload = {
      occurred_at: `${occurredAt}:00`,
      transaction_type: transactionType,
      account_id: Number(accountId),
      category_id: categoryId ? Number(categoryId) : null,
      amount: Number(amount),
      description: description.trim() || null,
    };

    try {
      if (editingTransactionId === null) {
        await createTransaction(payload);
        setStatusMessage("거래를 추가했습니다.");
      } else {
        await updateTransaction(editingTransactionId, payload);
        setStatusMessage("거래를 수정했습니다.");
      }

      resetForm();
      await loadTransactions();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "거래 저장에 실패했습니다.",
      );
    }
  };

  const resetForm = () => {
    setEditingTransactionId(null);
    setOccurredAt(`${today}T09:00`);
    setTransactionType("expense");
    setAccountId(accounts[0]?.id ? String(accounts[0].id) : "");
    setCategoryId("");
    setAmount("");
    setDescription("");
  };

  const handleEdit = (transaction: TransactionRecord) => {
    setErrorMessage("");
    setStatusMessage("");
    setEditingTransactionId(transaction.id);
    setOccurredAt(transaction.occurred_at.slice(0, 16));
    setTransactionType(transaction.transaction_type);
    setAccountId(String(transaction.account_id));
    setCategoryId(transaction.category_id ? String(transaction.category_id) : "");
    setAmount(String(transaction.amount));
    setDescription(transaction.description || "");
  };

  return (
    <div className="page">
      <PageHero
        eyebrow="Tickets 17-18"
        title="거래 목록과 입력 흐름"
        description="월별 또는 일별 조회와 함께 거래 생성·수정·삭제를 같은 화면에서 처리할 수 있도록 구성했습니다."
      />
      <form className="data-panel stack-form" onSubmit={handleSubmit}>
        <div className="data-panel-head">
          <h3>{editingTransactionId ? "거래 수정" : "거래 추가"}</h3>
          <p>{editingTransactionId ? "선택된 거래 편집 중" : "새 거래 입력"}</p>
        </div>
        <div className="settings-grid">
          <label className="field">
            <span>거래 일시</span>
            <input
              onChange={(event) => setOccurredAt(event.target.value)}
              type="datetime-local"
              value={occurredAt}
            />
          </label>
          <label className="field">
            <span>유형</span>
            <select
              onChange={(event) =>
                setTransactionType(
                  event.target.value as TransactionRecord["transaction_type"],
                )
              }
              value={transactionType}
            >
              <option value="expense">expense</option>
              <option value="income">income</option>
            </select>
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
            <span>금액</span>
            <input
              min="1"
              onChange={(event) => setAmount(event.target.value)}
              type="number"
              value={amount}
            />
          </label>
          <label className="field">
            <span>메모</span>
            <input
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </label>
        </div>
        <div className="quick-amount-row">
          {quickAmountOptions[transactionType].map((value) => (
            <button
              className="ghost-button quick-amount-button"
              key={value}
              onClick={() => setAmount(String(value))}
              type="button"
            >
              {formatCurrency(value)}원
            </button>
          ))}
        </div>
        <div className="transaction-preview">
          <strong>{editingTransactionId ? "수정 미리보기" : "입력 미리보기"}</strong>
          <p>
            {transactionType === "income" ? "수입" : "지출"} · {selectedAccountName} ·{" "}
            {selectedCategoryName}
          </p>
          <p className="transaction-preview-amount">
            {amount ? `${formatCurrency(Number(amount))}원` : "금액 미입력"}
          </p>
        </div>
        <div className="action-row">
          <button className="primary-button" type="submit">
            {editingTransactionId ? "거래 수정" : "거래 추가"}
          </button>
          <button
            className="ghost-button"
            onClick={resetForm}
            type="button"
          >
            {editingTransactionId ? "수정 취소" : "초기화"}
          </button>
        </div>
      </form>
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
        <label className="field">
          <span>유형 필터</span>
          <select
            onChange={(event) =>
              setTypeFilter(event.target.value as "all" | TransactionRecord["transaction_type"])
            }
            value={typeFilter}
          >
            <option value="all">전체</option>
            <option value="expense">지출만</option>
            <option value="income">수입만</option>
          </select>
        </label>
        <label className="field">
          <span>정렬</span>
          <select
            onChange={(event) =>
              setSortOrder(
                event.target.value as "latest" | "oldest" | "amount_desc" | "amount_asc",
              )
            }
            value={sortOrder}
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="amount_desc">금액 큰순</option>
            <option value="amount_asc">금액 작은순</option>
          </select>
        </label>
      </div>
      <div className="toolbar-row">
        <p className="toolbar-copy">
          {day ? `${day} 일별 조회` : `${month} 월별 조회`}
        </p>
        <button className="primary-button" onClick={() => void loadTransactions()} type="button">
          {isLoading ? "새로고침 중..." : "새로고침"}
        </button>
      </div>
      <div className="card-grid">
        <InfoCard
          title="거래 목록"
          description={
            isLoading
              ? "거래를 불러오는 중입니다."
              : `${visibleTransactions.length}건 표시 중`
          }
        />
        <InfoCard
          title="수입 합계"
          description={`${formatCurrency(summary.income)}원`}
        />
        <InfoCard
          title="지출 합계"
          description={`${formatCurrency(summary.expense)}원`}
        />
        <InfoCard
          title="순합계"
          description={`${formatCurrency(summary.income - summary.expense)}원`}
        />
      </div>
      {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      <section className="data-panel">
        <div className="data-panel-head">
          <h3>거래 내역</h3>
          <p>{day ? `${day} 기준` : `${month} 기준`}</p>
        </div>
        <div className="transaction-list">
          {visibleTransactions.length === 0 && !isLoading ? (
            <div className="empty-state-block">
              <p className="empty-state">표시할 거래가 없습니다.</p>
              <p className="empty-state">
                아직 기준 데이터가 없다면 설정에서 계정과 카테고리를 먼저 추가하세요.
              </p>
              <div className="quick-link-grid">
                <Link className="ghost-link ghost-link-block" to="/settings">
                  설정으로 이동
                </Link>
              </div>
            </div>
          ) : null}
          {visibleTransactions.map((transaction) => (
            <article className="transaction-row" key={transaction.id}>
              <div>
                <strong>
                  {transaction.transaction_type === "income" ? "수입" : "지출"}
                </strong>
                <p>{transaction.description || "메모 없음"}</p>
                <p className="subtle-meta">
                  {accountNameById.get(transaction.account_id) || `계정 #${transaction.account_id}`}
                  {" · "}
                  {transaction.category_id
                    ? categoryNameById.get(transaction.category_id) || `카테고리 #${transaction.category_id}`
                    : "카테고리 없음"}
                </p>
              </div>
              <div className="transaction-meta">
                <span>{transaction.occurred_at.slice(0, 10)}</span>
                <strong>{formatCurrency(transaction.amount)}원</strong>
                <div className="action-row">
                  <button
                    className="ghost-button"
                    onClick={() => handleEdit(transaction)}
                    type="button"
                  >
                    수정
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() =>
                      void deleteTransaction(transaction.id)
                        .then(() => {
                          setStatusMessage("거래를 삭제했습니다.");
                          return loadTransactions();
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
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
