export interface Project {
    id: number;
    title: string;
    description: string;
    date: string;
    category: string;
    tags: string[];
    content?: string; // Markdown content
    externalLink?: string; // Link to external viewer
}

export const projects: Project[] = [
    {
        id: 1,
        title: "여의도 63스퀘어 (Yeouido 63 Square)",
        description: "파노라마 뷰어 및 마감 레벨 분석. 현장의 360도 파노라마 뷰와 바닥 레벨 분석 데이터를 제공합니다.",
        date: "2024-11-15",
        category: "Panorama / Analysis",
        tags: ["Panorama", "Analysis", "3D Scan"],
        externalLink: "/panoviewer/63sq",
        content: `
# 여의도 63스퀘어 프로젝트

## 프로젝트 개요
여의도 63스퀘어의 리모델링 및 유지보수를 위한 정밀 3D 스캔 및 파노라마 기록 프로젝트입니다.

## 주요 기능
- **360도 파노라마 뷰어**: 현장의 모든 위치를 고해상도 파노라마로 확인 가능.
- **마감 레벨 분석**: 바닥의 평탄도 및 레벨 차이를 시각적으로 분석.
- **미니맵 네비게이션**: 도면 기반의 직관적인 위치 이동.

## 기술적 세부사항
- **장비**: Leica RTC360
- **소프트웨어**: Custom Three.js Viewer, CloudCompare
- **데이터**: 85개소 스캔 데이터 통합

[뷰어 열기](/panoviewer/63sq) 버튼을 클릭하여 전체 화면으로 확인하세요.
    `,
    },
    {
        id: 2,
        title: "춘천 프리미엄 빌리지 (Chuncheon Premium Village)",
        description: "폴대 위치 선정을 위한 3D 스캔 데이터 시각화 및 분석 통합 뷰어.",
        date: "2024-10-22",
        category: "3D Scan / Visualization",
        tags: ["3D Scan", "Visualization", "Planning"],
        externalLink: "/panoviewer/chuncheon/density/1",
        content: `
# 춘천 프리미엄 빌리지 프로젝트

## 프로젝트 개요
춘천 프리미엄 빌리지 조성 공사 중 폴대(Pole) 위치 선정을 위한 시뮬레이션 및 데이터 시각화 프로젝트입니다.

## 주요 내용
- **현장 스캔**: 드론 및 지상 라이다를 이용한 정밀 지형 스캔.
- **시뮬레이션**: 가로등 및 CCTV 폴대 설치 위치 시뮬레이션.
- **통합 뷰어**: 웹 기반의 3D 데이터 뷰어 제공.

[통합 뷰어 열기](/panoviewer/chuncheon/density/1)를 통해 상세 데이터를 확인하실 수 있습니다.
    `,
    },
    {
        id: 3,
        title: "송도 잭니클라우스 (Songdo Jack Nicklaus)",
        description: "데이터 준비 중입니다.",
        date: "2024-09-05",
        category: "Coming Soon",
        tags: ["Golf Course", "Maintenance"],
        content: `
# 송도 잭니클라우스

현재 데이터 처리 및 뷰어 최적화 작업이 진행 중입니다.
    `,
    },
];
