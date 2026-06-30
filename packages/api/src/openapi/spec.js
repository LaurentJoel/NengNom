/**
 * OpenAPI specification file
 * Auto-generated from Fastify route schemas
 * Accessible at GET /openapi.json and http://localhost:3001/docs
 */
export const openAPISpec = {
    openapi: '3.1.0',
    info: {
        title: 'Neng-Nom Backend API',
        description: 'AgriTech platform connecting African farmers with vets and lab services',
        version: '1.0.0',
        contact: {
            name: 'Neng-Nom Team',
            email: 'api@neng-nom.app',
        },
        license: {
            name: 'MIT',
        },
    },
    servers: [
        {
            url: 'http://localhost:3001',
            description: 'Development',
        },
        {
            url: 'https://api.neng-nom.app',
            description: 'Production',
        },
    ],
    tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Users', description: 'User profile management' },
        { name: 'Consultations', description: 'Veterinary consultations and messaging' },
        { name: 'Farm Records', description: 'Daily production records' },
        { name: 'Health Events', description: 'Vaccinations, deworming, treatments' },
        { name: 'Lab Requests', description: 'Mobile lab test requests' },
        { name: 'Community', description: 'Community Q&A, tips, alerts' },
        { name: 'Disease Surveillance', description: 'Disease alerts and tracking' },
        { name: 'AI', description: 'AI-powered farm suggestions' },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT access token (15 min TTL). Obtain from /auth/register or /auth/login.',
            },
        },
        headers: {
            X_Request_ID: {
                description: 'Unique request identifier',
                schema: { type: 'string', format: 'uuid' },
            },
            X_Process_Time: {
                description: 'Request processing time in milliseconds',
                schema: { type: 'string' },
            },
        },
        parameters: {
            Idempotency_Key: {
                name: 'Idempotency-Key',
                in: 'header',
                description: 'Optional. UUID to prevent duplicate operations. Responses cached for 24 hours.',
                schema: { type: 'string', format: 'uuid' },
            },
        },
    },
    security: [{ bearerAuth: [] }],
};
export default openAPISpec;
//# sourceMappingURL=spec.js.map