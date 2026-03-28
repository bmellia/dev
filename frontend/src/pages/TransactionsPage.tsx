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

function formatCategoryTone(type: TransactionRecord["transaction_type"]) {
  return type === "income" ? "transaction-chip-income" : "transaction-chip-expense";
}


export function TransactionsPage() {
  const [month, setMonth] = useState(defaultMonth);
  const [day, setDay] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
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
  const canSubmitTransaction = accounts.length > 0;

  const visibleTransactions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = transactions.filter((transaction) => {
      if (typeFilter !== "all" && transaction.transaction_type !== typeFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const accountName = accountNameById.get(transaction.account_id) ?? "";
      const categoryName = transaction.category_id
        ? categoryNameById.get(transaction.category_id) ?? ""
        : "";
      const haystack = [
        transaction.description ?? "",
        accountName,
        categoryName,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });

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
  }, [accountNameById, categoryNameById, searchTerm, sortOrder, transactions, typeFilter]);

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

  const activeFilterLabels = [
    day ? `일별 ${day}` : `월별 ${month}`,
    typeFilter === "all" ? null : typeFilter === "income" ? "수입만" : "지출만",
    sortOrder === "latest"
      ? "최신순"
      : sortOrder === "oldest"
      ? "오래된순"
      : sortOrder === "amount_desc"
      ? "금액 큰순"
      : "금액 작은순",
    searchTerm.trim() ? `검색: ${searchTerm.trim()}` : null,
  ].filter(Boolean) as string[];

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
        eyebrow="거래"
        title="거래 원장"
        description="필터, 검색, 빠른 입력을 한 화면에 두고 거래를 표처럼 밀도 있게 관리할 수 있도록 구성했습니다."
      />
      <div className="filter-panel">
        <label className="field">
          <span>월</span>
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
          <span>일</span>
          <input
            max={today}
            onChange={(event) => setDay(event.target.value)}
            type="date"
            value={day}
          />
        </label>
        <label className="field">
          <span>유형</span>
          <select
            onChange={(event) =>
              setTypeFilter(event.target.value as "all" | TransactionRecord["transaction_type"])
            }
            value={typeFilter}
          >
            <option value="all">전체</option>
            <option value="expense">지출</option>
            <option value="income">수입</option>
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
        <label className="field">
          <span>검색</span>
          <input
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="메모, 계정, 카테고리"
            value={searchTerm}
          />
        </label>
      </div>
      <div className="toolbar-row">
        <p className="toolbar-copy">빠른 필터</p>
        <div className="toolbar-actions">
          <button
            className="ghost-button ghost-button-light"
            onClick={() => {
              setDay(today);
            }}
            type="button"
          >
            오늘
          </button>
          <button
            className="ghost-button ghost-button-light"
            onClick={() => {
              setMonth(defaultMonth);
              setDay("");
            }}
            type="button"
          >
            이번 달
          </button>
        </div>
      </div>
      <div className="filter-chip-row">
        {activeFilterLabels.map((label) => (
          <span className="filter-chip" key={label}>
            {label}
          </span>
        ))}
      </div>
      <div className="toolbar-row">
        <p className="toolbar-copy">
          {day ? `${day} 선택됨` : `${month} 선택됨`}
        </p>
        <div className="toolbar-actions">
          <button
            className="ghost-button ghost-button-light"
            onClick={() => {
              setMonth(defaultMonth);
              setDay("");
              setTypeFilter("all");
              setSortOrder("latest");
              setSearchTerm("");
            }}
            type="button"
          >
            필터 초기화
          </button>
          <button className="primary-button" onClick={() => void loadTransactions()} type="button">
            {isLoading ? "새로고침 중..." : "새로고침"}
          </button>
        </div>
      </div>
      <div className="card-grid">
        <InfoCard
          title="표시 건수"
          description={
            isLoading
              ? "불러오는 중..."
              : `${visibleTransactions.length}건 표시 중`
          }
        />
        <InfoCard
          title="수입"
          description={`${formatCurrency(summary.income)}원`}
        />
        <InfoCard
          title="지출"
          description={`${formatCurrency(summary.expense)}원`}
        />
        <InfoCard
          title="순합계"
          description={`${formatCurrency(summary.income - summary.expense)}원`}
        />
      </div>
      {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      <div className="transactions-layout">
        <form className="data-panel stack-form quick-add-panel" onSubmit={handleSubmit}>
          <div className="data-panel-head">
            <h3>{editingTransactionId ? "거래 수정" : "빠른 입력"}</h3>
            <p>{editingTransactionId ? "선택한 행 수정 중" : "화면에 고정된 입력 패널"}</p>
          </div>
          {!canSubmitTransaction ? (
            <div className="guide-callout">
              <strong>계정 필요</strong>
              <p>설정에서 계정을 먼저 추가해야 거래를 저장할 수 있습니다.</p>
              <div className="quick-link-grid">
                <Link className="primary-link" to="/settings">
                  설정 열기
                </Link>
              </div>
            </div>
          ) : null}
          {canSubmitTransaction && filteredCategories.length === 0 ? (
            <div className="guide-callout">
              <strong>카테고리 선택 가능</strong>
              <p>현재 유형에 맞는 활성 카테고리가 없습니다. 카테고리 없이 저장할 수 있습니다.</p>
            </div>
          ) : null}
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
                <option value="expense">지출</option>
                <option value="income">수입</option>
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
              {amount ? `${formatCurrency(Number(amount))}원` : "금액 없음"}
            </p>
          </div>
          <div className="action-row">
            <button className="primary-button" disabled={!canSubmitTransaction} type="submit">
              {editingTransactionId ? "거래 수정" : "거래 저장"}
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
        <section className="data-panel transaction-ledger-panel">
          <div className="data-panel-head">
            <h3>거래 목록</h3>
            <p>{day ? `${day}` : `${month}`}</p>
          </div>
          <div className="transaction-table-header">
            <span>날짜</span>
            <span>카테고리</span>
            <span>메모</span>
            <span>금액</span>
            <span>동작</span>
          </div>
          <div className="transaction-list transaction-table-list">
            {visibleTransactions.length === 0 && !isLoading ? (
              <div className="empty-state-block">
                <p className="empty-state">현재 필터에 맞는 거래가 없습니다.</p>
                <p className="empty-state">
                  계정이나 카테고리가 비어 있다면 Settings에서 먼저 기준 데이터를 추가하세요.
                </p>
                <div className="quick-link-grid">
                  <Link className="ghost-link ghost-link-block" to="/settings">
                    설정 열기
                  </Link>
                </div>
              </div>
            ) : null}
            {visibleTransactions.map((transaction) => (
              <article className="transaction-table-row" key={transaction.id}>
                <div className="transaction-table-cell">
                  <strong>{transaction.occurred_at.slice(0, 10)}</strong>
                  <p>{transaction.occurred_at.slice(11, 16)}</p>
                </div>
                <div className="transaction-table-cell">
                  <span className={`transaction-chip ${formatCategoryTone(transaction.transaction_type)}`}>
                    {categoryNameById.get(transaction.category_id ?? 0) ??
                      (transaction.transaction_type === "income" ? "수입" : "지출")}
                  </span>
                  <p>{accountNameById.get(transaction.account_id) || `계정 #${transaction.account_id}`}</p>
                </div>
                <div className="transaction-table-cell">
                  <strong>{transaction.description || "메모 없음"}</strong>
                  <p>{transaction.transaction_type === "income" ? "입금" : "출금"}</p>
                </div>
                <div className="transaction-table-cell transaction-table-amount">
                  <strong>{formatCurrency(transaction.amount)}원</strong>
                </div>
                <div className="transaction-table-actions">
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
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
