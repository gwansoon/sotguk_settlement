import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { generateSummaryMessage } from "./messageFormatter.js";
import { initWeather } from "./weatherManager.js";
import { renderFooter } from "./footer.js";

const savedBranchName = localStorage.getItem('savedBranchName');

// 하단 푸터 렌더링 (일일 정산 탭 활성화)
renderFooter('navDaily');
document.getElementById('footerNav').style.display = 'block';

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

const branchNameInput = document.getElementById('branchName');
const saveBtn = document.getElementById('saveBtn');
const shareBtn = document.getElementById('shareBtn');
const resultArea = document.getElementById('resultArea');
const summaryText = document.getElementById('summaryText');
const closeResultBtn = document.getElementById('closeResultBtn');
const footerNav = document.getElementById('footerNav');
const currentDateElement = document.getElementById('currentDate');
const weatherInfoElement = document.getElementById('weatherInfo');

const salesHallCount = document.getElementById('salesHallCount');
const salesHallAmount = document.getElementById('salesHallAmount');
const salesDeliveryCount = document.getElementById('salesDeliveryCount');
const salesDeliveryAmount = document.getElementById('salesDeliveryAmount');
const salesUnclassifiedCount = document.getElementById('salesUnclassifiedCount');
const salesUnclassifiedAmount = document.getElementById('salesUnclassifiedAmount');
const salesTotalAmount = document.getElementById('salesTotalAmount');
const couponCount = document.getElementById('couponCount');
const meatUsage = document.getElementById('meatUsage');
const meatCumulative = document.getElementById('meatCumulative');
const memoInput = document.getElementById('memoInput');
const prepContainer = document.getElementById('prepContainer');
const prepResetAllBtn = document.getElementById('prepResetAllBtn');
const inventoryContainer = document.getElementById('inventoryContainer');
const inventoryResetAllBtn = document.getElementById('inventoryResetAllBtn');
const prepToggle = document.getElementById('prepToggle');
const inventoryToggle = document.getElementById('inventoryToggle');
const meatToggle = document.getElementById('meatToggle');
const meatContainer = document.getElementById('meatContainer');
const trafficBtns = document.querySelectorAll('.traffic-btn');
const logoutBtn = document.getElementById('logoutBtn');

// 고기 누적 계산을 위한 전역 변수
let currentMonthMeatTotal = 0;
let meatUsageData = {};

branchNameInput.innerText = savedBranchName + '점'; // 메인 화면 지점명에 텍스트로 표시

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

// 기존코드
const week = ['일', '월', '화', '수', '목', '금', '토'][todayDate.getDay()];

currentDateElement.innerText = `${year}년 ${month}월 ${day}일 (${week})`;

// --- 준비량 정산 데이터 ---
const prepMenus = [
    { id: 'yuk', name: '육개장', type: 'pot', options: [1, 0.5], labels: ['한솥', '반솥'], days: [0,1,2,3,4,5,6], alwaysTop: true },
    { id: 'galbi', name: '갈비탕', type: 'kg', options: [15, 20, 30], labels: ['15', '20', '30'], days: [0,1,2,3,4,5,6], alwaysTop: true },
    { id: 'seonji', name: '선지해장국', type: 'pot', options: [1, 0.5], labels: ['한솥', '반솥'], days: [0, 1, 3, 5], alwaysTop: false }, // 일월수금
    { id: 'sau', name: '사골우거지', type: 'pot', options: [1, 0.5], labels: ['한솥', '반솥'], days: [0, 1, 3, 5], alwaysTop: false }, // 일월수금
    { id: 'galbijjim', name: '갈비찜', type: 'kg', options: [15, 20, 30], labels: ['15', '20', '30'], days: [6], alwaysTop: false }, // 토
    { id: 'bone', name: '뼈해장국', type: 'kg', options: [15, 20], labels: ['15', '20'], days: [2, 4, 6], alwaysTop: false }, // 화목토
    { id: 'gom', name: '곰탕', type: 'pot', options: [1, 0.5], labels: ['한솥', '반솥'], days: [2, 4, 6], alwaysTop: false } // 화목토
];

let prepTotals = {};
prepMenus.forEach(m => prepTotals[m.id] = 0);

function formatPrepTotal(type, val) {
    if (val === 0) return '-';
    if (type === 'kg') return val + 'kg';
    
    // pot (한솥, 반솥)
    const whole = Math.floor(val);
    const half = val % 1 !== 0;
    let text = '';
    const names = ['영', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
    
    if (whole > 0) {
        text += (names[whole] || whole) + '솥';
    }
    if (half) {
        text += (text ? ' 반' : '반솥');
    }
    return text;
}

function renderPrepMenus() {
    if (!prepContainer) return;
    const today = todayDate.getDay(); // 실제 오늘 요일 사용
    
    // 항상 위로 갈 메뉴 최상단, 그 다음 오늘 활성화 여부
    const sortedMenus = [...prepMenus].sort((a, b) => {
        if (a.alwaysTop && !b.alwaysTop) return -1;
        if (!a.alwaysTop && b.alwaysTop) return 1;
        
        const aActive = a.days.includes(today);
        const bActive = b.days.includes(today);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return 0;
    });

    prepContainer.innerHTML = sortedMenus.map(menu => {
        const isActive = menu.days.includes(today);
        const rowClass = isActive ? 'prep-row active' : 'prep-row inactive';
        
        const btnsHtml = menu.options.map((opt, i) => 
            `<button class="add-btn" data-id="${menu.id}" data-val="${opt}">${menu.labels[i]}</button>`
        ).join('');

        return `
            <div class="${rowClass}">
                <div class="prep-label">${menu.name}</div>
                <div class="prep-buttons">
                    ${btnsHtml}
                </div>
                <div class="prep-total" id="prep-total-${menu.id}">${formatPrepTotal(menu.type, prepTotals[menu.id])}</div>
            </div>
        `;
    }).join('');
}
renderPrepMenus(); // 초기 렌더링

// --- 재고 관리 데이터 ---
const inventoryMenus = [
    { id: 'inv_yuk', name: '육개장', types: ['2인', '3인'], days: [0,1,2,3,4,5,6], alwaysTop: true },
    { id: 'inv_galbi', name: '갈비탕', types: ['2인', '3인'], days: [0,1,2,3,4,5,6], alwaysTop: true },
    { id: 'inv_seonji', name: '선지해장국', types: ['2인', '3인'], days: [0, 1, 3, 5], alwaysTop: false },
    { id: 'inv_sau', name: '사골우거지', types: ['2인', '3인'], days: [0, 1, 3, 5], alwaysTop: false },
    { id: 'inv_galbijjim', name: '갈비찜', types: ['수량'], days: [6], alwaysTop: false },
    { id: 'inv_bone', name: '뼈해장국', types: ['2인', '3인'], days: [2, 4, 6], alwaysTop: false },
    { id: 'inv_gom', name: '곰탕', types: ['2인', '3인'], days: [2, 4, 6], alwaysTop: false }
];

function renderInventoryMenus() {
    if (!inventoryContainer) return;
    const today = todayDate.getDay();

    const sortedMenus = [...inventoryMenus].sort((a, b) => {
        if (a.alwaysTop && !b.alwaysTop) return -1;
        if (!a.alwaysTop && b.alwaysTop) return 1;
        
        const aActive = a.days.includes(today);
        const bActive = b.days.includes(today);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return 0;
    });

    inventoryContainer.innerHTML = sortedMenus.map(menu => {
        const isActive = menu.days.includes(today);
        const rowClass = isActive ? 'inventory-row active' : 'inventory-row inactive';
        
        const inputsHtml = menu.types.map((type, i) => `
            <div class="inv-input-group">
                <span>${type}</span>
                <input type="number" id="${menu.id}_${i}" pattern="[0-9]*" inputmode="numeric" placeholder="0">
            </div>
        `).join('');

        return `
            <div class="${rowClass}">
                <div class="inventory-label">${menu.name}</div>
                <div class="inventory-inputs">
                    ${inputsHtml}
                </div>
            </div>
        `;
    }).join('');
}
renderInventoryMenus();

// --- 흑백(비활성) 항목 숨기기 토글 이벤트 ---
if (prepToggle && prepContainer) {
    prepToggle.addEventListener('click', () => {
        prepContainer.classList.toggle('hide-inactive');
        const icon = prepToggle.querySelector('.toggle-icon');
        if (icon) icon.innerText = prepContainer.classList.contains('hide-inactive') ? '∨' : '∧';
    });
}
if (inventoryToggle && inventoryContainer) {
    inventoryToggle.addEventListener('click', () => {
        inventoryContainer.classList.toggle('hide-inactive');
        const icon = inventoryToggle.querySelector('.toggle-icon');
        if (icon) icon.innerText = inventoryContainer.classList.contains('hide-inactive') ? '∨' : '∧';
    });
}
if (meatToggle && meatContainer) {
    meatToggle.addEventListener('click', () => {
        meatContainer.classList.toggle('hide-content');
        const icon = meatToggle.querySelector('.toggle-icon');
        if (icon) icon.innerText = meatContainer.classList.contains('hide-content') ? '∨' : '∧';
    });
}

// --- 유동인구 버튼 클릭 이벤트 ---
let selectedTraffic = '보통'; // 기본값
trafficBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        trafficBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTraffic = btn.dataset.val;
    });
});

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

// --- 초기 데이터 세팅 함수 ---
async function initDashboardData() {
    try {
        const branchRef = doc(db, "branches", savedBranchName);
        const branchSnap = await getDoc(branchRef);

        let lat = null;
        let lon = null;

        if (branchSnap.exists()) {
            const dbData = branchSnap.data();

            // 파이어베이스에 저장된 좌표가 있으면 가져오기
            if (dbData.lat) lat = dbData.lat;
            if (dbData.lon) lon = dbData.lon;

            // --- 고기 사용량 누적 계산 (이번 달) ---
            const currentYYYYMM = `${year}-${String(month).padStart(2, '0')}`;
            const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            meatUsageData = dbData.meatUsage || {};
            
            let pastDaysTotal = 0;
            let hasOldData = false;
            
            // 딱 3개월(이번 달, 1달 전, 2달 전)만 남기기 위한 허용 목록 (진짜 오늘 기준)
            const realNow = new Date();
            const rYear = realNow.getFullYear();
            const rMonth = realNow.getMonth() + 1;

            const validMonths = [
                `${rYear}-${String(rMonth).padStart(2, '0')}`,
                `${new Date(rYear, rMonth - 2, 1).getFullYear()}-${String(new Date(rYear, rMonth - 2, 1).getMonth() + 1).padStart(2, '0')}`,
                `${new Date(rYear, rMonth - 3, 1).getFullYear()}-${String(new Date(rYear, rMonth - 3, 1).getMonth() + 1).padStart(2, '0')}`
            ];

            for (const [dateKey, amount] of Object.entries(meatUsageData)) {
                const dateYYYYMM = dateKey.substring(0, 7);
                if (validMonths.includes(dateYYYYMM)) {
                    if (dateKey.startsWith(currentYYYYMM) && dateKey !== todayStr) {
                        pastDaysTotal += amount;
                    }
                } else {
                    // 허용 목록에 없는 데이터(과거 또는 매크로로 넣은 미래 데이터)는 무조건 삭제
                    meatUsageData[dateKey] = deleteField();
                    hasOldData = true;
                }
            }
            
            if (hasOldData) {
                await setDoc(branchRef, { meatUsage: meatUsageData }, { merge: true });
                for (const dateKey in meatUsageData) {
                    const dateYYYYMM = dateKey.substring(0, 7);
                    if (!validMonths.includes(dateYYYYMM)) delete meatUsageData[dateKey];
                }
            }
            currentMonthMeatTotal = pastDaysTotal;
            
            if (meatUsageData[todayStr]) {
                meatUsage.value = meatUsageData[todayStr];
            } else {
                meatUsage.value = '';
            }
            
            if (meatCumulative) {
                const todayVal = parseFloat(meatUsage.value) || 0;
                const total = currentMonthMeatTotal + todayVal;
                meatCumulative.innerText = `${currentMonthMeatTotal} + ${todayVal} = ${total}kg`;

                // 누적이 1 이상이면 자동으로 펼치기
                if (total >= 1) {
                    meatContainer.classList.remove('hide-content');
                    const icon = meatToggle ? meatToggle.querySelector('.toggle-icon') : null;
                    if (icon) icon.innerText = '∧';
                } else {
                    meatContainer.classList.add('hide-content');
                    const icon = meatToggle ? meatToggle.querySelector('.toggle-icon') : null;
                    if (icon) icon.innerText = '∨';
                }
            }
            
            // 지점 좌표로 날씨 초기화
            initWeather(weatherInfoElement, lat, lon);
        }
    } catch (error) {
        console.error("데이터 초기화 에러:", error);
    }
}
initDashboardData();

// 준비량 버튼 클릭 이벤트 위임
if (prepContainer) {
    prepContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const id = btn.dataset.id;
        if (btn.classList.contains('add-btn')) {
            prepTotals[id] += parseFloat(btn.dataset.val);
        }
        
        document.getElementById(`prep-total-${id}`).innerText = formatPrepTotal(prepMenus.find(m => m.id === id).type, prepTotals[id]);
    });
}

// 준비량 전체 초기화 버튼 이벤트
if (prepResetAllBtn) {
    prepResetAllBtn.addEventListener('click', () => {
        Object.keys(prepTotals).forEach(id => {
            prepTotals[id] = 0; // 데이터 0으로 초기화
            const el = document.getElementById(`prep-total-${id}`);
            if (el) el.innerText = formatPrepTotal(prepMenus.find(m => m.id === id).type, 0); // 화면 값 업데이트
        });
    });
}

// 재고 관리 전체 초기화 버튼 이벤트
if (inventoryResetAllBtn) {
    inventoryResetAllBtn.addEventListener('click', () => {
        const inputs = inventoryContainer.querySelectorAll('input');
        inputs.forEach(input => input.value = '');
    });
}

// --- 고기 사용량 입력 실시간 누적 표시 ---
if (meatUsage) {
    meatUsage.addEventListener('input', () => {
        const todayVal = parseFloat(meatUsage.value) || 0;
        if (meatCumulative) {
            meatCumulative.innerText = `${currentMonthMeatTotal} + ${todayVal} = ${currentMonthMeatTotal + todayVal}kg`;
        }
    });
}

// 파이어베이스에 고기 사용량 안전하게 업데이트하는 함수
async function saveMeatDataToDB() {
    const bName = localStorage.getItem('savedBranchName');
    if(!bName) return;
    
    const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const val = parseFloat(meatUsage.value) || 0;
    
    // 사용량이 0 이하이고, 기존 파이어베이스에도 오늘 기록이 없다면 불필요한 통신(필드 생성) 생략
    if (val <= 0 && !(todayStr in meatUsageData)) {
        return;
    }
    
    if (val > 0) {
        meatUsageData[todayStr] = val;
    } else {
        meatUsageData[todayStr] = deleteField(); // 실수로 적고 지웠을 때 파이어베이스에서도 완전 삭제
    }
    
    try {
        const branchRef = doc(db, "branches", bName);
        await setDoc(branchRef, { meatUsage: meatUsageData }, { merge: true });
        
        if (val <= 0) delete meatUsageData[todayStr]; // 로컬 데이터 찌꺼기 정리
    } catch(e) {
        console.error("고기사용량 저장 실패", e);
    }
}

// 입력된 정산 데이터를 수집하는 함수
function gatherSettlementData() {
    const inventoryData = [];
    inventoryMenus.forEach(menu => {
        menu.types.forEach((type, i) => {
            const val = document.getElementById(`${menu.id}_${i}`).value;
            if (val && parseInt(val) > 0) {
                const itemName = type === '수량' ? menu.name : `${menu.name} ${type}`;
                inventoryData.push({ name: itemName, details: `${val}개` });
            }
        });
    });

    return {
        branchName: branchNameInput.innerText,
        dateText: currentDateElement.innerText,
        weather: weatherInfoElement ? weatherInfoElement.innerText : '',
        traffic: selectedTraffic,
        hallC: salesHallCount.value || '0',
        hallA: salesHallAmount.value || '0',
        deliveryC: salesDeliveryCount.value || '0',
        deliveryA: salesDeliveryAmount.value || '0',
        unclassifiedC: salesUnclassifiedCount.value || '0',
        unclassifiedA: salesUnclassifiedAmount.value || '0',
        totalA: salesTotalAmount.innerText,
        couponC: couponCount.value || '0',
        meat: meatUsage.value || '0',
        meatTotal: `${currentMonthMeatTotal + (parseFloat(meatUsage.value) || 0)}kg`,
        memo: memoInput.value.trim(),
        prep: prepMenus.map(m => ({
            name: m.name,
            total: formatPrepTotal(m.type, prepTotals[m.id])
        })).filter(p => p.total !== '-'), // 기록된 데이터만 요약에 포함
        inventory: inventoryData
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
        // HTTPS가 아닌 환경(와이파이 로컬 테스트 등)에서도 복사가 작동하도록 하는 구형 방식 (Fallback)
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(messageText);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = messageText;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            alert('내역이 복사되었습니다. 카카오톡에 붙여넣기 해주세요!');
        } catch (error) {
            console.error('클립보드 복사 에러:', error);
            alert('이 기기에서는 공유/복사 기능이 차단되어 있습니다.');
        }
    }

    // 공유 창이 뜨는 것과 동시에 백그라운드에서 안전하게 고기사용량 DB 업데이트
    saveMeatDataToDB();
});

// 로그아웃 기능
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            sessionStorage.removeItem('isLoggedIn');
            window.location.replace('html/login.html');
        }
    });
}