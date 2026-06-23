'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { pointsData, PanoPoint } from '@/data/pano-data';

interface PanoViewerProps {
    initialPointId?: string;
}

const MARKER_VISIBLE_DISTANCE = 15000;
const MARKER_SPHERE_RADIUS = 410;
const MARKER_SIZE = 36;

const PanoViewer: React.FC<PanoViewerProps> = ({ initialPointId }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentPoint, setCurrentPoint] = useState<PanoPoint | null>(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Three.js refs
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sphereRef = useRef<THREE.Mesh | null>(null);
    const markersRef = useRef<THREE.Group | null>(null);
    const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
    const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
    const isUserInteractingRef = useRef(false);
    const onPointerDownPointerXRef = useRef(0);
    const onPointerDownPointerYRef = useRef(0);
    const lonRef = useRef(0);
    const onPointerDownLonRef = useRef(0);
    const latRef = useRef(0);
    const onPointerDownLatRef = useRef(0);
    const phiRef = useRef(0);
    const thetaRef = useRef(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.replaceChildren();

        // Initialize Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const getViewerSize = () => {
            const rect = container.getBoundingClientRect();

            return {
                width: Math.max(1, Math.floor(rect.width)),
                height: Math.max(1, Math.floor(rect.height)),
            };
        };

        const size = getViewerSize();

        // Initialize Camera
        const camera = new THREE.PerspectiveCamera(75, size.width / size.height, 1, 1100);

        cameraRef.current = camera;

        // Initialize Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(size.width, size.height);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Initialize Markers Group
        const markersGroup = new THREE.Group();
        scene.add(markersGroup);
        markersRef.current = markersGroup;

        const updateRendererSize = () => {
            const nextSize = getViewerSize();
            camera.aspect = nextSize.width / nextSize.height;
            camera.updateProjectionMatrix();
            renderer.setSize(nextSize.width, nextSize.height);
        };

        const update = () => {
            latRef.current = Math.max(-85, Math.min(85, latRef.current));
            phiRef.current = THREE.MathUtils.degToRad(90 - latRef.current);
            thetaRef.current = THREE.MathUtils.degToRad(lonRef.current);

            const target = new THREE.Vector3();
            target.x = 500 * Math.sin(phiRef.current) * Math.cos(thetaRef.current);
            target.y = 500 * Math.cos(phiRef.current);
            target.z = 500 * Math.sin(phiRef.current) * Math.sin(thetaRef.current);

            camera.lookAt(target);
            renderer.render(scene, camera);
        };

        const disposeSphere = () => {
            if (!sphereRef.current) return;

            scene.remove(sphereRef.current);
            (sphereRef.current.material as THREE.Material).dispose();
            sphereRef.current.geometry.dispose();
            sphereRef.current = null;
        };

        const clearMarkers = () => {
            while (markersGroup.children.length > 0) {
                const marker = markersGroup.children[0] as THREE.Sprite;
                markersGroup.remove(marker);
                marker.material.dispose();
            }
        };

        const markerCanvas = document.createElement('canvas');
        markerCanvas.width = 96;
        markerCanvas.height = 96;
        const markerContext = markerCanvas.getContext('2d');

        if (markerContext) {
            markerContext.clearRect(0, 0, markerCanvas.width, markerCanvas.height);
            markerContext.shadowColor = 'rgba(0, 0, 0, 0.45)';
            markerContext.shadowBlur = 10;
            markerContext.beginPath();
            markerContext.arc(48, 48, 28, 0, Math.PI * 2);
            markerContext.fillStyle = 'rgba(239, 68, 68, 0.92)';
            markerContext.fill();
            markerContext.shadowBlur = 0;
            markerContext.lineWidth = 6;
            markerContext.strokeStyle = 'rgba(255, 255, 255, 0.95)';
            markerContext.stroke();
            markerContext.beginPath();
            markerContext.arc(48, 48, 8, 0, Math.PI * 2);
            markerContext.fillStyle = '#ffffff';
            markerContext.fill();
        }

        const markerTexture = new THREE.CanvasTexture(markerCanvas);
        markerTexture.colorSpace = THREE.SRGBColorSpace;

        const updateMarkers = (current: PanoPoint) => {
            clearMarkers();

            pointsData.forEach((point) => {
                if (point === current) return;

                const dx = point.x - current.x;
                const dy = point.y - current.y;
                const dz = point.z - current.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (distance === 0 || distance >= MARKER_VISIBLE_DISTANCE) return;

                const markerMaterial = new THREE.SpriteMaterial({
                    map: markerTexture,
                    transparent: true,
                    depthTest: false,
                    depthWrite: false,
                });
                const marker = new THREE.Sprite(markerMaterial);
                const direction = new THREE.Vector3(dx, dz, -dy).normalize();

                marker.position.copy(direction.multiplyScalar(MARKER_SPHERE_RADIUS));
                marker.scale.set(MARKER_SIZE, MARKER_SIZE, 1);
                marker.userData = { point };

                markersGroup.add(marker);
            });
        };

        const textureLoader = new THREE.TextureLoader();

        const loadPanorama = (point: PanoPoint) => {
            setLoading(true);
            setProgress(0);
            setError(null);
            setCurrentPoint(point);

            const basePath = '/panoviewer/projects/여의도 63스퀘어/현장 파노라마뷰/파노라마데이터/';
            const imagePath = encodeURI(`${basePath}${point.image}`);

            textureLoader.load(
                imagePath,
                (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace;
                    const geometry = new THREE.SphereGeometry(500, 60, 40);
                    geometry.scale(-1, 1, 1);

                    const material = new THREE.MeshBasicMaterial({ map: texture });

                    disposeSphere();

                    const sphere = new THREE.Mesh(geometry, material);
                    if (point.rotationY) {
                        sphere.rotation.y = point.rotationY;
                    }

                    scene.add(sphere);
                    sphereRef.current = sphere;

                    updateMarkers(point);
                    setLoading(false);
                },
                (xhr) => {
                    if (xhr.total > 0) {
                        setProgress((xhr.loaded / xhr.total) * 100);
                    }
                },
                () => {
                    setError("파노라마 이미지를 불러오지 못했습니다.");
                    setLoading(false);
                }
            );
        };

        const handleMarkerClick = () => {
            raycasterRef.current.setFromCamera(mouseRef.current, camera);
            const intersects = raycasterRef.current.intersectObjects(markersGroup.children);

            if (intersects.length === 0) return;

            const targetPoint = intersects[0].object.userData.point as PanoPoint | undefined;

            if (targetPoint) {
                loadPanorama(targetPoint);
            }
        };

        const syncMousePosition = (event: PointerEvent) => {
            const rect = container.getBoundingClientRect();
            mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };

        const onPointerDown = (event: PointerEvent) => {
            isUserInteractingRef.current = true;
            onPointerDownPointerXRef.current = event.clientX;
            onPointerDownPointerYRef.current = event.clientY;
            onPointerDownLonRef.current = lonRef.current;
            onPointerDownLatRef.current = latRef.current;
            container.setPointerCapture(event.pointerId);
            syncMousePosition(event);
        };

        const onPointerMove = (event: PointerEvent) => {
            if (isUserInteractingRef.current) {
                lonRef.current = (onPointerDownPointerXRef.current - event.clientX) * 0.1 + onPointerDownLonRef.current;
                latRef.current = (event.clientY - onPointerDownPointerYRef.current) * 0.1 + onPointerDownLatRef.current;
            }

            syncMousePosition(event);
        };

        const onPointerUp = (event: PointerEvent) => {
            isUserInteractingRef.current = false;
            container.releasePointerCapture(event.pointerId);
            syncMousePosition(event);

            if (Math.abs(event.clientX - onPointerDownPointerXRef.current) < 5 &&
                Math.abs(event.clientY - onPointerDownPointerYRef.current) < 5) {
                handleMarkerClick();
            }
        };

        const onPointerLeave = () => {
            isUserInteractingRef.current = false;
        };

        const onDocumentMouseWheel = (event: WheelEvent) => {
            const fov = camera.fov + event.deltaY * 0.05;
            camera.fov = THREE.MathUtils.clamp(fov, 10, 75);
            camera.updateProjectionMatrix();
        };

        window.addEventListener('resize', updateRendererSize);
        container.addEventListener('pointerdown', onPointerDown);
        container.addEventListener('pointermove', onPointerMove);
        container.addEventListener('pointerup', onPointerUp);
        container.addEventListener('pointerleave', onPointerLeave);
        container.addEventListener('wheel', onDocumentMouseWheel);

        const resizeObserver = new ResizeObserver(updateRendererSize);
        resizeObserver.observe(container);

        // Animation Loop
        let animationFrameId = 0;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            update();
            TWEEN.update();
        };
        animate();

        // Initial Load
        const startPoint = pointsData.find(p => p.label === (initialPointId || "Setup-1")) || pointsData[0];
        loadPanorama(startPoint);

        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateRendererSize);
            container.removeEventListener('pointerdown', onPointerDown);
            container.removeEventListener('pointermove', onPointerMove);
            container.removeEventListener('pointerup', onPointerUp);
            container.removeEventListener('pointerleave', onPointerLeave);
            container.removeEventListener('wheel', onDocumentMouseWheel);
            clearMarkers();
            disposeSphere();
            markerTexture.dispose();
            renderer.dispose();
            renderer.domElement.remove();
            sceneRef.current = null;
            cameraRef.current = null;
            rendererRef.current = null;
            markersRef.current = null;
        };
    }, [initialPointId]);

    return (
        <div className="relative w-full h-[calc(100vh-4rem)] bg-black rounded-lg overflow-hidden border border-border shadow-lg">
            <div ref={containerRef} className="w-full h-full" />

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-foreground z-50 backdrop-blur-sm">
                    <div className="text-center space-y-4">
                        <div className="text-2xl font-bold">Loading 3D Scene...</div>
                        <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="text-sm text-muted-foreground">{Math.round(progress)}%</div>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/85 text-foreground z-50 backdrop-blur-sm">
                    <div className="max-w-sm text-center space-y-2 px-6">
                        <div className="text-lg font-semibold">{error}</div>
                        <p className="text-sm text-muted-foreground">
                            이미지 경로나 파일명을 확인한 뒤 다시 시도해주세요.
                        </p>
                    </div>
                </div>
            )}

            {currentPoint && (
                <div className="absolute top-4 left-4 text-foreground bg-background/80 backdrop-blur-md border border-border p-3 rounded-lg z-10 shadow-lg">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        {currentPoint.label}
                    </h2>
                </div>
            )}

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm pointer-events-none border border-white/10">
                Click and drag to look around. Click markers to move.
            </div>
        </div>
    );
};

export default PanoViewer;
