"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    } catch {
      setError("프로젝트를 삭제하지 못했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="project-grid">
      <form className="project-form" onSubmit={handleCreate}>
        <p className="eyebrow">Create</p>
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

      <Card className="project-list" size="sm">
        <CardHeader className="project-list-heading px-0">
          <p className="eyebrow">Saved</p>
          <CardTitle>저장된 프로젝트</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {loading ? <p className="empty-state">불러오는 중...</p> : null}
          {!loading && projects.length === 0 ? (
            <p className="empty-state">아직 저장된 프로젝트가 없습니다.</p>
          ) : null}
          <div className="project-cards">
            {projects.map((project) => (
              <article className="project-card" key={project.id}>
                <Link href={`/workspace/${project.id}`} className="project-card-link">
                  <strong>{project.name}</strong>
                  <span>
                    <Badge
                      className={`mr-2 ${project.contentType === "comic" ? "badge-comic" : "badge-card-news"}`}
                      variant="outline"
                    >
                      {project.contentType === "comic" ? "인스타툰" : "카드뉴스"}
                    </Badge>
                    <Badge className="badge-canvas" variant="secondary">
                      {project.canvasPreset}
                    </Badge>
                  </span>
                  <small>
                    {new Intl.DateTimeFormat("ko-KR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(project.updatedAt))}
                  </small>
                </Link>
                <Button
                  aria-label={`${project.name} 삭제`}
                  disabled={deletingId === project.id}
                  onClick={() => deleteProject(project)}
                  size="icon-sm"
                  type="button"
                  variant="destructive"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden />
                </Button>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
