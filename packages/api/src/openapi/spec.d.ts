/**
 * OpenAPI specification file
 * Auto-generated from Fastify route schemas
 * Accessible at GET /openapi.json and http://localhost:3001/docs
 */
export declare const openAPISpec: {
    openapi: string;
    info: {
        title: string;
        description: string;
        version: string;
        contact: {
            name: string;
            email: string;
        };
        license: {
            name: string;
        };
    };
    servers: {
        url: string;
        description: string;
    }[];
    tags: {
        name: string;
        description: string;
    }[];
    components: {
        securitySchemes: {
            bearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
                description: string;
            };
        };
        headers: {
            X_Request_ID: {
                description: string;
                schema: {
                    type: string;
                    format: string;
                };
            };
            X_Process_Time: {
                description: string;
                schema: {
                    type: string;
                };
            };
        };
        parameters: {
            Idempotency_Key: {
                name: string;
                in: string;
                description: string;
                schema: {
                    type: string;
                    format: string;
                };
            };
        };
    };
    security: {
        bearerAuth: never[];
    }[];
};
export default openAPISpec;
//# sourceMappingURL=spec.d.ts.map