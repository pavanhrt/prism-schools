import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import type { BookInput, IssueBookInput } from "@/validations/library";

export const listBooks = repo.listBooks;
export const listIssues = repo.listIssues;
export const returnBook = repo.returnBook;

export async function createBook(supabase: SupabaseClient, input: BookInput) {
  return repo.insertBook(supabase, {
    title: input.title,
    author: input.author || null,
    isbn: input.isbn || null,
    publisher: input.publisher || null,
    rack_no: input.rack_no || null,
    total_copies: input.total_copies,
    price: input.price ?? 0,
  });
}

export async function issueBook(supabase: SupabaseClient, input: IssueBookInput) {
  const borrowerId = await repo.findBorrowerId(supabase, input.borrower_email);
  if (!borrowerId) throw new Error(`No account found for ${input.borrower_email}.`);
  await repo.issueBook(supabase, input.book_id, borrowerId, input.due_date);
}
