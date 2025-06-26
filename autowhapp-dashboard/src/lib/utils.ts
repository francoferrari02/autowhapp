import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast, type ExternalToast } from "sonner";
import type { ReactElement, JSXElementConstructor } from "react";

export function cn(...args: ClassValue[]) {
  return twMerge(clsx(args));
}

// Type for sonner toast options based on sonner@2.x
export type SonnerToastOptions = ExternalToast & {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "info" | "warning";
  duration?: number;
  id?: string | number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClick?: () => void;
};

// Type for the toast function, including methods
export type ToastFunction = {
  (message: string | SonnerToastOptions): string | number;
  success: (message: string | SonnerToastOptions) => string | number;
  error: (message: string | SonnerToastOptions) => string | number;
  info: (message: string | SonnerToastOptions) => string | number;
  warning: (message: string | SonnerToastOptions) => string | number;
  loading: (message: string | SonnerToastOptions) => string | number;
  // 'custom' accepts a render function returning a ReactElement
  custom: (
    jsx: (id: string | number) => ReactElement<unknown, string | JSXElementConstructor<any>>,
    options?: SonnerToastOptions
  ) => string | number;
  dismiss: (id?: string | number) => void;
};

// Cast sonner.toast to our extended ToastFunction
export const useToast = toast as unknown as ToastFunction;
