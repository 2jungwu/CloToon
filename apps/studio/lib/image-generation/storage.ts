import type { ImageGenerationAssets, ImageGenerationCharacter } from "@/lib/image-generation/types";
import { isAllowedReferenceImageDataUrl } from "@/lib/cuts/image-data-url";

export const assetsStorageKey = "local-studio-assets";
export const settingsStorageKey = "local-studio-settings";

const defaultCharacterMarkdown = `# clo

- local studio character
- clean silhouette
- bright, readable expression`;

export function loadGeminiApiKeyFromStorage(storage: Storage) {
  const value = readStorageJson(storage, settingsStorageKey);
  return isRecord(value) ? getString(value.geminiApiKey, "") : "";
}

export function loadImageGenerationAssetsFromStorage(storage: Storage): ImageGenerationAssets {
  return migrateAssets(readStorageJson(storage, assetsStorageKey));
}

function readStorageJson(storage: Storage, key: string) {
  try {
    const saved = storage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function migrateAssets(value: unknown): ImageGenerationAssets {
  if (!isRecord(value)) {
    return createDefaultAssets();
  }

  if (Array.isArray(value.characters)) {
    const characters = value.characters
      .map(normalizeCharacter)
      .filter((character): character is ImageGenerationCharacter => character !== null);
    const ensuredCharacters = characters.length > 0 ? characters : createDefaultAssets().characters;
    const selectedCharacterId = ensuredCharacters.some(
      (character) => character.id === value.selectedCharacterId,
    )
      ? getString(value.selectedCharacterId, ensuredCharacters[0].id)
      : ensuredCharacters[0].id;
    const background = getRecord(value.background);

    return {
      selectedCharacterId,
      characters: ensuredCharacters,
      background: {
        name: getString(background?.name, "studio-room"),
        prompt: getString(
          background?.prompt,
          "clean local studio room, soft daylight, editorial webtoon background, no text",
        ),
        color: getString(background?.color, "#f7f7f7"),
      },
    };
  }

  const character: ImageGenerationCharacter = {
    id: "character-legacy",
    name: getString(value.characterName, "clo"),
    markdown: getString(value.characterMarkdown, defaultCharacterMarkdown),
    expressions: normalizeExpressions(value.expressions),
  };

  return {
    selectedCharacterId: character.id,
    characters: [character],
    background: {
      name: getString(value.backgroundName, "studio-room"),
      prompt: getString(
        value.backgroundPrompt,
        "clean local studio room, soft daylight, editorial webtoon background, no text",
      ),
      color: getString(value.backgroundColor, "#f7f7f7"),
    },
  };
}

function createDefaultAssets(): ImageGenerationAssets {
  return {
    selectedCharacterId: "character-default",
    characters: [
      {
        id: "character-default",
        name: "clo",
        markdown: defaultCharacterMarkdown,
        expressions: [],
      },
    ],
    background: {
      name: "studio-room",
      prompt: "clean local studio room, soft daylight, editorial webtoon background, no text",
      color: "#f7f7f7",
    },
  };
}

function normalizeCharacter(value: unknown): ImageGenerationCharacter | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: getString(value.id, "character-local"),
    name: getString(value.name, "clo"),
    markdown: getString(value.markdown, defaultCharacterMarkdown),
    expressions: normalizeExpressions(value.expressions),
  };
}

function normalizeExpressions(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const dataUrl = getString(item.dataUrl, "");
      if (!isAllowedReferenceImageDataUrl(dataUrl)) {
        return null;
      }

      return {
        id: getString(item.id, "expression-local"),
        name: getString(item.name, "expression"),
        dataUrl,
      };
    })
    .filter((item): item is { id: string; name: string; dataUrl: string } => item !== null);
}

function getRecord(value: unknown) {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}
