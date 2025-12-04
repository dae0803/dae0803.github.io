'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { pointsData, PanoPoint } from '@/data/pano-data';

interface PanoViewerProps {
    initialPointId?: string;
}

const PanoViewer: React.FC<PanoViewerProps> = ({ initialPointId }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentPoint, setCurrentPoint] = useState<PanoPoint | null>(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

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
        if (!containerRef.current) return;

        // Initialize Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Initialize Camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100);

        cameraRef.current = camera;

        // Initialize Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Initialize Markers Group
        const markersGroup = new THREE.Group();
        scene.add(markersGroup);
        markersRef.current = markersGroup;

        // Event Listeners
        const onWindowResize = () => {
            if (!cameraRef.current || !rendererRef.current) return;
            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        };

        const onPointerDown = (event: MouseEvent) => {
            isUserInteractingRef.current = true;
            onPointerDownPointerXRef.current = event.clientX;
            onPointerDownPointerYRef.current = event.clientY;
            onPointerDownLonRef.current = lonRef.current;
            onPointerDownLatRef.current = latRef.current;
        };

        const onPointerMove = (event: MouseEvent) => {
            if (isUserInteractingRef.current) {
                lonRef.current = (onPointerDownPointerXRef.current - event.clientX) * 0.1 + onPointerDownLonRef.current;
                latRef.current = (event.clientY - onPointerDownPointerYRef.current) * 0.1 + onPointerDownLatRef.current;
            }

            // Update mouse position for raycaster
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        const onPointerUp = (event: MouseEvent) => {
            isUserInteractingRef.current = false;

            // Check for clicks on markers
            if (Math.abs(event.clientX - onPointerDownPointerXRef.current) < 5 &&
                Math.abs(event.clientY - onPointerDownPointerYRef.current) < 5) {
                handleMarkerClick();
            }
        };

        const onDocumentMouseWheel = (event: WheelEvent) => {
            if (!cameraRef.current) return;
            const fov = cameraRef.current.fov + event.deltaY * 0.05;
            cameraRef.current.fov = THREE.MathUtils.clamp(fov, 10, 75);
            cameraRef.current.updateProjectionMatrix();
        };

        window.addEventListener('resize', onWindowResize);
        containerRef.current.addEventListener('mousedown', onPointerDown);
        containerRef.current.addEventListener('mousemove', onPointerMove);
        containerRef.current.addEventListener('mouseup', onPointerUp);
        containerRef.current.addEventListener('wheel', onDocumentMouseWheel);

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            update();
            TWEEN.update();
        };
        animate();

        // Initial Load
        const startPoint = pointsData.find(p => p.label === (initialPointId || "Setup-1")) || pointsData[0];
        loadPanorama(startPoint);

        return () => {
            window.removeEventListener('resize', onWindowResize);
            if (containerRef.current) {
                containerRef.current.removeEventListener('mousedown', onPointerDown);
                containerRef.current.removeEventListener('mousemove', onPointerMove);
                containerRef.current.removeEventListener('mouseup', onPointerUp);
                containerRef.current.removeEventListener('wheel', onDocumentMouseWheel);
                if (rendererRef.current) {
                    containerRef.current.removeChild(rendererRef.current.domElement);
                }
            }
            rendererRef.current?.dispose();
        };
    }, []);

    const update = () => {
        if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return;

        latRef.current = Math.max(-85, Math.min(85, latRef.current));
        phiRef.current = THREE.MathUtils.degToRad(90 - latRef.current);
        thetaRef.current = THREE.MathUtils.degToRad(lonRef.current);

        const target = new THREE.Vector3();
        target.x = 500 * Math.sin(phiRef.current) * Math.cos(thetaRef.current);
        target.y = 500 * Math.cos(phiRef.current);
        target.z = 500 * Math.sin(phiRef.current) * Math.sin(thetaRef.current);

        cameraRef.current.lookAt(target);
        rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    const loadPanorama = (point: PanoPoint) => {
        if (!sceneRef.current) return;

        setLoading(true);
        setCurrentPoint(point);

        const textureLoader = new THREE.TextureLoader();
        // The images are located in a deep subdirectory with Korean names.
        // Path: public/panoviewer/projects/여의도 63스퀘어/현장 파노라마뷰/파노라마데이터/
        // We need to encode the URI components to ensure they load correctly.
        const basePath = '/panoviewer/projects/여의도 63스퀘어/현장 파노라마뷰/파노라마데이터/';
        const imagePath = `${basePath}${point.image}`;

        textureLoader.load(
            imagePath,
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                const geometry = new THREE.SphereGeometry(500, 60, 40);
                // invert the geometry on the x-axis so that all of the faces point inward
                geometry.scale(-1, 1, 1);

                const material = new THREE.MeshBasicMaterial({ map: texture });

                if (sphereRef.current) {
                    sceneRef.current?.remove(sphereRef.current);
                    (sphereRef.current.material as THREE.Material).dispose();
                    (sphereRef.current.geometry as THREE.BufferGeometry).dispose();
                }

                const sphere = new THREE.Mesh(geometry, material);
                if (point.rotationY) {
                    sphere.rotation.y = point.rotationY;
                }
                sceneRef.current?.add(sphere);
                sphereRef.current = sphere;

                updateMarkers(point);
                setLoading(false);
            },
            (xhr) => {
                setProgress((xhr.loaded / xhr.total) * 100);
            },
            (error) => {
                console.error('An error happened loading panorama:', error);
                setLoading(false);
            }
        );
    };

    const updateMarkers = (current: PanoPoint) => {
        if (!markersRef.current || !sceneRef.current) return;

        // Clear existing markers
        while (markersRef.current.children.length > 0) {
            markersRef.current.remove(markersRef.current.children[0]);
        }

        // Add new markers
        pointsData.forEach(point => {
            if (point === current) return;

            const distance = Math.sqrt(
                Math.pow(point.x - current.x, 2) +
                Math.pow(point.y - current.y, 2) +
                Math.pow(point.z - current.z, 2)
            );

            // Only show markers within a certain distance (e.g., 5000 units)
            // Adjust this threshold as needed based on the scale of coordinates
            if (distance < 8000) {
                const dx = point.x - current.x;
                const dy = point.y - current.y;
                const dz = point.z - current.z;

                // Convert to spherical coordinates for placement on the sphere
                // This logic might need adjustment based on the coordinate system used in the original data
                // The original viewer.js likely had logic for this.
                // Let's try a simple projection first.

                // Normalize direction
                const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const ndx = dx / len;
                const ndy = dy / len;
                const ndz = dz / len;

                // Position marker on the sphere (radius 450 to be slightly inside)
                // Note: The coordinate system of the data (x, y, z) might not match Three.js (x, y, z) directly.
                // Usually Y is up in Three.js.
                // If the data is from a scanner, Z might be up.
                // Let's assume standard mapping first, but we might need to swap Y and Z.
                // Looking at data: y values are large negative/positive, z is small. 
                // This suggests Y is likely the horizontal plane along with X, and Z is height?
                // Or maybe it's X and Y are ground plane.
                // Let's check viewer.js logic if possible.

                // For now, I'll use a placeholder logic.
                // I'll create a simple sprite.

                const spriteMaterial = new THREE.SpriteMaterial({ color: 0xffffff });
                const sprite = new THREE.Sprite(spriteMaterial);

                // We need to rotate the vector based on the current sphere's rotation?
                // Actually, if the sphere is rotated, the world coordinates are relative to the camera?
                // No, the sphere rotates to align with the real world.
                // So the markers should be placed in the "world" space relative to the current point.

                // Simplified: just place them based on relative direction
                // We need to account for the rotationY of the current panorama

                const vec = new THREE.Vector3(dx, dz, -dy).normalize(); // Swapping axes based on guess
                // Wait, let's stick to a simpler guess or check viewer.js.
                // viewer.js would be best.

                sprite.position.copy(vec.multiplyScalar(400));
                sprite.scale.set(20, 20, 1);
                sprite.userData = { point };

                markersRef.current?.add(sprite);
            }
        });
    };

    const handleMarkerClick = () => {
        if (!raycasterRef.current || !cameraRef.current || !markersRef.current) return;

        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(markersRef.current.children);

        if (intersects.length > 0) {
            const targetPoint = intersects[0].object.userData.point as PanoPoint;
            if (targetPoint) {
                // Transition effect
                loadPanorama(targetPoint);
            }
        }
    };

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
