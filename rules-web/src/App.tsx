import { useState } from "react";
import { Toaster } from "sonner";
import { getStoredPassword, LoginCard } from "@/components/LoginCard";
import { AdminShell } from "@/components/AdminShell";

export default function App() {
  const [password, setPassword] = useState<string | null>(() => getStoredPassword());

  return (
    <>
      {password ? (
        <AdminShell password={password} onLogout={() => setPassword(null)} />
      ) : (
        <LoginCard onSuccess={setPassword} />
      )}
      <Toaster richColors position="top-center" />
    </>
  );
}
