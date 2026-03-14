import { z } from "zod";

export const SubmitAssessmentSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      optionId: z.string().uuid(),
    }),
  ),
});
