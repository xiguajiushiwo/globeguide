import { handleAuth, requireOrigin, resolveSession } from './auth';
import type { Env } from './env';
import { handlePosts } from './posts';
import { handleSocial } from './social';
import { handleMessaging } from './messaging';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !requireOrigin(request)) {
      return Response.json({ error: 'Request origin is not allowed.' }, { status: 403 });
    }
    const authResponse = await handleAuth(request, env);
    if (authResponse) return authResponse;
    const user = await resolveSession(request, env);
    const postsResponse = await handlePosts(request, env, user);
    if (postsResponse) return postsResponse;
    const socialResponse = await handleSocial(request, env, user);
    if (socialResponse) return socialResponse;
    const messagingResponse = await handleMessaging(request, env, user);
    if (messagingResponse) return messagingResponse;
    return Response.json({ error: 'Not found.' }, { status: 404 });
  },
};
