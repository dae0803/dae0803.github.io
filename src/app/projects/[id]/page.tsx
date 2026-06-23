import { projects } from "@/lib/data";
import { notFound } from "next/navigation";
import { Calendar, Tag, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export async function generateStaticParams() {
    return projects.map((project) => ({
        id: project.id.toString(),
    }));
}

function renderInline(text: string): ReactNode {
    const linkMatch = text.match(/^\[(.+)\]\((.+)\)(.*)$/);

    if (linkMatch) {
        const [, label, href, rest] = linkMatch;
        const link = href.startsWith("/") ? (
            <Link href={href} className="font-medium text-primary hover:underline">
                {label}
            </Link>
        ) : (
            <a href={href} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                {label}
            </a>
        );

        return (
            <>
                {link}
                {rest}
            </>
        );
    }

    const boldMatch = text.match(/^\*\*(.+)\*\*:?\s*(.*)$/);

    if (boldMatch) {
        const [, label, rest] = boldMatch;

        return (
            <>
                <strong className="font-semibold text-foreground">{label}</strong>
                {rest ? `: ${rest}` : ""}
            </>
        );
    }

    return text;
}

function ProjectContent({ content }: { content?: string }) {
    if (!content) return null;

    const lines = content.trim().split("\n");
    const nodes: ReactNode[] = [];
    let listItems: string[] = [];

    const flushList = () => {
        if (listItems.length === 0) return;

        nodes.push(
            <ul key={`list-${nodes.length}`} className="space-y-2">
                {listItems.map((item) => (
                    <li key={item} className="flex gap-3 text-foreground/85">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{renderInline(item)}</span>
                    </li>
                ))}
            </ul>
        );
        listItems = [];
    };

    lines.forEach((rawLine) => {
        const line = rawLine.trim();

        if (!line) {
            flushList();
            return;
        }

        if (line.startsWith("- ")) {
            listItems.push(line.slice(2));
            return;
        }

        flushList();

        if (line.startsWith("# ")) {
            nodes.push(
                <h2 key={`h1-${nodes.length}`} className="text-2xl font-bold tracking-tight text-foreground">
                    {line.slice(2)}
                </h2>
            );
            return;
        }

        if (line.startsWith("## ")) {
            nodes.push(
                <h3 key={`h2-${nodes.length}`} className="text-lg font-semibold text-foreground">
                    {line.slice(3)}
                </h3>
            );
            return;
        }

        nodes.push(
            <p key={`p-${nodes.length}`} className="text-foreground/85 leading-7">
                {renderInline(line)}
            </p>
        );
    });

    flushList();

    return <div className="space-y-6">{nodes}</div>;
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
                href="/projects"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
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
                        {project.externalLink.startsWith("/") ? (
                            <Link
                                href={project.externalLink}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                            >
                                Open Viewer
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <a
                                href={project.externalLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                            >
                                Open Viewer
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        )}
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
            <article className="rounded-xl border border-border bg-background p-6">
                <ProjectContent content={project.content} />
            </article>
        </div>
    );
}
