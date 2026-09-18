import { Suspense } from "react";
import LoadingScreen from "@/shared/components/feedback/LoadingScreen";

/**
 * Wraps a lazy component with Suspense fallback.
 */
export default function SuspenseWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
}
