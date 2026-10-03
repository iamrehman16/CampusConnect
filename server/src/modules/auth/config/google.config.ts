import { registerAs } from '@nestjs/config';

export default registerAs('google', () => {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  return {
    clientId,
    clientSecret,
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ??
      `http://localhost:${process.env.PORT ?? 3100}/api/auth/google/callback`,
    // Without credentials the app still boots (local dev, CI); the Google
    // routes answer 503 instead.
    enabled: Boolean(clientId && clientSecret),
    frontendUrl: (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(
      /\/+$/,
      '',
    ),
  };
});
