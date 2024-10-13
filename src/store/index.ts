import { create } from "zustand";

interface IStore {
  bears: number;
  updateBears: (newBears: number) => void;
}

const useStore = create<IStore>((set) => ({
  bears: 0,
  updateBears: (newBears) => set({ bears: newBears }),
}));

export default useStore;
