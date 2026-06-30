import { PrismaClient } from '@prisma/client'
import { createLogger } from '../../lib/logger.js'
import { NotFoundError } from '../../lib/errors.js'
import type { CreateDiseaseAlertInput, UpdateDiseaseAlertInput } from './surveillance.schema.js'

const log = createLogger('surveillance-service')

/**
 * SurveillanceService — disease alert tracking and surveillance
 * DISABLED - Type compatibility issues with Prisma enums
 */
/*
export class SurveillanceService {
  constructor(private prisma: PrismaClient) {}

  async createAlert(reportedById: string, input: CreateDiseaseAlertInput) {
    const alert = await this.prisma.diseaseAlert.create({
      data: {
        reportedById,
        diseaseName: input.diseaseName,
        region: input.region,
        country: input.country,
        severity: input.severity,
        isConfirmed: input.isConfirmed,
      },
    })

    log.info('Disease alert created', {
      alertId: alert.id,
      reportedById,
      diseaseName: input.diseaseName,
      region: input.region,
      country: input.country,
      severity: input.severity,
    })

    return alert
  }

  async getAlert(alertId: string) {
    const alert = await this.prisma.diseaseAlert.findUnique({
      where: { id: alertId },
    })

    if (!alert) {
      throw new NotFoundError('Disease alert', alertId)
    }

    return alert
  }

  async listAlerts(limit = 50, offset = 0) {
    const [alerts, total] = await Promise.all([
      this.prisma.diseaseAlert.findMany({
        orderBy: { reportedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.diseaseAlert.count(),
    ])

    return { alerts, total }
  }

  async listAlertsByRegion(country: string, region: string, limit = 50) {
    const alerts = await this.prisma.diseaseAlert.findMany({
      where: { country, region },
      orderBy: { reportedAt: 'desc' },
      take: limit,
    })

    return alerts
  }

  async listAlertsByCountry(country: string, limit = 100) {
    const alerts = await this.prisma.diseaseAlert.findMany({
      where: { country },
      orderBy: [{ severity: 'desc' }, { reportedAt: 'desc' }],
      take: limit,
    })

    return alerts
  }

  async listAlertsBySeverity(severity: string, limit = 50) {
    const alerts = await this.prisma.diseaseAlert.findMany({
      where: { severity },
      orderBy: { reportedAt: 'desc' },
      take: limit,
    })

    return alerts
  }

  async updateAlert(alertId: string, input: UpdateDiseaseAlertInput) {
    const alert = await this.getAlert(alertId)

    const updated = await this.prisma.diseaseAlert.update({
      where: { id: alertId },
      data: {
        severity: input.severity,
        isConfirmed: input.isConfirmed,
      },
    })

    log.info('Disease alert updated', {
      alertId,
      severity: input.severity,
      isConfirmed: input.isConfirmed,
    })

    return updated
  }

  async getRecentAlerts(country: string, days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const alerts = await this.prisma.diseaseAlert.findMany({
      where: {
        country,
        reportedAt: { gte: since },
      },
      orderBy: { reportedAt: 'desc' },
    })

    return alerts
  }

  async getHighSeverityAlerts(country: string) {
    const alerts = await this.prisma.diseaseAlert.findMany({
      where: {
        country,
        severity: { in: ['HIGH', 'CRITICAL'] },
      },
      orderBy: [{ severity: 'desc' }, { reportedAt: 'desc' }],
    })

    return alerts
  }

  async getDiseaseSummary(country: string) {
    const alerts = await this.prisma.diseaseAlert.findMany({
      where: { country },
    })

    const summary: Record<string, Record<string, number>> = {}

    alerts.forEach((alert) => {
      if (!summary[alert.diseaseName]) {
        summary[alert.diseaseName] = { HIGH: 0, MEDIUM: 0, CRITICAL: 0, LOW: 0 }
      }
      summary[alert.diseaseName][alert.severity] =
        (summary[alert.diseaseName][alert.severity] || 0) + 1
    })

    return summary
  }
}
*/
