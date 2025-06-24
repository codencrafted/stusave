'use server';
/**
 * @fileOverview An AI flow to predict future spending.
 *
 * - predictNextDaySpending - Predicts the spending for the next day based on history.
 * - SpendingPredictionInput - The input type for the prediction function.
 * - SpendingPredictionOutput - The return type for the prediction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpendingRecordSchema = z.object({
  date: z.string().describe('The date of the spending in YYYY-MM-DD format.'),
  amount: z.number().describe('The amount spent.'),
});

const SpendingPredictionInputSchema = z.object({
  history: z.array(SpendingRecordSchema).describe('A list of past spending records.'),
  currencySymbol: z.string().describe('The currency symbol, e.g., $, €, ₹.'),
});
export type SpendingPredictionInput = z.infer<typeof SpendingPredictionInputSchema>;

const SpendingPredictionOutputSchema = z.object({
  predictedAmount: z.number().describe('The predicted spending amount for the next day.'),
  reasoning: z.string().describe('A brief explanation for the prediction.'),
});
export type SpendingPredictionOutput = z.infer<typeof SpendingPredictionOutputSchema>;

export async function predictNextDaySpending(input: SpendingPredictionInput): Promise<SpendingPredictionOutput> {
  return predictNextDaySpendingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictSpendingPrompt',
  input: {schema: SpendingPredictionInputSchema},
  output: {schema: SpendingPredictionOutputSchema},
  prompt: `You are a financial analyst AI. Your task is to predict the user's spending for tomorrow based on their recent spending history.

Analyze the provided spending data, looking for patterns like daily averages, weekly trends (e.g., higher spending on weekends), or recent spikes.

User's Currency: {{{currencySymbol}}}
Spending History:
{{#each history}}
- Date: {{date}}, Amount: {{amount}}
{{/each}}

Based on this data, predict the total spending amount for the next calendar day. Provide a brief, one-sentence reasoning for your prediction. For example, mention if the prediction is based on a daily average, a recent increase, or a weekly pattern.`,
});

const predictNextDaySpendingFlow = ai.defineFlow(
  {
    name: 'predictNextDaySpendingFlow',
    inputSchema: SpendingPredictionInputSchema,
    outputSchema: SpendingPredictionOutputSchema,
  },
  async (input) => {
    const recentHistory = input.history.slice(-30);
    const {output} = await prompt({...input, history: recentHistory});
    return output!;
  }
);
