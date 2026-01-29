import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Some password-recovery email links can land on `/` (landing) with recovery tokens
 * in the URL hash/query. This ensures we always route the user to `/reset-password`.
 */
export default function RecoveryLinkHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash || "";
    const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const searchParams = new URLSearchParams(location.search);

    const type = (hashParams.get("type") || searchParams.get("type") || "").toLowerCase();
    const isRecovery = type === "recovery";

    if (!isRecovery) return;
    if (location.pathname === "/reset-password") return;

    navigate(
      {
        pathname: "/reset-password",
        search: location.search,
        hash: window.location.hash,
      },
      { replace: true }
    );
  }, [location.pathname, location.search, navigate]);

  return null;
}
