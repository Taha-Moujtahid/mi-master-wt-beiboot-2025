"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectsApi } from '@/apis/beiboot-api';
import { useState } from "react";
import { useImageGalleryStore } from '@/stores/useImageGalleryStore';

export default function ProjectsClient() {

  const { setCurrentProjectId } = useImageGalleryStore();

  const router = useRouter();
  const { data: session, status } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  // Use the generated Swagger client (fetch-based)
  const api = new ProjectsApi();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        console.log("Session:", session);
        if (!session?.accessToken) {
          console.warn("No access token in session");
          return [];
        }
        const res = await api.projectsControllerGetProjects({
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        console.log("Raw response from API:", res);
        if (typeof res.json === 'function') {
          const result = await res.json();
          console.log("Fetched projects (json):", result);
          return result;
        }
        const result = res;
        console.log("Fetched projects (direct):", result);
        return result;
      } catch (err) {
        console.error("Error fetching projects:", err);
        return [];
      }
    },
    enabled: status === 'authenticated',
  });

  const addProjectMutation = useMutation({
    mutationFn: async (name) => {
      console.log("Adding project:", name);
      if (!session?.accessToken) throw new Error('No access token');
      // The generated client expects a body as an object, not stringified
      const res = await api.projectsControllerCreateProject({
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });
      if (typeof res.json === 'function') {
        return res.json();
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setProjectName("");
      setShowForm(false);
    },
    onError: () => setError('Failed to add project'),
  });

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") {
    router.push("/api/auth/signin");
    return null;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold mb-4">My Projects</h1>
      <button
        className="mb-4 px-4 py-2 bg-brand-primary text-white hover:bg-white hover:text-brand-primary"
        onClick={() => setShowForm((v) => !v)}
      >
        + Add Project
      </button>

      </div>
      {showForm && (
        <form
          onSubmit={e => {
            e.preventDefault();
            setError("");
            addProjectMutation.mutate(projectName);
          }}
          className="mb-4 flex gap-2 w-full"
        >
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name"
            className="border-2 px-2 py-1 bg-white focus:border-brand-primary w-full"
            required
          />
          <button
            type="submit"
            className="border-2 px-4 py-1 bg-white text-brand-primary border-brand-primary hover:bg-brand-primary hover:text-white"
            disabled={addProjectMutation.isPending}
          >
            Save
          </button>
        </form>
      )}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <ul className="space-y-2">
        {(projects || []).map((project) => (
          <li
            key={project.id}
            className="border-2 hover:border-brand-primary p-2 cursor-pointer bg-white"
            onClick={() => {
              setCurrentProjectId(project.id);
              router.push(`/projects/${project.id}`)
            }}
          >
            {project.name}
          </li>
        ))}
      </ul>
      {isLoading && <div>Loading...</div>}
    </div>
  );
}
