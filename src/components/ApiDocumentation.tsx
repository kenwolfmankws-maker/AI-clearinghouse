import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, BookOpen } from 'lucide-react';

export function ApiDocumentation() {
  return (
    <Card className="bg-slate-900/50 border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">API Documentation</h2>
      </div>

      <Tabs defaultValue="auth" className="w-full">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="limits">Rate Limits</TabsTrigger>
          <TabsTrigger value="models">List Models</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
        </TabsList>


        <TabsContent value="auth" className="space-y-3">
          <p className="text-slate-300 text-sm">Include your API key in the request header:</p>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-700">
            <code className="text-green-400 text-sm">
              curl https://api.aiclearinghouse.com/v1/models \<br />
              &nbsp;&nbsp;-H "x-api-key: YOUR_API_KEY"
            </code>
          </div>
        </TabsContent>

        <TabsContent value="limits" className="space-y-3">
          <p className="text-slate-300 text-sm">Rate limits are enforced per API key based on your tier:</p>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 space-y-2">
            <div className="text-slate-300 text-sm">
              <span className="text-slate-500 font-semibold">Free Tier:</span> 10/min, 50/hour, 100/day
            </div>
            <div className="text-blue-400 text-sm">
              <span className="text-blue-500 font-semibold">Pro Tier:</span> 100/min, 500/hour, 1,000/day
            </div>
            <div className="text-purple-400 text-sm">
              <span className="text-purple-500 font-semibold">Enterprise:</span> Unlimited requests
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-2">
            Rate limit exceeded responses return HTTP 429 with retry-after header.
          </p>
        </TabsContent>

        <TabsContent value="models" className="space-y-3">
          <p className="text-slate-300 text-sm">Get a list of available AI models:</p>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-700">
            <code className="text-green-400 text-sm">
              GET /v1/models<br />
              Response: &#123; "models": [...] &#125;
            </code>
          </div>
        </TabsContent>


        <TabsContent value="generate" className="space-y-3">
          <p className="text-slate-300 text-sm">Generate content using an AI model:</p>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-700">
            <code className="text-green-400 text-sm">
              POST /v1/generate<br />
              &#123; "model": "gpt-4", "prompt": "..." &#125;
            </code>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-300 text-sm">
          <Code className="w-4 h-4 inline mr-2" />
          Full API documentation available at <span className="font-mono">docs.aiclearinghouse.com</span>
        </p>
      </div>
    </Card>
  );
}
