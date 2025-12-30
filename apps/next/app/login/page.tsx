"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm, RegisterForm, Card } from "@menumate/app";
import { UtensilsCrossed } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || result.message || "Login failed");
        setIsLoading(false);
        return;
      }

      // Reset loading state before redirect
      setIsLoading(false);
      const redirect = searchParams.get("redirect") || "/admin";
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: {
    email: string;
    password: string;
    fullName: string;
    restaurantName: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      // Reset loading state before showing alert and redirecting
      setIsLoading(false);
      alert("Registration successful! Your account is pending approval.");
      router.push("/login");
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-slate-50 px-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
            <UtensilsCrossed className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-3">
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
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        ) : (
          <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
        )}

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
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


