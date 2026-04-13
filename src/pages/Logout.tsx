import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Visiting /logout clears the session and redirects to /login.
 * No UI — just a side-effect component.
 * TODO: When backend auth is ready, also call the logout API endpoint here
 *       before clearing local state (e.g. invalidate server-side token/session).
 */
export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    navigate("/login", { replace: true });
  }, []);

  return null;
}
