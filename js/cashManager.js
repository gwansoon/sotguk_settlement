import { renderFooter } from "./footer.js";

// 푸터 렌더링 (시제 정산 탭 활성화) 및 표시
renderFooter('navCash', '../');
document.getElementById('footerNav').style.display = 'block';

// 시제(가게현금) 정산 관련 로직을 관리하는 파일입니다.
console.log("시제 정산 화면 로드됨");