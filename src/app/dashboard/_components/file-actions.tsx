import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Protect } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import {
    EyeIcon,
    FileIcon,
    MoreVertical,
    StarHalf,
    StarIcon,
    TrashIcon,
    UndoIcon,
} from "lucide-react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import { ImagePreviewDialog } from "./ImagePreviewDialog";

export function FileCardActions({
    file,
    isFavorited,
}: {
    file: Doc<"files"> & { url: string | null };
    isFavorited: boolean;
}) {
    const deleteFile = useMutation(api.files.deleteFile);
    const restoreFile = useMutation(api.files.restoreFile);
    const toggleFavorite = useMutation(api.files.toggleFavorite);
    const { toast } = useToast();
    const me = useQuery(api.users.getMe);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

    const handlePreview = () => {
        if (file.type === "image") {
            // Jika gambar, buka dialog
            setIsImagePreviewOpen(true);
        } else if (file.url) {
            // Jika dokumen lain (PDF, CSV), buka di tab baru
            window.open(file.url, "_blank");
        }
    };

    return (
        <>
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will mark the file for our deletion process. Files are
                            deleted periodically
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                await deleteFile({
                                    fileId: file._id,
                                });
                                toast.success("File marked for deletion",
                                    { description: "Your file will be deleted soon" },
                                );
                            }}
                        >
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ImagePreviewDialog
                isOpen={isImagePreviewOpen}
                onOpenChange={setIsImagePreviewOpen}
                imageUrl={file.url}
                title={file.name}
            />

            <DropdownMenu>
                <DropdownMenuTrigger>
                    <MoreVertical />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem
                        onClick={handlePreview}
                        className="flex gap-1 items-center cursor-pointer"
                    >
                        <EyeIcon className="w-4 h-4" /> Preview
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => {
                            if (!file.url) return;
                            window.open(file.url, "_blank");
                        }}
                        className="flex gap-1 items-center cursor-pointer"
                    >
                        <FileIcon className="w-4 h-4" /> Download
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => {
                            toggleFavorite({
                                fileId: file._id,
                            });
                        }}
                        className="flex gap-1 items-center cursor-pointer"
                    >
                        {isFavorited ? (
                            <div className="flex gap-1 items-center">
                                <StarIcon className="w-4 h-4" /> Unfavorite
                            </div>
                        ) : (
                            <div className="flex gap-1 items-center">
                                <StarHalf className="w-4 h-4" /> Favorite
                            </div>
                        )}
                    </DropdownMenuItem>

                    <Protect
                        condition={(check) => {
                            return (
                                check({
                                    role: "org:admin",
                                }) || file.userId === me?._id
                            );
                        }}
                        fallback={<></>}
                    >
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => {
                                if (file.shouldDelete) {
                                    restoreFile({
                                        fileId: file._id,
                                    });
                                } else {
                                    setIsConfirmOpen(true);
                                }
                            }}
                            className="flex gap-1 items-center cursor-pointer"
                        >
                            {file.shouldDelete ? (
                                <div className="flex gap-1 text-green-600 items-center cursor-pointer">
                                    <UndoIcon className="w-4 h-4" /> Restore
                                </div>
                            ) : (
                                <div className="flex gap-1 text-red-600 items-center cursor-pointer">
                                    <TrashIcon className="w-4 h-4" /> Delete
                                </div>
                            )}
                        </DropdownMenuItem>
                    </Protect>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}