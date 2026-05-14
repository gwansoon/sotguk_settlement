import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { generateSummaryMessage } from "./messageFormatter.js";

// 파이어베이스 설정
const firebaseConfig = {
  apiKey: "AIzaSyB2VNNENhPrYT9JZShr4e104pScC0p218g",
  authDomain: "sotguk-settlement-e3da2.firebaseapp.com",
  projectId: "sotguk-settlement-e3da2",
  storageBucket: "sotguk-settlement-e3da2.firebasestorage.app",
  messagingSenderId: "628564551507",
  appId: "1:628564551507:web:d24a9607aefbb7ef45e3a6"
};

// 파이어베이스 및 파이어스토어(데이터베이스) 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM 요소 가져오기
const loginScreen = document.getElementById('loginScreen');
const mainScreen = document.getElementById('mainScreen');
const loginBranchNameInput = document.getElementById('loginBranchName');
const loginPinInput = document.getElementById('loginPin');
const loginBtn = document.getElementById('loginBtn');
const pinDots = document.querySelectorAll('#pinDisplay .dot');

const branchNameInput = document.getElementById('branchName');
const saveBtn = document.getElementById('saveBtn');
const shareBtn = document.getElementById('shareBtn');
const resultArea = document.getElementById('resultArea');
const summaryText = document.getElementById('summaryText');
const closeResultBtn = document.getElementById('closeResultBtn');
const footerNav = document.getElementById('footerNav');
const currentDateElement = document.getElementById('currentDate');

const salesHallCount = document.getElementById('salesHallCount');
const salesHallAmount = document.getElementById('salesHallAmount');
const salesDeliveryCount = document.getElementById('salesDeliveryCount');
const salesDeliveryAmount = document.getElementById('salesDeliveryAmount');
const salesUnclassifiedCount = document.getElementById('salesUnclassifiedCount');
const salesUnclassifiedAmount = document.getElementById('salesUnclassifiedAmount');
const salesTotalAmount = document.getElementById('salesTotalAmount');
const couponCount = document.getElementById('couponCount');
const memoInput = document.getElementById('memoInput');

// --- 모바일 줌인/줌아웃 강제 차단 ---
// 두 손가락으로 화면을 확대/축소하는 터치 동작 방지
document.addEventListener('touchmove', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

// --- 오늘 날짜 표시 ---
const todayDate = new Date();
const year = todayDate.getFullYear();
const month = todayDate.getMonth() + 1;
const day = todayDate.getDate();
const week = ['일', '월', '화', '수', '목', '금', '토'][todayDate.getDay()];
currentDateElement.innerText = `${year}년 ${month}월 ${day}일 (${week})`;

// --- 매출 총합 자동 계산 ---
function formatNumberWithComma(value) {
    const num = value.replace(/[^0-9]/g, ''); // 숫자 이외의 문자 제거
    if (!num) return '';
    return parseInt(num, 10).toLocaleString(); // 콤마 추가
}

function handleAmountInput(e) {
    e.target.value = formatNumberWithComma(e.target.value);
    calculateTotalSales();
}

function calculateTotalSales() {
    const hall = parseInt(salesHallAmount.value.replace(/,/g, '')) || 0;
    const delivery = parseInt(salesDeliveryAmount.value.replace(/,/g, '')) || 0;
    const unclassified = parseInt(salesUnclassifiedAmount.value.replace(/,/g, '')) || 0;
    const total = hall + delivery + unclassified;
    salesTotalAmount.innerText = total.toLocaleString() + '원';
}

[salesHallAmount, salesDeliveryAmount, salesUnclassifiedAmount].forEach(input => {
    if (input) input.addEventListener('input', handleAmountInput);
});

// --- 로그인 기능 ---
// 앱 실행 시 저장된 지점명 불러오기
const savedBranchName = localStorage.getItem('savedBranchName');
if (savedBranchName) {
    loginBranchNameInput.value = savedBranchName;
}

// PIN 번호 입력 시 점 색상 변경
loginPinInput.addEventListener('input', (e) => {
    const length = e.target.value.length;
    pinDots.forEach((dot, index) => {
        if (index < length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
});

// 로그인 버튼 클릭 이벤트
loginBtn.addEventListener('click', async () => {
    const branchName = loginBranchNameInput.value.trim();
    const pin = loginPinInput.value;

    if (!branchName) {
        alert('지점명을 입력해주세요.');
        return;
    }
    if (!pin || pin.length !== 6) {
        alert('6자리 PIN 번호를 입력해주세요.');
        loginPinInput.value = '';
        pinDots.forEach(dot => dot.classList.remove('filled'));
        return;
    }

    try {
        // MySQL의 SELECT와 유사: 'branches' 컬렉션에서 지점명(branchName)으로 문서 가져오기
        const branchRef = doc(db, "branches", branchName);
        const branchSnap = await getDoc(branchRef);

        if (branchSnap.exists()) {
            console.log("👉 기존 지점 로그인 시도");
            // 1. 이미 등록된 지점인 경우: DB의 핀번호와 입력한 핀번호 비교
            const dbData = branchSnap.data();
            console.log("DB에 저장된 PIN:", dbData.pin, " / 입력한 PIN:", pin);

            if (dbData.pin !== pin) {
                alert('PIN 번호가 올바르지 않습니다.');
                loginPinInput.value = '';
                pinDots.forEach(dot => dot.classList.remove('filled'));
                return;
            }
        } else {
            alert('등록되지 않은 지점입니다. 관리자에게 문의해주세요.');
            loginPinInput.value = '';
            pinDots.forEach(dot => dot.classList.remove('filled'));
            return;
        }

        // 로그인 성공: 지점명 저장 및 화면 전환
        localStorage.setItem('savedBranchName', branchName);
        branchNameInput.innerText = branchName; // 메인 화면 지점명에 텍스트로 표시
        loginScreen.style.display = 'none';
        mainScreen.style.display = 'block';
        footerNav.style.display = 'block';
    } catch (error) {
        console.error("Firebase 에러:", error);
        alert('데이터베이스 통신 중 오류가 발생했습니다.');
    }
});

// 입력된 정산 데이터를 수집하는 함수
function gatherSettlementData() {
    return {
        branchName: branchNameInput.innerText,
        dateText: currentDateElement.innerText,
        hallC: salesHallCount.value || '0',
        hallA: salesHallAmount.value || '0',
        deliveryC: salesDeliveryCount.value || '0',
        deliveryA: salesDeliveryAmount.value || '0',
        unclassifiedC: salesUnclassifiedCount.value || '0',
        unclassifiedA: salesUnclassifiedAmount.value || '0',
        totalA: salesTotalAmount.innerText,
        couponC: couponCount.value || '0',
        memo: memoInput.value.trim()
    };
}

// 요약 버튼 클릭 이벤트
saveBtn.addEventListener('click', () => {
    const data = gatherSettlementData();

    // 결과 영역 표시
    resultArea.style.display = 'block';
    summaryText.innerText = generateSummaryMessage(data);
});

// 정산 요약 닫기 버튼 이벤트
closeResultBtn.addEventListener('click', () => {
    resultArea.style.display = 'none';
});

// 공유 버튼 클릭 이벤트
shareBtn.addEventListener('click', async () => {
    const data = gatherSettlementData();

    if (!data.branchName) {
        alert('지점명을 입력해주세요.');
        return;
    }

    const messageText = generateSummaryMessage(data);

    // 공유 기능 (모바일 지원 환경 우선, 미지원 시 클립보드 복사)
    if (navigator.share) {
        try {
            await navigator.share({text: messageText });
        } catch (error) {
            console.log('공유 취소 또는 실패:', error);
        }
    } else {
        navigator.clipboard.writeText(messageText).then(() => alert('내역이 복사되었습니다. 카카오톡에 붙여넣기 해주세요!'));
    }
});