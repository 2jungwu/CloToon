"use client";

import type {
  CSSProperties,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { useEffect, useRef, useState } from "react";
import { TextAlignCenterIcon, TextAlignLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clampNumber,
  getColorAreaHsv,
  hexToRgb,
  hsvToRgb,
  normalizeHexColor,
  rgbToHex,
  rgbToHsv,
  toRgba,
  type HsvColor,
} from "@/lib/caption-style/color";
import { normalizeCaptionStyle } from "@/lib/caption-style/schema";
import type { CaptionStyle, CaptionWidthMode } from "@/lib/caption-style/types";

export type CaptionLayerCSSProperties = CSSProperties & Record<`--${string}`, string | number>;

export type CaptionLayerEditorValue = {
  caption: string;
  captionStyle: CaptionStyle;
};

type CaptionLayerEditorProps = {
  onBlur?: () => void;
  onChange: (value: CaptionLayerEditorValue) => void;
  showCaptionTextarea?: boolean;
  value: CaptionLayerEditorValue;
};

type CaptionStylePatch = {
  text?: Partial<CaptionStyle["text"]>;
  box?: Partial<CaptionStyle["box"]>;
};

const labels = {
  alignCenter: "\uac00\uc6b4\ub370 \uc815\ub82c",
  alignLeft: "\uc67c\ucabd \uc815\ub82c",
  blue: "B",
  bold: "\uad75\uac8c",
  borderRadius: "\ubaa8\uc11c\ub9ac",
  borderWidth: "\uc120",
  boxBackgroundColor: "\ubc30\uacbd",
  boxBorderColor: "\ud14c\ub450\ub9ac",
  boxPadding: "\uc548\ucabd \uc5ec\ubc31",
  boxWidthFit: "\ub0b4\uc6a9 \ub9de\ucda4",
  boxWidthFixed: "\uace0\uc815",
  boxWidthFull: "\uc804\uccb4 \ub108\ube44",
  boxWidthMode: "\ubc15\uc2a4 \ub108\ube44 \ubc29\uc2dd",
  boxWidthPx: "\uace0\uc815 \ub108\ube44",
  cancel: "\ucde8\uc18c",
  caption: "\uc790\ub9c9",
  captionBoxStyle: "\ubc30\uacbd, \ud14c\ub450\ub9ac, \uc120, \ubaa8\uc11c\ub9ac",
  captionLayerEdit: "\uc790\ub9c9 \ub808\uc774\uc5b4 \ud3b8\uc9d1",
  captionPlaceholder: "\ud654\uba74\uc5d0 \ud45c\uc2dc\ud560 \uc790\ub9c9\uc744 \uc785\ub825\ud558\uc138\uc694.",
  captionTextStyle: "\ud14d\uc2a4\ud2b8 \uae00\uc790 \uc2a4\ud0c0\uc77c",
  colorBrightness: "\ucc44\ub3c4 {saturation}%, \ubc1d\uae30 {value}%",
  colorGradient: "\ucc44\ub3c4\uc640 \ubc1d\uae30",
  confirm: "\ud655\uc778",
  fontColor: "\uae00\uc790\uc0c9",
  fontSize: "\uae00\uc790 \ud06c\uae30",
  green: "G",
  hexColor: "HEX",
  hue: "\uc0c9\uc0c1",
  italic: "\uae30\uc6b8\uc784",
  presets: "\ud504\ub9ac\uc14b",
  red: "R",
  shell: "\uc790\ub9c9 \ubc15\uc2a4",
  underline: "\ubc11\uc904",
};

const captionColorPresets = [
  "#080808",
  "#ffffff",
  "#ff3b30",
  "#ff9500",
  "#ffcc00",
  "#34c759",
  "#0071e3",
  "#5856d6",
  "#af52de",
] as const;

const captionFontSizeOptions = [24, 28, 32, 36, 44, 52, 64] as const;
const captionBorderWidthOptions = [0, 1, 2, 3, 4, 6] as const;
const captionBorderRadiusOptions = [0, 4, 8, 12, 16, 24] as const;

export function getCaptionLayerStyle(captionStyleInput: CaptionStyle): CaptionLayerCSSProperties {
  const captionStyle = normalizeCaptionStyle(captionStyleInput);

  return {
    "--caption-color": captionStyle.text.color,
    "--caption-font-size": `${captionStyle.text.fontSize}px`,
    "--caption-font-style": captionStyle.text.fontStyle,
    "--caption-font-weight": captionStyle.text.fontWeight,
    "--caption-text-align": captionStyle.text.textAlign,
    "--caption-text-decoration": captionStyle.text.textDecoration,
    "--caption-box-background": toRgba(captionStyle.box.backgroundColor, captionStyle.box.opacity),
    "--caption-box-border-color": captionStyle.box.borderColor,
    "--caption-box-border-radius": `${captionStyle.box.borderRadius}px`,
    "--caption-box-border-width": `${captionStyle.box.borderWidth}px`,
    "--caption-box-padding-x": `${captionStyle.box.paddingX}px`,
    "--caption-box-padding-y": `${captionStyle.box.paddingY}px`,
    "--caption-box-width": getCaptionWidthValue(
      captionStyle.box.widthMode,
      captionStyle.box.widthPx,
    ),
  };
}

export function CaptionLayerEditor({
  onBlur,
  onChange,
  showCaptionTextarea = true,
  value,
}: CaptionLayerEditorProps) {
  const captionStyle = normalizeCaptionStyle(value.captionStyle);
  const isBold = captionStyle.text.fontWeight >= 700;

  function updateCaptionStyle(patch: CaptionStylePatch) {
    onChange({
      ...value,
      captionStyle: mergeCaptionStyle(captionStyle, patch),
    });
  }

  function updateCaption(caption: string) {
    onChange({ ...value, caption });
  }

  return (
    <section className="caption-layer-editor" aria-label={labels.captionLayerEdit}>
      <div className="caption-editor-section">
        <div className="caption-editor-head">
          <strong>{labels.caption}</strong>
          <span>{labels.captionTextStyle}</span>
        </div>
        <div className="caption-editor-toolbar text-toolbar" aria-label={labels.captionTextStyle}>
          <CaptionColorControl
            label={labels.fontColor}
            onChange={(color) => updateCaptionStyle({ text: { color } })}
            value={captionStyle.text.color}
          />
          <Select
            onValueChange={(nextValue) =>
              updateCaptionStyle({ text: { fontSize: Number.parseInt(nextValue, 10) } })
            }
            value={String(captionStyle.text.fontSize)}
          >
            <SelectTrigger className="caption-font-size-select" aria-label={labels.fontSize}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {captionFontSizeOptions.map((fontSize) => (
                <SelectItem key={fontSize} value={String(fontSize)}>
                  {fontSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            aria-label={labels.bold}
            className="caption-tool"
            data-active={isBold}
            onClick={() => updateCaptionStyle({ text: { fontWeight: isBold ? 400 : 700 } })}
            type="button"
          >
            B
          </button>
          <button
            aria-label={labels.italic}
            className="caption-tool"
            data-active={captionStyle.text.fontStyle === "italic"}
            onClick={() =>
              updateCaptionStyle({
                text: {
                  fontStyle: captionStyle.text.fontStyle === "italic" ? "normal" : "italic",
                },
              })
            }
            type="button"
          >
            <i>I</i>
          </button>
          <button
            aria-label={labels.underline}
            className="caption-tool"
            data-active={captionStyle.text.textDecoration === "underline"}
            onClick={() =>
              updateCaptionStyle({
                text: {
                  textDecoration:
                    captionStyle.text.textDecoration === "underline" ? "none" : "underline",
                },
              })
            }
            type="button"
          >
            <span className="caption-underline">U</span>
          </button>
          <span className="caption-toolbar-divider" aria-hidden="true" />
          <button
            aria-label={labels.alignLeft}
            className="caption-tool"
            data-active={captionStyle.text.textAlign === "left"}
            onClick={() => updateCaptionStyle({ text: { textAlign: "left" } })}
            type="button"
          >
            <HugeiconsIcon aria-hidden="true" icon={TextAlignLeftIcon} size={16} strokeWidth={2} />
          </button>
          <button
            aria-label={labels.alignCenter}
            className="caption-tool"
            data-active={captionStyle.text.textAlign === "center"}
            onClick={() => updateCaptionStyle({ text: { textAlign: "center" } })}
            type="button"
          >
            <HugeiconsIcon aria-hidden="true" icon={TextAlignCenterIcon} size={16} strokeWidth={2} />
          </button>
        </div>
        {showCaptionTextarea ? (
          <textarea
            className="caption-textarea"
            onBlur={onBlur}
            onChange={(event) => updateCaption(event.target.value)}
            placeholder={labels.captionPlaceholder}
            rows={3}
            value={value.caption}
          />
        ) : null}
      </div>

      <div className="caption-editor-section">
        <div className="caption-editor-head">
          <strong>{labels.shell}</strong>
          <span>{labels.captionBoxStyle}</span>
        </div>
        <div className="caption-box-toolbar" aria-label={labels.captionBoxStyle}>
          <CaptionControlField label={labels.boxBackgroundColor}>
            <CaptionColorControl
              label={labels.boxBackgroundColor}
              onChange={(backgroundColor) => updateCaptionStyle({ box: { backgroundColor } })}
              value={captionStyle.box.backgroundColor}
              variant="field"
            />
          </CaptionControlField>
          <CaptionControlField label={labels.boxBorderColor}>
            <CaptionColorControl
              label={labels.boxBorderColor}
              onChange={(borderColor) => updateCaptionStyle({ box: { borderColor } })}
              value={captionStyle.box.borderColor}
              variant="field"
            />
          </CaptionControlField>
          <CaptionControlField label={labels.borderWidth}>
            <Select
              onValueChange={(nextValue) =>
                updateCaptionStyle({ box: { borderWidth: Number.parseInt(nextValue, 10) } })
              }
              value={String(captionStyle.box.borderWidth)}
            >
              <SelectTrigger className="caption-compact-select" aria-label={labels.borderWidth}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {captionBorderWidthOptions.map((borderWidth) => (
                  <SelectItem key={borderWidth} value={String(borderWidth)}>
                    {borderWidth}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CaptionControlField>
          <CaptionControlField label={labels.borderRadius}>
            <Select
              onValueChange={(nextValue) =>
                updateCaptionStyle({ box: { borderRadius: Number.parseInt(nextValue, 10) } })
              }
              value={String(captionStyle.box.borderRadius)}
            >
              <SelectTrigger className="caption-compact-select" aria-label={labels.borderRadius}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {captionBorderRadiusOptions.map((borderRadius) => (
                  <SelectItem key={borderRadius} value={String(borderRadius)}>
                    {borderRadius}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CaptionControlField>
          <CaptionNumberInput
            label={`${labels.boxPadding} X`}
            max={96}
            min={0}
            onBlur={onBlur}
            onChange={(paddingX) => updateCaptionStyle({ box: { paddingX } })}
            value={captionStyle.box.paddingX}
          />
          <CaptionNumberInput
            label={`${labels.boxPadding} Y`}
            max={96}
            min={0}
            onBlur={onBlur}
            onChange={(paddingY) => updateCaptionStyle({ box: { paddingY } })}
            value={captionStyle.box.paddingY}
          />
        </div>
        <div className="caption-width-editor">
          <span>{labels.boxWidthMode}</span>
          <div className="caption-segmented" role="group" aria-label={labels.boxWidthMode}>
            {(
              [
                ["full-width", labels.boxWidthFull],
                ["fixed", labels.boxWidthFixed],
                ["fit-content", labels.boxWidthFit],
              ] as const
            ).map(([widthMode, label]) => (
              <button
                data-active={captionStyle.box.widthMode === widthMode}
                key={widthMode}
                onClick={() => updateCaptionStyle({ box: { widthMode } })}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          {captionStyle.box.widthMode === "fixed" ? (
            <CaptionNumberInput
              label={labels.boxWidthPx}
              max={1080}
              min={240}
              onBlur={onBlur}
              onChange={(widthPx) => updateCaptionStyle({ box: { widthPx } })}
              value={captionStyle.box.widthPx}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function mergeCaptionStyle(captionStyle: CaptionStyle, patch: CaptionStylePatch): CaptionStyle {
  return normalizeCaptionStyle({
    text: {
      ...captionStyle.text,
      ...patch.text,
    },
    box: {
      ...captionStyle.box,
      ...patch.box,
    },
  });
}

function getCaptionWidthValue(widthMode: CaptionWidthMode, widthPx: number) {
  if (widthMode === "fixed") {
    return `${widthPx}px`;
  }

  if (widthMode === "fit-content") {
    return "auto";
  }

  return "calc(100% - 48px)";
}

function CaptionControlField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="caption-control-field">
      <span className="caption-control-field-label">{label}</span>
      {children}
    </div>
  );
}

type CaptionColorControlProps = {
  label: string;
  onChange: (color: string) => void;
  value: string;
  variant?: "compact" | "field";
};

function CaptionColorControl({
  label,
  onChange,
  value,
  variant = "compact",
}: CaptionColorControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftHex, setDraftHex] = useState(value);
  const isFieldVariant = variant === "field";
  const normalizedValue = normalizeHexColor(value) ?? "#000000";
  const normalizedDraftHex = normalizeHexColor(draftHex) ?? normalizedValue;
  const draftRgb = hexToRgb(normalizedDraftHex) ?? { r: 0, g: 0, b: 0 };
  const draftHsv = rgbToHsv(draftRgb);
  const hueRgb = hsvToRgb({ hue: draftHsv.hue, saturation: 100, value: 100 });
  const hueHex = rgbToHex(hueRgb.r, hueRgb.g, hueRgb.b);
  const isDraggingColorAreaRef = useRef(false);
  const draftHsvRef = useRef(draftHsv);
  const initialColorRef = useRef(normalizedValue);

  useEffect(() => {
    draftHsvRef.current = draftHsv;
  }, [draftHsv]);

  function updateDraftColor(nextValue: string) {
    const normalized = normalizeHexColor(nextValue);
    setDraftHex(normalized ?? nextValue);
    if (normalized) {
      const nextRgb = hexToRgb(normalized);
      if (nextRgb) {
        draftHsvRef.current = rgbToHsv(nextRgb);
      }
      onChange(normalized);
    }
  }

  function updateDraftHsv(nextHsv: HsvColor) {
    const normalizedHsv = {
      hue: clampNumber(nextHsv.hue, 0, 359),
      saturation: clampNumber(nextHsv.saturation, 0, 100),
      value: clampNumber(nextHsv.value, 0, 100),
    };
    const nextRgb = hsvToRgb({
      hue: normalizedHsv.hue,
      saturation: normalizedHsv.saturation,
      value: normalizedHsv.value,
    });
    const nextHex = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b);
    draftHsvRef.current = normalizedHsv;
    setDraftHex(nextHex);
    onChange(nextHex);
  }

  function updateDraftFromColorArea(element: HTMLDivElement, clientX: number, clientY: number) {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const nextHsv = getColorAreaHsv({
      clientX,
      clientY,
      hue: draftHsvRef.current.hue,
      rect,
    });

    updateDraftHsv(nextHsv);
  }

  function handleColorAreaClick(event: ReactMouseEvent<HTMLDivElement>) {
    updateDraftFromColorArea(event.currentTarget, event.clientX, event.clientY);
  }

  function handleColorAreaPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    isDraggingColorAreaRef.current = true;
    event.currentTarget.focus();
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    updateDraftFromColorArea(event.currentTarget, event.clientX, event.clientY);
  }

  function handleColorAreaPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDraggingColorAreaRef.current) {
      return;
    }

    event.preventDefault();
    updateDraftFromColorArea(event.currentTarget, event.clientX, event.clientY);
  }

  function handleColorAreaPointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    isDraggingColorAreaRef.current = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleColorAreaKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 2;
    const currentHsv = draftHsvRef.current;
    let nextHsv: HsvColor | null = null;

    switch (event.key) {
      case "ArrowRight":
        nextHsv = {
          ...currentHsv,
          saturation: clampNumber(currentHsv.saturation + step, 0, 100),
        };
        break;
      case "ArrowLeft":
        nextHsv = {
          ...currentHsv,
          saturation: clampNumber(currentHsv.saturation - step, 0, 100),
        };
        break;
      case "ArrowUp":
        nextHsv = {
          ...currentHsv,
          value: clampNumber(currentHsv.value + step, 0, 100),
        };
        break;
      case "ArrowDown":
        nextHsv = {
          ...currentHsv,
          value: clampNumber(currentHsv.value - step, 0, 100),
        };
        break;
      case "Home":
        nextHsv = { ...currentHsv, saturation: 0 };
        break;
      case "End":
        nextHsv = { ...currentHsv, saturation: 100 };
        break;
      case "PageUp":
        nextHsv = { ...currentHsv, value: 100 };
        break;
      case "PageDown":
        nextHsv = { ...currentHsv, value: 0 };
        break;
      case "Enter":
        event.preventDefault();
        commitColor();
        return;
      default:
        return;
    }

    event.preventDefault();
    updateDraftHsv(nextHsv);
  }

  function updateDraftRgb(channel: "r" | "g" | "b", rawValue: string) {
    const parsed = Number.parseInt(rawValue, 10);
    const nextRgb = {
      ...draftRgb,
      [channel]: Number.isFinite(parsed) ? Math.min(255, Math.max(0, parsed)) : 0,
    };
    const nextHex = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b);
    draftHsvRef.current = rgbToHsv(nextRgb);
    setDraftHex(nextHex);
    onChange(nextHex);
  }

  function updateDraftHue(rawValue: string) {
    const parsed = Number.parseInt(rawValue, 10);
    const currentHsv = draftHsvRef.current;
    updateDraftHsv({
      hue: Number.isFinite(parsed) ? parsed : currentHsv.hue,
      saturation: currentHsv.saturation,
      value: currentHsv.value,
    });
  }

  function commitColor() {
    const normalized = normalizeHexColor(draftHex) ?? normalizedValue;
    onChange(normalized);
    setIsOpen(false);
  }

  function toggleColorPicker() {
    if (!isOpen) {
      initialColorRef.current = normalizedValue;
      setDraftHex(normalizedValue);
    }
    setIsOpen(!isOpen);
  }

  function cancelColor() {
    setDraftHex(initialColorRef.current);
    onChange(initialColorRef.current);
    setIsOpen(false);
  }

  return (
    <div className="caption-color-control">
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={label}
        className={
          isFieldVariant ? "caption-toolbar-control caption-color-trigger" : "caption-tool color-tool"
        }
        onClick={toggleColorPicker}
        type="button"
      >
        <span className="caption-color-swatch" style={{ backgroundColor: normalizedValue }} />
        {isFieldVariant ? <span className="caption-color-value">{normalizedValue}</span> : null}
      </button>
      {isOpen ? (
        <div className="caption-color-popover" role="dialog" aria-label={label}>
          <div
            aria-label={`${label} ${labels.colorGradient}`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(draftHsv.saturation)}
            aria-valuetext={labels.colorBrightness
              .replace("{saturation}", String(Math.round(draftHsv.saturation)))
              .replace("{value}", String(Math.round(draftHsv.value)))}
            className="caption-color-gradient"
            onClick={handleColorAreaClick}
            onKeyDown={handleColorAreaKeyDown}
            onLostPointerCapture={handleColorAreaPointerEnd}
            onPointerCancel={handleColorAreaPointerEnd}
            onPointerDown={handleColorAreaPointerDown}
            onPointerMove={handleColorAreaPointerMove}
            onPointerUp={handleColorAreaPointerEnd}
            role="slider"
            style={{
              background: `linear-gradient(180deg, rgba(255,255,255,0), #000000), linear-gradient(90deg, #ffffff, ${hueHex})`,
            }}
            tabIndex={0}
            title={label}
          >
            <span
              className="caption-color-gradient-handle"
              style={{
                backgroundColor: normalizedDraftHex,
                left: `${draftHsv.saturation}%`,
                top: `${100 - draftHsv.value}%`,
              }}
            />
          </div>
          <div className="caption-color-picker-row">
            <span
              className="caption-color-large-swatch"
              style={{ backgroundColor: normalizedDraftHex }}
            />
            <label className="caption-color-hue-field">
              <span>{labels.hue}</span>
              <input
                aria-label={`${label} ${labels.hue}`}
                className="caption-color-hue"
                max={359}
                min={0}
                onChange={(event) => updateDraftHue(event.target.value)}
                style={{
                  background:
                    "linear-gradient(90deg, #ff3b30, #ff9500, #ffcc00, #34c759, #0071e3, #5856d6, #af52de, #ff3b30)",
                }}
                type="range"
                value={draftHsv.hue}
              />
            </label>
          </div>
          <div className="caption-color-presets" aria-label={`${label} ${labels.presets}`}>
            {captionColorPresets.map((preset) => (
              <button
                aria-label={preset}
                data-active={normalizedDraftHex === preset}
                key={preset}
                onClick={() => updateDraftColor(preset)}
                style={{ backgroundColor: preset }}
                type="button"
              />
            ))}
          </div>
          <div className="caption-color-fields">
            <label>
              <span>{labels.hexColor}</span>
              <Input onChange={(event) => updateDraftColor(event.target.value)} value={draftHex} />
            </label>
            <label>
              <span>{labels.red}</span>
              <Input
                max={255}
                min={0}
                onChange={(event) => updateDraftRgb("r", event.target.value)}
                type="number"
                value={draftRgb.r}
              />
            </label>
            <label>
              <span>{labels.green}</span>
              <Input
                max={255}
                min={0}
                onChange={(event) => updateDraftRgb("g", event.target.value)}
                type="number"
                value={draftRgb.g}
              />
            </label>
            <label>
              <span>{labels.blue}</span>
              <Input
                max={255}
                min={0}
                onChange={(event) => updateDraftRgb("b", event.target.value)}
                type="number"
                value={draftRgb.b}
              />
            </label>
          </div>
          <div className="caption-color-actions">
            <Button onClick={cancelColor} type="button" variant="secondary">
              {labels.cancel}
            </Button>
            <Button onClick={commitColor} type="button">
              {labels.confirm}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type CaptionNumberInputProps = {
  label: string;
  max: number;
  min: number;
  onBlur?: () => void;
  onChange: (value: number) => void;
  value: number;
};

function CaptionNumberInput({
  label,
  max,
  min,
  onBlur,
  onChange,
  value,
}: CaptionNumberInputProps) {
  return (
    <label className="caption-number-field">
      <span>{label}</span>
      <Input
        max={max}
        min={min}
        onBlur={onBlur}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          if (Number.isFinite(parsed)) {
            onChange(Math.min(max, Math.max(min, parsed)));
          }
        }}
        type="number"
        value={value}
      />
    </label>
  );
}
