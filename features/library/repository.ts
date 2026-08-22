import type { SupabaseClient } from "@supabase/supabase-js";
import type { Book, BookIssue } from "@/types/library";

export async function listBooks(supabase: SupabaseClient): Promise<Book[]> {
  const { data, error } = await supabase.from("books").select("*").order("title");
  if (error) throw error;
  return data;
}

export async function insertBook(
  supabase: SupabaseClient,
  input: Pick<Book, "title" | "author" | "isbn" | "publisher" | "rack_no" | "total_copies" | "price">,
): Promise<Book> {
  const { data, error } = await supabase
    .from("books")
    .insert({ ...input, available_copies: input.total_copies })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listIssues(supabase: SupabaseClient): Promise<BookIssue[]> {
  const { data, error } = await supabase
    .from("book_issues")
    .select("*")
    .order("issue_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function findBorrowerId(supabase: SupabaseClient, email: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("find_auth_user_id_for_library", { lookup_email: email });
  if (error) throw error;
  return data ?? null;
}

export async function issueBook(
  supabase: SupabaseClient,
  bookId: string,
  borrowerId: string,
  dueDate: string,
): Promise<void> {
  const { error } = await supabase.rpc("issue_book", {
    p_book_id: bookId,
    p_borrower_id: borrowerId,
    p_due_date: dueDate,
  });
  if (error) throw error;
}

export async function returnBook(supabase: SupabaseClient, issueId: string): Promise<void> {
  const { error } = await supabase.rpc("return_book", { p_issue_id: issueId });
  if (error) throw error;
}
