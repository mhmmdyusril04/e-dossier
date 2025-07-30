"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

import { z } from "zod";

import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Id } from "../../../../convex/_generated/dataModel";
import { documentTypeEnum } from "../../../../convex/schema";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1).max(200),
  file: z.array(z.instanceof(File)).min(1, "File is required"),
  documentType: z.enum(documentTypeEnum),
});

export function UploadButton({ parentId }: { parentId?: Id<"files"> }) {
  const { toast } = useToast();
  const organization = useOrganization();
  const user = useUser();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      file: undefined,
    },
  });

  // Move useDropzone hook here
  function onDrop(acceptedFiles: File[]) {
    const dt = new DataTransfer();
    acceptedFiles.forEach((file) => dt.items.add(file));
    const FileList = dt.files;
    form.setValue("file", Array.from(FileList)); // convert FileList to File[]
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!orgId) return;

    const postUrl = await generateUploadUrl();

    const fileType = values.file[0].type;

    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": fileType },
      body: values.file[0],
    });
    const { storageId } = await result.json();

    let determinedType: "image" | "file" = "file";
    if (fileType.startsWith("image/")) {
      determinedType = "image";
    }

    try {
      await createFile({
        name: values.title,
        fileId: storageId,
        orgId,
        type: determinedType,
        documentType: values.documentType,
        parentId: parentId,
      });

      form.reset();

      setIsFileDialogOpen(false);

      toast.success("File Uploaded", {
        description: "Now everyone can view your file",
      });
    } catch (err) {
      toast.error("Something went wrong", {
        description:
          err instanceof Error ? err.message : "Unknown error occurred",
      });
    }
  }

  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);

  const createFile = useMutation(api.files.createFile);

  return (
    <Dialog
      open={isFileDialogOpen}
      onOpenChange={(isOpen) => {
        setIsFileDialogOpen(isOpen);
        form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>Tambah File</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-8">Tambahkan File</DialogTitle>
          <DialogDescription>
            This file will be accessible by anyone in your organization
          </DialogDescription>
        </DialogHeader>

        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama File</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:border-gray-600 focus:ring-2 focus:ring-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Dokumen</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe dokumen yang akan diunggah" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {documentTypeEnum.map((docType) => (
                          <SelectItem key={docType} value={docType}>
                            {docType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="file"
                render={() => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <div
                        {...getRootProps()}
                        className={cn(
                          "flex items-center justify-center border border-dashed border-gray-400 rounded-md p-6 cursor-pointer bg-white transition",
                          isDragActive ? "bg-blue-100 border-blue-500" : ""
                        )}
                      >
                        <input {...getInputProps()} />
                        {form.watch("file")?.[0] ? (
                          <p className="text-sm text-gray-800">
                            {form.watch("file")[0].name}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 text-center">
                            Drag & drop file di sini, atau klik untuk memilih
                          </p>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="flex gap-1 bordered"
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Submit
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
