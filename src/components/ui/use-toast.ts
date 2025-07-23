// file: hooks/use-toast.ts (atau di mana pun Anda menyimpannya)

import * as React from 'react';
// Impor fungsi toast dari sonner, kita beri alias agar tidak bentrok
import { toast as sonnerToast } from 'sonner';

// 1. Definisikan tipe baru yang sesuai dengan API Sonner
// Perhatikan, action bukan lagi React Element, tapi object.
type CustomToastAction = {
    label: React.ReactNode;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

// Ini adalah tipe untuk properti yang akan diterima oleh fungsi `toast` kustom kita
type ToastProps = {
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: CustomToastAction;
    icon?: React.ReactNode;
    duration?: number;
    // Anda bisa tambahkan properti lain dari Sonner di sini jika perlu
    // seperti onDismiss, onAutoClose, etc.
};

// Tipe untuk nilai yang dikembalikan oleh fungsi `toast` kita
type ToastReturn = {
    id: string | number;
    dismiss: () => void;
    update: (props: ToastProps) => void;
};

// 2. Fungsi `toast` utama kita yang sekarang membungkus Sonner
function toast(props: ToastProps): ToastReturn {
    const { title, ...rest } = props;

    // Memanggil sonnerToast dan menyimpan ID yang dikembalikannya.
    // Sonner secara otomatis menghasilkan ID unik jika tidak disediakan.
    const toastId = sonnerToast(title, {
        ...rest,
    });

    // Fungsi untuk meng-update toast yang ada
    const update = (newProps: ToastProps) => {
        // Untuk meng-update, kita panggil lagi sonnerToast dengan ID yang sama
        sonnerToast(newProps.title, {
            id: toastId, // <-- Kunci untuk update
            ...newProps,
        });
    };

    // Fungsi untuk menutup toast spesifik ini
    const dismiss = () => {
        sonnerToast.dismiss(toastId);
    };

    return {
        id: toastId,
        dismiss,
        update,
    };
}

// Menambahkan metode lain ke fungsi `toast` kita (opsional, tapi bagus)
// agar kita bisa memanggil toast.error(), toast.success(), dll.
toast.success = (title: React.ReactNode, props?: Omit<ToastProps, 'title'>): ToastReturn => {
    const toastId = sonnerToast.success(title, props);
    return {
        id: toastId,
        dismiss: () => sonnerToast.dismiss(toastId),
        update: (newProps: ToastProps) => sonnerToast(newProps.title, { id: toastId, ...newProps }),
    };
};

toast.error = (title: React.ReactNode, props?: Omit<ToastProps, 'title'>): ToastReturn => {
    const toastId = sonnerToast.error(title, props);
    return {
        id: toastId,
        dismiss: () => sonnerToast.dismiss(toastId),
        update: (newProps: ToastProps) => sonnerToast(newProps.title, { id: toastId, ...newProps }),
    };
};

// 3. `useToast` hook yang jauh lebih sederhana
// Kita tidak lagi butuh state management internal (reducer, listeners, state)
function useToast() {
    return {
        // Mengembalikan fungsi `toast` kustom kita
        toast,
        // Mengembalikan fungsi `dismiss` global dari Sonner
        dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
    };
}

export { toast, useToast };
