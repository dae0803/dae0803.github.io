import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import * as TWEEN from '@tweenjs/tween.js';

let scene, camera, renderer, controls;
let panoramaMesh;
let markers = [];
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let currentPointIndex = -1;

// 측정 관련 변수
let pointCloud;
let isMeasureMode = false;
let measurePoints = [];
let measureLine;
let measureMarkerStart, measureMarkerEnd;

// 미니맵 관련 변수
let minimapCanvas, minimapCtx;
let mapScale = 1;
let mapOffsetX = 0, mapOffsetY = 0;
let isMinimapDragging = false;
let isMinimapMouseDown = false; // 마우스 다운 상태 추적
let minimapDragStartX = 0, minimapDragStartY = 0; // 드래그 시작 위치
let minimapLastX = 0, minimapLastY = 0;
let minimapPanX = 0, minimapPanY = 0; // 드래그로 인한 추가 오프셋
let minimapImage = null;
let mapImageBounds = null;
let mapAdjust = { x: -10100.00, y: -5300.00, scale: 1.6780, rotation: 0.0000 }; // 2D 맵 보정값

// 바닥 맵 관련 변수
let floorMapMesh;
let panoramaRotationY = 0; // 파노라마 회전값 저장

// 마커 가시성 설정
const MARKER_VISIBLE_DISTANCE = 150; // 단위: 3D 유닛 (1유닛 = 10cm 이므로 150 = 15m)
const MIN_MARKER_SCALE = 0.5;
const MAX_MARKER_SCALE = 1.5;

// 좌표 스케일 (mm -> m)
const SCALE = 0.01;

// 초기화
// init();
// animate();
checkAuth();

function checkAuth() {
    const SESSION_KEY = "site_access_key"; // Main app uses this key
    const ACCESS_KEY = "emtech2025"; // Main app key

    const storedKey = localStorage.getItem(SESSION_KEY);

    if (storedKey === ACCESS_KEY) {
        init();
        animate();
    } else {
        alert("접근 권한이 없습니다. 메인 페이지로 이동합니다.");
        window.location.href = "/"; // Redirect to Next.js root
    }
}

/*
function checkAccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const key = urlParams.get('key');
    const ACCESS_PASSWORD = 'eunmin'; // 비밀번호 설정 (원하는 값으로 변경하세요)

    const lockScreen = document.getElementById('access-lock');
    const pwArea = document.getElementById('password-input-area');
    const pwInput = document.getElementById('manual-pw');
    const btnUnlock = document.getElementById('btn-unlock');

    function unlock() {
        lockScreen.style.display = 'none';
        init();
        animate();
    }

    // 1. URL 파라미터로 접속 시 (?key=pano)
    if (key === ACCESS_PASSWORD) {
        unlock();
        return;
    }

    // 2. 비밀번호 입력창 활성화 (선택 사항)
    // URL에 키가 없으면 입력창을 보여줍니다.
    pwArea.style.display = 'block';

    btnUnlock.addEventListener('click', () => {
        if (pwInput.value === ACCESS_PASSWORD) {
            unlock();
        } else {
            alert('비밀번호가 일치하지 않습니다.');
        }
    });

    pwInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (pwInput.value === ACCESS_PASSWORD) {
                unlock();
            } else {
                alert('비밀번호가 일치하지 않습니다.');
            }
        }
    });
}
*/

function init() {
    const container = document.getElementById('container');

    // 씬 생성
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // 카메라 생성
    // 파노라마 구체 반지름이 5000이므로 far 클리핑 평면을 충분히 크게 설정해야 함 (1000 -> 10000)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

    // 렌더러 생성
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 컨트롤 생성
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true; // 1. 줌 기능 활성화
    controls.enablePan = false;
    controls.rotateSpeed = -0.5;
    controls.minDistance = 0.1; // 줌인 최소 거리
    controls.maxDistance = 100; // 줌아웃 최대 거리

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // 데이터 로드 및 마커 배치
    createMarkers();

    // 바닥 맵 로드 (3D 맵 제거됨)
    // loadFloorMap();

    // 포인트 클라우드 로드 (측정용)
    loadPointCloud();

    // 미니맵 초기화
    initMinimap();

    // 첫 번째 파노라마 로드 (Setup-15: 우상단 컬러 파노라마)
    loadPanorama(14);

    // 이벤트 리스너
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    // 측정 버튼 이벤트
    document.getElementById('btn-measure').addEventListener('click', toggleMeasureMode);
}

function loadPointCloud() {
    const loader = new PLYLoader();
    // 'pointcloud.ply' 파일이 있다고 가정하고 로드
    // 실제 파일이 없으면 에러가 나겠지만, 기능 구현을 위해 작성
    loader.load('pointcloud.ply', (geometry) => {
        geometry.computeVertexNormals();

        // 포인트 클라우드 재질
        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.5 // 파노라마 뒤에 은은하게 보이도록
        });

        pointCloud = new THREE.Points(geometry, material);

        // 좌표계 변환 (데이터와 맞춤)
        // pointsData의 첫번째 점을 원점으로 했으므로, 포인트 클라우드도 동일하게 이동 필요
        // 하지만 보통 포인트 클라우드와 카메라 좌표계가 일치되어 있다고 가정
        // 만약 불일치한다면 여기서 position/rotation 조정 필요

        // 여기서는 pointsData 변환 로직과 동일하게 스케일링 및 이동 적용
        // (실제로는 포인트 클라우드 원점과 데이터 원점이 같은지 확인 필요)
        const origin = pointsData[0];
        pointCloud.position.set(
            -origin.x * SCALE,
            -origin.z * SCALE, // Y -> Z (ThreeJS Y is Up)
            origin.y * SCALE   // Z -> -Y
        );
        // 위 변환은 createMarkers의 로직과 맞추기 위해 조정이 필요할 수 있음.
        // createMarkers에서는:
        // x = (point.x - origin.x) * SCALE;
        // y = (point.z - origin.z) * SCALE;
        // z = -(point.y - origin.y) * SCALE;

        // 포인트 클라우드 전체를 이동/회전 시키는 대신, 
        // 그냥 로드된 상태가 월드 좌표계라고 가정하고, 
        // createMarkers에서 썼던 오프셋 방식을 적용하지 않는게 나을 수도 있음.
        // 하지만 뷰어의 중심이 (0,0,0)이 되도록 맞췄으므로, 포인트 클라우드도 맞춰야 함.

        // 간단하게: 포인트 클라우드도 스케일링만 적용하고, 
        // 위치는 첫번째 포인트 기준으로 이동
        pointCloud.scale.set(SCALE, SCALE, SCALE);
        pointCloud.rotation.x = -Math.PI / 2; // Z-up to Y-up
        pointCloud.position.set(
            -origin.x * SCALE,
            origin.z * SCALE, // 높이 보정
            origin.y * SCALE
        );

        // 일단 씬에 추가하지 않고 레이캐스팅용으로만 쓸 수도 있고,
        // 시각적 확인을 위해 추가할 수도 있음.
        // scene.add(pointCloud); 
        // (파노라마에 가려져서 안보일 수 있으므로 측정 모드에서만 보이게 하거나 숨김 처리)
        pointCloud.visible = false;
        scene.add(pointCloud);

    }, undefined, (err) => {
        console.log('Point cloud not found or error loading. Measurement might be inaccurate (fallback to sphere).');
    });
}

function loadFloorMap() {
    const loader = new THREE.TextureLoader();
    loader.load('map.png', (texture) => {
        // 맵 텍스처 설정
        texture.colorSpace = THREE.SRGBColorSpace;

        // 이미지 비율 유지
        const imgAspect = texture.image.width / texture.image.height;

        // 데이터 범위 계산
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        pointsData.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        });

        const dataWidth = maxX - minX;
        const dataHeight = maxY - minY;

        // 바닥 메쉬 생성
        // 이미지 비율에 맞춰서 생성하되, 데이터 영역을 충분히 덮도록 설정
        // 데이터 영역의 가로/세로 비율
        const dataAspect = dataWidth / dataHeight;

        let planeWidth, planeHeight;

        // 이미지와 데이터의 비율을 비교하여 맞춤
        // 여백을 고려하여 1.2배 정도 크게 잡음
        const paddingScale = 1.2;

        if (imgAspect > dataAspect) {
            // 이미지가 더 납작함 -> 데이터 높이에 맞춤
            planeHeight = dataHeight * paddingScale;
            planeWidth = planeHeight * imgAspect;
        } else {
            // 이미지가 더 길쭉함 -> 데이터 너비에 맞춤
            planeWidth = dataWidth * paddingScale;
            planeHeight = planeWidth / imgAspect;
        }

        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });

        floorMapMesh = new THREE.Mesh(geometry, material);
        floorMapMesh.rotation.x = -Math.PI / 2; // 눕히기

        // 위치 설정 (데이터 중심)
        const origin = pointsData[0];
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const mapX = (centerX - origin.x) * SCALE;
        const mapZ = -(centerY - origin.y) * SCALE; // Y -> -Z

        // 높이 설정: 파노라마 구체(반지름 500)보다 아래에 위치하도록 설정
        // 카메라 높이가 대략 0 근처이므로, -550 정도면 구체 밖으로 나감
        // 이렇게 하면 파노라마가 불투명할 때는 맵이 가려지고, 투명해지면 맵이 보임
        const mapY = -550;

        // 사용자 지정 맵 설정 적용
        floorMapMesh.position.set(-158.57, -550.00, -374.00);
        floorMapMesh.rotation.z = 0.0000;
        floorMapMesh.scale.set(1.0000, 1.0000, 1);

        scene.add(floorMapMesh);

        console.log("Map loaded. Use Arrow keys to move, +/- to scale, [] to rotate.");

    }, undefined, (err) => {
        console.log('map.png not found. Floor map will not be displayed.');
    });
}

function toggleMeasureMode() {
    isMeasureMode = !isMeasureMode;
    const btn = document.getElementById('btn-measure');
    const result = document.getElementById('measure-result');

    if (isMeasureMode) {
        btn.classList.add('active');
        btn.innerText = '📏 측정 중...';
        result.style.display = 'block';
        result.innerText = '지점을 클릭하세요';

        // 측정 초기화
        measurePoints = [];
        if (measureLine) scene.remove(measureLine);
        if (measureMarkerStart) scene.remove(measureMarkerStart);
        if (measureMarkerEnd) scene.remove(measureMarkerEnd);

        // 포인트 클라우드가 있으면 보이게 할 수도 있음
        if (pointCloud) pointCloud.visible = true;

    } else {
        btn.classList.remove('active');
        btn.innerText = '📏 측정';
        result.style.display = 'none';

        if (pointCloud) pointCloud.visible = false;
    }
}

function initMinimap() {
    const container = document.getElementById('minimap-content');
    minimapCanvas = document.getElementById('minimap-canvas');
    minimapCtx = minimapCanvas.getContext('2d');

    // 캔버스 크기 설정
    minimapCanvas.width = container.clientWidth;
    minimapCanvas.height = container.clientHeight;

    // 데이터 범위 계산 (Auto Scale)
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity; // 2D 맵에서는 Z가 Y가 됨

    pointsData.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y; // 데이터의 Y가 평면상 Y라고 가정 (Z는 높이)
        if (p.y > maxY) maxY = p.y;
    });

    // 여백 추가
    const padding = 1000; // mm 단위
    minX -= padding; maxX += padding;
    minY -= padding; maxY += padding;

    const dataWidth = maxX - minX;
    const dataHeight = maxY - minY;

    // 스케일 계산 (캔버스 크기에 맞춤)
    const scaleX = minimapCanvas.width / dataWidth;
    const scaleY = minimapCanvas.height / dataHeight;
    mapScale = Math.min(scaleX, scaleY);

    // 오프셋 (중앙 정렬)
    mapOffsetX = -minX * mapScale + (minimapCanvas.width - dataWidth * mapScale) / 2;

    // Y축은 뒤집혀 있으므로 (-y), 계산 방식이 다름
    // 중심점: -(minY + maxY)/2 * mapScale + mapOffsetY = canvasHeight/2
    mapOffsetY = minimapCanvas.height / 2 + (minY + maxY) / 2 * mapScale;

    // 미니맵 이미지 로드
    const img = new Image();
    img.src = 'map.png';
    img.onload = () => {
        minimapImage = img;

        // 이미지 비율
        const imgAspect = img.width / img.height;
        const dataAspect = dataWidth / dataHeight;

        let imgWidth, imgHeight;
        const paddingScale = 1.2; // loadFloorMap과 동일한 패딩 적용

        if (imgAspect > dataAspect) {
            imgHeight = dataHeight * paddingScale;
            imgWidth = imgHeight * imgAspect;
        } else {
            imgWidth = dataWidth * paddingScale;
            imgHeight = imgWidth / imgAspect;
        }

        const centerX = (minX + maxX) / 2; // 패딩 전 minX, maxX 사용 (데이터 중심)
        const centerY = (minY + maxY) / 2;

        mapImageBounds = {
            w: imgWidth,
            h: imgHeight,
            cx: centerX,
            cy: centerY
        };
        drawMinimap();
    };

    drawMinimap();

    // 미니맵 클릭 및 드래그 이벤트
    minimapCanvas.addEventListener('mousedown', (e) => {
        isMinimapMouseDown = true;
        isMinimapDragging = false;
        minimapDragStartX = e.clientX;
        minimapDragStartY = e.clientY;
        minimapLastX = e.clientX;
        minimapLastY = e.clientY;
        minimapCanvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (isMinimapMouseDown) {
            // 드래그 감지 (5px 이상 움직였을 때만 드래그로 간주)
            if (!isMinimapDragging) {
                const dist = Math.hypot(e.clientX - minimapDragStartX, e.clientY - minimapDragStartY);
                if (dist > 5) {
                    isMinimapDragging = true;
                }
            }

            if (isMinimapDragging) {
                const dx = e.clientX - minimapLastX;
                const dy = e.clientY - minimapLastY;
                minimapPanX += dx;
                minimapPanY += dy;
                drawMinimap();
            }
            minimapLastX = e.clientX;
            minimapLastY = e.clientY;
        }
    });

    // 미니맵 호버 커서 처리 (드래그 중이 아닐 때)
    minimapCanvas.addEventListener('mousemove', (e) => {
        if (isMinimapMouseDown) return; // 마우스 눌린 상태면 호버 처리 안함

        const rect = minimapCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        let isHovering = false;
        for (let i = 0; i < pointsData.length; i++) {
            const p = pointsData[i];
            const cx = p.x * mapScale + mapOffsetX + minimapPanX;
            const cy = -p.y * mapScale + mapOffsetY + minimapPanY;
            const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);
            if (dist < 10) {
                isHovering = true;
                break;
            }
        }
        minimapCanvas.style.cursor = isHovering ? 'pointer' : 'grab';
    });

    window.addEventListener('mouseup', () => {
        isMinimapMouseDown = false;
        isMinimapDragging = false;

        if (minimapCanvas.matches(':hover')) {
            // do nothing, mousemove will set cursor
        } else {
            minimapCanvas.style.cursor = 'grab';
        }
    });

    // mouseup에서 클릭 처리 (드래그가 아니었을 때만)
    minimapCanvas.addEventListener('mouseup', (e) => {
        if (isMinimapDragging) return; // 드래그였다면 클릭 처리 안함

        const rect = minimapCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // 가장 가까운 포인트 찾기
        let minDist = Infinity;
        let closestIndex = -1;

        pointsData.forEach((p, i) => {
            // 데이터 좌표 -> 캔버스 좌표 변환 (Pan 적용)
            const cx = p.x * mapScale + mapOffsetX + minimapPanX;
            const cy = -p.y * mapScale + mapOffsetY + minimapPanY;

            const dist = Math.sqrt((clickX - cx) ** 2 + (clickY - cy) ** 2);
            if (dist < 10) { // 10px 이내 클릭 시
                if (dist < minDist) {
                    minDist = dist;
                    closestIndex = i;
                }
            }
        });

        if (closestIndex !== -1) {
            loadPanorama(closestIndex);
        }
    });

    // 휠 줌 제거됨
}

function drawMinimap() {
    if (!minimapCtx) return;

    minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    // 1. 맵 이미지 그리기 (배경)
    if (minimapImage && mapImageBounds) {
        // 데이터 좌표계 기준 보정 적용
        const adjustedCx = (mapImageBounds.cx + mapAdjust.x) * mapScale + mapOffsetX + minimapPanX;
        const adjustedCy = -(mapImageBounds.cy + mapAdjust.y) * mapScale + mapOffsetY + minimapPanY;

        const w = mapImageBounds.w * mapScale * mapAdjust.scale;
        const h = mapImageBounds.h * mapScale * mapAdjust.scale;

        minimapCtx.save();
        minimapCtx.globalAlpha = 0.5; // 반투명

        // 회전 및 그리기
        minimapCtx.translate(adjustedCx, adjustedCy);
        minimapCtx.rotate(mapAdjust.rotation);
        minimapCtx.drawImage(minimapImage, -w / 2, -h / 2, w, h);

        minimapCtx.restore();
    }

    // 카메라 방향 계산
    const dir = new THREE.Vector3();
    if (camera) camera.getWorldDirection(dir);
    // Three.js 좌표계(X, Z) -> 캔버스 좌표계(X, Y) 변환 각도
    // Three Z는 Canvas Y와 방향이 같음 (Data Y가 증가하면 Three Z 감소, Canvas Y 감소... 아님)
    // 다시 정리:
    // Data X -> Three X -> Canvas X (Right)
    // Data Y -> Three -Z -> Canvas -Y (Up)
    // Three Dir (x, z)
    // Canvas Dir (x, z) (왜냐하면 Three Z는 Data -Y이고, Canvas Y는 Data -Y 방향이므로)
    // 즉 Three Z가 증가하면(Data Y 감소), Canvas Y도 증가(Data Y 감소, 화면 아래로)
    // 따라서 (dir.x, dir.z) 그대로 사용하면 됨.
    const angle = Math.atan2(dir.z, dir.x);

    // 모든 포인트 그리기
    pointsData.forEach((p, i) => {
        const cx = p.x * mapScale + mapOffsetX + minimapPanX;
        const cy = -p.y * mapScale + mapOffsetY + minimapPanY;

        // 화면 밖이면 그리지 않음 (성능 최적화)
        if (cx < -10 || cx > minimapCanvas.width + 10 || cy < -10 || cy > minimapCanvas.height + 10) return;

        // 현재 위치일 경우 시야각(부채꼴) 그리기
        if (i === currentPointIndex) {
            minimapCtx.beginPath();
            minimapCtx.moveTo(cx, cy);
            minimapCtx.arc(cx, cy, 40, angle - Math.PI / 6, angle + Math.PI / 6); // 60도 시야각
            minimapCtx.lineTo(cx, cy);
            minimapCtx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            minimapCtx.fill();
        }

        minimapCtx.beginPath();
        minimapCtx.arc(cx, cy, 3, 0, Math.PI * 2);

        if (i === currentPointIndex) {
            minimapCtx.fillStyle = 'red';
            minimapCtx.strokeStyle = 'white';
            minimapCtx.lineWidth = 2;
            minimapCtx.fill();
            minimapCtx.stroke();
        } else {
            minimapCtx.fillStyle = 'blue';
            minimapCtx.fill();
        }
    });
}

function createMarkers() {
    // ...existing code...
    const origin = pointsData[0];

    pointsData.forEach((point, index) => {
        // ...existing code...
        const x = (point.x - origin.x) * SCALE;
        const y = (point.z - origin.z) * SCALE;
        const z = -(point.y - origin.y) * SCALE;

        // 위치 저장 (나중에 카메라 이동 시 사용)
        point.scenePosition = new THREE.Vector3(x, y, z);

        // 마커 생성 (바닥에 표시되는 핫스팟)
        // 현재 위치가 아닌 곳에만 마커 표시
        const geometry = new THREE.SphereGeometry(2.5, 32, 32);

        // ShaderMaterial로 그라디언트 효과 구현 (안쪽 흰색, 바깥쪽 빨간색)
        const material = new THREE.ShaderMaterial({
            uniforms: {},
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                void main() {
                    vec3 normal = normalize(vNormal);
                    float intensity = dot(normal, vec3(0.0, 0.0, 1.0));
                    // intensity가 1이면(중앙) 흰색, 0이면(가장자리) 빨간색
                    // pow를 사용하여 흰색 영역 조절
                    vec3 color = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0), pow(intensity, 2.0));
                    gl_FragColor = vec4(color, 0.7); // 투명도 0.7
                }
            `,
            transparent: true,
            depthWrite: false
        });

        const marker = new THREE.Mesh(geometry, material);

        marker.position.copy(point.scenePosition);
        // ...existing code...

        marker.userData = { index: index };
        scene.add(marker);
        markers.push(marker);
    });
}

function loadPanorama(index) {
    if (currentPointIndex === index) return;

    const prevIndex = currentPointIndex;
    currentPointIndex = index;

    // 미니맵 업데이트
    drawMinimap();

    const point = pointsData[index];
    // const imagePath = `panotest/${point.image}`;
    const imagePath = `projects/여의도 63스퀘어/현장 파노라마뷰/파노라마데이터/${point.image}`;

    // 4. 애니메이션 이동 (Fly-to)
    if (prevIndex !== -1) {
        // 이전 위치에서 새 위치로 카메라 이동 애니메이션
        const startPos = camera.position.clone();
        const endPos = point.scenePosition.clone();

        // 컨트롤 타겟도 같이 이동해야 함
        const startTarget = controls.target.clone();

        // 현재 바라보는 방향 벡터 유지 (Target - Camera)
        const lookDirection = new THREE.Vector3().subVectors(startTarget, startPos);
        const endTarget = endPos.clone().add(lookDirection);

        // FOV 애니메이션 (줌인 효과)
        const startFov = camera.fov;
        const targetFov = Math.max(30, startFov * 0.6); // 60% 수준으로 줌인

        new TWEEN.Tween({ t: 0, fov: startFov })
            .to({ t: 1, fov: targetFov }, 1000) // 1초 동안 부드럽게 이동
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate((obj) => {
                const t = obj.t;
                camera.position.lerpVectors(startPos, endPos, t);
                controls.target.lerpVectors(startTarget, endTarget, t);

                camera.fov = obj.fov;
                camera.updateProjectionMatrix();
            })
            .onComplete(() => {
                // 도착 후 이미지 로드 및 교체
                changePanoramaTexture(imagePath, point, () => {
                    // 이미지 로드 완료 후 FOV 복구 (줌아웃)
                    new TWEEN.Tween({ fov: camera.fov })
                        .to({ fov: startFov }, 800)
                        .easing(TWEEN.Easing.Cubic.Out)
                        .onUpdate((obj) => {
                            camera.fov = obj.fov;
                            camera.updateProjectionMatrix();
                        })
                        .start();
                });
            })
            .start();

    } else {
        // 처음 로드 시에는 즉시 이동
        changePanoramaTexture(imagePath, point);
        camera.position.copy(point.scenePosition);
        controls.target.copy(point.scenePosition).add(new THREE.Vector3(0.1, 0, 0));
        controls.update();
    }
}

function changePanoramaTexture(imagePath, point, onTextureLoaded) {
    document.getElementById('loading').style.display = 'block';

    const loader = new THREE.TextureLoader();
    loader.load(
        imagePath,
        (texture) => {
            document.getElementById('loading').style.display = 'none';

            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;

            if (!panoramaMesh) {
                // 구체 반지름을 5000으로 키워 바닥 맵(-550)이 구체 내부에 위치하도록 함
                // 이를 통해 파노라마가 투명해지지 않아도 맵을 볼 수 있음 (검은 배경 방지)
                const geometry = new THREE.SphereGeometry(5000, 60, 40);
                geometry.scale(-1, 1, 1);
                const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 1 });
                panoramaMesh = new THREE.Mesh(geometry, material);
                panoramaMesh.renderOrder = -1; // 파노라마를 가장 먼저 그려서 마커 뒤에 보이도록 함
                scene.add(panoramaMesh);
            } else {
                panoramaMesh.material.map = texture;
                panoramaMesh.material.needsUpdate = true;

                // 이동 후 복구 로직
                panoramaMesh.visible = true;
                panoramaMesh.material.opacity = 0; // 일단 투명하게 시작해서 페이드 인

                // 페이드 인 애니메이션
                new TWEEN.Tween({ opacity: 0 })
                    .to({ opacity: 1 }, 500)
                    .onUpdate(({ opacity }) => {
                        panoramaMesh.material.opacity = opacity;
                    })
                    .start();
            }

            // 파노라마 구체 위치 업데이트
            panoramaMesh.position.copy(point.scenePosition);
            // 저장된 회전값 적용
            panoramaMesh.rotation.y = point.rotationY || 0;

            // 마커 가시성 업데이트
            markers.forEach((m, i) => {
                m.visible = (i !== currentPointIndex);
            });

            // 콜백 실행
            if (onTextureLoaded) onTextureLoaded();
        },
        undefined,
        (err) => {
            console.error('Error loading image', err);
            document.getElementById('loading').innerText = 'Error loading image';
        }
    );
}

function onPointerDown(event) {
    // 마우스 좌표 정규화
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (isMeasureMode) {
        // 측정 모드: 포인트 클라우드 또는 파노라마 메쉬와 교차 검사
        const objects = pointCloud ? [pointCloud, panoramaMesh] : [panoramaMesh];
        const intersects = raycaster.intersectObjects(objects, true);

        if (intersects.length > 0) {
            const hitPoint = intersects[0].point;
            addMeasurePoint(hitPoint);
        }
        return; // 측정 모드일 때는 이동 안함
    }

    // 이동 모드: 마커 클릭
    const intersects = raycaster.intersectObjects(markers);
    if (intersects.length > 0) {
        const marker = intersects[0].object;
        const index = marker.userData.index;
        loadPanorama(index);
    }
}

function addMeasurePoint(point) {
    measurePoints.push(point);

    // 마커 표시
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(point);
    scene.add(marker);

    if (measurePoints.length === 1) {
        measureMarkerStart = marker;
        document.getElementById('measure-result').innerText = '두 번째 지점을 클릭하세요';
    } else if (measurePoints.length === 2) {
        measureMarkerEnd = marker;

        // 선 그리기
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(measurePoints);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
        measureLine = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(measureLine);

        // 거리 계산
        const dist = measurePoints[0].distanceTo(measurePoints[1]);
        // 스케일이 0.01 (mm -> m) 이었으므로, 현재 3D 상의 1단위는 1m라고 가정?
        // 아니, createMarkers에서 SCALE = 0.01을 곱했음.
        // 원본 데이터가 mm 단위였고, 0.01을 곱했으므로 3D 상의 1단위 = 10mm = 1cm?
        // 확인: 5331.91 * 0.01 = 53.3191. 
        // 만약 5331mm가 5.3m라면, 0.001을 곱해야 미터 단위임.
        // 현재 0.01을 곱했으므로 단위는 'cm' 또는 '10mm'임.
        // 따라서 미터로 환산하려면: dist (현재단위) / 100 * (원래단위환산)
        // 헷갈리므로 역산:
        // 3D 거리 1 = 원본 데이터 100mm = 0.1m
        // 따라서 미터 거리 = dist * 0.1

        // 하지만 보통 건축에서 mm 단위를 0.001 곱해서 m로 씀.
        // 코드 상단 SCALE = 0.01 로 되어있음. (100mm -> 1 unit)
        // 즉 1 unit = 10cm = 0.1m

        const distMeter = dist / SCALE * 0.001; // 원본 mm로 복구 후 m로 변환
        // 또는 그냥 dist * (1/SCALE) * 0.001
        // = dist * 100 * 0.001 = dist * 0.1

        document.getElementById('measure-result').innerText = `거리: ${(dist * 0.1).toFixed(3)} m`;

        // 초기화 (다음 측정을 위해)
        measurePoints = [];
        // 마커와 라인은 남겨둘지, 지울지 결정. 여기선 일단 남겨두고 다음 클릭시 지움(toggleMeasureMode에서 처리)
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    requestAnimationFrame(animate);
    TWEEN.update(time); // Tween 업데이트
    controls.update();

    updateMarkersVisibility(); // 마커 가시성 업데이트
    drawMinimap(); // 미니맵 실시간 업데이트

    renderer.render(scene, camera);
}

function updateMarkersVisibility() {
    if (!camera) return;

    markers.forEach(marker => {
        // 현재 위치(카메라)와 마커 사이의 거리 계산
        const dist = camera.position.distanceTo(marker.position);

        // 1. 거리 기반 숨김 처리
        if (dist > MARKER_VISIBLE_DISTANCE) {
            marker.visible = false;
        } else {
            // 현재 위치인 마커는 이미 loadPanorama에서 숨김 처리되지만,
            // 여기서 다시 켜버릴 수 있으므로 체크 필요
            if (marker.userData.index !== currentPointIndex) {
                marker.visible = true;

                // 2. 거리 기반 크기 조절 (가까울수록 큼)
                // dist가 0이면 MAX_SCALE, dist가 MARKER_VISIBLE_DISTANCE면 MIN_SCALE
                // 선형 보간: scale = MAX - (dist / MAX_DIST) * (MAX - MIN)
                let scale = MAX_MARKER_SCALE - (dist / MARKER_VISIBLE_DISTANCE) * (MAX_MARKER_SCALE - MIN_MARKER_SCALE);
                scale = Math.max(MIN_MARKER_SCALE, scale); // 최소 크기 제한

                marker.scale.setScalar(scale);

                // 3. 거리 기반 투명도 조절 (제거됨 - 불투명 유지)
                // const opacity = 1 - (dist / MARKER_VISIBLE_DISTANCE);
                // marker.material.opacity = Math.max(0.2, opacity * 0.8); 
            }
        }
    });
}

function onKeyDown(e) {
    // 파노라마 토글 (맵을 보기 위해)
    if (e.key === 'm' || e.key === 'M') {
        if (panoramaMesh) {
            panoramaMesh.visible = !panoramaMesh.visible;
            console.log(`Panorama visibility: ${panoramaMesh.visible}`);
        }
    }

    // 파노라마 회전 (현재 뷰 수정)
    // e.key는 Shift 누르면 { } 로 변하므로 e.code 사용 (BracketLeft, BracketRight)
    if (panoramaMesh && (e.code === 'BracketLeft' || e.code === 'BracketRight')) {
        // 기본 속도 빠르게 (0.05), Shift 누르면 미세 조정 (0.005)
        const rotStep = e.shiftKey ? 0.005 : 0.05;

        if (e.code === 'BracketLeft') {
            panoramaMesh.rotation.y += rotStep;
            console.log('Panorama Rotate Left', panoramaMesh.rotation.y);
        } else {
            panoramaMesh.rotation.y -= rotStep;
            console.log('Panorama Rotate Right', panoramaMesh.rotation.y);
        }
        // 현재 포인트 데이터에 회전값 저장
        if (currentPointIndex !== -1) {
            pointsData[currentPointIndex].rotationY = panoramaMesh.rotation.y;
        }
        return; // 파노라마 회전 시 맵 회전 방지
    }

    // 저장 기능 (S) - 맵 로드 여부와 상관없이 작동
    if (e.key === 's' || e.key === 'S') {
        console.log("=== Updated Data Structure ===");
        let output = "const pointsData = [\n";
        pointsData.forEach(p => {
            let rot = p.rotationY !== undefined ? `, rotationY: ${p.rotationY.toFixed(4)}` : "";
            output += `  { label: "${p.label}", x: ${p.x}, y: ${p.y}, z: ${p.z}, image: "${p.image}"${rot} },\n`;
        });
        output += "];";
        console.log(output);

        console.log("\n=== Map Transform Settings ===");
        console.log(`const mapAdjust = { x: ${mapAdjust.x.toFixed(2)}, y: ${mapAdjust.y.toFixed(2)}, scale: ${mapAdjust.scale.toFixed(4)}, rotation: ${mapAdjust.rotation.toFixed(4)} };`);
        console.log("==============================");

        // 클립보드 복사 시도
        navigator.clipboard.writeText(output).then(() => {
            alert("전체 데이터가 클립보드에 복사되었습니다! data.js 파일에 붙여넣기 하세요.\n(콘솔에서 맵 보정값도 확인하세요)");
        }).catch(err => {
            console.error('Clipboard copy failed:', err);
            alert("클립보드 복사에 실패했습니다. 콘솔(F12) 내용을 직접 복사하세요.");
        });
        return;
    }

    // 2D 맵 제어 (미니맵 이미지 조정)
    if (minimapImage) {
        const moveStep = 100; // 이동 단위 (데이터 단위, mm)
        const scaleStep = 0.005; // 스케일 단위
        const rotStep = 0.005; // 회전 단위 (라디안)

        switch (e.key) {
            case 'ArrowUp':
                mapAdjust.y += moveStep;
                console.log('Map Up', mapAdjust.y);
                break;
            case 'ArrowDown':
                mapAdjust.y -= moveStep;
                console.log('Map Down', mapAdjust.y);
                break;
            case 'ArrowLeft':
                mapAdjust.x -= moveStep;
                console.log('Map Left', mapAdjust.x);
                break;
            case 'ArrowRight':
                mapAdjust.x += moveStep;
                console.log('Map Right', mapAdjust.x);
                break;
            case '+': case '=':
                mapAdjust.scale *= (1 + scaleStep);
                console.log('Map Scale Up', mapAdjust.scale);
                break;
            case '-': case '_':
                mapAdjust.scale *= (1 - scaleStep);
                console.log('Map Scale Down', mapAdjust.scale);
                break;
            case '[': // Shift + [
                if (e.shiftKey) {
                    mapAdjust.rotation += rotStep;
                    console.log('Map Rotate Left', mapAdjust.rotation);
                }
                break;
            case ']': // Shift + ]
                if (e.shiftKey) {
                    mapAdjust.rotation -= rotStep;
                    console.log('Map Rotate Right', mapAdjust.rotation);
                }
                break;
        }
        drawMinimap(); // 변경사항 즉시 반영
    }
}

// UI 이벤트 리스너 (사이드바)
const sidebar = document.getElementById('sidebar');
const btnMenuToggle = document.getElementById('btn-menu-toggle');

if (btnMenuToggle) {
    btnMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        btnMenuToggle.textContent = sidebar.classList.contains('open') ? '✕' : '☰';
    });
}


