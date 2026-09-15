// src/layout/TopBar.tsx
import { useLocation } from "react-router-dom";
import { getRouteConfig} from '../../../app/routeConfig';
import StandardBar from "./topbar/StandardBar";
import ContextualBar from "./topbar/ContextualBar";

interface TopBarProps {
  /**
   * Passed through from AppLayout → ProfileDrawer.
   * Only StandardBar uses this — ContextualBar has no avatar.
   * We accept it here so AppLayout's interface stays unchanged.
   */
  onAvatarClick: () => void;
}

/**
 * TopBar — thin routing-aware switcher.
 *
 * This component has exactly one job: read the current route config
 * and render the right bar variant. No layout logic, no business logic.
 *
 * Why does the switcher live here and not in AppLayout?
 * AppLayout manages the overall page structure (sidebar, main area,
 * bottom nav). Knowing *which* bar variant to render is a TopBar concern.
 * Keeping it here means AppLayout stays unchanged when we add new modes.
 *
 * Why not just pass topBarMode as a prop from AppLayout?
 * AppLayout would then need to call useLocation + getRouteConfig itself,
 * making it routing-aware. We want AppLayout to stay a dumb structural
 * shell. One component reads the route; everything else receives props.
 */
export default function TopBar({ onAvatarClick }: TopBarProps) {
  const { pathname } = useLocation();
  const config = getRouteConfig(pathname);

  if (config.topBarMode === "immersive") {
    // Immersive pages own their header entirely.
    // AppShell renders nothing here — the page component takes over.
    return null;
  }

  if (config.topBarMode === "contextual") {
    // action slot is undefined here — each page that needs a right-side
    // action (compose button on Messages, search on Contributors) will
    // render it inside its own page component, positioned absolutely or
    // via a portal, so ContextualBar stays generic with no page knowledge.
    //
    // Alternative: pass action via React context or a layout store.
    // We'll address that when we build ConversationsPage — for now the
    // slot exists and is ready.
    return <ContextualBar title={config.title} />;
  }

  // default: 'standard'
  return <StandardBar title={config.title} onAvatarClick={onAvatarClick} />;
}