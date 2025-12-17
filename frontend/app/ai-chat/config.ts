// config.ts
// Конфигурация для Groq API (бесплатный и быстрый)

export const config = {
  groq: {
    apiKey: "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",
    
    model: "llama-3.3-70b-versatile",
    maxTokens: 1000,
    temperature: 0.7,
  },
  
  app: {
    name: "ONTHEGO AI Helper",
    version: "1.0.0",
  },
  
  features: {
    quickTest: true,
    explainTopic: true,
    practice: true,
    projectIdeas: true,
  },
};

// Функция для проверки наличия API ключа
export function isConfigured(): boolean {
  return config.groq.apiKey !== "ВАШ_API_КЛЮЧ_GROQ" && 
         config.groq.apiKey.length > 20;
}

export default config;