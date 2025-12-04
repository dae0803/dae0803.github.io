const PASSWORD = "eunmin"; // 간단한 비밀번호 (실제 운영시에는 더 안전한 방법 권장)
const SESSION_KEY = "auth_token";

document.addEventListener('DOMContentLoaded', () => {
    const lockScreen = document.getElementById('lock-screen');
    const dashboard = document.getElementById('dashboard');
    const passwordInput = document.getElementById('password-input');
    const loginBtn = document.getElementById('btn-login');
    const logoutBtn = document.getElementById('btn-logout');
    const errorMsg = document.getElementById('error-msg');

    // 세션 확인
    if (sessionStorage.getItem(SESSION_KEY) === "valid") {
        showDashboard();
    }

    // 로그인 함수
    function login() {
        const input = passwordInput.value;
        if (input === PASSWORD) {
            sessionStorage.setItem(SESSION_KEY, "valid");
            showDashboard();
        } else {
            errorMsg.textContent = "비밀번호가 올바르지 않습니다.";
            passwordInput.value = "";
            passwordInput.focus();
        }
    }

    // 대시보드 표시
    function showDashboard() {
        lockScreen.style.display = 'none';
        dashboard.style.display = 'flex';
        document.body.style.overflow = 'auto';
    }

    // 로그아웃
    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        location.reload();
    }

    // 이벤트 리스너
    loginBtn.addEventListener('click', login);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// 프로젝트 뷰어 열기
function openViewer(projectId) {
    // 뷰어 페이지로 이동 (파라미터 전달)
    // viewer.html은 assets/js/viewer.js에서 파라미터를 읽어서 처리하도록 되어있어야 함
    window.location.href = `viewer.html?project=${projectId}`;
}

// 일반 링크 열기
function openLink(url) {
    window.location.href = url;
}