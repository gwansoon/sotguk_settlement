import { APP_VERSION } from "../version.js";

export function renderFooter(activeId, pathToRoot = './') {
    const linkIndex = pathToRoot + 'index.html';
    const linkCash = pathToRoot === './' ? 'html/cash.html' : 'cash.html';

    const layoutHtml = `
    <div class="version-info">${APP_VERSION}</div>
    <footer id="footerNav" style="display: none;">
        <nav class="footer-menu">
            <a href="${linkIndex}" id="navDaily" class="menu-item ${activeId === 'navDaily' ? 'active' : ''}">
                <span class="icon">📊</span>
                <span class="label">일일정산</span>
            </a>
            <a href="${linkCash}" id="navCash" class="menu-item ${activeId === 'navCash' ? 'active' : ''}">
                <span class="icon">🏠</span>
                <span class="label">시제정산</span>
            </a>
            <a href="#" id="navTest" class="menu-item ${activeId === 'navTest' ? 'active' : ''}">
                <span class="icon">⚙️</span>
                <span class="label">Test</span>
            </a>
        </nav>
    </footer>
    `;
    
    document.body.insertAdjacentHTML('beforeend', layoutHtml);

    const navCash = document.getElementById('navCash');
    if (navCash) {
        // --- [배포용 코드] 시제정산 탭 이동 막기 ---
        // 개발 환경(Live Server)에서 테스트하실 때는 아래 4줄을 주석 처리해 주세요!

        // navCash.addEventListener('click', (e) => {
        //     e.preventDefault(); // 페이지 이동 강제 중단
        //     alert('개발중입니다.');
        // });

        // --- [개발용 코드] 시제정산 정상 이동 ---
        // a 태그의 href 속성으로 자동 이동하므로 별도의 코드가 필요 없습니다. 위 배포용 코드를 주석 처리하기만 하면 풀립니다!
    }

    const navTest = document.getElementById('navTest');
    if (navTest) {

        navTest.addEventListener('click', (e) => {
            e.preventDefault();
            alert('개발중입니다.');
        });
        
    }
}