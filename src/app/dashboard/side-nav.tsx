"use client";

import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { FileIcon, StarIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
    { name: "File Drive", href: "/dashboard/files", icon: FileIcon },
    { name: "Favorite", href: "/dashboard/favorites", icon: StarIcon },
    { name: "Trash", href: "/dashboard/trash", icon: TrashIcon },
];

export function SideNav() {
    const pathname = usePathname();

    return (
        <nav className="grid items-start text-sm font-medium">
            {links.map((link) => (
                <Link key={link.name} href={link.href}>
                    <Button
                        variant="ghost"
                        className={clsx("w-full justify-start gap-2", {
                            "bg-muted text-primary": pathname.startsWith(link.href),
                        })}
                    >
                        <link.icon className="h-4 w-4" />
                        {link.name}
                    </Button>
                </Link>
            ))}
        </nav>
    );
}