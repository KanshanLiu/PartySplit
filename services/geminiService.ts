
import { GoogleGenAI } from "@google/genai";
import { Expense, Participant } from "../types.ts";

export const getExpenseInsights = async (expenses: Expense[], participants: Participant[]) => {
  const apiKey = (window as any).process?.env?.API_KEY || "";
  if (!apiKey) return "请配置 API Key 以获取 AI 建议。";

  const ai = new GoogleGenAI({ apiKey });
  
  const expenseSummary = expenses.map(e => {
    const payerName = participants.find(p => p.id === e.payerId)?.name || 'Unknown';
    return `${payerName} paid ${e.amount} for ${e.description}`;
  }).join('\n');

  const prompt = `Based on the party expenses: ${expenseSummary}, provide a brief 3-bullet summary in Chinese.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Gemini insights error:", error);
    return "无法获取AI建议。";
  }
};
