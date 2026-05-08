"use client";

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

type StudioSettings = {
  provider: "mock" | "gemini";
  geminiApiKey: string;
  exportScale: "1080" | "2160";
  saveOriginalHtml: boolean;
};

const storageKey = "local-studio-settings";

const defaultSettings: StudioSettings = {
  provider: "gemini",
  geminiApiKey: "",
  exportScale: "1080",
  saveOriginalHtml: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(loadSettings);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  function updateSettings(patch: Partial<StudioSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
    setSaveState("idle");
  }

  function saveSettings() {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
    setSaveState("saved");
  }

  const providerReady = settings.provider === "mock" || settings.geminiApiKey.trim().length > 0;

  return (
    <section className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">Settings</p>
        <h1>로컬 제작 설정</h1>
        <p>이미지 provider와 내보내기 옵션을 브라우저 로컬 저장소에 보관합니다.</p>
      </div>

      <div className="settings-grid">
        <div className="editor-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Provider</p>
              <h2>이미지 생성 방식</h2>
            </div>
            <span className={providerReady ? "status-pill ready" : "status-pill warning"}>
              {providerReady ? "Ready" : "API Key 필요"}
            </span>
          </div>

          <Label className="field-stack">
            Provider
            <Select
              value={settings.provider}
              onValueChange={(value) => updateSettings({ provider: value as StudioSettings["provider"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mock">Mock provider</SelectItem>
                <SelectItem value="gemini">Gemini API key</SelectItem>
              </SelectContent>
            </Select>
          </Label>

          <Label className="field-stack">
            Gemini API Key
            <Input
              type="password"
              value={settings.geminiApiKey}
              placeholder="로컬 브라우저에만 저장됩니다."
              onChange={(event) => updateSettings({ geminiApiKey: event.target.value })}
            />
          </Label>

          <div className="notice-panel">
            Google 로그인만으로 유료 API 사용을 우회하는 기능은 제공하지 않습니다. 기본 제작, mock 이미지, HTML/PNG/ZIP 다운로드는 외부 API 없이 로컬에서 동작합니다.
          </div>
        </div>

        <div className="editor-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Export</p>
              <h2>다운로드 옵션</h2>
            </div>
          </div>

          <Label className="field-stack">
            PNG 기준 해상도
            <Select
              value={settings.exportScale}
              onValueChange={(value) => updateSettings({ exportScale: value as StudioSettings["exportScale"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1080">1080 기준</SelectItem>
                <SelectItem value="2160">2160 기준</SelectItem>
              </SelectContent>
            </Select>
          </Label>

          <Label className="check-row">
            <input
              type="checkbox"
              checked={settings.saveOriginalHtml}
              onChange={(event) => updateSettings({ saveOriginalHtml: event.target.checked })}
            />
            HTML 원본을 프로젝트 데이터와 함께 유지
          </Label>

          <Label className="field-stack">
            Provider payload preview
            <Textarea readOnly rows={10} value={buildPreview(settings)} />
          </Label>

          <div className="toolbar-row">
            <Button type="button" onClick={saveSettings}>
              설정 저장
            </Button>
            <p className="save-state save-state-saved">{saveState === "saved" ? "저장 완료" : ""}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function buildPreview(settings: StudioSettings) {
  return JSON.stringify(
    {
      provider: settings.provider,
      mode: settings.provider === "mock" ? "local deterministic preview" : "Gemini image generation",
      promptParts: ["cut.imagePrompt", "assets.characterMarkdown", "assets.expressionImages", "assets.backgroundPrompt"],
      output: {
        textInImage: false,
        finalDownload: "HTML rendered PNG",
        bundle: "ZIP per cut",
      },
    },
    null,
    2,
  );
}

function loadSettings(): StudioSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  const saved = window.localStorage.getItem(storageKey);
  return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
}
