export type CutTextOverlayInput = {
  caption: string;
  dialogue: string;
};

export type CutTextOverlay = {
  caption: string;
  dialogue: string;
  hasCaption: boolean;
  hasDialogue: boolean;
};

export function getCutTextOverlay(input: CutTextOverlayInput): CutTextOverlay {
  const caption = input.caption.trim().length > 0 ? input.caption : "";

  return {
    caption,
    dialogue: "",
    hasCaption: caption.length > 0,
    hasDialogue: false,
  };
}
