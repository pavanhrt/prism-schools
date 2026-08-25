-- Management Intelligence Phase 2: additive settings for academic delivery lag,
-- performance trend, fee overdue, and School Health Score weighting.
-- No new tables: academics/performance/fees/health analytics are all computed
-- live from existing tables (attendance, exams, fees, lesson_plans, timetable),
-- and reuse the existing management_alerts/management_alert_events lifecycle.

insert into public.management_intelligence_settings
  (setting_key, value_type, numeric_value, description)
values
  ('academic_lag_slightly_behind_days', 'numeric', 1, 'Working-day lag (on an overdue, not-yet-completed lesson plan) at which a subject becomes Slightly Behind'),
  ('academic_lag_warning_days', 'numeric', 4, 'Working-day lag at which a subject becomes a Warning'),
  ('academic_lag_critical_days', 'numeric', 8, 'Working-day lag at which a subject becomes Critical'),
  ('performance_change_points', 'numeric', 3, 'Percentage-point change between comparable exam results that marks Improving/Declining'),
  ('performance_strong_change_points', 'numeric', 10, 'Percentage-point change between comparable exam results that marks Strongly Improving/Declining'),
  ('performance_attention_score_pct', 'numeric', 40, 'Subject percentage below which a result is flagged as requiring attention'),
  ('fee_significant_overdue_amount', 'numeric', 5000, 'Outstanding overdue amount for one student above which the overdue alert is treated as significant'),
  ('fee_collection_rate_warning_pct', 'numeric', 60, 'Collection percentage below which a collection-rate warning is raised'),
  ('health_weight_student_attendance', 'numeric', 25, 'School Health Score weight: student attendance component'),
  ('health_weight_academic_progress', 'numeric', 25, 'School Health Score weight: academic delivery/progress component'),
  ('health_weight_performance', 'numeric', 25, 'School Health Score weight: student performance component'),
  ('health_weight_staff_attendance', 'numeric', 10, 'School Health Score weight: staff attendance component'),
  ('health_weight_delivery', 'numeric', 10, 'School Health Score weight: timetable/delivery evidence component'),
  ('health_weight_fees', 'numeric', 5, 'School Health Score weight: fee collection component')
on conflict (setting_key) do nothing;

comment on column public.management_intelligence_settings.setting_key is
  'Includes Phase 1 attendance thresholds and Phase 2 academic-lag, performance-trend, fee-overdue, and health-score-weight thresholds. All are re-read live, never hardcoded, by the management-intelligence service layer.';
