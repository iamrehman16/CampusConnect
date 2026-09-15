import { RouterProvider } from "react-router-dom";
import AppProviders from "./providers/AppProviders";
import router from "./router";
import { PwaUpdatePrompt } from "@/shared/components/pwaUpdatePrompt";
import { OfflineBanner } from "@/shared/components/OfflineBanner";
export default function App() {
  return (
    <AppProviders>
      <OfflineBanner />
      <RouterProvider router={router} />
      {import.meta.env.PROD && <PwaUpdatePrompt />}
    </AppProviders>
  );
}
