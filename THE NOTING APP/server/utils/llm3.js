const Together = require('together-ai');
require('dotenv').config();

class TogetherAIClient {
  constructor(apiKey = process.env.TOGETHER_API_KEY) {
    if (!apiKey) {
      throw new Error('TOGETHER_API_KEY is required. Please set it in your environment variables or .env file');
    }
    
    this.client = new Together(apiKey);
    this.defaultConfig = {
      model: "meta-llama/Llama-3.2-3B-Instruct-Turbo",
      temperature: 0.7,
      max_tokens: 8000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };
  }

  /**
   * Generate a chat completion using Together AI
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

    try {
      console.log('🤖 Sending request to Together AI...');
      
      const response = await this.client.chat.completions.create({
        messages,
        ...config
      });

      if (!response?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from Together AI');
      }

      const result = {
        content: response.choices[0].message.content,
        model: response.model,
        usage: response.usage,
        finish_reason: response.choices[0].finish_reason,
        created: response.created,
        id: response.id
      };

      console.log('✅ Together AI response received');
      console.log('📊 Usage:', result.usage);
      
      return result;

    } catch (error) {
      console.error('❌ Together AI error:', error.message);
      
      // Handle specific error types
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error?.message || error.message;
        
        switch (status) {
          case 400:
            throw new Error(`Bad Request: ${message}`);
          case 401:
            throw new Error('Unauthorized: Invalid API key');
          case 429:
            throw new Error('Rate limit exceeded. Please try again later');
          case 500:
            throw new Error('Together AI server error. Please try again later');
          default:
            throw new Error(`API Error (${status}): ${message}`);
        }
      }
      
      throw new Error(`Together AI request failed: ${error.message}`);
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
   * Stream chat completion (if supported by the model)
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Optional configuration overrides
   * @returns {Promise<AsyncGenerator>} Stream of response chunks
   */
  async *streamChat(messages, options = {}) {
    const config = { ...this.defaultConfig, ...options, stream: true };
    
    try {
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
    } catch (error) {
      console.error('❌ Stream error:', error.message);
      throw new Error(`Streaming failed: ${error.message}`);
    }
  }

  /**
   * Get available models
   * @returns {Promise<Array>} List of available models
   */
  async getModels() {
    try {
      const response = await this.client.models.list();
      return response.data || [];
    } catch (error) {
      console.error('❌ Failed to fetch models:', error.message);
      throw new Error(`Failed to fetch models: ${error.message}`);
    }
  }

  /**
   * Update default configuration
   * @param {Object} config - New default configuration
   */
  updateDefaults(config) {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }
}

// Create default instance
const defaultClient = new TogetherAIClient();

// Export both class and convenience function for backward compatibility
module.exports = {
  TogetherAIClient,
  call: (messages, options) => defaultClient.chat(messages, options),
  complete: (prompt, options) => defaultClient.complete(prompt, options),
  stream: (messages, options) => defaultClient.streamChat(messages, options),
  getModels: () => defaultClient.getModels(),
  client: defaultClient
};