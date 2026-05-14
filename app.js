// DOM 요소 가져오기
const loginScreen = document.getElementById('loginScreen');
const mainScreen = document.getElementById('mainScreen');
const loginBranchNameInput = document.getElementById('loginBranchName');
const loginPinInput = document.getElementById('loginPin');
const loginBtn = document.getElementById('loginBtn');

const branchNameInput = document.getElementById('branchName');
const saveBtn = document.getElementById('saveBtn');
const shareBtn = document.getElementById('shareBtn');
const resultArea = document.getElementById('resultArea');
const summaryText = document.getElementById('summaryText');

// --- 로그인 기능 ---
// 앱 실행 시 저장된 지점명 불러오기
const savedBranchName = localStorage.getItem('savedBranchName');
if (savedBranchName) {
    loginBranchNameInput.value = savedBranchName;
}

// 로그인 버튼 클릭 이벤트
loginBtn.addEventListener('click', () => {
    const branchName = loginBranchNameInput.value.trim();
    const pin = loginPinInput.value;

    if (!branchName) {
        alert('지점명을 입력해주세요.');
        return;
    }
    if (pin !== '123456') { // 임시 핀번호
        alert('PIN 번호가 올바르지 않습니다.');
        return;
    }

    // 로그인 성공: 지점명 저장 및 화면 전환
    localStorage.setItem('savedBranchName', branchName);
    branchNameInput.value = branchName; // 메인 화면 지점명에 자동 입력
    loginScreen.style.display = 'none';
    mainScreen.style.display = 'block';
});

// 저장 버튼 클릭 이벤트
saveBtn.addEventListener('click', () => {
    const branchName = branchNameInput.value;

    if (!branchName) {
        alert('지점명을 입력해주세요.');
        return;
    }

    // 임시 저장 메시지
    alert('데이터가 저장되었습니다.');
    
    // 결과 영역 표시
    resultArea.style.display = 'block';
    summaryText.innerText = `[${branchName} 지점]\n정산 내역이 저장되었습니다.`;
});

// 공유 버튼 클릭 이벤트
shareBtn.addEventListener('click', async () => {
    const branchName = branchNameInput.value;

    if (!branchName) {
        alert('지점명을 입력해주세요.');
        return;
    }

    const messageText = `[${branchName} 지점]\n오늘 하루도 고생하셨습니다!`;

    // 공유 기능 (모바일 지원 환경 우선, 미지원 시 클립보드 복사)
    if (navigator.share) {
        try {
            await navigator.share({ title: '매장 정산', text: messageText });
        } catch (error) {
            console.log('공유 취소 또는 실패:', error);
        }
    } else {
        navigator.clipboard.writeText(messageText).then(() => alert('내역이 복사되었습니다. 카카오톡에 붙여넣기 해주세요!'));
    }
});