"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative z-50 w-full max-w-lg rounded-xl border border-fast-surface bg-fast-dark p-6 shadow-2xl transition-all", className)}>
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-xl font-bold text-fast-text">{title}</h2>}
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full absolute right-4 top-4 text-fast-text-secondary hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
