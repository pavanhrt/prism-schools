export interface Book {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  rack_no: string | null;
  total_copies: number;
  available_copies: number;
  price: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type BookIssueStatus = "issued" | "returned";

export interface BookIssue {
  id: string;
  book_id: string;
  borrower_id: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: BookIssueStatus;
  created_at: string;
  created_by: string | null;
}
