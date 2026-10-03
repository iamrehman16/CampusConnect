import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useAuth } from '@/shared/hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';
import authService from '../services/auth.service';

/**
 * Landing target of the server's Google redirect (BACKLOG.md F3). Exchanges
 * the one-time `code` for tokens, then goes through the same `login` as a
 * password sign-in. Failures go back to /login with an error code.
 */
export default function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  // The code is single-use; StrictMode's double effect must not spend it twice.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const code = params.get('code');
    const error = params.get('error');
    const fail = (reason: string) =>
      navigate(`${ROUTES.LOGIN}?error=${reason}`, { replace: true });

    if (error || !code) {
      fail(error ?? 'google_failed');
      return;
    }

    authService
      .exchangeGoogleCode(code)
      .then((tokens) => login(tokens))
      .then(() => navigate(ROUTES.HOME, { replace: true }))
      .catch((err: unknown) => {
        console.error('Google sign-in exchange failed', err);
        fail('google_failed');
      });
  }, [params, navigate, login]);

  return (
    <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: '100svh' }}>
      <CircularProgress />
      <Typography color="text.secondary">Signing you in…</Typography>
    </Stack>
  );
}
