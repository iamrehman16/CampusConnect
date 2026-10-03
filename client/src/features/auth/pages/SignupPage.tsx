import { Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { AuthLayout } from "../components/AuthLayout";
import RegisterForm from "../components/RegisterForm";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free for students. Takes about a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link component={RouterLink} to={ROUTES.LOGIN} fontWeight={600}>
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
      <GoogleSignInButton />
    </AuthLayout>
  );
}
