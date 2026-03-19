import { apiFetch } from "./api";


export type Category = {
  id: number;
  name: string;
  category_type: "income" | "expense";
  parent_id: number | null;
  is_active: boolean;
};

type CategoryPayload = {
  name: string;
  category_type: Category["category_type"];
  parent_id?: number | null;
  is_active?: boolean;
};


export function fetchCategories() {
  return apiFetch<Category[]>("/categories");
}


export function createCategory(payload: CategoryPayload) {
  return apiFetch<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export function updateCategory(
  categoryId: number,
  payload: Partial<CategoryPayload>,
) {
  return apiFetch<Category>(`/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}


export function deactivateCategory(categoryId: number) {
  return apiFetch<Category>(`/categories/${categoryId}/deactivate`, {
    method: "POST",
  });
}
