// DOM 요소 가져오기
const dateInput = document.getElementById('date');
const salesCountInput = document.getElementById('salesCount');
const revenueInput = document.getElementById('revenue');
const saveBtn = document.getElementById('saveBtn');
const shareBtn = document.getElementById('shareBtn');
const resultArea = document.getElementById('resultArea');
const summaryText = document.getElementById('summaryText');

// 오늘 날짜를 기본값으로 세팅
const today = new Date();
dateInput.valueAsDate = today;

// 날짜 변경 시 해당 날짜의 데이터 불러오기
dateInput.addEventListener('change', loadData);

// 초기 로딩 시 오늘 데이터 불러오기
loadData();

// 저장 버튼 클릭 이벤트
saveBtn.addEventListener('click', () => {
    const date = dateInput.value;
    const salesCount = salesCountInput.value;
    const revenue = revenueInput.value;

    if (!salesCount || !revenue) {
        alert('판매량과 매출액을 모두 입력해주세요.');
        return;
    }

    const data = { date, salesCount, revenue };
    
    // localStorage에 날짜를 키값으로 저장
    localStorage.setItem(`settlement_${date}`, JSON.stringify(data));
    
    alert('데이터가 기기에 저장되었습니다.');
    updateSummary(data);
});

// 데이터 불러오기 함수
function loadData() {
    const date = dateInput.value;
    const savedData = localStorage.getItem(`settlement_${date}`);
    
    if (savedData) {
        const data = JSON.parse(savedData);
        salesCountInput.value = data.salesCount;
        revenueInput.value = data.revenue;
        updateSummary(data);
    } else {
        salesCountInput.value = '';
        revenueInput.value = '';
        resultArea.style.display = 'none';
    }
}

// 하단 요약 업데이트
function updateSummary(data) {
    resultArea.style.display = 'block';
    const formattedRevenue = Number(data.revenue).toLocaleString(); // 천 단위 콤마
    summaryText.innerText = `[${data.date} 정산 내역]\n총 판매량: ${data.salesCount}건\n총 매출액: ${formattedRevenue}원`;
}

// 스마트폰 기본 공유 기능으로 변경 (카카오톡 포함)
shareBtn.addEventListener('click', async () => {
    const date = dateInput.value;
    const salesCount = salesCountInput.value;
    const revenue = revenueInput.value;

    if (!salesCount || !revenue) {
        alert('먼저 판매량과 매출액을 입력해주세요.');
        return;
    }

    const formattedRevenue = Number(revenue).toLocaleString();
    const messageText = `[${date} 매장 정산 내역]\n\n판매량: ${salesCount}건\n매출액: ${formattedRevenue}원\n\n오늘 하루도 고생하셨습니다!`;

    // 스마트폰(브라우저)에서 공유하기 기능을 지원하는지 확인
    if (navigator.share) {
        try {
            await navigator.share({
                title: '일일 매장 정산',
                text: messageText
            });
            console.log('공유 성공');
        } catch (error) {
            console.log('공유 취소 또는 실패:', error);
        }
    } else {
        // PC 브라우저 등 지원하지 않는 환경일 경우 클립보드에 복사
        navigator.clipboard.writeText(messageText).then(() => {
            alert('정산 내역이 복사되었습니다. 카카오톡에 붙여넣기 해주세요!');
        });
    }
});