"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button, Input, useToast } from "@menumate/app";
import { UtensilsCrossed, Loader2 } from "lucide-react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        credentials: "include", // Important: Include cookies in request/response
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || result.message || "Login failed");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      const redirect = searchParams.get("redirect") || "/admin";
      
      // Use router.push with a small delay to ensure cookie is set
      // Then force a full page reload to ensure middleware reads the cookie
      setTimeout(() => {
        // First try router.push
        router.push(redirect);
        // Then force a full reload after a brief moment to ensure cookie is read
        setTimeout(() => {
          window.location.href = redirect;
        }, 50);
      }, 150);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          fullName,
          restaurantName,
        }),
        credentials: "include", // Important: Include cookies in request/response
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      showToast("Registration successful! MenuMate admin will review your request—you can log in after approval.", "success");
      // Clear signup form and switch to login form (we're already on /login page)
      setRegisterEmail("");
      setRegisterPassword("");
      setFullName("");
      setRestaurantName("");
      setError(null);
      setTimeout(() => {
        setIsLogin(true);
      }, 800);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br neutral-50 px-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
            <UtensilsCrossed className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-primary-700 mb-3">
            {isLogin ? "Welcome Back" : "Join MenuMate"}
          </h1>
          <p className="text-slate-600 font-medium">
            {isLogin
              ? "Sign in to manage your restaurant"
              : "Create your restaurant account"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-2">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="restaurantName" className="block text-sm font-semibold text-slate-700 mb-2">
                Restaurant Name
              </label>
              <Input
                id="restaurantName"
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                required
                className="w-full"
                placeholder="My Restaurant"
              />
            </div>

            <div>
              <label htmlFor="registerEmail" className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <Input
                id="registerEmail"
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
                className="w-full"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="registerPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <Input
                id="registerPassword"
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
                className="w-full"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
            <p className="mt-3 text-xs text-slate-500 text-center">
              Restaurant accounts require approval by MenuMate admin before you can log in.
            </p>
          </form>
        )}

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up →"
              : "Already have an account? Sign in →"}
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br neutral-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
