"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookSchema, issueBookSchema, type BookInput, type IssueBookInput } from "@/validations/library";
import { createBookAction, issueBookAction, returnBookAction } from "@/features/library/actions";
import type { Book, BookIssue } from "@/types/library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function LibraryManager({
  initialBooks: books,
  initialIssues: issues,
  canManage,
  canIssue,
}: {
  initialBooks: Book[];
  initialIssues: BookIssue[];
  canManage: boolean;
  canIssue: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [bookError, setBookError] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);
  const bookById = new Map(books.map((b) => [b.id, b]));
  const today = new Date().toISOString().slice(0, 10);

  const bookForm = useForm<BookInput>({ resolver: zodResolver(bookSchema), defaultValues: { total_copies: 1 } });
  const issueForm = useForm<IssueBookInput>({ resolver: zodResolver(issueBookSchema) });

  async function onAddBook(values: BookInput) {
    setBookError(null);
    const result = await createBookAction(values);
    if (!result.ok) { setBookError(result.error); return; }
    bookForm.reset({ title: "", author: "", isbn: "", publisher: "", rack_no: "", total_copies: 1, price: 0 });
    router.refresh();
  }

  async function onIssue(values: IssueBookInput) {
    setIssueError(null);
    const result = await issueBookAction(values);
    if (!result.ok) { setIssueError(result.error); return; }
    issueForm.reset({ book_id: "", borrower_email: "", due_date: "" });
    router.refresh();
  }

  function returnBook(issueId: string) {
    startTransition(async () => {
      await returnBookAction(issueId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {canManage && (
          <Card>
            <CardHeader><CardTitle>Add book</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={bookForm.handleSubmit(onAddBook)} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" {...bookForm.register("title")} />
                  {bookForm.formState.errors.title && <p className="text-xs text-red-600">{bookForm.formState.errors.title.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="author">Author</Label>
                    <Input id="author" {...bookForm.register("author")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input id="isbn" {...bookForm.register("isbn")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="rack_no">Rack no</Label>
                    <Input id="rack_no" {...bookForm.register("rack_no")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="total_copies">Copies</Label>
                    <Input id="total_copies" type="number" {...bookForm.register("total_copies")} />
                  </div>
                </div>
                {bookError && <p className="text-sm text-red-600">{bookError}</p>}
                <Button type="submit" size="sm" disabled={bookForm.formState.isSubmitting} className="self-start">Add book</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {canIssue && (
          <Card>
            <CardHeader><CardTitle>Issue book</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={issueForm.handleSubmit(onIssue)} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="book_id">Book</Label>
                  <select id="book_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...issueForm.register("book_id")}>
                    <option value="">Choose</option>
                    {books.filter((b) => b.available_copies > 0).map((b) => (
                      <option key={b.id} value={b.id}>{b.title} ({b.available_copies} available)</option>
                    ))}
                  </select>
                  {issueForm.formState.errors.book_id && <p className="text-xs text-red-600">{issueForm.formState.errors.book_id.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="borrower_email">Borrower&apos;s account email</Label>
                  <Input id="borrower_email" type="email" {...issueForm.register("borrower_email")} />
                  {issueForm.formState.errors.borrower_email && <p className="text-xs text-red-600">{issueForm.formState.errors.borrower_email.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="due_date">Due date</Label>
                  <Input id="due_date" type="date" {...issueForm.register("due_date")} />
                  {issueForm.formState.errors.due_date && <p className="text-xs text-red-600">{issueForm.formState.errors.due_date.message}</p>}
                </div>
                {issueError && <p className="text-sm text-red-600">{issueError}</p>}
                <Button type="submit" size="sm" disabled={issueForm.formState.isSubmitting} className="self-start">Issue</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <Table>
        <THead><TR><TH>Title</TH><TH>Rack</TH><TH className="text-right">Available</TH></TR></THead>
        <TBody>
          {books.map((b) => (
            <TR key={b.id}>
              <TD className="font-medium text-slate-900">{b.title}{b.author ? ` — ${b.author}` : ""}</TD>
              <TD>{b.rack_no ?? "—"}</TD>
              <TD className="text-right">{b.available_copies} / {b.total_copies}</TD>
            </TR>
          ))}
          {books.length === 0 && <TR><TD colSpan={3} className="py-6 text-center text-slate-400">No books yet.</TD></TR>}
        </TBody>
      </Table>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Issued</h2>
        <Table>
          <THead><TR><TH>Book</TH><TH>Due</TH><TH>Status</TH><TH></TH></TR></THead>
          <TBody>
            {issues.map((i) => (
              <TR key={i.id}>
                <TD>{bookById.get(i.book_id)?.title ?? "—"}</TD>
                <TD>{i.due_date}</TD>
                <TD>
                  {i.status === "returned" ? (
                    <Badge variant="success">returned</Badge>
                  ) : i.due_date < today ? (
                    <Badge variant="warning">overdue</Badge>
                  ) : (
                    <Badge variant="outline">issued</Badge>
                  )}
                </TD>
                <TD>
                  {canIssue && i.status === "issued" && (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => returnBook(i.id)}>Return</Button>
                  )}
                </TD>
              </TR>
            ))}
            {issues.length === 0 && <TR><TD colSpan={4} className="py-6 text-center text-slate-400">No books issued yet.</TD></TR>}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
