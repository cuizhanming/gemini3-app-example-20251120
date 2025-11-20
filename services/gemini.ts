import { GoogleGenAI, FunctionDeclaration, Type, Chat } from '@google/genai';
import { Payslip } from '../types';
import { getPayslips, getPayslipById } from './firebase';

// --- Extraction ---

export const extractPayslipData = async (imageBase64: string): Promise<Partial<Payslip>> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");
  
  const ai = new GoogleGenAI({ apiKey });

  // Extract generic structure
  const model = 'gemini-2.5-flash';
  const prompt = `
    Analyze this image. It is a payslip. 
    Extract the following details in strict JSON format:
    - employer (string)
    - date (string in YYYY-MM-DD format, usually the payment date)
    - period (string in YYYY-MM format)
    - netPay (number)
    - grossPay (number)
    - tax (number, sum of all tax deductions)
    
    If you cannot find a value, use 0 or empty string. Do not wrap in markdown code blocks. Return raw JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned");
    return JSON.parse(text);
  } catch (error) {
    console.error("Extraction failed", error);
    throw error;
  }
};

// --- Chat Tools Definition ---

const listPayslipsTool: FunctionDeclaration = {
  name: 'listPayslips',
  description: 'List the user\'s payslips, optionally filtered by year and month.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      year: { type: Type.NUMBER, description: 'The 4-digit year (e.g. 2023)' },
      month: { type: Type.NUMBER, description: 'The month number (1-12)' }
    }
  }
};

const getPayslipDetailTool: FunctionDeclaration = {
  name: 'getPayslipDetail',
  description: 'Get detailed information about a specific payslip by ID.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'The unique ID of the payslip' }
    },
    required: ['id']
  }
};

// --- Chat Function ---

export const createChatSession = (): Chat | null => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("GoogleGenAI: API_KEY is missing.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are a helpful financial assistant inside a Payslip manager app. 
      You have access to the user's payslip data via tools. 
      When asked about income, taxes, or specific payslips, use the tools to retrieve data.
      Always be concise and professional. Format currency nicely.
      Current Date: ${new Date().toISOString().split('T')[0]}`,
      tools: [{ functionDeclarations: [listPayslipsTool, getPayslipDetailTool] }]
    }
  });
};

// We need a way to inject the UID into the tool execution context
export const executeToolCall = async (name: string, args: any, uid: string): Promise<any> => {
  console.log(`Executing tool ${name} for user ${uid}`, args);
  if (name === 'listPayslips') {
    const slips = await getPayslips(uid, args.year, args.month);
    return { count: slips.length, payslips: slips.map(s => ({ id: s.id, date: s.date, net: s.netPay, employer: s.employer })) };
  }
  if (name === 'getPayslipDetail') {
    const slip = await getPayslipById(uid, args.id);
    return slip || { error: "Payslip not found" };
  }
  return { error: "Unknown tool" };
};