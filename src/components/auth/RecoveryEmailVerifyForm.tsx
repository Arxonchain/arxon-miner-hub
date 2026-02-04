import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  verifying: boolean;
  errorMessage: string | null;
  onVerify: (email: string) => Promise<boolean>;
};

export default function RecoveryEmailVerifyForm({ verifying, errorMessage, onVerify }: Props) {
  const [email, setEmail] = useState("");

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm text-center">{errorMessage}</div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onVerify(email);
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="recovery-email">Email address</Label>
          <div className="relative">
            <Input
              id="recovery-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={verifying}
              required
              autoComplete="email"
              className="pl-10"
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the email you used to request this password reset.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={verifying}>
          {verifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </form>
    </div>
  );
}
