import { PrismaClient } from '@prisma/client';
import type { CreateDiseaseAlertInput, UpdateDiseaseAlertInput } from './surveillance.schema.js';
/**
 * SurveillanceService — disease alert tracking and surveillance
 */
export declare class SurveillanceService {
    private prisma;
    constructor(prisma: PrismaClient);
    createAlert(reportedById: string, input: CreateDiseaseAlertInput): Promise<any>;
    getAlert(alertId: string): Promise<any>;
    listAlerts(limit?: number, offset?: number): Promise<{
        alerts: any;
        total: any;
    }>;
    listAlertsByRegion(country: string, region: string, limit?: number): Promise<any>;
    listAlertsByCountry(country: string, limit?: number): Promise<any>;
    listAlertsBySeverity(severity: string, limit?: number): Promise<any>;
    updateAlert(alertId: string, input: UpdateDiseaseAlertInput): Promise<any>;
    getRecentAlerts(country: string, days?: number): Promise<any>;
    getHighSeverityAlerts(country: string): Promise<any>;
    getDiseaseSummary(country: string): Promise<Record<string, Record<string, number>>>;
}
//# sourceMappingURL=surveillance.service.d.ts.map