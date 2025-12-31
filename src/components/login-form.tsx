"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
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
import { Separator } from "@/src/components/ui/separator";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/src/providers/auth-provider";

type LoginFormProps = React.ComponentProps<"div">;

export function LoginForm({ className, ...props }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    startTransition(async () => {
      try {
        await login({
          email,
          password,
          device_name: "nextjs-pos",
        });
        router.push("/dashboard");
      } catch (error) {
        if (error instanceof Error) {
          setFormError(error.message);
        } else {
          setFormError("Unable to sign in. Please try again.");
        }
      }
    });
  };

  return (
    <div className={cn("flex w-full flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-0 shadow-lg shadow-black/5">
        <CardContent className="grid p-0 md:grid-cols-[1fr_320px]">
          <form
            className="flex flex-col justify-center p-6 md:p-10"
            onSubmit={handleSubmit}
          >
            <CardHeader className="p-0 pb-6 text-center md:text-left">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Welcome back
              </CardTitle>
              <CardDescription className="mt-2 text-balance">
                Enter your credentials to access the POS control center.
              </CardDescription>
            </CardHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="team@gts-pos.io"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isPending}
                  inputMode="email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="/forgot-password"
                    className="ml-auto text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={isPending}
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

              {formError ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={isPending || !email || !password}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

              {/* <div className="text-center text-sm text-muted-foreground">
                Don&rsquo;t have access yet?{" "}
                <a
                  href="/register"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Request an account
                </a>
              </div> */}
            </div>
          </form>

          <div className="relative hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8 md:flex md:flex-col md:justify-end">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_60%)]" />
            <div className="relative z-10">
              <CardHeader className="p-0">
                <CardTitle className="text-lg font-semibold">
                  Seamless Sales Operations
                </CardTitle>
              </CardHeader>
              <CardDescription className="mt-3 max-w-xs text-muted-foreground">
                Track revenue, manage inventory, and keep your team aligned in
                one modern dashboard powered by Laravel &amp; Next.js.
              </CardDescription>
              <Separator className="my-6" />
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    ✓
                  </span>
                  Real-time stock monitoring
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    ✓
                  </span>
                  Rapid checkout workflows
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    ✓
                  </span>
                  Built-in analytics &amp; reporting
                </li>
              </ul>
            </div>
            <Image
              src="/placeholder.svg"
              alt="POS dashboard preview"
              width={320}
              height={240}
              className="relative z-10 mt-8 w-full rounded-xl border border-border/60 bg-background/80 object-cover shadow-sm backdrop-blur"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t bg-muted/50 px-6 py-4 text-center text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:text-left">
          <span>
            By continuing you agree to the{" "}
            <a className="underline hover:text-primary" href="#">
              Terms of Service
            </a>{" "}
            and{" "}
            <a className="underline hover:text-primary" href="#">
              Privacy Policy
            </a>
            .
          </span>
          <span>Secure access powered by Laravel Sanctum</span>
        </CardFooter>
      </Card>
    </div>
  );
}
