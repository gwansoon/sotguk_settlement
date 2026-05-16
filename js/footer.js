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

    const navTest = document.getElementById('navTest');
    if (navTest) {
        navTest.addEventListener('click', (e) => {
            e.preventDefault();
            alert('개발중입니다.');
        });
    }
}