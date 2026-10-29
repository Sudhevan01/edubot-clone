export default async function healthRoutes(fastify) {
  fastify.get('/api/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health Check',
      description: 'Returns service status to verify the backend is online.',
      response: {
        200: {
          type: 'object',
          description: 'Service is healthy and ready.',
          properties: {
            status: { type: 'string', example: 'ok' },
          },
        },
      },
    },
  }, async (request, reply) => {
    return { status: 'ok' };
  });
}
