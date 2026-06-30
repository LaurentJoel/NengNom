import { PrismaClient } from '@prisma/client';
import type { CreateFarmRecordInput, UpdateFarmRecordInput } from './farm-records.schema.js';
/**
 * FarmRecordsService — production records management
 */
export declare class FarmRecordsService {
    private prisma;
    constructor(prisma: PrismaClient);
    createRecord(farmerId: string, input: CreateFarmRecordInput): Promise<any>;
    getRecord(recordId: string): Promise<any>;
    listRecords(farmerId: string, limit?: number, offset?: number): Promise<{
        records: any;
        total: any;
    }>;
    getRecordsBetween(farmerId: string, startDate: Date, endDate: Date): Promise<any>;
    updateRecord(recordId: string, farmerId: string, input: UpdateFarmRecordInput): Promise<any>;
    deleteRecord(recordId: string, farmerId: string): Promise<void>;
    getMonthlyStats(farmerId: string, year: number, month: number): Promise<{
        daysRecorded: any;
        avgAnimalCount: number;
        totalMortality: any;
        mortalityRate: string | number;
        avgFeedConsumption: string | number;
        totalExpenses: any;
        totalRevenue: any;
    }>;
}
//# sourceMappingURL=farm-records.service.d.ts.map