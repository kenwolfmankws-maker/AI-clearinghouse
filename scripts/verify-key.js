// Verify that OPENAI_API_KEY works without needing PowerShell env setup
require('dotenv').config();
const OpenAI = require('openai');

(async () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error('❌ OPENAI_API_KEY not set. Create a .env file with:');
    console.error('   OPENAI_API_KEY=sk-your-real-key');
    process.exit(1);
  }

  const client = new OpenAI({ apiKey: key });
  try {
    const models = await client.models.list();
    console.log(`✅ Key looks good. Models available: ${models.data?.length ?? 'unknown'}`);
  } catch (e) {
    console.error('❌ Key verification failed:', e.message);
    process.exit(1);
  }
})();
