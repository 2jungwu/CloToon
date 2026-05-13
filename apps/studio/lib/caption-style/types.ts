export type CaptionTextAlign = "left" | "center";
export type CaptionFontStyle = "normal" | "italic";
export type CaptionTextDecoration = "none" | "underline";
export type CaptionFontWeight = 400 | 500 | 600 | 700 | 800;
export type CaptionWidthMode = "full-width" | "fixed" | "fit-content";

export type CaptionTextStyle = {
  color: string;
  fontSize: number;
  fontWeight: CaptionFontWeight;
  fontStyle: CaptionFontStyle;
  textDecoration: CaptionTextDecoration;
  textAlign: CaptionTextAlign;
};

export type CaptionBoxStyle = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  opacity: number;
  paddingX: number;
  paddingY: number;
  widthMode: CaptionWidthMode;
  widthPx: number;
};

export type CaptionStyle = {
  text: CaptionTextStyle;
  box: CaptionBoxStyle;
};

export const defaultCaptionStyle: CaptionStyle = {
  text: {
    color: "#080808",
    fontSize: 32,
    fontWeight: 700,
    fontStyle: "normal",
    textDecoration: "none",
    textAlign: "center",
  },
  box: {
    backgroundColor: "#ffffff",
    borderColor: "#080808",
    borderWidth: 2,
    borderRadius: 0,
    opacity: 1,
    paddingX: 28,
    paddingY: 22,
    widthMode: "full-width",
    widthPx: 920,
  },
};
