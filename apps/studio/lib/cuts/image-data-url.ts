export const maxCutImageDataUrlLength = 8_000_000;
export const maxReferenceImageDataUrlLength = 2_000_000;

const rasterImageDataUrlPattern =
  /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/i;
const encodedSvgDataUrlPattern = /^data:image\/svg\+xml;charset=utf-8,[A-Za-z0-9%_.!~*'()-]+$/i;

export function isAllowedCutImageDataUrl(value: string) {
  if (value.length === 0) {
    return true;
  }

  if (value.length > maxCutImageDataUrlLength) {
    return false;
  }

  return rasterImageDataUrlPattern.test(value) || encodedSvgDataUrlPattern.test(value);
}

export function isAllowedReferenceImageDataUrl(value: string) {
  return value.length <= maxReferenceImageDataUrlLength && rasterImageDataUrlPattern.test(value);
}

export function isSupportedGeneratedImageMimeType(mimeType: string) {
  return /^image\/(?:png|jpeg|webp)$/i.test(mimeType);
}

export function toCssImageUrl(dataUrl: string) {
  if (!isAllowedCutImageDataUrl(dataUrl) || dataUrl.length === 0) {
    return "none";
  }

  return `url("${dataUrl}")`;
}
