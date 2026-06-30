import fastifyPlugin from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
/**
 * OpenAPI/Swagger plugin
 * Auto-generates API documentation from route schemas
 * Accessible at /docs (Swagger UI) and /openapi.json
 */
export default fastifyPlugin(async (fastify) => {
    await fastify.register(fastifySwagger, {
        openapi: {
            openapi: '3.1.0',
            info: {
                title: 'Neng-Nom Backend API',
                description: 'AgriTech platform for African livestock farmers',
                version: '1.0.0',
                contact: {
                    name: 'Neng-Nom Team',
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
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
        },
    });
    await fastify.register(fastifySwaggerUi, {
        routePrefix: '/docs',
    });
});
//# sourceMappingURL=swagger.js.map