"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
import type { Project } from "@/lib/projects/types";

type ProjectResponse = {
  projects: Project[];
};

type CreateProjectResponse = {
  project: Project;
};

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("새 인스타툰 프로젝트");
  const [contentType, setContentType] = useState<Project["contentType"]>("comic");
  const [canvasPreset, setCanvasPreset] = useState<Project["canvasPreset"]>("1:1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState("new");

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/projects", { cache: "no-store" });
        const data = (await response.json()) as ProjectResponse;

        if (!cancelled) {
          setProjects(data.projects);
        }
      } catch {
        if (!cancelled) {
          setError("프로젝트 목록을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, contentType, canvasPreset }),
      });

      if (!response.ok) {
        throw new Error("Create failed");
      }

      const data = (await response.json()) as CreateProjectResponse;
      setProjects((current) => [data.project, ...current]);
      setActiveProjectId(data.project.id);
      setName("");
    } catch {
      setError("프로젝트를 만들지 못했습니다.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(project: Project) {
    const confirmed = window.confirm(`"${project.name}" 프로젝트를 삭제할까요?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(project.id);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setProjects((current) => current.filter((item) => item.id !== project.id));
      setActiveProjectId((current) => (current === project.id ? "new" : current));
    } catch {
      setError("프로젝트를 삭제하지 못했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="split-layout project-layout">
      <aside className="split-menu" aria-label="Projects menu">
        <div className="split-menu-list">
          <button
            aria-current={activeProjectId === "new" ? "page" : undefined}
            className="project-create-button"
            data-active={activeProjectId === "new"}
            onClick={() => setActiveProjectId("new")}
            type="button"
          >
            새 프로젝트
          </button>
          {loading ? <p className="empty-state">불러오는 중...</p> : null}
          {!loading && projects.length === 0 ? (
            <p className="empty-state">아직 저장된 프로젝트가 없습니다.</p>
          ) : null}
          {projects.map((project) => (
            <button
              aria-current={activeProjectId === project.id ? "page" : undefined}
              className="split-menu-item project-menu-item"
              data-active={activeProjectId === project.id}
              key={project.id}
              onClick={() => setActiveProjectId(project.id)}
              type="button"
            >
              <span>{project.name}</span>
              <small>
                {project.contentType === "comic" ? "인스타툰" : "카드뉴스"} · {project.canvasPreset}
              </small>
            </button>
          ))}
        </div>
      </aside>

      <div className="split-content project-detail">
        {activeProjectId === "new" ? (
          <form className="project-form" onSubmit={handleCreate}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Create</p>
                <h2>새 프로젝트</h2>
                <p>콘텐츠 유형과 캔버스를 정하고 로컬 프로젝트를 만듭니다.</p>
              </div>
            </div>
            <div className="field">
              <Label htmlFor="project-name">프로젝트 이름</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="예: clo 카드뉴스 캠페인"
              />
            </div>
            <div className="field">
              <Label>콘텐츠 유형</Label>
              <Select
                value={contentType}
                onValueChange={(value) => setContentType(value as Project["contentType"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comic">인스타툰</SelectItem>
                  <SelectItem value="card-news">카드뉴스</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="field">
              <Label>캔버스</Label>
              <Select
                value={canvasPreset}
                onValueChange={(value) => setCanvasPreset(value as Project["canvasPreset"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1080 x 1080</SelectItem>
                  <SelectItem value="4:5">4:5</SelectItem>
                  <SelectItem value="9:16">9:16</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button disabled={creating || name.trim().length === 0} type="submit">
              {creating ? "생성 중..." : "프로젝트 생성"}
            </Button>
            {error ? <p className="form-error">{error}</p> : null}
          </form>
        ) : null}

        {activeProject ? (
          <section className="project-summary" aria-label="Project detail">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Project</p>
                <h2>{activeProject.name}</h2>
                <p>
                  {new Intl.DateTimeFormat("ko-KR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(activeProject.updatedAt))}
                </p>
              </div>
              <span>
                <Badge
                  className={activeProject.contentType === "comic" ? "badge-comic" : "badge-card-news"}
                  variant="outline"
                >
                  {activeProject.contentType === "comic" ? "인스타툰" : "카드뉴스"}
                </Badge>
                <Badge className="badge-canvas ml-2" variant="secondary">
                  {activeProject.canvasPreset}
                </Badge>
              </span>
            </div>
            <div className="asset-preview project-preview">
              <strong>{activeProject.contentType === "comic" ? "인스타툰" : "카드뉴스"}</strong>
              <span>{activeProject.canvasPreset} 캔버스 제작 워크스페이스</span>
            </div>
            <div className="toolbar-row">
              <Button asChild>
                <Link href={`/workspace/${activeProject.id}`}>워크스페이스 열기</Link>
              </Button>
              <Button
                aria-label={`${activeProject.name} 삭제`}
                disabled={deletingId === activeProject.id}
                onClick={() => deleteProject(activeProject)}
                type="button"
                variant="destructive"
              >
                {deletingId === activeProject.id ? "삭제 중..." : "삭제"}
              </Button>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
