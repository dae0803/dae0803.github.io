const SESSION_KEY = "auth_token";

// Auth Check
if (sessionStorage.getItem(SESSION_KEY) !== "valid") {
    alert("접근 권한이 없습니다.");
    window.location.href = "../../../index.html";
}

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('project-sidebar');
    const menuItems = document.querySelectorAll('.menu-item');
    const iframe = document.getElementById('content-frame');
    const pageTitle = document.getElementById('page-title');
    const mobileToggle = document.getElementById('mobile-toggle');
    const controlsContainer = document.getElementById('custom-controls');

    // Mobile Menu Toggle
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Menu Navigation
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update Active State
            menuItems.forEach(el => el.classList.remove('active'));
            item.classList.add('active');

            // Update Content
            const src = item.dataset.src;
            const title = item.dataset.title;
            const type = item.dataset.type; // 'static', 'density-map', 'panorama'

            pageTitle.textContent = title;
            
            // Handle Special Types
            if (type === 'density-map') {
                setupDensityMapControls();
            } else {
                controlsContainer.innerHTML = ''; // Clear controls
                iframe.src = src;
            }

            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });

    // Density Map Logic
    function setupDensityMapControls() {
        const TOTAL_CLUSTERS = 200;
        let currentCluster = 1;

        controlsContainer.innerHTML = `
            <div class="overlay-controls">
                <button id="btn-prev">◀</button>
                <select id="cluster-select"></select>
                <button id="btn-next">▶</button>
            </div>
        `;

        const select = document.getElementById('cluster-select');
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');

        // Populate Select
        for (let i = 1; i <= TOTAL_CLUSTERS; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = `Cluster ${i}`;
            select.appendChild(option);
        }

        // Load Function
        const loadCluster = (id) => {
            currentCluster = parseInt(id);
            select.value = currentCluster;
            // Assuming the path structure is consistent
            iframe.src = `폴대위치 선정을 위한 3D스캔 분석/density_map_cluster_${currentCluster}.html`;
            
            btnPrev.disabled = currentCluster <= 1;
            btnNext.disabled = currentCluster >= TOTAL_CLUSTERS;
        };

        // Event Listeners
        select.addEventListener('change', (e) => loadCluster(e.target.value));
        btnPrev.addEventListener('click', () => loadCluster(currentCluster - 1));
        btnNext.addEventListener('click', () => loadCluster(currentCluster + 1));

        // Initial Load
        loadCluster(1);
    }

    // Trigger first item
    if (menuItems.length > 0) {
        menuItems[0].click();
    }
});
