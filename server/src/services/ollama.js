import http from 'http';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';

export function generateJSON(prompt) {
  return new Promise((resolve, reject) => {
    console.log(`[Ollama] Sending request (prompt length: ${prompt.length} chars)...`);
    const startTime = Date.now();

    const url = new URL(`${OLLAMA_URL}/api/generate`);
    const postData = JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: prompt,
      format: 'json',
      stream: false
    });

    const options = {
      hostname: url.hostname,
      port: url.port || 11434,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 300000 // 5 minutes
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          console.log(`[Ollama] Response received in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
          const parsed = JSON.parse(data);
          resolve(JSON.parse(parsed.response));
        } catch (err) {
          reject(new Error(`Failed to parse Ollama response: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Ollama request timed out after 5 minutes'));
    });

    req.write(postData);
    req.end();
  });
}
