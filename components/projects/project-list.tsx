"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
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

  return (
    <div className="project-grid">
      <form className="project-form" onSubmit={handleCreate}>
        <h2>새 프로젝트</h2>
        <label>
          프로젝트 이름
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="예: clo 카드뉴스 캠페인"
          />
        </label>
        <label>
          콘텐츠 유형
          <select
            value={contentType}
            onChange={(event) =>
              setContentType(event.target.value as Project["contentType"])
            }
          >
            <option value="comic">인스타툰</option>
            <option value="card-news">카드뉴스</option>
          </select>
        </label>
        <label>
          캔버스
          <select
            value={canvasPreset}
            onChange={(event) =>
              setCanvasPreset(event.target.value as Project["canvasPreset"])
            }
          >
            <option value="1:1">1080 x 1080</option>
            <option value="4:5">4:5</option>
            <option value="9:16">9:16</option>
          </select>
        </label>
        <button disabled={creating || name.trim().length === 0} type="submit">
          {creating ? "생성 중..." : "프로젝트 생성"}
        </button>
        {error ? <p className="form-error">{error}</p> : null}
      </form>

      <section className="project-list" aria-label="Projects">
        <h2>저장된 프로젝트</h2>
        {loading ? <p>불러오는 중...</p> : null}
        {!loading && projects.length === 0 ? (
          <p className="empty-state">아직 저장된 프로젝트가 없습니다.</p>
        ) : null}
        <div className="project-cards">
          {projects.map((project) => (
            <Link
              href={`/workspace/${project.id}`}
              className="project-card"
              key={project.id}
            >
              <strong>{project.name}</strong>
              <span>
                {project.contentType === "comic" ? "인스타툰" : "카드뉴스"} ·{" "}
                {project.canvasPreset}
              </span>
              <small>
                {new Intl.DateTimeFormat("ko-KR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(project.updatedAt))}
              </small>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
