import { ArrowRight, Calendar, Tag } from "lucide-react";
import Link from "next/link";
import { projects } from "@/lib/data";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Project Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of technical support and design projects.
        </p>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group block p-6 bg-secondary/30 border border-border rounded-xl hover:border-primary/50 hover:bg-secondary/50 transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  {project.category}
                </span>
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                  <Calendar className="w-3 h-3" />
                  {project.date}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                  {project.title}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {project.description}
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-border/50">
                <div className="flex gap-2">
                  {project.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 2 && (
                    <span className="text-xs text-muted-foreground px-2 py-1">+{project.tags.length - 2}</span>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
