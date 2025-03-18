import { create } from "zustand";

export type QueueState = State;
export type QueueStore = State & Operations;
type State = {
  operations: { forward: any; operation: any }[];
  loading: boolean;
  error: { message: string } | null;
  isOnline: boolean;
};

type Operations = {
  setOperations: (operations: { forward: any; operation: any }[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: { message: string } | null) => void;
  setIsOnline: (online: boolean) => void;
  popOperation: () => void;
  pushOperation: (operation: { forward: any; operation: any }) => void;
  //updateOperations: () => void;
};

export const useQueueStore = create<State & Operations>((set) => ({
  operations: [],
  numberOperations: 0,
  loading: false,
  error: null,
  isOnline: false,
  setOperations: (operations) => set({ operations }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setIsOnline: (isOnline) => {
    console.log({ isOnline });
    set({ isOnline });
  },
  popOperation: () =>
    set((state) => {
      const newOps = state.operations.slice(1);
      return { operations: newOps };
    }),
  pushOperation: (operation) =>
    set((state) => {
      const newOps = [...state.operations, operation];
      return { operations: newOps };
    }),
}));
