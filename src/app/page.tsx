import { Calendar, User, ArrowRight } from "lucide-react";
import Link from "next/link";

// Mock data for blog posts
const posts = [
  {
    id: 1,
    title: "3D 스캔 기술의 현장 적용 사례",
    excerpt: "최신 3D 스캔 장비를 활용하여 건설 현장의 정밀 데이터를 취득하고 분석하는 과정에 대한 심층 리포트입니다.",
    date: "2024-12-01",
    author: "조형준",
    category: "Technology"
  },
  {
    id: 2,
    title: "BIM 데이터와 파노라마 뷰어의 통합",
    excerpt: "대용량 BIM 모델과 360도 파노라마 이미지를 웹에서 효율적으로 연동하여 시각화하는 기술적인 챌린지와 해결책을 공유합니다.",
    date: "2024-11-20",
    author: "조형준",
    category: "Development"
  },
  {
    id: 3,
    title: "Next.js를 활용한 포트폴리오 사이트 구축기",
    excerpt: "React 기반의 Next.js 프레임워크를 사용하여 빠르고 반응성 높은 포트폴리오 웹사이트를 개발한 경험을 나눕니다.",
    date: "2024-11-10",
    author: "조형준",
    category: "Web Dev"
  },
  {
    id: 4,
    title: "드론 측량과 지상 라이다의 데이터 정합",
    excerpt: "항공 측량 데이터와 지상 라이다 데이터를 정합하여 오차를 최소화하고 전체 현장의 디지털 트윈을 구축하는 방법.",
    date: "2024-10-25",
    author: "조형준",
    category: "Field Work"
  }
];

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">JUN's Blog</h1>
        <p className="text-muted-foreground">
          BIM/3DSCAN팀에서 진행한 프로젝트와 기술 이야기를 기록하는 공간입니다.
        </p>
      </div>

      {/* Blog Board */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="group block p-6 bg-background border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-foreground font-medium">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {post.author}
                  </span>
                </div>
                <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
              <div className="shrink-0">
                <button className="text-sm font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                  Read More <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
