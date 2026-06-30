import { PrismaClient } from '@prisma/client';
/**
 * AIService — Groq LLM integration for farm suggestions
 * Generates AI-powered recommendations based on farm context
 */
export declare class AIService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Generate daily suggestions for a farmer
     * Looks at recent records, health events, and lab results
     */
    generateSuggestions(farmerId: string): Promise<any>;
    /**
     * Get last suggestion for farmer
     */
    getLastSuggestion(farmerId: string): Promise<any>;
    /**
     * Mark suggestion as helpful/unhelpful for feedback loop
     */
    rateSuggestion(suggestionId: string, helpful: boolean): Promise<any>;
    /**
     * Build LLM prompt with farm context
     */
    private _buildPrompt;
    /**
     * Parse LLM response into structured suggestions
     */
    private _parseResponse;
}
//# sourceMappingURL=ai.service.d.ts.map