import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 파이어베이스 설정 (기존과 동일)
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

const runMacroBtn = document.getElementById('runMacroBtn');

// 데이터를 넣을 지점명 리스트 (원하는 지점명을 입력하세요)
const targetBranches = ["test"]; 

// 넣으실 시제 정산 데이터와 날짜
const targetDate = "2026-05-15";
const cashDataToInsert = {
    actualAmount: 3000000, // 실제금액
    bankDepositor: "관순순", // 입금자명
    inAmount: 200000, // 들어온금액
    memo: "토란 고사리", // 비고
    outAmount: 800000, // 나간금액
    startAmount: 2000000 // 시작금액
};

runMacroBtn.addEventListener('click', async () => {
    runMacroBtn.innerText = "데이터 입력 중...";
    runMacroBtn.disabled = true;

    try {
        for (const branchName of targetBranches) {
            const branchRef = doc(db, "branches", branchName);
            await setDoc(branchRef, { cashSettlement: { [targetDate]: cashDataToInsert } }, { merge: true });
            console.log(`${branchName} 지점 [${targetDate}] 시제 정산 데이터 입력 완료!`);
        }
        alert(`성공! 총 ${targetBranches.length}개 지점에 시제 정산 데이터가 추가/수정되었습니다.`);
    } catch (error) {
        console.error("에러 발생:", error);
        alert("데이터 입력 중 에러가 발생했습니다. 콘솔을 확인하세요.");
    }
    
    runMacroBtn.innerText = "매크로 실행하기";
    runMacroBtn.disabled = false;
});