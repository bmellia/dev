import { apiFetch } from "./api";


export type TransactionRecord = {
  id: number;
  occurred_at: string;
  transaction_type: "income" | "expense";
  account_id: number;
  category_id: number | null;
  amount: number;
  description: string | null;
};


export function fetchTransactions(params: URLSearchParams) {
  return apiFetch<TransactionRecord[]>(`/transactions?${params.toString()}`);
}
