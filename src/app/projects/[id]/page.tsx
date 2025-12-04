import { projects } from "@/lib/data";
import { notFound } from "next/navigation";
import { Calendar, Tag, ArrowLeft } from "lucide-react";
import Link from "next/link";

export async function generateStaticParams() {
    return projects.map((project) => ({
        id: project.id.toString(),
    }));
}

export default async function ProjectPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const project = projects.find((p) => p.id === Number(id));

    if (!project) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Back Button */}
            <Link
                href="/"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
            </Link>

            {/* Header */}
            <div className="space-y-4 border-b border-border pb-8">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                        {project.category}
                    </span>
                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                        <Calendar className="w-4 h-4" />
                        {project.date}
                    </div>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                    {project.title}
                </h1>
                <p className="text-xl text-muted-foreground">
                    {project.description}
                </p>

                {project.externalLink && (
                    <div className="pt-4">
                        <a
                            href={project.externalLink}
                            target="_blank"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                        >
                            Open Viewer
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                        </a>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                    {project.tags.map((tag) => (
                        <span
                            key={tag}
                            className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-md flex items-center gap-1"
                        >
                            <Tag className="w-3 h-3" />
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Content */}
            <article className="prose prose-invert prose-orange max-w-none">
                <div className="whitespace-pre-wrap font-sans text-foreground/90 leading-relaxed">
                    {project.content}
                </div>
            </article>
        </div>
    );
}
