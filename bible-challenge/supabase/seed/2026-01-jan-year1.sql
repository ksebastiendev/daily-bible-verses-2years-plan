-- Seed: Janvier — Année 1 (Lecture quotidienne en 2 ans)
-- Idempotent: utilise ON CONFLICT pour éviter les doublons

WITH plan AS (
  INSERT INTO public.reading_plans (name, year, month, timezone, is_active)
  VALUES ('Bible Challenge - 2 ans', 1, 1, 'Africa/Porto-Novo', true)
  ON CONFLICT (year, month) DO UPDATE
    SET name = EXCLUDED.name,
        timezone = EXCLUDED.timezone,
        is_active = EXCLUDED.is_active
  RETURNING id
),
rows AS (
  VALUES
    (1, 'Ps1-3', 'Mat1:1-17'),
    (2, 'Ps4-6', 'Mat1:18-25'),
    (3, 'Gen1', 'Mat2:1-11'),
    (4, 'Gen2', 'Mat2:12-18'),
    (5, 'Gen3', 'Mat3:1-12'),
    (6, 'Gen4', 'Mat3:13-17'),
    (7, 'Gen5', 'Mat4:1-11'),
    (8, 'Gen6', 'Mat4:12-25'),
    (9, 'Gen7', 'Mat5:1-12'),
    (10, 'Gen8', 'Mat5:13-20'),
    (11, 'Gen9', 'Mat5:21-26'),
    (12, 'Gen10', 'Mat5:27-37'),
    (13, 'Gen11-12', 'Mat5:38-48'),
    (14, 'Gen13-14', 'Mat6:1-15'),
    (15, 'Gen15-16', 'Mat6:7-15'),
    (16, 'Gen17-18', 'Mat6:16-24'),
    (17, 'Gen19', 'Mat6:25-34'),
    (18, 'Gen20', 'Ps7-8; Mat6:1-12'),
    (19, 'Gen21', 'Mat7:13-14; Mat26:16-17'),
    (20, 'Gen22', 'Mat7:21-29'),
    (21, 'Gen23', 'Mat8:1-13'),
    (22, 'Gen24', 'Mat8:14-22'),
    (23, 'Gen24', 'Mat8:23-34'),
    (24, 'Gen25', 'Mat9:1-13'),
    (25, 'Gen26', 'Mat9:14-26'),
    (26, 'Gen27', 'Mat9:27-38'),
    (27, 'Gen28', 'Mat10:1-17'),
    (28, 'Gen29', 'Mat10:18-23'),
    (29, 'Gen30', 'Mat10:24-42'),
    (30, 'Gen31', 'Mat11:1-6'),
    (31, 'Gen32', 'Mat11:7-19')
)
INSERT INTO public.plan_days (
  plan_id,
  day_index,
  morning_reference,
  evening_reference,
  reference,
  passage_text,
  morning_text,
  evening_text,
  main_verse
)
SELECT
  (SELECT id FROM plan),
  r.column1 AS day_index,
  r.column2 AS morning_reference,
  r.column3 AS evening_reference,
  r.column2 || ' | ' || r.column3 AS reference,
  NULL::text AS passage_text,
  NULL::text AS morning_text,
  NULL::text AS evening_text,
  NULL::text AS main_verse
FROM rows r
ON CONFLICT (plan_id, day_index) DO UPDATE SET
  morning_reference = EXCLUDED.morning_reference,
  evening_reference = EXCLUDED.evening_reference,
  reference = EXCLUDED.reference,
  passage_text = EXCLUDED.passage_text,
  morning_text = EXCLUDED.morning_text,
  evening_text = EXCLUDED.evening_text,
  main_verse = EXCLUDED.main_verse;
