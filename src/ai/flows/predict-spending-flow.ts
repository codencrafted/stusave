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
  dayOfWeek: z.string().describe('The day of the week for the spending (e.g., Monday, Tuesday).'),
});

const SpendingPredictionInputSchema = z.object({
  history: z.array(SpendingRecordSchema).describe('A list of past spending records.'),
  currencySymbol: z.string().describe('The currency symbol, e.g., $, €, ₹.'),
  tomorrowDayOfWeek: z.string().describe('The day of the week for tomorrow.'),
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
  prompt: `You are a financial analyst AI for a student money-saving app. Your task is to predict the user's spending for tomorrow based on their recent spending history.

Analyze the provided spending data. Look for patterns like:
- Daily averages.
- Weekly trends (e.g., higher spending on Fridays and weekends).
- Recent spikes or drops in spending.
- Spending habits specific to certain days of the week.

The prediction is for tomorrow, which is a {{{tomorrowDayOfWeek}}}. Use this information to make a more accurate prediction. For example, if tomorrow is a Saturday and the user tends to spend more on Saturdays, your prediction should reflect that.

User's Currency: {{{currencySymbol}}}
Spending History:
{{#each history}}
- Date: {{date}} ({{dayOfWeek}}), Amount: {{amount}}
{{/each}}

Based on this data, predict the total spending amount for tomorrow ({{{tomorrowDayOfWeek}}}). Provide a brief, one-sentence reasoning for your prediction that explains the key factor you considered (e.g., "Based on higher spending on previous weekends," or "Following a recent spike in expenses."). The predicted amount should be a number, not a range.`,
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
