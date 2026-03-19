import { apiFetch } from "./api";


export type Account = {
  id: number;
  name: string;
  account_type: "cash" | "bank" | "card" | "ewallet" | "liability";
  is_active: boolean;
};

type AccountPayload = {
  name: string;
  account_type: Account["account_type"];
  is_active?: boolean;
};


export function fetchAccounts() {
  return apiFetch<Account[]>("/accounts");
}


export function createAccount(payload: AccountPayload) {
  return apiFetch<Account>("/accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export function updateAccount(accountId: number, payload: Partial<AccountPayload>) {
  return apiFetch<Account>(`/accounts/${accountId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}


export function deactivateAccount(accountId: number) {
  return apiFetch<Account>(`/accounts/${accountId}/deactivate`, {
    method: "POST",
  });
}
