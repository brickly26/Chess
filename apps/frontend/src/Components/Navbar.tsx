import { MobileSidebar } from "./mobile-sidebar";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const router = useNavigate();
  return (
    <div className="chess-board supports-backdrop-blur:bg-background/60 fixed left-0 right-0 top-0 z-20 backdrop-blur  md:hidden text-white">
      <nav className="flex h-16 items-center justify-between px-4">
        <div>
          <MobileSidebar />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={"ghost"}
            onClick={() => {
              router("/login");
            }}
          >
            Login
          </Button>
        </div>
      </nav>
    </div>
  );
}
