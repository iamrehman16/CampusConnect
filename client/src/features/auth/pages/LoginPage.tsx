import { Alert, Link } from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { AuthLayout } from "../components/AuthLayout";
import LoginForm from "../components/LoginForm";
import GoogleSignInButton from "../components/GoogleSignInButton";

const GOOGLE_ERRORS: Record<string, string> = {
  account_conflict:
    "That email already belongs to an account we couldn't link to this Google account. Sign in with your password.",
  suspended: "This account has been suspended.",
  google_failed: "Google sign-in didn't complete. Please try again.",
};

export default function LoginPage() {
  const [params] = useSearchParams();
  const errorCode = params.get("error");
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your library, chats and mentors."
      footer={
        <>
          New to CampusConnect?{" "}
          <Link component={RouterLink} to={ROUTES.SIGNUP} fontWeight={600}>
            Create an account
          </Link>
        </>
      }
    >
      {errorCode && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {GOOGLE_ERRORS[errorCode] ?? GOOGLE_ERRORS.google_failed}
        </Alert>
      )}
      <LoginForm />
      <GoogleSignInButton />
    </AuthLayout>
  );
}
