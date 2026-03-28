import { useEffect, useMemo, useState } from "react";

import { ApiError } from "../services/api";
import { fetchCategories, type Category } from "../services/categories";
import {
  fetchTransactions,
  type TransactionRecord,
} from "../services/transactions";
import { InfoCard } from "../ui/InfoCard";
import { PageHero } from "../ui/PageHero";

type MonthSeries = {
  key: string;
  label: string;
  income: number;
  expense: number;
  net: number;
};

type CategorySpend = {
  categoryId: number | null;
  label: string;
  amount: number;
};

const categoryPalette = ["#1A237E", "#2E7D32", "#00695C", "#EF6C57", "#5C6BC0"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function toMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function buildRecentMonths(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (count - 1 - index));
    const key = toMonthKey(date);
    return {
      key,
      label: date.toLocaleDateString("ko-KR", { month: "short", year: "2-digit" }),
    };
  });
}

function buildDonutSegments(items: CategorySpend[]) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  let offset = 0;

  return items.map((item, index) => {
    const portion = total === 0 ? 0 : item.amount / total;
    const dash = portion * 100;
    const segment = {
      ...item,
      color: categoryPalette[index % categoryPalette.length],
      dash,
      offset,
    };
    offset += dash;
    return segment;
  });
}

export function AnalysisPage() {
  const [series, setSeries] = useState<MonthSeries[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const months = buildRecentMonths(6);

    Promise.all([
      Promise.all(
        months.map(async ({ key, label }) => {
          const transactions = await fetchTransactions(new URLSearchParams({ month: key }));
          const totals = transactions.reduce(
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

          return {
            key,
            label,
            income: totals.income,
            expense: totals.expense,
            net: totals.income - totals.expense,
          };
        }),
      ),
      fetchCategories(),
    ])
      .then(([nextSeries, nextCategories]) => {
        setSeries(nextSeries);
        setCategories(nextCategories);
        setErrorMessage("");
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof ApiError ? error.message : "분석 데이터를 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const currentMonthKey = series.at(-1)?.key ?? toMonthKey(new Date());

  const [currentMonthTransactions, setCurrentMonthTransactions] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    const month = currentMonthKey;
    fetchTransactions(new URLSearchParams({ month }))
      .then((transactions) => {
        setCurrentMonthTransactions(transactions);
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof ApiError ? error.message : "분석용 거래를 불러오지 못했습니다.",
        );
      });
  }, [currentMonthKey]);

  const spendingByCategory = useMemo(() => {
    const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
    const grouped = new Map<number | null, number>();

    currentMonthTransactions
      .filter((transaction) => transaction.transaction_type === "expense")
      .forEach((transaction) => {
        const next = (grouped.get(transaction.category_id) ?? 0) + transaction.amount;
        grouped.set(transaction.category_id, next);
      });

    return [...grouped.entries()]
      .map(([categoryId, amount]) => ({
        categoryId,
        amount,
        label: categoryId ? categoryNameById.get(categoryId) ?? `카테고리 #${categoryId}` : "미분류",
      }))
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 5);
  }, [categories, currentMonthTransactions]);

  const donutSegments = useMemo(() => buildDonutSegments(spendingByCategory), [spendingByCategory]);

  const maxExpense = Math.max(...series.map((item) => item.expense), 1);
  const averageIncome =
    series.length > 0 ? series.reduce((sum, item) => sum + item.income, 0) / series.length : 0;
  const averageExpense =
    series.length > 0 ? series.reduce((sum, item) => sum + item.expense, 0) / series.length : 0;
  const highestSpend = spendingByCategory[0];

  return (
    <div className="page">
      <PageHero
        eyebrow="분석"
        title="지출 분석"
        description="최근 6개월 흐름과 이번 달 지출 패턴을 가볍게 읽을 수 있도록 정리했습니다."
      />
      <div className="card-grid">
        <InfoCard
          title="예상 여유 자금"
          description={isLoading ? "분석 중..." : `${formatCurrency(Math.max(averageIncome - averageExpense, 0))}원`}
        />
        <InfoCard
          title="가장 큰 지출"
          description={highestSpend ? highestSpend.label : "지출 데이터 없음"}
          body={
            highestSpend ? <p>{formatCurrency(highestSpend.amount)}원</p> : <p>이번 달 지출 데이터가 없습니다.</p>
          }
        />
        <InfoCard
          title="이번 달 흐름"
          description={series.at(-1)?.net && series.at(-1)!.net >= 0 ? "흑자 유지" : "지출 점검 필요"}
          body={
            <p>
              {formatCurrency(series.at(-1)?.net ?? 0)}원
            </p>
          }
        />
      </div>
      <div className="analysis-grid">
        <section className="data-panel">
          <div className="data-panel-head">
            <h3>카테고리별 지출</h3>
            <p>{currentMonthKey}</p>
          </div>
          <div className="analysis-donut-layout">
            <div className="analysis-donut-shell" aria-hidden="true">
              <svg className="analysis-donut" viewBox="0 0 42 42">
                <circle className="analysis-donut-track" cx="21" cy="21" r="15.915" />
                {donutSegments.map((segment) => (
                  <circle
                    className="analysis-donut-segment"
                    cx="21"
                    cy="21"
                    key={segment.label}
                    r="15.915"
                    stroke={segment.color}
                    strokeDasharray={`${segment.dash} ${100 - segment.dash}`}
                    strokeDashoffset={25 - segment.offset}
                  />
                ))}
              </svg>
              <div className="analysis-donut-center">
                <strong>{formatCurrency(spendingByCategory.reduce((sum, item) => sum + item.amount, 0))}원</strong>
                <span>지출 합계</span>
              </div>
            </div>
            <div className="analysis-legend">
              {spendingByCategory.length === 0 ? (
                <p className="empty-state">이번 달 지출 데이터가 없습니다.</p>
              ) : (
                spendingByCategory.map((item, index) => (
                  <div className="analysis-legend-row" key={item.label}>
                    <span className="analysis-legend-swatch" style={{ backgroundColor: categoryPalette[index % categoryPalette.length] }} />
                    <span>{item.label}</span>
                    <strong>{formatCurrency(item.amount)}원</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
        <section className="data-panel">
          <div className="data-panel-head">
            <h3>6개월 현금 흐름</h3>
            <p>수입 대비 지출</p>
          </div>
          <div className="analysis-bars">
            {series.map((item) => (
              <div className="analysis-bar-row" key={item.key}>
                <div className="analysis-bar-label">
                  <strong>{item.label}</strong>
                  <span>{formatCurrency(item.net)}원</span>
                </div>
                <div className="analysis-bar-track">
                  <span
                    className="analysis-bar-fill analysis-bar-fill-expense"
                    style={{ width: `${(item.expense / maxExpense) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
    </div>
  );
}
