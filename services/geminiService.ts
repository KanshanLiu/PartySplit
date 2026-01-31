
import { GoogleGenAI, Type } from "@google/genai";
import { Expense, Participant } from "../types";

export const getExpenseInsights = async (expenses: Expense[], participants: Participant[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const expenseSummary = expenses.map(e => {
    const payerName = participants.find(p => p.id === e.payerId)?.name || 'Unknown';
    return `${payerName} paid ${e.amount} for ${e.description}`;
  }).join('\n');

  const prompt = `
    Based on the following party expenses, provide a brief, friendly 3-bullet summary in Chinese.
    Total Participants: ${participants.length}
    Expenses:
    ${expenseSummary}

    Analyze who spent the most, what the money was spent on, and maybe a witty remark about the party spending.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini insights error:", error);
    return "无法获取AI建议，请检查网络或API设置。";
  }
};
