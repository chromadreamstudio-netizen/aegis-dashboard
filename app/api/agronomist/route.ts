import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// تهيئة الاتصال بقاعدة البيانات
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// تهيئة Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `
You are 'The Agronomist Cloud AI Agent' for AegisCrop.
Your task is to convert human agronomic instructions into a structured JSON policy for the Edge Guardian Agent.
You MUST respond ONLY with a valid JSON object matching this schema:
{
  "parameter_name": string (e.g., "moisture", "temperature"),
  "condition_operator": string (must be strictly one of: "<", ">", "="),
  "threshold_value": number (e.g., 25.0, 32.5),
  "action_to_take": string (e.g., "PUMP_ON", "PUMP_OFF")
}
Do not include any extra text or markdown formatting.
`;

export async function POST(req: Request) {
  try {
    const { instruction } = await req.json();

    // استخدم نفس اسم الموديل الذي عمل معك بنجاح في بايثون
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash', // قم بتغييره إلى الموديل الشغال لديك
        generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `${SYSTEM_PROMPT}\n\nHuman Instruction: ${instruction}`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const policyData = JSON.parse(responseText);

    // حفظ السياسة في Supabase ليقرأها الوكيل الطرفي (Edge Agent)
    const { data, error } = await supabase
      .from('agent_policies')
      .insert([{
        parameter_name: policyData.parameter_name,
        condition_operator: policyData.condition_operator,
        threshold_value: policyData.threshold_value,
        action_to_take: policyData.action_to_take,
        is_active: true
      }]);

    if (error) throw error;

    return NextResponse.json({ success: true, policy: policyData });
  } catch (error: any) {
    console.error("Agronomist API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}