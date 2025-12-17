// groq-service.ts
// Бесплатный и быстрый AI сервис на базе Groq

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GroqResponse {
  success: boolean;
  message?: string;
  error?: string;
  responseTime?: number;
}

class GroqService {
  private apiKey: string;
  private apiUrl: string = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(
    userMessage: string,
    conversationHistory: Message[] = []
  ): Promise<GroqResponse> {
    const startTime = Date.now();

    try {
      const messages: Message[] = [
        {
          role: 'system',
          content: `Ты - AI помощник в образовательной платформе ONTHEGO. 
Помогай студентам с учебными вопросами, объясняй сложные темы простым языком, 
давай персональные рекомендации и проводи по учебному материалу. 
Отвечай на русском языке, будь дружелюбным и поддерживающим.`,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage,
        },
      ];

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Ошибка API Groq');
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        message: data.choices[0].message.content,
        responseTime,
      };
    } catch (error) {
      console.error('Ошибка Groq Service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.sendMessage('Привет');
      return result.success;
    } catch {
      return false;
    }
  }
}

export default GroqService;