"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, icon, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
    >
      {open && (
        <div className="rounded-3xl border border-line bg-surface p-6 text-ink shadow-2xl sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 id="modal-title" className="font-display flex items-center gap-2.5 text-xl">
              {icon}
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="-m-1.5 rounded-full p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
              aria-label="Fermer"
            >
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
