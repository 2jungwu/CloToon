export type HsvColor = {
  hue: number;
  saturation: number;
  value: number;
};

type ColorAreaRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

export function normalizeHexColor(value: string) {
  const normalized = value.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : null;
}

export function hexToRgb(value: string) {
  const normalized = normalizeHexColor(value);

  if (!normalized) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) =>
      Math.min(255, Math.max(0, Math.round(channel))).toString(16).padStart(2, "0"),
    )
    .join("")}`;
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function rgbToHsv({ r, g, b }: { r: number; g: number; b: number }): HsvColor {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta !== 0) {
    if (max === red) {
      hue = ((green - blue) / delta) % 6;
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }
  }

  const normalizedHue = Math.round(hue * 60);

  return {
    hue: normalizedHue < 0 ? normalizedHue + 360 : normalizedHue,
    saturation: max === 0 ? 0 : Math.round((delta / max) * 100),
    value: Math.round(max * 100),
  };
}

export function hsvToRgb({ hue, saturation, value }: HsvColor) {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const chroma = (value / 100) * (saturation / 100);
  const x = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
  const match = value / 100 - chroma;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (normalizedHue < 60) {
    red = chroma;
    green = x;
  } else if (normalizedHue < 120) {
    red = x;
    green = chroma;
  } else if (normalizedHue < 180) {
    green = chroma;
    blue = x;
  } else if (normalizedHue < 240) {
    green = x;
    blue = chroma;
  } else if (normalizedHue < 300) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  };
}

export function getColorAreaHsv({
  clientX,
  clientY,
  hue,
  rect,
}: {
  clientX: number;
  clientY: number;
  hue: number;
  rect: ColorAreaRect;
}): HsvColor {
  if (rect.width <= 0 || rect.height <= 0) {
    return {
      hue: clampNumber(hue, 0, 359),
      saturation: 0,
      value: 0,
    };
  }

  return {
    hue: clampNumber(hue, 0, 359),
    saturation: clampNumber(((clientX - rect.left) / rect.width) * 100, 0, 100),
    value: clampNumber(100 - ((clientY - rect.top) / rect.height) * 100, 0, 100),
  };
}

export function toRgba(hex: string, opacity: number) {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return hex;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(1, Math.max(0, opacity))})`;
}
