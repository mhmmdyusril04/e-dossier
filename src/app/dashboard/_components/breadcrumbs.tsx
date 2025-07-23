import { ChevronRight } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

export function Breadcrumbs({
    path,
    onNavigate,
}: {
    path: { _id: Id<"files">; name: string }[];
    onNavigate: (fileId: Id<"files"> | undefined) => void;
}) {
    return (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 flex-wrap">
            <div
                onClick={() => onNavigate(undefined)}
                className="hover:underline cursor-pointer"
            >
                Semua File
            </div>
            {path.map((item, index) => (
                <div key={item._id} className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    <div
                        onClick={() => onNavigate(item._id)}
                        className={`hover:underline ${index === path.length - 1 ? "text-black font-medium" : "cursor-pointer"
                            }`}
                    >
                        {item.name}
                    </div>
                </div>
            ))}
        </div>
    );
}