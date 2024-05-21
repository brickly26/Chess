import { useState, useEffect } from "react";
import { MenuIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { SideNav } from "./side-nav";
import { UpperNavItems, LowerNavItems } from "./constants/side-nav";

export const MobileSidebar = () => {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <div className="flex items-center justify-center gap-2">
            <MenuIcon />
            <h1 className="text-lg font-semibold">Chess</h1>
          </div>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-36 text-muted-foreground flex flex-col h-full justify-between"
        >
          <div className="flex flex-col justify-start">
            <h1 className="text-center text-white">Chess</h1>
            <SideNav items={UpperNavItems} setOpen={setOpen} />
          </div>
          <div>
            <SideNav items={LowerNavItems} setOpen={setOpen} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
