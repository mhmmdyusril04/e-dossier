import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { formatRelative } from "date-fns";

import { useQuery } from "convex/react";
import { FileTextIcon, FolderIcon, ImageIcon } from "lucide-react";
import Image from "next/image";
import { ReactNode, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { FileCardActions } from "./file-actions";
import { ImagePreviewDialog } from "./ImagePreviewDialog";

export function FileCard({
    file, onNavigate
}: {
    file: Doc<"files"> & { isFavorited: boolean; url: string | null };
    onNavigate: (fileId: Id<"files">) => void;
}) {
    const userProfile = useQuery(api.users.getUserProfile, {
        userId: file.userId,
    });

    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

    const typeIcons = {
        image: <ImageIcon />,
        file: <FileTextIcon />,
        folder: <FolderIcon />
    } as Record<Doc<"files">["type"], ReactNode>;

    const handleContentClick = () => {
        if (file.type === "image") {
            setIsImagePreviewOpen(true);
        } else if (file.type !== 'folder' && file.url) {
            window.open(file.url, "_blank");
        }
    }

    return (
        <>
            <ImagePreviewDialog
                isOpen={isImagePreviewOpen}
                onOpenChange={setIsImagePreviewOpen}
                imageUrl={file.url}
                title={file.name}
            />

            <Card onDoubleClick={() => {
                if (file.type === 'folder') {
                    onNavigate(file._id);
                }
            }}>
                <CardHeader className="relative">
                    <CardTitle className="flex gap-2 text-base font-normal">
                        <div className="flex justify-center">{typeIcons[file.type]}</div>{" "}
                        {file.name}
                    </CardTitle>
                    <div className="absolute top-2 right-2">
                        <FileCardActions isFavorited={file.isFavorited} file={file} />
                    </div>
                </CardHeader>
                <CardContent className="h-[200px] relative flex justify-center items-center" onClick={handleContentClick}>
                    {file.type === "folder" && <FolderIcon className="w-20 h-20" />}
                    {file.type === "image" && file.url && (
                        <Image
                            alt={file.name}
                            src={file.url}
                            fill
                            style={{ objectFit: "cover" }}
                            className="rounded"
                        />
                    )}
                    {file.type === "file" && <FileTextIcon className="w-20 h-20" />}
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2 pt-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="flex gap-2 text-xs text-gray-700 items-center">
                        <Avatar className="w-6 h-6">
                            <AvatarImage src={userProfile?.image} />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        {userProfile?.name}
                    </div>
                    <div className="text-xs text-gray-700">
                        Uploaded {formatRelative(new Date(file._creationTime), new Date())}
                    </div>
                </CardFooter>
            </Card>
        </>
    );
}