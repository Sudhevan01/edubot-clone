export default async function healthRoutes(fastify) {
  fastify.get('/api/health', async (request, reply) => {
    return { status: 'ok' };
  });
}
