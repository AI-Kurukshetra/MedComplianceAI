"use server";

import { redirect } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

function asString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitQuiz(formData: FormData) {
  const moduleId = asString(formData, "module_id");
  const rawAnswers = asString(formData, "answers");

  if (!moduleId || !rawAnswers) {
    redirect(`/training/${moduleId || ""}/quiz?error=${encodeURIComponent("Invalid quiz submission")}`);
  }

  const answers = JSON.parse(rawAnswers) as Array<{ questionId: string; optionId: string }>;
  const user = await requireUserContext();
  const supabase = await createClient();

  const questionIds = answers.map((answer) => answer.questionId);
  const { data: options } = await supabase
    .from("question_options")
    .select("id, question_id, is_correct")
    .in("question_id", questionIds);

  const correctByQuestion = new Map<string, string>();
  for (const option of options ?? []) {
    if (option.is_correct) {
      correctByQuestion.set(option.question_id, option.id);
    }
  }

  let correct = 0;
  for (const answer of answers) {
    if (correctByQuestion.get(answer.questionId) === answer.optionId) {
      correct += 1;
    }
  }

  const score = answers.length > 0 ? Number(((correct / answers.length) * 100).toFixed(2)) : 0;

  await supabase.from("assessment_attempts").insert({
    organization_id: user.organizationId,
    user_id: user.userId,
    module_id: moduleId,
    answers,
    score,
    passed: score >= 80,
    completed_at: new Date().toISOString(),
  });

  redirect(`/training/${moduleId}?success=${encodeURIComponent(`Quiz submitted with score ${score}%`)}`);
}
