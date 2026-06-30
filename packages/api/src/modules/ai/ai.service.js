import { createLogger } from '../../lib/logger.js';
import Groq from 'groq-sdk';
import { config } from '../../config/env.js';
import { loggedCall } from '../../lib/logged-fetch.js';
const log = createLogger('ai-service');
const groq = new Groq({
    apiKey: config.GROQ_API_KEY,
});
/**
 * AIService — Groq LLM integration for farm suggestions
 * Generates AI-powered recommendations based on farm context
 */
export class AIService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Generate daily suggestions for a farmer
     * Looks at recent records, health events, and lab results
     */
    async generateSuggestions(farmerId) {
        const [farmerProfile, recentRecords, healthEvents, labResults] = await Promise.all([
            this.prisma.farmerProfile.findUnique({
                where: { id: farmerId },
            }),
            this.prisma.farmRecord.findMany({
                where: { farmerId },
                orderBy: { recordDate: 'desc' },
                take: 7,
            }),
            this.prisma.healthEvent.findMany({
                where: { farmerId },
                orderBy: { eventDate: 'desc' },
                take: 5,
            }),
            this.prisma.labRequest.findMany({
                where: { farmerId },
                orderBy: { createdAt: 'desc' },
                take: 3,
            }),
        ]);
        if (!farmerProfile) {
            throw new Error(`Farmer profile not found: ${farmerId}`);
        }
        // Build context for LLM
        const context = {
            farmType: farmerProfile.farmType,
            animalCount: farmerProfile.animalCount,
            recentMortality: recentRecords.length > 0
                ? recentRecords[0].mortalityCount
                : 0,
            avgFeed: recentRecords.length > 0
                ? recentRecords.reduce((sum, r) => sum + (r.feedConsumedKg || 0), 0) /
                    recentRecords.length
                : 0,
            lastVaccination: healthEvents.find((e) => e.eventType === 'vaccination')
                ?.eventDate || null,
            lastTreatment: healthEvents.find((e) => e.eventType === 'treatment')
                ?.eventDate || null,
            pendingLabTests: labResults.filter((r) => !r.resultUrl).length,
        };
        const prompt = this._buildPrompt(context, farmerProfile.country);
        log.info('Generating AI suggestions', {
            farmerId,
            farmType: farmerProfile.farmType,
        });
        const suggestions = await loggedCall('groq.suggestions', async () => {
            const message = await groq.messages.create({
                model: config.GROQ_MODEL,
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });
            const text = message.content[0].type === 'text' ? message.content[0].text : '';
            return this._parseResponse(text);
        }, { farmerId, farmType: farmerProfile.farmType });
        // Store in database
        const aiSuggestion = await this.prisma.aiSuggestion.create({
            data: {
                farmerId,
                modelUsed: config.GROQ_MODEL,
                promptContext: JSON.stringify(context),
                suggestion: JSON.stringify(suggestions),
            },
        });
        log.info('AI suggestions generated and stored', {
            suggestionId: aiSuggestion.id,
            farmerId,
        });
        return aiSuggestion;
    }
    /**
     * Get last suggestion for farmer
     */
    async getLastSuggestion(farmerId) {
        const suggestion = await this.prisma.aiSuggestion.findFirst({
            where: { farmerId },
            orderBy: { generatedAt: 'desc' },
        });
        return suggestion;
    }
    /**
     * Mark suggestion as helpful/unhelpful for feedback loop
     */
    async rateSuggestion(suggestionId, helpful) {
        const updated = await this.prisma.aiSuggestion.update({
            where: { id: suggestionId },
            data: { wasHelpful: helpful },
        });
        return updated;
    }
    /**
     * Build LLM prompt with farm context
     */
    _buildPrompt(context, country) {
        const countryContext = country === 'CM' ? 'Cameroon' : 'Republic of Congo';
        return `You are an expert veterinarian AI assistant helping livestock farmers in ${countryContext}.

Farm Context:
- Type: ${context.farmType}
- Animal Count: ${context.animalCount}
- Recent Mortality: ${context.avgMortality} animals
- Average Feed Consumption: ${context.avgFeed?.toFixed(1) || 0} kg/day
- Last Vaccination: ${context.lastVaccination || 'Unknown'}
- Last Treatment: ${context.lastTreatment || 'Unknown'}
- Pending Lab Tests: ${context.pendingLabTests}

Based on this context, provide 3-5 specific, actionable recommendations to improve farm health and productivity. 
Format your response as JSON array with objects containing: title (string), content (string), priority (high/medium/low).`;
    }
    /**
     * Parse LLM response into structured suggestions
     */
    _parseResponse(text) {
        try {
            // Extract JSON from response (may be wrapped in markdown code blocks)
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch)
                return { error: 'Could not parse response' };
            return JSON.parse(jsonMatch[0]);
        }
        catch (error) {
            log.warn('Failed to parse LLM response', { error });
            return { error: 'Invalid response format' };
        }
    }
}
//# sourceMappingURL=ai.service.js.map