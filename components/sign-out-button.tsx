"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      aria-label="Uitloggen"
      className="button button-outline button-small"
      onClick={() => signOut({ redirectTo: "/" })}
      title="Uitloggen"
      type="button"
    >
      <LogOut aria-hidden="true" size={14} />
      <span>Uitloggen</span>
    </button>
  );
}
