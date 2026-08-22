import { z } from "zod";

export const bookSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  author: z.string().trim().max(200).optional().or(z.literal("")),
  isbn: z.string().trim().max(50).optional().or(z.literal("")),
  publisher: z.string().trim().max(200).optional().or(z.literal("")),
  rack_no: z.string().trim().max(50).optional().or(z.literal("")),
  total_copies: z.coerce.number().int().min(1, "At least 1 copy"),
  price: z.coerce.number().min(0).optional(),
});

export const issueBookSchema = z.object({
  book_id: z.string().uuid("Choose a book"),
  borrower_email: z.string().trim().email("Enter the borrower's account email"),
  due_date: z.string().min(1, "Due date is required"),
});

export type BookInput = z.infer<typeof bookSchema>;
export type IssueBookInput = z.infer<typeof issueBookSchema>;
