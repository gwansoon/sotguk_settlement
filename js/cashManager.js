import { renderFooter } from "./footer.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

let todayDate = new Date();
let year = todayDate.getFullYear();
let month = todayDate.getMonth() + 1;
let day = todayDate.getDate();
let week = ['일', '월', '화', '수', '목', '금', '토'][todayDate.getDay()];

function updateDateDisplay() {
    if (cashCurrentDate) {
        cashCurrentDate.innerText = `${year}년 ${month}월 ${day}일 (${week})`;
        
        // 실제 오늘 날짜와 비교하여 스타일 변경
        const realToday = new Date();
        if (year === realToday.getFullYear() && month === realToday.getMonth() + 1 && day === realToday.getDate()) {
            cashCurrentDate.classList.add('is-today');
        } else {
            cashCurrentDate.classList.remove('is-today');
        }
    }
}
updateDateDisplay();

const cashDatePicker = document.getElementById('cashDatePicker');
if (cashDatePicker) {
    cashDatePicker.value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // PC 브라우저 등에서 투명 인풋 클릭 시 달력이 안 뜨는 현상 방지
    cashDatePicker.addEventListener('click', function() {
        try {
            if (typeof this.showPicker === 'function') {
                this.showPicker();
            }
        } catch (error) {}
    });

    cashDatePicker.addEventListener('change', (e) => {
        if (!e.target.value) return;
        todayDate = new Date(e.target.value);
        year = todayDate.getFullYear();
        month = todayDate.getMonth() + 1;
        day = todayDate.getDate();
        week = ['일', '월', '화', '수', '목', '금', '토'][todayDate.getDay()];
        updateDateDisplay();
        loadCashDataForDate(); // 날짜가 바뀌었으므로 선택한 날짜의 데이터를 다시 불러옴
    });
}

// --- 날짜 좌우 화살표 버튼 이벤트 ---
const prevDayBtn = document.getElementById('prevDayBtn');
const nextDayBtn = document.getElementById('nextDayBtn');

function changeDateByOffset(offset) {
    todayDate.setDate(todayDate.getDate() + offset); // 날짜 계산 (월이 넘어가도 JS가 자동 처리)
    year = todayDate.getFullYear();
    month = todayDate.getMonth() + 1;
    day = todayDate.getDate();
    week = ['일', '월', '화', '수', '목', '금', '토'][todayDate.getDay()];
    
    updateDateDisplay();
    if (cashDatePicker) {
        cashDatePicker.value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    loadCashDataForDate(); // 날짜가 바뀌었으므로 데이터 다시 불러오기
}

if (prevDayBtn) prevDayBtn.addEventListener('click', () => changeDateByOffset(-1));
if (nextDayBtn) nextDayBtn.addEventListener('click', () => changeDateByOffset(1));

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
    const withdrawalAmt = parseInt(String(document.getElementById('cashWithdrawal').value).replace(/,/g, '')) || 0;
    
    const endAmt = start + inAmt - outAmt - withdrawalAmt;
    
    const endAmountInput = document.getElementById('endAmount');
    if (endAmountInput) endAmountInput.value = endAmt.toLocaleString();

    calculateDiffAmount(); // 마감잔액이 바뀔 때 차액 재계산
}

// --- 시제 정산 폼 금액 콤마 자동 생성 ---
const amountInputs = ['startAmount', 'inAmount', 'outAmount', 'cashWithdrawal'];
amountInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', (e) => {
            e.target.value = formatNumberWithComma(e.target.value);
            if (['startAmount', 'inAmount', 'outAmount', 'cashWithdrawal'].includes(id)) {
                calculateEndAmount();
            }
        });
    }
});

// --- 시제 정산 파이어베이스 저장 로직 ---
async function saveCashDataToDB(showAlert = true) {
    if (!savedBranchName) return;

    const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const getNum = (id) => parseInt(String(document.getElementById(id).value).replace(/,/g, '')) || 0;

    const cashData = {
        startAmount: getNum('startAmount'),
        inAmount: getNum('inAmount'),
        outAmount: getNum('outAmount'),
        cashWithdrawal: getNum('cashWithdrawal'),
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
        if (showAlert) alert(`[${cashCurrentDate.innerText}]\n시제 정산 데이터가 성공적으로 저장되었습니다!`);
    } catch(e) {
        console.error("시제 정산 저장 실패", e);
        if (showAlert) alert('저장에 실패했습니다. 관리자에게 문의해주세요.');
    }
}

// --- 저장 버튼 클릭 이벤트 ---
const cashSaveBtn = document.getElementById('cashSaveBtn');
if (cashSaveBtn) {
    cashSaveBtn.addEventListener('click', async () => {
        cashSaveBtn.innerText = '저장 중...';
        cashSaveBtn.disabled = true;
        await saveCashDataToDB(true); // 저장 버튼을 누를 때만 알림창 띄우기
        cashSaveBtn.innerText = '저장';
        cashSaveBtn.disabled = false;
    });
}

// --- 한 달 전체보기 (미리보기) 이벤트 ---
const cashPreviewBtn = document.getElementById('cashPreviewBtn');
const cashPreviewArea = document.getElementById('cashPreviewArea');
const closeCashPreviewBtn = document.getElementById('closeCashPreviewBtn');
const cashPreviewTableContainer = document.getElementById('cashPreviewTableContainer');

if (cashPreviewBtn) {
    cashPreviewBtn.addEventListener('click', async () => {
        if (!savedBranchName) return;

        cashPreviewBtn.innerText = '데이터 불러오는 중...';
        cashPreviewBtn.disabled = true;

        // 미리보기 전 현재 작성 중인 데이터 조용히 저장
        await saveCashDataToDB(false);

        try {
            const branchRef = doc(db, "branches", savedBranchName);
            const branchSnap = await getDoc(branchRef);

            if (branchSnap.exists()) {
                const dbData = branchSnap.data();
                const cashSettlements = dbData.cashSettlement || {};
                
                // 현재 화면에 선택된 '년-월' (예: 2023-10)으로 시작하는 데이터만 필터링
                const currentMonthPrefix = `${year}-${String(month).padStart(2, '0')}`;
                const sortedDates = Object.keys(cashSettlements).filter(date => date.startsWith(currentMonthPrefix)).sort();

                if (sortedDates.length === 0) {
                    alert(`${month}월에 저장된 시제 정산 데이터가 없습니다.`);
                    cashPreviewBtn.innerText = '📊 한 달 전체보기';
                    cashPreviewBtn.disabled = false;
                    return;
                }

                // HTML 표 만들기
                let tableHtml = '<table class="preview-table"><thead><tr>';
                const headers = ['날짜', '시작금액', '들어온금액', '재료구매', '현금출금', '출금자명', '마감잔액', '실제금액', '차액(과부족)', '비고'];
                headers.forEach(header => tableHtml += `<th>${header}</th>`);
                tableHtml += '</tr></thead><tbody>';

                sortedDates.forEach(date => {
                    const data = cashSettlements[date];
                    const start = data.startAmount || 0;
                    const inAmt = data.inAmount || 0;
                    const outAmt = data.outAmount || 0;
                    const withdrawalAmt = data.cashWithdrawal || 0;
                    const actual = data.actualAmount || 0;
                    const endAmt = start + inAmt - outAmt - withdrawalAmt;
                    const diff = actual - endAmt;
                    
                    const rowData = [
                        date, start.toLocaleString(), inAmt.toLocaleString(), outAmt.toLocaleString(),
                        withdrawalAmt.toLocaleString(), data.bankDepositor || '', endAmt.toLocaleString(), actual.toLocaleString(),
                        diff.toLocaleString(), data.memo || ''
                    ];

                    tableHtml += '<tr>';
                    rowData.forEach(cellVal => {
                        tableHtml += `<td>${cellVal}</td>`;
                    });
                    tableHtml += '</tr>';
                });
                tableHtml += '</tbody></table>';

                // 화면에 표 띄우기
                cashPreviewTableContainer.innerHTML = tableHtml;
                cashPreviewArea.style.display = 'block';
                
                // 모바일에서 스크롤 살짝 아래로 내려서 표 보여주기
                cashPreviewArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } catch (error) {
            console.error("데이터 불러오기 에러:", error);
            alert('데이터 불러오기 중 오류가 발생했습니다.');
        }

        cashPreviewBtn.innerText = '📊 한 달 전체보기';
        cashPreviewBtn.disabled = false;
    });
}

// 미리보기 창 닫기
if (closeCashPreviewBtn) {
    closeCashPreviewBtn.addEventListener('click', () => {
        cashPreviewArea.style.display = 'none';
    });
}

// --- 한 달 전체 공유하기 이벤트 ---
const cashShareAllBtn = document.getElementById('cashShareAllBtn');
if (cashShareAllBtn) {
    cashShareAllBtn.addEventListener('click', async () => {
        if (!savedBranchName) return;

        cashShareAllBtn.innerText = '파일 생성 중...';
        cashShareAllBtn.disabled = true;

        // 공유 전 현재 작성 중인 데이터 조용히 저장
        await saveCashDataToDB(false);

        try {
            const branchRef = doc(db, "branches", savedBranchName);
            const branchSnap = await getDoc(branchRef);

            if (!branchSnap.exists()) {
                alert('저장된 지점 데이터가 없습니다.');
                return;
            }

            const dbData = branchSnap.data();
            const cashSettlements = dbData.cashSettlement || {};
            
            const currentMonthPrefix = `${year}-${String(month).padStart(2, '0')}`;
            const sortedDates = Object.keys(cashSettlements).filter(date => date.startsWith(currentMonthPrefix)).sort();

            if (sortedDates.length === 0) {
                alert(`${month}월에 저장된 시제 정산 데이터가 없습니다.`);
                return;
            }

            // 엑셀 데이터 조립
            const excelData = sortedDates.map(date => {
                const data = cashSettlements[date];
                const start = data.startAmount || 0;
                const inAmt = data.inAmount || 0;
                const outAmt = data.outAmount || 0;
                const withdrawalAmt = data.cashWithdrawal || 0;
                const actual = data.actualAmount || 0;
                const endAmt = start + inAmt - outAmt - withdrawalAmt;
                const diff = actual - endAmt;
                return { '날짜': date, '시작금액': start, '들어온금액': inAmt, '재료구매': outAmt, '현금출금': withdrawalAmt, '출금자명': data.bankDepositor || '', '마감잔액': endAmt, '실제금액': actual, '차액(과부족)': diff, '비고': data.memo || '' };
            });

            // 엑셀 파일 생성
            const ws = XLSX.utils.json_to_sheet(excelData);

            // 헤더 배경색 및 숫자 콤마 스타일 적용
            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let C = range.s.c; C <= range.e.c; ++C) {
                // 1. 첫 번째 행 (헤더) 디자인 적용
                const headerCell = XLSX.utils.encode_cell({ c: C, r: 0 });
                if (ws[headerCell]) {
                    ws[headerCell].s = {
                        fill: { fgColor: { rgb: "FEE500" } }, // 산뜻한 카카오톡 노란색 계열 배경
                        font: { bold: true, color: { rgb: "333333" } },
                        alignment: { horizontal: "center", vertical: "center" }
                    };
                }

                // 2. 데이터 행 숫자 포맷(콤마) 적용
                for (let R = 1; R <= range.e.r; ++R) {
                    const dataCell = XLSX.utils.encode_cell({ c: C, r: R });
                    if (ws[dataCell] && typeof ws[dataCell].v === 'number') {
                        ws[dataCell].z = '#,##0'; // 3자리마다 콤마
                    }
                }
            }

            ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 40 }];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, `${month}월 시제정산`);
            const fileName = `솥국_${savedBranchName}점_${year}년${month}월_시제정산.xlsx`;

            // 공유 및 다운로드 시도
            if (navigator.share && navigator.canShare) {
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const file = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                if (navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({ files: [file], title: `${month}월 시제 정산` });
                    } catch (e) { 
                        console.log('공유 취소 또는 차단됨:', e); 
                        // 애플 보안 차단 시 즉시 다운로드로 우회 (Fallback)
                        XLSX.writeFile(wb, fileName);
                        alert('애플 보안 정책으로 다이렉트 공유가 차단되어 파일로 다운로드했습니다.\n카카오톡 대화방에서 [+]버튼을 눌러 [파일 전송]으로 직접 공유해 주세요!');
                    }
                } else {
                    XLSX.writeFile(wb, fileName);
                    alert('엑셀 파일이 기기에 다운로드되었습니다.\n카카오톡 대화방에서 [파일 전송]으로 직접 공유해 주세요!');
                }
            } else {
                XLSX.writeFile(wb, fileName);
                // alert('엑셀 파일이 다운로드되었습니다.');
            }

        } catch (error) {
            console.error("데이터 불러오기 에러:", error);
            alert('데이터 불러오기 중 오류가 발생했습니다.');
        } finally {
            cashShareAllBtn.innerText = '💬 한 달 전체 공유하기';
            cashShareAllBtn.disabled = false;
        }
    });
}

// --- 선택한 날짜의 데이터(또는 전날 실제금액) 불러오기 ---
async function loadCashDataForDate() {
    if (!savedBranchName) return;
    
    const startAmountInput = document.getElementById('startAmount');
    const inAmountInput = document.getElementById('inAmount');
    const outAmountInput = document.getElementById('outAmount');
    const cashWithdrawalInput = document.getElementById('cashWithdrawal');
    const actualAmountInput = document.getElementById('actualAmount');
    const bankDepositorInput = document.getElementById('bankDepositor');
    const cashMemoInput = document.getElementById('cashMemo');
    
    if (!startAmountInput) return;

    // 선택한 날짜와 어제 날짜 문자열 구하기
    const selectedDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const yesterday = new Date(year, month - 1, day);
    yesterday.setDate(yesterday.getDate() - 1);
    const yYear = yesterday.getFullYear();
    const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yDay = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

    // 폼 초기화 (다른 날짜를 불러올 때 이전 입력값 싹 지우기)
    startAmountInput.value = '';
    inAmountInput.value = '';
    outAmountInput.value = '';
    cashWithdrawalInput.value = '';
    actualAmountInput.value = '';
    bankDepositorInput.value = '';
    cashMemoInput.value = '';
    startAmountInput.placeholder = "금액 (원)";

    try {
        const branchRef = doc(db, "branches", savedBranchName);
        const branchSnap = await getDoc(branchRef);
        
        if (branchSnap.exists()) {
            const dbData = branchSnap.data();
            const cashSettlements = dbData.cashSettlement || {};
            
            // --- 정확히 최근 3개월 치만 남기고 싹 다 삭제하는 로직 ---
            let hasOldCashData = false;
            
            // [버그 수정] 달력을 넘기더라도 무조건 '진짜 오늘 날짜' 기준으로만 판단하도록 고정
            const realNow = new Date();
            const rYear = realNow.getFullYear();
            const rMonth = realNow.getMonth() + 1;

            const validMonths = [
                `${rYear}-${String(rMonth).padStart(2, '0')}`,
                `${new Date(rYear, rMonth - 2, 1).getFullYear()}-${String(new Date(rYear, rMonth - 2, 1).getMonth() + 1).padStart(2, '0')}`,
                `${new Date(rYear, rMonth - 3, 1).getFullYear()}-${String(new Date(rYear, rMonth - 3, 1).getMonth() + 1).padStart(2, '0')}`
            ];

            for (const dateKey of Object.keys(cashSettlements)) {
                const dateYYYYMM = dateKey.substring(0, 7);
                if (!validMonths.includes(dateYYYYMM)) {
                    cashSettlements[dateKey] = deleteField();
                    hasOldCashData = true;
                }
            }

            if (hasOldCashData) {
                await setDoc(branchRef, { cashSettlement: cashSettlements }, { merge: true });
                for (const dateKey in cashSettlements) {
                    const dateYYYYMM = dateKey.substring(0, 7);
                    if (!validMonths.includes(dateYYYYMM)) delete cashSettlements[dateKey];
                }
            }

            // 1. 선택한 날짜에 저장된 데이터가 있으면 폼에 전부 채우기
            if (cashSettlements[selectedDateStr]) {
                const data = cashSettlements[selectedDateStr];
                if (data.startAmount) startAmountInput.value = formatNumberWithComma(String(data.startAmount));
                if (data.inAmount) inAmountInput.value = formatNumberWithComma(String(data.inAmount));
                if (data.outAmount) outAmountInput.value = formatNumberWithComma(String(data.outAmount));
                if (data.cashWithdrawal) cashWithdrawalInput.value = formatNumberWithComma(String(data.cashWithdrawal));
                if (data.actualAmount) actualAmountInput.value = formatNumberWithComma(String(data.actualAmount));
                if (data.bankDepositor) bankDepositorInput.value = data.bankDepositor;
                if (data.memo) cashMemoInput.value = data.memo;
            } 
            // 2. 데이터가 없다면, '어제' 날짜의 실제금액만 시작금액에 넣어주기
            else if (cashSettlements[yesterdayStr] && cashSettlements[yesterdayStr].actualAmount !== undefined) {
                startAmountInput.value = formatNumberWithComma(String(cashSettlements[yesterdayStr].actualAmount));
            } else {
                startAmountInput.placeholder = "전날데이터 없음";
            }
        }
        
        calculateEndAmount(); // 값 채운 후 마감잔액 및 차액 다시 계산
    } catch(e) {
        console.error("전날 데이터 불러오기 실패", e);
        startAmountInput.placeholder = "전날데이터 없음";
    }
}
loadCashDataForDate(); // 화면 진입 시 즉시 실행

// 시제(가게현금) 정산 관련 로직을 관리하는 파일입니다.
console.log("시제 정산 화면 로드됨");

// 로그아웃 기능
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            sessionStorage.removeItem('isLoggedIn');
            window.location.replace('login.html');
        }
    });
}