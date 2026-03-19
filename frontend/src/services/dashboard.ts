import { apiFetch } from "./api";


export type MonthlySummary = {
  month: string;
  income_total: number;
  expense_total: number;
  net_total: number;
};

export type AccountSummary = {
  account_id: number;
  name: string;
  account_type: string;
  is_active: boolean;
  balance: number;
};


export function fetchMonthlySummary(month: string) {
  return apiFetch<MonthlySummary>(
    `/dashboard/summary?month=${encodeURIComponent(month)}`,
  );
}


export function fetchAccountSummaries() {
  return apiFetch<AccountSummary[]>("/dashboard/accounts");
}
