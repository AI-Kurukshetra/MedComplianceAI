-- ============================================================
-- Fix: Ensure every question has at least one correct option
-- Run this in Supabase SQL Editor if quiz scores are always 0
-- ============================================================

-- Step 1: Show questions that have NO correct option (diagnosis)
SELECT
  q.id         AS question_id,
  q.body       AS question,
  q.module_id,
  tm.title     AS module_title,
  COUNT(qo.id) AS total_options,
  COUNT(qo.id) FILTER (WHERE qo.is_correct) AS correct_options
FROM public.questions q
JOIN public.training_modules tm ON tm.id = q.module_id
LEFT JOIN public.question_options qo ON qo.question_id = q.id
GROUP BY q.id, q.body, q.module_id, tm.title
HAVING COUNT(qo.id) FILTER (WHERE qo.is_correct) = 0
ORDER BY tm.title, q.position;

-- Step 2: Fix — set the first option (lowest position) as correct
-- for any question that currently has zero correct options.
-- Run this after reviewing Step 1 output.
UPDATE public.question_options qo
SET    is_correct = true
WHERE  qo.id IN (
  SELECT DISTINCT ON (inner_qo.question_id)
         inner_qo.id
  FROM   public.question_options inner_qo
  WHERE  inner_qo.question_id IN (
    -- questions with no correct answer
    SELECT question_id
    FROM   public.question_options
    GROUP  BY question_id
    HAVING COUNT(*) FILTER (WHERE is_correct = true) = 0
  )
  ORDER  BY inner_qo.question_id, inner_qo.position ASC, inner_qo.id ASC
);

-- Step 3: Verify — all questions now have exactly 1 correct option
SELECT
  COUNT(*) FILTER (WHERE correct_count = 0) AS questions_with_no_correct,
  COUNT(*) FILTER (WHERE correct_count = 1) AS questions_with_one_correct,
  COUNT(*) FILTER (WHERE correct_count > 1) AS questions_with_multiple_correct
FROM (
  SELECT question_id, COUNT(*) FILTER (WHERE is_correct) AS correct_count
  FROM   public.question_options
  GROUP  BY question_id
) sub;
