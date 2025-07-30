"use client";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { GridIcon, Loader2, RowsIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { documentTypeEnum } from "../../../../convex/schema";
import { Breadcrumbs } from "./breadcrumbs";
import { columns } from "./columns";
import { CreateFolderButton } from "./create_folder_button";
import { FileCard } from "./file-card";
import { DataTable } from "./file-table";
import { SearchBar } from "./search-bar";
import { UploadButton } from "./upload_button";

function Placeholder() {
    return (
        <div className="flex flex-col gap-8 w-full items-center mt-24">
            <Image
                alt="an image of a picture and directory icon"
                width="300"
                height="300"
                src="/empty.svg"
            />
            <div className="text-xl md:text-2xl text-center">
                Anda belum memiliki file, tambah sekarang
            </div>
            <UploadButton />
        </div>
    );
}

export function FileBrowser({
    title,
    favoritesOnly,
    deletedOnly,
}: {
    title: string;
    favoritesOnly?: boolean;
    deletedOnly?: boolean;
}) {
    const organization = useOrganization();
    const user = useUser();
    const [query, setQuery] = useState("");
    const [type, setType] = useState<Doc<"files">["documentType"] | "all">("all");

    const [parentId, setParentId] = useState<Id<"files"> | undefined>(undefined);
    const folderPath = useQuery(api.files.getFolderPath, { fileId: parentId });

    let orgId: string | undefined = undefined;
    if (organization.isLoaded && user.isLoaded) {
        orgId = organization.organization?.id ?? user.user?.id;
    }

    const favorites = useQuery(
        api.files.getAllFavorites,
        orgId ? { orgId } : "skip"
    );

    const files = useQuery(
        api.files.getFiles,
        orgId
            ? {
                orgId,
                query,
                favorites: favoritesOnly,
                deletedOnly,
                documentType: type === 'all' ? undefined : type,
                parentId: parentId,
            }
            : "skip"
    );
    const isLoading = files === undefined;

    const modifiedFiles =
        files?.map((file) => ({
            ...file,
            isFavorited: (favorites ?? []).some(
                (favorite) => favorite.fileId === file._id
            ),
        })) ?? [];

    return (
        <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>

                <SearchBar query={query} setQuery={setQuery} />

                <div className="flex gap-2">
                    <UploadButton parentId={parentId} />
                    <CreateFolderButton parentId={parentId} />
                </div>
            </div>

            <Tabs defaultValue="grid">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
                    <div className="flex gap-4 flex-col items-start">
                        <TabsList className="mb-2">
                            <TabsTrigger value="grid" className="flex gap-2 items-center">
                                <GridIcon />
                                Grid
                            </TabsTrigger>
                            <TabsTrigger value="table" className="flex gap-2 items-center">
                                <RowsIcon /> Table
                            </TabsTrigger>
                        </TabsList>

                        <Breadcrumbs path={folderPath ?? []} onNavigate={setParentId} />
                    </div>

                    <div className="flex gap-2 items-center">
                        <Label htmlFor="type-select">Tipe File</Label>
                        <Select
                            value={type}
                            onValueChange={(newType) => {
                                setType(newType as Doc<"files">["documentType"] | "all");
                            }}
                        >
                            <SelectTrigger id="type-select" className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                {documentTypeEnum.map((docType) => (
                                    <SelectItem key={docType.toLowerCase()} value={docType}>
                                        {docType}
                                    </SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {isLoading && (
                    <div className="flex flex-col gap-8 w-full items-center mt-24">
                        <Loader2 className="h-32 w-32 animate-spin text-gray-500" />
                        <div className="text-2xl">Memuat file Anda...</div>
                    </div>
                )}

                <TabsContent value="grid">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {modifiedFiles?.map((file) => {
                            return <FileCard key={file._id} file={file} onNavigate={setParentId} />;
                        })}
                    </div>
                </TabsContent>
                <TabsContent value="table">
                    <DataTable columns={columns} data={modifiedFiles} onNavigate={setParentId} />
                </TabsContent>
            </Tabs>

            {files?.length === 0 && <Placeholder />}
        </div>
    );
}
