// src/models/lmStudioModel.js
const axios = require("axios");

const LM_BASE_URL = process.env.LM_STUDIO_URL || "http://127.0.0.1:1234/v1";
const LM_MODEL = process.env.LM_STUDIO_MODEL || "qwen3-1.7b";

async function generateChatCompletion(messages) {
  const url = `${LM_BASE_URL}/chat/completions`;

  const response = await axios.post(
    url,
    {
      model: LM_MODEL,
      messages,
      max_tokens: 128,     // limit length
      temperature: 0.8
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer lm-studio-local"
      },
      timeout: 300_000
    }
  );

  return response.data;
}

module.exports = {
  generateChatCompletion
};
