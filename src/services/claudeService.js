const claudeApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
const claudeApiUrl = 'https://api.anthropic.com/v1/chat/completions';

const formatMessages = (messages, systemPrompt) => {
  const content = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages;
  return content.map((msg) => ({ role: msg.role, content: msg.content }));
};

export const claudeService = {
  async sendMessage(messages, options = {}) {
    if (!claudeApiKey) {
      throw new Error('Claude API 未配置，请设置 VITE_ANTHROPIC_API_KEY 环境变量');
    }

    const {
      model = 'claude-3-haiku-20240307',
      maxTokens = 1024,
      temperature = 0.7,
      systemPrompt = null
    } = options;

    try {
      const response = await fetch(claudeApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': claudeApiKey
        },
        body: JSON.stringify({
          model,
          messages: formatMessages(messages, systemPrompt),
          max_tokens_to_sample: maxTokens,
          temperature
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API 错误: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      const content = result?.choices?.[0]?.message?.content || result?.choices?.[0]?.text || '';

      return {
        success: true,
        content,
        model: result?.model,
        usage: result?.usage
      };
    } catch (error) {
      console.error('调用 Claude API 失败:', error);
      throw new Error(error.message || '调用 Claude API 失败');
    }
  },

  async sendMessageStream(messages, options = {}) {
    const { onChunk } = options;
    const result = await this.sendMessage(messages, options);

    if (onChunk) {
      onChunk(result.content);
    }

    return result;
  },

  isConfigured() {
    return !!claudeApiKey;
  }
};
