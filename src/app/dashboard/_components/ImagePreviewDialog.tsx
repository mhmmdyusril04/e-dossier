import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

interface ImagePreviewDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    imageUrl: string | null;
    title: string;
}

export function ImagePreviewDialog({
    isOpen,
    onOpenChange,
    imageUrl,
    title,
}: ImagePreviewDialogProps) {
    if (!imageUrl) {
        return null; // Jangan render apa-apa jika tidak ada URL
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center items-center">
                    <Image
                        alt={title}
                        width="800"
                        height="600"
                        src={imageUrl}
                        className="max-w-full h-auto rounded-lg"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}