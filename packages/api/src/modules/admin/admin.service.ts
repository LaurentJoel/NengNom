import { PrismaClient } from '@prisma/client'
import { createLogger } from '../../lib/logger.js'
import { NotFoundError } from '../../lib/errors.js'

const log = createLogger('admin-service')

export class AdminService {
  constructor(private prisma: PrismaClient) {}

  async getPlatformStats() {
    const [
      totalUsers,
      totalFarmers,
      totalVets,
      totalLabTechs,
      totalConsultations,
      activeConsultations,
      totalLabRequests,
      totalPosts,
      totalAlerts,
      revenueAgg,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'FARMER' } }),
      this.prisma.user.count({ where: { role: 'VET' } }),
      this.prisma.user.count({ where: { role: 'LAB_TECH' } }),
      this.prisma.consultation.count(),
      this.prisma.consultation.count({ where: { status: 'ACTIVE' } }),
      this.prisma.labRequest.count(),
      this.prisma.communityPost.count(),
      this.prisma.diseaseAlert.count(),
      this.prisma.farmRecord.aggregate({ _sum: { revenue: true } }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, fullName: true, role: true, createdAt: true, isActive: true },
      }),
    ])

    return {
      users: { total: totalUsers, farmers: totalFarmers, vets: totalVets, labTechs: totalLabTechs },
      consultations: { total: totalConsultations, active: activeConsultations },
      labRequests: totalLabRequests,
      communityPosts: totalPosts,
      diseaseAlerts: totalAlerts,
      totalRevenueFCFA: Number(revenueAgg._sum.revenue ?? 0),
      recentUsers,
    }
  }

  async listUsers(page = 1, limit = 20, role?: string, query?: string) {
    const offset = (page - 1) * limit
    const where: any = {}
    if (role) where.role = role
    if (query) {
      where.OR = [
        { fullName: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
      ]
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          phone: true,
          role: true,
          region: true,
          country: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          farmerProfile: { select: { farmName: true, farmType: true, animalCount: true } },
          vetProfile: { select: { specialization: true, licenseNumber: true, isAvailable: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.user.count({ where }),
    ])

    return { users, total, page, limit }
  }

  async toggleUserStatus(userId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (!user) throw new NotFoundError('User', userId)

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, fullName: true, isActive: true, role: true },
    })

    log.info('User status toggled by admin', { userId, isActive })
    return updated
  }

  async listAllConsultations(page = 1, limit = 20, status?: string) {
    const offset = (page - 1) * limit
    const where: any = {}
    if (status) where.status = status

    const [consultations, total] = await Promise.all([
      this.prisma.consultation.findMany({
        where,
        include: {
          farmer: { include: { user: { select: { fullName: true, phone: true } } } },
          vet: { include: { user: { select: { fullName: true, phone: true } } } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.consultation.count({ where }),
    ])

    return { consultations, total, page, limit }
  }

  async listAlerts() {
    const alerts = await this.prisma.diseaseAlert.findMany({
      orderBy: { reportedAt: 'desc' },
    })
    const reporterIds = [...new Set(alerts.map((a) => a.reportedById))]
    const reporters = await this.prisma.user.findMany({
      where: { id: { in: reporterIds } },
      select: { id: true, fullName: true, role: true },
    })
    const reporterMap = new Map(reporters.map((r) => [r.id, r]))
    return alerts.map((a) => ({
      ...a,
      reportedBy: reporterMap.get(a.reportedById) ?? null,
    }))
  }

  async createAlert(input: {
    diseaseName: string
    region: string
    country: string
    severity: string
    isConfirmed: boolean
    reportedById: string
  }) {
    const alert = await this.prisma.diseaseAlert.create({
      data: {
        diseaseName: input.diseaseName,
        region: input.region,
        country: input.country,
        severity: input.severity as any,
        isConfirmed: input.isConfirmed,
        reportedById: input.reportedById,
      },
    })
    log.info('Disease alert created by admin', { alertId: alert.id })
    return alert
  }

  async deleteAlert(id: string) {
    await this.prisma.diseaseAlert.delete({ where: { id } })
    log.info('Disease alert deleted by admin', { alertId: id })
  }

  async deleteCommunityPost(id: string) {
    await this.prisma.communityPost.delete({ where: { id } })
    log.info('Community post deleted by admin', { postId: id })
  }
}
