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


type TransactionPayload = {
  occurred_at: string;
  transaction_type: TransactionRecord["transaction_type"];
  account_id: number;
  category_id: number | null;
  amount: number;
  description: string | null;
};


export function createTransaction(payload: TransactionPayload) {
  return apiFetch<TransactionRecord>("/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export function updateTransaction(
  transactionId: number,
  payload: Partial<TransactionPayload>,
) {
  return apiFetch<TransactionRecord>(`/transactions/${transactionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}


export function deleteTransaction(transactionId: number) {
  return apiFetch<void>(`/transactions/${transactionId}`, {
    method: "DELETE",
  });
}
