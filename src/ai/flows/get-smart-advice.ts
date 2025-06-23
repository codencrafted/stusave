'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing smart money-saving advice to students based on their spending habits.
 *
 * - getSmartAdvice - A function that takes a spending summary as input and returns a money-saving tip from the AI.
 * - GetSmartAdviceInput - The input type for the getSmartAdvice function.
 * - GetSmartAdviceOutput - The return type for the getSmartAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetSmartAdviceInputSchema = z.object({
  spendingSummary: z
    .string()
    .describe('A summary of the user\'s spending, including amounts and categories.'),
  budget: z.number().describe('The user\'s monthly budget.'),
});
export type GetSmartAdviceInput = z.infer<typeof GetSmartAdviceInputSchema>;

const GetSmartAdviceOutputSchema = z.object({
  advice: z.string().describe('A short, personalized money-saving tip.'),
});
export type GetSmartAdviceOutput = z.infer<typeof GetSmartAdviceOutputSchema>;

export async function getSmartAdvice(input: GetSmartAdviceInput): Promise<GetSmartAdviceOutput> {
  return getSmartAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getSmartAdvicePrompt',
  input: {schema: GetSmartAdviceInputSchema},
  output: {schema: GetSmartAdviceOutputSchema},
  prompt: `You are a personal money advisor for students. Analyze their spending habits and provide a short, actionable money-saving tip.

Here is their spending summary: {{{spendingSummary}}}
Their budget is: {{{budget}}}

Give me one short saving tip.`,
});

const getSmartAdviceFlow = ai.defineFlow(
  {
    name: 'getSmartAdviceFlow',
    inputSchema: GetSmartAdviceInputSchema,
    outputSchema: GetSmartAdviceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
