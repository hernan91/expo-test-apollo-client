import { OfflineLink } from "@/lib/client";
import { create } from "zustand";

type StoreOperations = {
  offlineLink: OfflineLink;
  toggleOnline: () => void;
  getOperations: () => any;
  //updateOperations: () => void;
};

export const useOfflineLinkStore = create<StoreOperations>((set, get) => ({
  offlineLink: new OfflineLink(),
  toggleOnline: () => {
    const { offlineLink } = get();
    offlineLink.toggleOnline();
    // Forzar actualización del estado
    set({ ...offlineLink } as OfflineLink);
  },
  getOperations: () => {
    const { offlineLink } = get();
    return offlineLink.operations;
  },
}));
