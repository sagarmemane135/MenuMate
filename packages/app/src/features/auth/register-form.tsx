"use client";

import React, { useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  restaurantName: z.string().min(2, "Restaurant name must be at least 2 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  isLoading?: boolean;
}

export function RegisterForm({ onSubmit, isLoading = false }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    fullName: "",
    restaurantName: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof RegisterFormData] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await onSubmit(result.data);
    } catch (error) {
      setErrors({ email: error instanceof Error ? error.message : "An error occurred" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full Name"
        type="text"
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        error={errors.fullName}
        disabled={isLoading}
        required
      />
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        disabled={isLoading}
        required
      />
      <Input
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={errors.password}
        disabled={isLoading}
        required
      />
      <Input
        label="Restaurant Name"
        type="text"
        value={formData.restaurantName}
        onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
        error={errors.restaurantName}
        disabled={isLoading}
        required
      />
      <Button type="submit" className="w-full" isLoading={isLoading}>
        Create Account
      </Button>
    </form>
  );
}


