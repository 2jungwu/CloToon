"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ExpressionImage = {
  id: string;
  name: string;
  dataUrl: string;
};

type StudioAssets = {
  characterName: string;
  characterMarkdown: string;
  expressions: ExpressionImage[];
  backgroundName: string;
  backgroundPrompt: string;
  backgroundColor: string;
  subtitleFont: string;
  dialogueFont: string;
};

const storageKey = "local-studio-assets";

const defaultAssets: StudioAssets = {
  characterName: "clo",
  characterMarkdown:
    "# clo\n\n- 둥근 실루엣과 선명한 눈매를 가진 일관 캐릭터\n- 따뜻하지만 과장되지 않은 표정\n- 인스타툰에 맞는 깨끗한 선과 밝은 색감",
  expressions: [],
  backgroundName: "studio-room",
  backgroundPrompt: "clean local studio room, soft daylight, editorial webtoon background, no text",
  backgroundColor: "#f7f7f7",
  subtitleFont: "Pretendard",
  dialogueFont: "Pretendard",
};

export default function AssetsPage() {
  const [assets, setAssets] = useState(loadAssets);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  function updateAssets(patch: Partial<StudioAssets>) {
    setAssets((current) => ({ ...current, ...patch }));
    setSaveState("idle");
  }

  function saveAssets() {
    window.localStorage.setItem(storageKey, JSON.stringify(assets));
    setSaveState("saved");
  }

  async function importMarkdown(file: File | null) {
    if (!file) {
      return;
    }
    updateAssets({ characterMarkdown: await file.text() });
  }

  async function importExpressions(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const images = await Promise.all(
      Array.from(files).map(async (file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        dataUrl: await readFileAsDataUrl(file),
      })),
    );

    updateAssets({ expressions: [...assets.expressions, ...images] });
  }

  return (
    <section className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">Assets</p>
        <h1>자산 설정</h1>
        <p>캐릭터 설명 Markdown, 표정 이미지, 배경 프롬프트, 자막/대사 폰트를 로컬에 저장합니다.</p>
      </div>

      <div className="asset-grid">
        <div className="editor-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Character</p>
              <h2>캐릭터 프로필</h2>
            </div>
          </div>
          <Label className="field-stack">
            캐릭터 이름
            <Input
              value={assets.characterName}
              onChange={(event) => updateAssets({ characterName: event.target.value })}
            />
          </Label>
          <Label className="field-stack">
            캐릭터 Markdown
            <Textarea
              value={assets.characterMarkdown}
              rows={10}
              onChange={(event) => updateAssets({ characterMarkdown: event.target.value })}
            />
          </Label>
          <Label className="upload-button">
            Markdown 파일 업로드
            <input type="file" accept=".md,text/markdown,text/plain" onChange={(event) => importMarkdown(event.target.files?.[0] ?? null)} />
          </Label>
        </div>

        <div className="editor-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Expressions</p>
              <h2>표정 이미지</h2>
            </div>
          </div>
          <Label className="upload-button">
            표정 이미지 추가
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => importExpressions(event.target.files)}
            />
          </Label>
          <div className="expression-grid">
            {assets.expressions.map((image) => (
              <figure key={image.id} className="expression-card">
                <Image src={image.dataUrl} alt={image.name} width={160} height={160} unoptimized />
                <figcaption>{image.name}</figcaption>
              </figure>
            ))}
            {assets.expressions.length === 0 ? <p className="empty-state">아직 등록된 표정 이미지가 없습니다.</p> : null}
          </div>
        </div>

        <div className="editor-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Background</p>
              <h2>배경과 폰트</h2>
            </div>
          </div>
          <Label className="field-stack">
            배경 이름
            <Input
              value={assets.backgroundName}
              onChange={(event) => updateAssets({ backgroundName: event.target.value })}
            />
          </Label>
          <Label className="field-stack">
            배경 프롬프트
            <Textarea
              value={assets.backgroundPrompt}
              rows={4}
              onChange={(event) => updateAssets({ backgroundPrompt: event.target.value })}
            />
          </Label>
          <Label className="field-stack">
            배경 색상
            <Input
              type="color"
              value={assets.backgroundColor}
              onChange={(event) => updateAssets({ backgroundColor: event.target.value })}
            />
          </Label>
          <div className="form-grid compact">
            <Label className="field-stack">
              자막 폰트
              <FontSelect value={assets.subtitleFont} onChange={(value) => updateAssets({ subtitleFont: value })} />
            </Label>
            <Label className="field-stack">
              대사 폰트
              <FontSelect value={assets.dialogueFont} onChange={(value) => updateAssets({ dialogueFont: value })} />
            </Label>
          </div>
          <div className="asset-preview" style={{ background: assets.backgroundColor }}>
            <strong style={{ fontFamily: assets.subtitleFont }}>{assets.characterName}</strong>
            <span style={{ fontFamily: assets.dialogueFont }}>프롬프트에 활용될 로컬 자산 미리보기</span>
          </div>
          <div className="toolbar-row">
            <Button type="button" onClick={saveAssets}>
              로컬 저장
            </Button>
            <p className="save-state save-state-saved">{saveState === "saved" ? "저장 완료" : ""}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FontSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Pretendard">Pretendard</SelectItem>
        <SelectItem value="Arial">Arial</SelectItem>
        <SelectItem value="Noto Sans KR">Noto Sans KR</SelectItem>
        <SelectItem value="system-ui">System UI</SelectItem>
      </SelectContent>
    </Select>
  );
}

function loadAssets(): StudioAssets {
  if (typeof window === "undefined") {
    return defaultAssets;
  }

  const saved = window.localStorage.getItem(storageKey);
  return saved ? { ...defaultAssets, ...JSON.parse(saved) } : defaultAssets;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
