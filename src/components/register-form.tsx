"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/src/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/src/providers/auth-provider";

const roles = [
  { value: "manager", label: "Store Manager" },
  { value: "cashier", label: "Cashier" },
  { value: "technician", label: "Technician" },
];

type RegisterFormProps = React.ComponentProps<"div">;

export function RegisterForm({ className, ...props }: RegisterFormProps) {
  const router = useRouter();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>(roles[0]?.value ?? "manager");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        await register({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          password_confirmation: confirmPassword,
          role: role as "manager" | "cashier" | "technician" | "admin" | undefined,
        });
        router.push("/dashboard");
      } catch (error) {
        if (error instanceof Error) {
          setFormError(error.message);
        } else {
          setFormError("Unable to create your account. Please try again.");
        }
      }
    });
  };

  return (
    <div className={cn("flex w-full flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-0 shadow-lg shadow-black/5">
        <CardContent className="grid p-0 md:grid-cols-[1fr_320px]">
          <div className="relative hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent md:flex md:flex-col md:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.15),transparent_65%)]" />
            <div className="relative z-10 p-8">
              <CardHeader className="p-0">
                <CardTitle className="text-xl font-semibold text-primary">
                  Empower your frontline
                </CardTitle>
                <CardDescription className="mt-2 text-sm text-muted-foreground">
                  Create accounts for teammates and synchronize your entire store
                  in one secure workspace.
                </CardDescription>
              </CardHeader>
              <Separator className="my-6" />
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Role-based permissions backed by Laravel Policies
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Fine-grained access for multi-store operations
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Audit-ready activity trails and sign-in logs
                </li>
              </ul>
            </div>
            <div className="relative z-10 mt-auto px-8 pb-8">
              <Image
                src="/placeholder.svg"
                alt="Team collaboration"
                width={320}
                height={220}
                className="w-full rounded-xl border border-border/60 bg-background/80 object-cover shadow-sm backdrop-blur"
              />
            </div>
          </div>

          <form
            className="flex flex-col justify-center p-6 md:p-10"
            onSubmit={handleSubmit}
          >
            <CardHeader className="p-0 pb-6 text-center md:text-left">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Create your workspace
              </CardTitle>
              <CardDescription className="mt-2 text-balance">
                Set up secure access for your point-of-sale operations in
                minutes.
              </CardDescription>
            </CardHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Juan"
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Dela Cruz"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="team@gts-pos.io"
                required
                disabled={isPending}
              />
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="role">Default role</Label>
              <Select
                value={role}
                onValueChange={setRole}
                disabled={isPending}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                You can fine-tune permissions later inside the admin console.
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a strong password"
                    required
                    disabled={isPending}
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((state) => !state)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat password"
                    required
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setShowConfirmPassword((state) => !state)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {formError ? (
              <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            ) : null}

            <Button
              type="submit"
              className="mt-6 w-full"
              disabled={
                isPending ||
                !firstName ||
                !lastName ||
                !email ||
                !password ||
                !confirmPassword
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating workspace…
                </>
              ) : (
                "Create account"
              )}
            </Button>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <a
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in instead
              </a>
            </p>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t bg-muted/50 px-6 py-4 text-center text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:text-left">
          <span>
            Protected with Laravel Sanctum multi-factor ready endpoints.
          </span>
          <span>Data stored securely in MySQL with row-level ACLs.</span>
        </CardFooter>
      </Card>
    </div>
  );
}
