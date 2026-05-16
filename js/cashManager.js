import { renderFooter } from "./footer.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 파이어베이스 설정
const firebaseConfig = {
  apiKey: "AIzaSyB2VNNENhPrYT9JZShr4e104pScC0p218g",
  authDomain: "sotguk-settlement-e3da2.firebaseapp.com",
  projectId: "sotguk-settlement-e3da2",
  storageBucket: "sotguk-settlement-e3da2.firebasestorage.app",
  messagingSenderId: "628564551507",
  appId: "1:628564551507:web:d24a9607aefbb7ef45e3a6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 푸터 렌더링 (시제 정산 탭 활성화) 및 표시
renderFooter('navCash', '../');
document.getElementById('footerNav').style.display = 'block';

// --- 상단 지점명 및 날짜 설정 ---
const savedBranchName = localStorage.getItem('savedBranchName');
const cashBranchName = document.getElementById('cashBranchName');
const cashCurrentDate = document.getElementById('cashCurrentDate');

if (cashBranchName && savedBranchName) {
    cashBranchName.innerText = savedBranchName + '점';
}

const todayDate = new Date();
const year = todayDate.getFullYear();
const month = todayDate.getMonth() + 1;
const day = todayDate.getDate();
const week = ['일', '월', '화', '수', '목', '금', '토'][todayDate.getDay()];

if (cashCurrentDate) {
    cashCurrentDate.innerText = `${year}년 ${month}월 ${day}일 (${week})`;
}

// --- 현금 시제 계산 로직 ---
const cashInputs = ['cash50k', 'cash10k', 'cash5k', 'cash1k', 'cash500', 'cash100', 'cashGift', 'cashDirectInput'];
// 곱해질 금액 배열 (상품권은 10,000원권으로 임시 설정, 직접입력은 1을 곱함)
const multipliers = [50000, 10000, 5000, 1000, 500, 100, 10000, 1]; 

function formatNumberWithComma(value) {
    const num = value.replace(/[^0-9]/g, ''); // 숫자 이외의 문자 제거
    if (!num) return '';
    return parseInt(num, 10).toLocaleString(); // 콤마 추가
}

function calculateTotalCash() {
    let total = 0;
    cashInputs.forEach((id, index) => {
        const el = document.getElementById(id);
        if (el) {
            // 콤마가 있다면 제거한 뒤 숫자로 변환하여 계산
            const val = parseInt(String(el.value).replace(/,/g, '')) || 0;
            total += val * multipliers[index];
        }
    });
    
    const totalEl = document.getElementById('cashTotalAmount');
    if (totalEl) totalEl.innerText = total.toLocaleString() + '원';

    const actualAmountInput = document.getElementById('actualAmount');
    if (actualAmountInput) actualAmountInput.value = total.toLocaleString();

    calculateDiffAmount(); // 실제금액이 바뀔 때 차액 재계산
}

// --- 차액(과부족) 자동 계산 로직 ---
function calculateDiffAmount() {
    const endAmt = parseInt(String(document.getElementById('endAmount').value).replace(/,/g, '')) || 0;
    const actualAmt = parseInt(String(document.getElementById('actualAmount').value).replace(/,/g, '')) || 0;
    
    const diff = actualAmt - endAmt;
    const diffEl = document.getElementById('diffAmount');
    
    if (diffEl) {
        if (diff > 0) {
            diffEl.innerText = '+' + diff.toLocaleString() + '원';
            diffEl.style.color = '#3498db'; // 남으면 파란색
        } else if (diff < 0) {
            diffEl.innerText = diff.toLocaleString() + '원';
            diffEl.style.color = '#e74c3c'; // 부족하면 빨간색
        } else {
            diffEl.innerText = '0원';
            diffEl.style.color = '#2c3e50';
        }
    }
}

cashInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', (e) => {
            if (id === 'cashDirectInput') {
                e.target.value = formatNumberWithComma(e.target.value);
            }
            calculateTotalCash();
        });
    }
});

// --- 현금 수량 초기화 이벤트 ---
const cashResetBtn = document.getElementById('cashResetBtn');
if (cashResetBtn) {
    cashResetBtn.addEventListener('click', () => {
        cashInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        calculateTotalCash(); // 값 지운 후 0원으로 재계산
    });
}

// --- 마감잔액 자동 계산 로직 ---
function calculateEndAmount() {
    const start = parseInt(String(document.getElementById('startAmount').value).replace(/,/g, '')) || 0;
    const inAmt = parseInt(String(document.getElementById('inAmount').value).replace(/,/g, '')) || 0;
    const outAmt = parseInt(String(document.getElementById('outAmount').value).replace(/,/g, '')) || 0;
    
    const endAmt = start + inAmt - outAmt;
    
    const endAmountInput = document.getElementById('endAmount');
    if (endAmountInput) endAmountInput.value = endAmt.toLocaleString();

    calculateDiffAmount(); // 마감잔액이 바뀔 때 차액 재계산
}

// --- 시제 정산 폼 금액 콤마 자동 생성 ---
const amountInputs = ['startAmount', 'inAmount', 'outAmount'];
amountInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', (e) => {
            e.target.value = formatNumberWithComma(e.target.value);
            if (['startAmount', 'inAmount', 'outAmount'].includes(id)) {
                calculateEndAmount();
            }
        });
    }
});

// --- 시제 정산 파이어베이스 저장 로직 ---
async function saveCashDataToDB() {
    if (!savedBranchName) return;

    const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const getNum = (id) => parseInt(String(document.getElementById(id).value).replace(/,/g, '')) || 0;

    const cashData = {
        startAmount: getNum('startAmount'),
        inAmount: getNum('inAmount'),
        outAmount: getNum('outAmount'),
        actualAmount: getNum('actualAmount'),
        bankDepositor: document.getElementById('bankDepositor').value.trim(),
        memo: document.getElementById('cashMemo').value.trim()
    };

    try {
        const branchRef = doc(db, "branches", savedBranchName);
        await setDoc(branchRef, {
            cashSettlement: {
                [todayStr]: cashData
            }
        }, { merge: true });
        alert(`[${cashCurrentDate.innerText}]\n시제 정산 데이터가 성공적으로 저장되었습니다!`);
    } catch(e) {
        console.error("시제 정산 저장 실패", e);
        alert('저장에 실패했습니다. 관리자에게 문의해주세요.');
    }
}

// --- 저장 버튼 클릭 이벤트 ---
const cashSaveBtn = document.getElementById('cashSaveBtn');
if (cashSaveBtn) {
    cashSaveBtn.addEventListener('click', async () => {
        cashSaveBtn.innerText = '저장 중...';
        cashSaveBtn.disabled = true;
        await saveCashDataToDB();
        cashSaveBtn.innerText = '저장';
        cashSaveBtn.disabled = false;
    });
}

// --- 전날 데이터(실제금액) 불러와서 시작금액에 넣기 ---
async function loadYesterdayData() {
    if (!savedBranchName) return;
    
    const startAmountInput = document.getElementById('startAmount');
    if (!startAmountInput) return;

    // 어제 날짜 구하기
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yYear = yesterday.getFullYear();
    const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yDay = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

    try {
        const branchRef = doc(db, "branches", savedBranchName);
        const branchSnap = await getDoc(branchRef);
        
        if (branchSnap.exists()) {
            const dbData = branchSnap.data();
            // 어제 날짜의 정산 데이터가 있고, 실제금액(actualAmount)이 존재한다면
            if (dbData.cashSettlement && dbData.cashSettlement[yesterdayStr] && dbData.cashSettlement[yesterdayStr].actualAmount !== undefined) {
                startAmountInput.value = formatNumberWithComma(String(dbData.cashSettlement[yesterdayStr].actualAmount));
                calculateEndAmount(); // 값이 들어갔으니 마감잔액 다시 계산
                return; // 성공적으로 불러오면 여기서 함수 종료
            }
        }
        // 데이터가 없는 경우
        startAmountInput.placeholder = "전날데이터 없음";
    } catch(e) {
        console.error("전날 데이터 불러오기 실패", e);
        startAmountInput.placeholder = "전날데이터 없음";
    }
}
loadYesterdayData(); // 화면 진입 시 즉시 실행

// 시제(가게현금) 정산 관련 로직을 관리하는 파일입니다.
console.log("시제 정산 화면 로드됨");