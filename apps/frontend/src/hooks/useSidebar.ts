/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";

interface SidebarStore {
  isOpen: boolean;
  toggle: () => void;
}

export const useSidebar = create<SidebarStore>((set: any) => ({
  isOpen: true,
  toggle: () => set((state: any) => ({ isOpen: !state.isOpen })),
}));
