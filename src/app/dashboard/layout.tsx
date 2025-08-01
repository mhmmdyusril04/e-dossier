import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { SideNav } from "./side-nav";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-100vh w-full overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-[220px] lg:w-[280px] bg-blue-950 text-white border-r">
        <div className="flex items-center h-14 border-b px-4 lg:h-[60px] lg:px-6">
          <h2 className="text-lg font-bold">Menu</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <SideNav />
        </div>
      </aside>

      {/* Content area */}
      <div className="flex flex-col flex-1 h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex h-14 items-center gap-4 px-4 border-b bg-muted/40 sticky top-0 z-20">
          <Sheet>
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-4">
              <h2 className="text-lg font-bold mb-4 border-b pb-4">
                Dashboard
              </h2>
              <SideNav />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold">Menu</h1>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
