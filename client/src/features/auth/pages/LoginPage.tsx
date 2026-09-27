import { Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { AuthLayout } from "../components/AuthLayout";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
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
      <LoginForm />
    </AuthLayout>
  );
}
