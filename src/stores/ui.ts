import { create } from "zustand";

interface UiState {
  activeCardId: string | null;
  openCard: (cardId: string) => void;
  closeCard: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeCardId: null,
  openCard: (cardId) => set({ activeCardId: cardId }),
  closeCard: () => set({ activeCardId: null }),
}));
