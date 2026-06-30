/**
 * Module index and exports
 * Aggregates all module services for easy importing
 */
export { AuthService } from './modules/auth/auth.service.js';
export { UsersService } from './modules/users/users.service.js';
export { ConsultationsService } from './modules/consultations/consultations.service.js';
export { FarmRecordsService } from './modules/farm-records/farm-records.service.js';
export { HealthEventsService } from './modules/health-events/health-events.service.js';
export { LabRequestsService } from './modules/lab-requests/lab-requests.service.js';
export { CommunityService } from './modules/community/community.service.js';
export { SurveillanceService } from './modules/surveillance/surveillance.service.js';
export { AIService } from './modules/ai/ai.service.js';
export type { RegisterInput, LoginInput, AuthResponse } from './modules/auth/auth.schema.js';
export type { UpdateProfileInput, UpdateFarmerProfileInput, UpdateVetProfileInput, } from './modules/users/users.schema.js';
export type { CreateConsultationInput, UpdateConsultationInput, CreateMessageInput, } from './modules/consultations/consultations.schema.js';
export type { CreateFarmRecordInput, UpdateFarmRecordInput, } from './modules/farm-records/farm-records.schema.js';
export type { CreateHealthEventInput, UpdateHealthEventInput, } from './modules/health-events/health-events.schema.js';
export type { CreateLabRequestInput, UpdateLabRequestInput, } from './modules/lab-requests/lab-requests.schema.js';
export type { CreateCommunityPostInput } from './modules/community/community.schema.js';
export type { CreateDiseaseAlertInput } from './modules/surveillance/surveillance.schema.js';
//# sourceMappingURL=index.d.ts.map