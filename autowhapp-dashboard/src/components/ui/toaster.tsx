"use client";

import * as React from "react";
import { useToast } from "@/components/hooks/use-toast";
import { cn } from "@/lib/utils";

const Toaster = () => {
  const { toasts, dismiss } = useToast();

  return (
    <div>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "fixed bottom-4 right-4 bg-white p-4 rounded-md shadow-lg",
            t.open ? "animate-in" : "animate-out"
          )}
          style={{ animationDuration: "0.3s" }}
        >
          {t.title || t.description}
          {t.action}
          <button onClick={() => dismiss(t.id)}>X</button> {/* Use dismiss from useToast */}
        </div>
      ))}
    </div>
  );
};

export { Toaster, useToast };