-- Management Intelligence Phase 2D: database-level guard for exam
-- comparability metadata, on top of the existing application-layer
-- validation (both-or-neither, no duplicate sequence per academic year +
-- comparison group — features/exams/service.ts). This CHECK constraint
-- covers the cheaper, purely local invariant that a CHECK can express
-- without a cross-table lookup: comparison_group and sequence_no must be
-- supplied together, and sequence_no must be a positive integer.
--
-- The academic-year-scoped duplicate-sequence rule remains
-- application-layer only (documented in features/exams/service.ts) since
-- exams has no direct academic_year_id column to build a partial unique
-- index against without a schema change beyond this metadata's stakes.
--
-- Live data was inspected before this migration: 0 rows exist in `exams`
-- in production, so this is safe to add with no backfill/cleanup needed.

alter table public.exams
  add constraint exams_comparison_metadata_pair check (
    (comparison_group is null and sequence_no is null)
    or
    (comparison_group is not null and sequence_no is not null and sequence_no >= 1)
  );

comment on constraint exams_comparison_metadata_pair on public.exams is
  'comparison_group and sequence_no must be supplied together (or both left null), and sequence_no must be >= 1. The academic-year-scoped no-duplicate-sequence rule is enforced in application code (features/exams/service.ts), not here.';
