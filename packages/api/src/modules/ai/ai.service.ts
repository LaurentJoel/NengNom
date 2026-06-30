import { PrismaClient } from '@prisma/client'
import Groq from 'groq-sdk'
import { createLogger } from '../../lib/logger.js'
import { NotFoundError } from '../../lib/errors.js'
import { config } from '../../config/env.js'
import { TIMEOUTS } from '../../config/constants.js'

const log = createLogger('ai-service')

const FALLBACK_SUGGESTIONS = [
  {
    title: 'Vaccination Maladie de Newcastle à prévoir',
    content: 'Selon vos fiches d\'élevage, votre troupeau devrait recevoir un rappel contre la maladie de Newcastle. Planifiez la vaccination dans les 7 prochains jours pour maintenir l\'immunité.',
    priority: 'high',
    category: 'santé',
  },
  {
    title: 'Ratio de conversion alimentaire à surveiller',
    content: 'La consommation de nourriture a augmenté de 15% sans gain de poids correspondant. Envisagez d\'utiliser une formule plus riche en protéines pour vos poulets de chair.',
    priority: 'medium',
    category: 'nutrition',
  },
  {
    title: 'Tendance de mortalité détectée',
    content: 'La mortalité quotidienne dépasse 0.3% depuis 3 jours consécutifs. Vérifiez la ventilation et la qualité de l\'eau — signes possibles d\'un problème respiratoire.',
    priority: 'high',
    category: 'santé',
  },
  {
    title: 'Fenêtre d\'abattage optimal approche',
    content: 'Vos poulets approchent du poids optimal de marché (2.2–2.5 kg). Envisagez de vendre dans les 10 prochains jours pour maximiser la rentabilité.',
    priority: 'medium',
    category: 'production',
  },
  {
    title: 'Rappel pour le déparasitage',
    content: 'Il y a 8 semaines depuis le dernier déparasitage. Planifiez un traitement pour éviter les pertes de productivité dues aux parasites internes.',
    priority: 'low',
    category: 'santé',
  },
  {
    title: 'Risque de maladie de Gumboro élevé',
    content: 'Des alertes régionales signalent une activité IBD (Gumboro) accrue dans votre zone. Assurez-vous que les poussins de moins de 6 semaines sont correctement vaccinés.',
    priority: 'high',
    category: 'biosécurité',
  },
  {
    title: 'Nettoyage du système d\'eau recommandé',
    content: 'Les abreuvoirs doivent être rincés et désinfectés toutes les 2 semaines. Une mauvaise hygiène de l\'eau est une cause majeure d\'infections bactériennes en aviculture.',
    priority: 'low',
    category: 'biosécurité',
  },
]

const VALID_PRIORITIES = new Set(['high', 'medium', 'low'])

let groqClient: Groq | null = null

function getGroqClient(): Groq | null {
  if (groqClient) return groqClient
  const key = config.GROQ_API_KEY
  if (!key || key.includes('test') || key.includes('development')) return null
  try {
    groqClient = new Groq({ apiKey: key })
    return groqClient
  } catch {
    return null
  }
}

function sanitizePromptField(val: unknown, maxLen = 100): string {
  return String(val ?? '').replace(/[\n\r]/g, ' ').trim().slice(0, maxLen)
}

export class AIService {
  constructor(private prisma: PrismaClient) {}

  private async getFarmerProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!profile) throw new NotFoundError('Farmer profile', userId)
    return profile.id
  }

  private async callGroqAI(context: Record<string, any>): Promise<any[]> {
    const client = getGroqClient()
    if (!client) {
      log.info('Groq client not available, using contextual fallback suggestions')
      return this.selectFallbackSuggestions(context)
    }

    const farmType = sanitizePromptField(context.farmType) || 'poulets de chair'
    const animalCount = sanitizePromptField(context.animalCount, 20) || 'inconnu'
    const recentMortality = Number(context.recentMortality) || 0
    const avgFeed = typeof context.avgFeed === 'number' ? context.avgFeed.toFixed(1) : '0'
    const lastVaccination = context.lastVaccination
      ? new Date(context.lastVaccination).toLocaleDateString('fr-FR')
      : 'inconnue'
    const daysWithoutVaccination = Number(context.daysWithoutVaccination) || 0

    const prompt = `Tu es un conseiller vétérinaire expert en aviculture et élevage en Afrique Centrale.
Un éleveur a les données suivantes:
- Type d'élevage: ${farmType}
- Nombre d'animaux: ${animalCount}
- Mortalité récente: ${recentMortality} animaux
- Consommation moyenne de nourriture: ${avgFeed} kg/jour
- Dernière vaccination: ${lastVaccination}
- Jours sans vaccination: ${daysWithoutVaccination}

Génère entre 3 et 5 conseils pratiques et personnalisés en FRANÇAIS, adaptés au contexte camerounais/africain.
Réponds uniquement avec un JSON valide, sans aucun texte autour, au format:
[
  {
    "title": "Titre court du conseil",
    "content": "Description détaillée et actionnable du conseil (2-3 phrases)",
    "priority": "high" | "medium" | "low",
    "category": "santé" | "nutrition" | "production" | "biosécurité"
  }
]`

    try {
      const completion = await client.chat.completions.create(
        {
          model: config.GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1024,
        },
        { timeout: TIMEOUTS.GROQ_COMPLETION }
      )

      const text = completion.choices[0]?.message?.content || ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON array found in Groq response')
      const parsed = JSON.parse(jsonMatch[0])
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Empty suggestions array')

      const validated = parsed.filter((item: unknown): item is Record<string, string> =>
        typeof item === 'object' && item !== null &&
        typeof (item as any).title === 'string' && (item as any).title.length > 0 &&
        typeof (item as any).content === 'string' && (item as any).content.length > 0 &&
        VALID_PRIORITIES.has((item as any).priority) &&
        typeof (item as any).category === 'string'
      )
      if (validated.length === 0) throw new Error('No valid suggestions in Groq response')

      log.info('Groq AI suggestions generated successfully', { count: validated.length })
      return validated
    } catch (err) {
      log.warn('Groq API call failed, falling back to contextual suggestions', { error: err })
      return this.selectFallbackSuggestions(context)
    }
  }

  private selectFallbackSuggestions(context: Record<string, any>): any[] {
    let selected = [...FALLBACK_SUGGESTIONS]
    if ((context.recentMortality || 0) > 2) {
      const order = { high: 0, medium: 1, low: 2 } as const
      selected = selected.sort((a, b) =>
        (order[a.priority as keyof typeof order] ?? 1) - (order[b.priority as keyof typeof order] ?? 1)
      )
    }
    if ((context.daysWithoutVaccination || 999) < 30) {
      selected = selected.filter((s) => s.category !== 'santé' || !s.title.includes('Newcastle'))
    }
    return selected.slice(0, 3 + Math.floor(Math.random() * 2))
  }

  async generateSuggestions(userId: string) {
    const farmerId = await this.getFarmerProfileId(userId)

    const [farmerProfile, recentRecords, healthEvents] = await Promise.all([
      this.prisma.farmerProfile.findUnique({ where: { id: farmerId } }),
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
    ])

    if (!farmerProfile) throw new NotFoundError('Farmer profile', farmerId)

    const lastVaccinationEvent = healthEvents.find((e) => e.eventType === 'vaccination')
    const context = {
      farmType: farmerProfile.farmType,
      animalCount: farmerProfile.animalCount,
      recentMortality: recentRecords.length > 0 ? recentRecords[0].mortalityCount : 0,
      avgFeed: recentRecords.length > 0
        ? recentRecords.reduce((s, r) => s + (r.feedConsumedKg || 0), 0) / recentRecords.length
        : 0,
      lastVaccination: lastVaccinationEvent?.eventDate || null,
      daysWithoutVaccination: lastVaccinationEvent
        ? Math.floor((Date.now() - lastVaccinationEvent.eventDate.getTime()) / 86400000)
        : 999,
    }

    const suggestions = await this.callGroqAI(context)

    const aiSuggestion = await this.prisma.aiSuggestion.create({
      data: {
        farmerId,
        modelUsed: config.GROQ_MODEL,
        promptContext: JSON.stringify(context),
        suggestion: JSON.stringify(suggestions),
      },
    })

    log.info('AI suggestions saved', { suggestionId: aiSuggestion.id, farmerId })
    return { ...aiSuggestion, parsed: suggestions }
  }

  async getLastSuggestion(userId: string) {
    const farmerId = await this.getFarmerProfileId(userId)

    const suggestion = await this.prisma.aiSuggestion.findFirst({
      where: { farmerId },
      orderBy: { generatedAt: 'desc' },
    })

    if (!suggestion) return null

    let parsed: any[] = []
    try {
      parsed = JSON.parse(suggestion.suggestion)
    } catch {
      parsed = []
    }

    return { ...suggestion, parsed }
  }

  async listSuggestions(userId: string, limit = 10) {
    const farmerId = await this.getFarmerProfileId(userId)

    const suggestions = await this.prisma.aiSuggestion.findMany({
      where: { farmerId },
      orderBy: { generatedAt: 'desc' },
      take: limit,
    })

    return suggestions.map((s) => {
      let parsed: any[] = []
      try { parsed = JSON.parse(s.suggestion) } catch {}
      return { ...s, parsed }
    })
  }

  async rateSuggestion(suggestionId: string, helpful: boolean, userId: string) {
    const farmerId = await this.getFarmerProfileId(userId)
    return this.prisma.aiSuggestion.update({
      where: { id: suggestionId, farmerId },
      data: { wasHelpful: helpful },
    })
  }
}
