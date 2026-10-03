import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';

// Plain navigation, not an XHR: the server answers with a redirect to Google.
const GOOGLE_AUTH_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`;

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function GoogleSignInButton() {
  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 2, color: 'text.secondary', typography: 'body2' }}>or</Divider>
      <Button
        component="a"
        href={GOOGLE_AUTH_URL}
        variant="outlined"
        fullWidth
        size="large"
        startIcon={<GoogleMark />}
        sx={{ minHeight: 48 }}
      >
        Continue with Google
      </Button>
    </Box>
  );
}
