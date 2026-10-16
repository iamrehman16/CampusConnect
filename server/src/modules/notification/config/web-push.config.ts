import { registerAs } from '@nestjs/config';

export default registerAs('webPush', () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  return {
    publicKey,
    privateKey,
    subject,
    // Optional: without keys the app boots and notifications stay in-app
    // (bell + socket); the client hides the push toggle.
    enabled: Boolean(publicKey && privateKey && subject),
  };
});
