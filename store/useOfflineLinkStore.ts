import { OfflineLink } from "@/lib/client";
import { create } from "zustand";

type StoreOperations = {
  offlineLink: OfflineLink;
  toggleOnline: () => void;
  //updateOperations: () => void;
};

export const useOfflineLinkStore = create<StoreOperations>((set, get) => ({
  offlineLink: new OfflineLink(),
  toggleOnline: () => {
    const { offlineLink } = get();
    offlineLink.toggleOnline();
    // Forzar actualización del estado
    set({ ...offlineLink } as OfflineLink);
    console.log({ isOn: offlineLink.isOnline });
  },
}));
