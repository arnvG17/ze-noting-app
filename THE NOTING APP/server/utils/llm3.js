// server/utils/llm3.js — Multi-LLM client (Groq / Together AI)
const { OpenAI } = require('openai');
const { getNextGroqKey, hasGroqKeys } = require('./groqKeys');
require('dotenv').config();

class TogetherAIClient {
  constructor() {
    const hasGroq = hasGroqKeys();
    const apiKey = hasGroq ? getNextGroqKey() : process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      throw new Error('API Key (Groq or TOGETHER_API_KEY) is required. Please set it in your environment variables or .env file');
    }

    if (hasGroq) {
      this.client = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.groq.com/openai/v1'
      });
      this.defaultConfig = {
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.95
      };
      console.log('🤖 LLM Client Initialized: Groq (llama-3.3-70b-versatile)');
    } else {
      this.client = new OpenAI({
        apiKey: process.env.TOGETHER_API_KEY,
        baseURL: 'https://api.together.xyz/v1'
      });
      this.defaultConfig = {
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.95
      };
      console.log('🤖 LLM Client Initialized: Together AI (Llama-3.3-70B-Instruct-Turbo)');
    }
  }

  /**
   * Generate a chat completion
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Optional configuration overrides
   * @returns {Promise<Object>} Response object with content and metadata
   */
  async chat(messages, options = {}) {
    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array');
    }

    // Validate message format
    const validRoles = ['system', 'user', 'assistant'];
    for (const message of messages) {
      if (!message.role || !validRoles.includes(message.role)) {
        throw new Error(`Invalid message role. Must be one of: ${validRoles.join(', ')}`);
      }
      if (!message.content || typeof message.content !== 'string') {
        throw new Error('Each message must have a content property with a string value');
      }
    }

    // Merge default config with provided options
    const config = { ...this.defaultConfig, ...options };
    const isGroq = this.client.baseURL.includes('groq');
    let attempts = 0;
    const maxAttempts = isGroq ? 3 : 1;

    while (attempts < maxAttempts) {
      try {
        console.log('🤖 Sending request to LLM...');

        if (isGroq) {
          const nextKey = getNextGroqKey();
          if (nextKey) {
            this.client.apiKey = nextKey;
            console.log(`🤖 Using Groq API Key (attempt ${attempts + 1}): ...${nextKey.slice(-6)}`);
          }
        }

        const response = await this.client.chat.completions.create({
          messages,
          ...config
        });

        if (!response?.choices?.[0]?.message?.content) {
          throw new Error('Invalid response format from LLM');
        }

        const result = {
          content: response.choices[0].message.content,
          model: response.model,
          usage: response.usage,
          finish_reason: response.choices[0].finish_reason,
          created: response.created,
          id: response.id
        };

        console.log('✅ LLM response received');
        return result;

      } catch (error) {
        attempts++;
        console.error(`❌ LLM attempt ${attempts} failed:`, error.message);
        
        if (attempts >= maxAttempts) {
          throw new Error(`LLM request failed after ${attempts} attempts: ${error.message}`);
        }
        
        console.log('🔄 Retrying with next Groq API key...');
      }
    }
  }

  /**
   * Generate a simple text completion
   * @param {string} prompt - The prompt to complete
   * @param {Object} options - Optional configuration overrides
   * @returns {Promise<string>} Generated text content
   */
  async complete(prompt, options = {}) {
    const messages = [{ role: 'user', content: prompt }];
    const response = await this.chat(messages, options);
    return response.content;
  }

  /**
   * Stream chat completion
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Optional configuration overrides
   * @returns {Promise<AsyncGenerator>} Stream of response chunks
   */
  async *streamChat(messages, options = {}) {
    const config = { ...this.defaultConfig, ...options, stream: true };
    const isGroq = this.client.baseURL.includes('groq');
    let attempts = 0;
    const maxAttempts = isGroq ? 3 : 1;

    while (attempts < maxAttempts) {
      try {
        if (isGroq) {
          const nextKey = getNextGroqKey();
          if (nextKey) {
            this.client.apiKey = nextKey;
            console.log(`🤖 Using Groq API Key for stream (attempt ${attempts + 1}): ...${nextKey.slice(-6)}`);
          }
        }

        const stream = await this.client.chat.completions.create({
          messages,
          ...config
        });

        for await (const chunk of stream) {
          if (chunk.choices?.[0]?.delta?.content) {
            yield {
              content: chunk.choices[0].delta.content,
              finish_reason: chunk.choices[0].finish_reason,
              id: chunk.id
            };
          }
        }
        return;

      } catch (error) {
        attempts++;
        console.error(`❌ Stream attempt ${attempts} failed:`, error.message);
        
        if (attempts >= maxAttempts) {
          throw new Error(`Streaming failed after ${attempts} attempts: ${error.message}`);
        }
        
        console.log('🔄 Retrying stream with next Groq API key...');
      }
    }
  }
}

// Create default instance lazily so env can load
let defaultClient = null;
function getClientInstance() {
  if (!defaultClient) {
    defaultClient = new TogetherAIClient();
  }
  return defaultClient;
}

// Export both class and convenience function for backward compatibility
module.exports = {
  TogetherAIClient,
  call: (messages, options) => getClientInstance().chat(messages, options),
  complete: (prompt, options) => getClientInstance().complete(prompt, options),
  stream: (messages, options) => getClientInstance().streamChat(messages, options),
  client: {
    chat: {
      completions: {
        create: (args) => getClientInstance().client.chat.completions.create(args)
      }
    }
  }
};