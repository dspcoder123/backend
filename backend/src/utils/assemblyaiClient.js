const axios = require("axios");
const fs = require("fs");

const BASE = "https://api.assemblyai.com/v2";
const headers = () => ({
  authorization: process.env.ASSEMBLYAI_API_KEY,
});

async function uploadLocalFile(filePath) {
  const stream = fs.createReadStream(filePath);
  const res = await axios.post(`${BASE}/upload`, stream, {
    headers: {
      ...headers(),
      "transfer-encoding": "chunked",
      "content-type": "application/octet-stream",
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 300_000,
  });
  return res.data.upload_url; // URL to use as audio_url
}

async function createTranscript(audio_url, options = {}) {
    const baseOptions = {
        summarization: true,
        summary_model: "informative",
        summary_type: "bullets",
        auto_highlights: true,
        sentiment_analysis: true,
        auto_chapters: false // set true if you want chapter summaries too
      };
      
      const body = { audio_url, ...baseOptions, ...options };
      
  const res = await axios.post(`${BASE}/transcript`, body, { headers: headers() });
  return res.data; // contains id, status
}

async function getTranscript(id) {
  const res = await axios.get(`${BASE}/transcript/${id}`, { headers: headers() });
  return res.data; // contains status/text/etc.
}

async function waitForCompletion(id, { timeoutMs = 600_000, intervalMs = 3000 } = {}) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const data = await getTranscript(id);
    if (data.status === "completed") return data;
    if (data.status === "error") throw new Error(data.error || "Transcript error");
    if (Date.now() - start > timeoutMs) throw new Error("Transcription timeout");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

module.exports = { uploadLocalFile, createTranscript, getTranscript, waitForCompletion };
