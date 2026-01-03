"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration: number = 3000) => {
      const id = Math.random().toString(36).substring(7);
      const toast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:top-4 md:bottom-auto md:left-auto md:right-4 z-50 flex flex-col gap-2 max-w-md mx-auto md:mx-0 md:w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const bgColors = {
    success: "bg-success-600",
    error: "bg-error-600",
    info: "bg-primary-600",
    warning: "bg-warning-600",
  };

  const textColors = {
    success: "text-white",
    error: "text-white",
    info: "text-white",
    warning: "text-white",
  };

  return (
    <div
      className={`${bgColors[toast.type]} ${textColors[toast.type]} px-4 py-3 rounded-lg shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-2 md:slide-in-from-top-2 border border-white/20 backdrop-blur-sm`}
      role="alert"
    >
      <p className="text-sm font-medium flex-1 pr-2 break-words">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-2 text-white/90 hover:text-white focus:outline-none flex-shrink-0"
        aria-label="Close notification"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}


