import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiters partagés.
 * Nécessite les variables d'environnement Upstash :
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Si ces variables sont absentes (dev local ou Upstash non configuré),
 * les fonctions de rate limiting retournent toujours { success: true }
 * pour éviter de bloquer l'application.
 */

function createRatelimit(requests: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
  });
}

const chatLimiter = createRatelimit(20, '1 m');       // 20 req/min par IP pour le chat IA
const contactLimiter = createRatelimit(5, '1 m');    // 5 req/min par IP pour les emails

export async function checkChatRateLimit(ip: string): Promise<{ success: boolean }> {
  if (!chatLimiter) return { success: true };
  return chatLimiter.limit(ip);
}

export async function checkContactRateLimit(ip: string): Promise<{ success: boolean }> {
  if (!contactLimiter) return { success: true };
  return contactLimiter.limit(ip);
}

export function getClientIp(req: Request): string {
  const forwarded = (req as any).headers?.get?.('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '127.0.0.1';
}
