-- SAMPLE DATA - VERIFY BEFORE PRODUCTION USE
-- Seeds the deterministic safety_rules table matching packages/safety-rules/safety_rules.json

insert into public.safety_rules (category, max_hours_ambient, max_hours_chilled, blocked, notes, is_sample)
values
  ('cooked_rice_dish', 2.00, 12.00, false, 'SAMPLE (verify before use): Cooked rice must be delivered within 2 hours ambient or 12 hours chilled.', true),
  ('cooked_curry_dal', 3.00, 18.00, false, 'SAMPLE (verify before use): Hot cooked curries and dals max 3 hours ambient or 18 hours chilled.', true),
  ('breads_rotis', 8.00, 24.00, false, 'SAMPLE (verify before use): Dry flatbreads and baked goods max 8 hours ambient.', true),
  ('dairy_sweets', 4.00, 24.00, false, 'SAMPLE (verify before use): Milk-based sweets max 4 hours ambient or 24 hours chilled.', true),
  ('cut_fruit_salad', 2.00, 6.00, false, 'SAMPLE (verify before use): Cut produce max 2 hours ambient or 6 hours chilled.', true),
  ('packaged_dry_staples', 72.00, 72.00, false, 'SAMPLE (verify before use): Factory-sealed dry goods with intact packaging.', true),
  ('raw_meat_seafood', 0.00, 0.00, true, 'SAMPLE (verify before use): High-risk raw animal protein is blocked from peer-to-peer rescue.', true),
  ('unpasteurized_dairy', 0.00, 0.00, true, 'SAMPLE (verify before use): Unpasteurized milk or open cream is blocked.', true)
on conflict (category) do update set
  max_hours_ambient = excluded.max_hours_ambient,
  max_hours_chilled = excluded.max_hours_chilled,
  blocked = excluded.blocked,
  notes = excluded.notes,
  is_sample = excluded.is_sample;

