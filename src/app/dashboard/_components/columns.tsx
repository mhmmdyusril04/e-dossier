"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { formatRelative } from "date-fns";
import { FolderIcon } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { FileCardActions } from "./file-actions";

export function UserCell({ userId }: { userId: Id<"users"> }) {
    const userProfile = useQuery(api.users.getUserProfile, {
        userId: userId,
    });
    return (
        <div className="flex gap-2 text-xs text-gray-700 w-40 items-center">
            <Avatar className="w-6 h-6">
                <AvatarImage src={userProfile?.image} />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            {userProfile?.name}
        </div>
    );
}

export const columns: ColumnDef<
    Doc<"files"> & { url: string | null; isFavorited: boolean }
>[] = [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => {
                return (
                    <button
                        onClick={() => {
                            if (row.original.type === 'folder') {
                            }
                        }}
                        className="flex items-center gap-2 hover:underline"
                    >
                        {row.original.type === 'folder' && <FolderIcon className="h-4 w-4" />}
                        {row.original.name}
                    </button>
                )
            }
        },
        {
            accessorKey: "type",
            header: "Type",
            meta: {
                className: "hidden md:table-cell",
            },
        },
        {
            header: "User",
            cell: ({ row }) => {
                return <UserCell userId={row.original.userId} />;
            },
            meta: {
                className: "hidden md:table-cell",
            },
        },
        {
            header: "Uploaded On",
            cell: ({ row }) => {
                return (
                    <div>
                        {formatRelative(new Date(row.original._creationTime), new Date())}
                    </div>
                );
            },
            meta: {
                className: "hidden lg:table-cell",
            },
        },
        {
            header: "Actions",
            cell: ({ row }) => {
                return (
                    <div>
                        <FileCardActions
                            file={row.original}
                            isFavorited={row.original.isFavorited}
                        />
                    </div>
                );
            },
            meta: {
                className: "text-right",
            }
        },
    ];