import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const parseQuestionsFromText = async (inputText: string): Promise<Question[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key eksik. Lütfen ortam değişkenlerini kontrol edin.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Sen uzman bir hukuk eğitmenisin. Aşağıdaki metin, Hukuk Mesleklerine Giriş Sınavı (HMGS) için hazırlanmış soruları (veya ham metinleri) içermektedir.
    
    Görevini yaparken şunlara dikkat et:
    1. Metni analiz et ve çoktan seçmeli soruları çıkar.
    2. Eğer metinde cevap anahtarı yoksa, kendi hukuk bilgini kullanarak doğru cevabı ve açıklamasını ekle.
    3. Kategoriyi (Örn: Anayasa Hukuku, Ceza Hukuku vb.) belirle.
    4. Çıktı kesinlikle geçerli bir JSON formatında olmalı.
    
    İşlenecek Metin:
    "${inputText}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Unique ID generate random string" },
              category: { type: Type.STRING },
              text: { type: Type.STRING, description: "Soru metni" },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Şıklar (A, B, C... olmadan sadece metin)" },
              correctAnswer: { type: Type.STRING, description: "Doğru şıkkın tam metni" },
              explanation: { type: Type.STRING, description: "Cevabın neden doğru olduğuna dair kısa açıklama" }
            },
            required: ["id", "category", "text", "options", "correctAnswer"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as Question[];

  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Sorular oluşturulurken bir hata oluştu.");
  }
};

export { parseQuestionsFromText };
