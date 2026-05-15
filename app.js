import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { generateSummaryMessage } from "./messageFormatter.js";
import { initWeather } from "./weatherManager.js";

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
const menuItems = document.querySelectorAll('.menu-item');
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

// 고기 누적 계산을 위한 전역 변수
let currentMonthMeatTotal = 0;
let meatUsageData = {};

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
        loginBranchNameInput.value = '';
        loginBranchNameInput.focus();
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

        let lat = null;
        let lon = null;

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
            
            // 파이어베이스에 저장된 좌표가 있으면 가져오기
            if (dbData.lat) lat = dbData.lat;
            if (dbData.lon) lon = dbData.lon;

            // --- 고기 사용량 누적 계산 (이번 달) ---
            const currentYYYYMM = `${year}-${String(month).padStart(2, '0')}`;
            const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            meatUsageData = dbData.meatUsage || {};
            
            let pastDaysTotal = 0;
            let hasOldData = false;
            
            for (const [dateKey, amount] of Object.entries(meatUsageData)) {
                if (dateKey.startsWith(currentYYYYMM)) {
                    if (dateKey !== todayStr) {
                        pastDaysTotal += amount;
                    }
                } else {
                    // 이번 달이 아닌 이전 달 데이터는 삭제하도록 설정
                    meatUsageData[dateKey] = deleteField();
                    hasOldData = true;
                }
            }
            
            if (hasOldData) {
                // 파이어베이스에서 이전 달 데이터 즉시 완전 삭제
                await setDoc(branchRef, { meatUsage: meatUsageData }, { merge: true });
                // 로컬 변수에서도 찌꺼기 삭제
                for (const dateKey in meatUsageData) {
                    if (!dateKey.startsWith(currentYYYYMM)) delete meatUsageData[dateKey];
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
        } else {
            alert('등록되지 않은 지점입니다. 관리자에게 문의해주세요.');
            loginBranchNameInput.value = '';
            loginBranchNameInput.focus();
            loginPinInput.value = '';
            pinDots.forEach(dot => dot.classList.remove('filled'));
            return;
        }

        // 로그인 성공: 지점명 저장 및 화면 전환
        localStorage.setItem('savedBranchName', branchName);
        branchNameInput.innerText = branchName+'점'; // 메인 화면 지점명에 텍스트로 표시
        
        // 지점 좌표로 날씨 초기화
        initWeather(weatherInfoElement, lat, lon);

        loginScreen.style.display = 'none';
        mainScreen.style.display = 'block';
        footerNav.style.display = 'block';
    } catch (error) {
        console.error("Firebase 에러:", error);
        alert('데이터베이스 통신 중 오류가 발생했습니다.');
    }
});

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
    await saveMeatDataToDB(); // 공유하기 전 고기사용량 DB 업데이트
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

// 하단 푸터 메뉴 클릭 이벤트 (개발 중 알림)
menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault(); // '#' 링크 클릭 시 페이지 상단으로 튕기는 현상 방지
        if (!item.classList.contains('active')) {
            alert('개발중입니다.');
        }
    });
});