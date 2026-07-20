const MAX_INPUT_LENGTH = 6000;
const MAX_OUTPUT_TOKENS = 1800;

const SYSTEM_INSTRUCTIONS = `You are the AI Clearinghouse Judgment Gate, a conservative workflow-governance analyst.

Apply this doctrine in order:
1. Purpose before power: identify the legitimate outcome before considering automation.
2. Boundary before action: state data, authority, legal, safety, security, financial, reputational, and reversibility limits.
3. Judgment before automation: reserve consequential, ambiguous, exceptional, or irreversible decisions for an accountable human.

Assess only the workflow described. Do not invent missing safeguards. Distinguish assistance from autonomous action. Treat external communications, approvals, access changes, money movement, legal or medical conclusions, personnel decisions, sensitive-data handling, destructive actions, and material scope changes as human judgment gates unless the workflow explicitly provides stronger accountable controls.

Assign exactly one governance rating:
- green: bounded, low-impact, reversible automation with clear controls;
- yellow: automation is useful but requires explicit human gates or stronger boundaries;
- red: the proposed automation is unsafe, unlawful, unbounded, or too consequential to automate as described.

Return practical, workflow-specific guidance. Each list must contain 1-6 concise items. The operating plan must be ordered and include monitoring, escalation, and rollback or stop conditions. Never claim compliance or safety as a certainty.`;

const RESPONSE_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        governanceRating: { type: 'string', enum: ['green', 'yellow', 'red'] },
        purpose: { type: 'string', minLength: 1, maxLength: 1200 },
        safeAutomation: {
            type: 'array',
            minItems: 1,
            maxItems: 6,
            items: { type: 'string', minLength: 1, maxLength: 500 },
        },
        humanJudgmentGates: {
            type: 'array',
            minItems: 1,
            maxItems: 6,
            items: { type: 'string', minLength: 1, maxLength: 500 },
        },
        risksAndBoundaries: {
            type: 'array',
            minItems: 1,
            maxItems: 6,
            items: { type: 'string', minLength: 1, maxLength: 500 },
        },
        recommendedOperatingPlan: {
            type: 'array',
            minItems: 1,
            maxItems: 6,
            items: { type: 'string', minLength: 1, maxLength: 600 },
        },
    },
    required: [
        'governanceRating',
        'purpose',
        'safeAutomation',
        'humanJudgmentGates',
        'risksAndBoundaries',
        'recommendedOperatingPlan',
    ],
};

function getOutputText(response) {
    if (typeof response.output_text === 'string') return response.output_text;

    for (const item of response.output || []) {
        for (const content of item.content || []) {
            if (content.type === 'output_text' && typeof content.text === 'string') {
                return content.text;
            }
        }
    }

    return '';
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const workflow = typeof req.body?.workflow === 'string' ? req.body.workflow.trim() : '';

    if (!workflow) {
        return res.status(400).json({ error: 'A workflow description is required.' });
    }

    if (workflow.length > MAX_INPUT_LENGTH) {
        return res.status(400).json({
            error: `Workflow description must be ${MAX_INPUT_LENGTH.toLocaleString()} characters or fewer.`,
        });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'The analysis service is not configured.' });
    }

    try {
        const openAIResponse = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-5.6',
                instructions: SYSTEM_INSTRUCTIONS,
                input: `Analyze this workflow and return the required governance assessment:\n\n${workflow}`,
                reasoning: { effort: 'medium' },
                max_output_tokens: MAX_OUTPUT_TOKENS,
                text: {
                    verbosity: 'medium',
                    format: {
                        type: 'json_schema',
                        name: 'judgment_gate_assessment',
                        strict: true,
                        schema: RESPONSE_SCHEMA,
                    },
                },
            }),
        });

        if (!openAIResponse.ok) {
            const requestId = openAIResponse.headers.get('x-request-id');
            console.error('Judgment Gate OpenAI request failed', {
                status: openAIResponse.status,
                requestId,
            });
            return res.status(502).json({ error: 'The analysis service could not complete the request.' });
        }

        const response = await openAIResponse.json();
        const outputText = getOutputText(response);

        if (!outputText) {
            console.error('Judgment Gate received no model output', { requestId: response._request_id });
            return res.status(502).json({ error: 'The analysis service returned an empty result.' });
        }

        const assessment = JSON.parse(outputText);
        return res.status(200).json(assessment);
    } catch (error) {
        console.error('Judgment Gate API error', {
            name: error instanceof Error ? error.name : 'UnknownError',
        });
        return res.status(500).json({ error: 'Unable to analyze the workflow right now.' });
    }
}
