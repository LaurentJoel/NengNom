import { z } from 'zod';
declare const EnvSchema: any;
export type AppConfig = z.infer<typeof EnvSchema>;
export declare const config: AppConfig;
export {};
//# sourceMappingURL=env.d.ts.map