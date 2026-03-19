import { useEffect, useMemo, useState, type FormEvent } from "react";

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


function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}


export function TransactionsPage() {
  const [month, setMonth] = useState(defaultMonth);
  const [day, setDay] = useState("");
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
        <div className="action-row">
          <button className="primary-button" type="submit">
            {editingTransactionId ? "거래 수정" : "거래 추가"}
          </button>
          <button
            className="ghost-button"
            onClick={resetForm}
            type="button"
          >
            초기화
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
      {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
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
