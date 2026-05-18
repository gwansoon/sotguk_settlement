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

// 업데이트할 지점 데이터 리스트 (이곳에 지점명과 좌표를 쭉 나열하세요!)
const branchDataList = [
    { name: "도곡", lat: 37.4908, lon: 127.0467, pin: "000000" },
    { name: "경동", lat: 37.5796, lon: 127.0407, pin: "000000" },
    { name: "신봉", lat: 37.323344, lon: 127.07797, pin: "000000" },
    { name: "매탄", lat: 37.2659, lon: 127.0462, pin: "000000" },
    { name: "상현", lat: 37.2973, lon: 127.0696, pin: "000000" },
    { name: "동탄1", lat: 37.2007, lon: 127.0731, pin: "000000" },
    { name: "망포", lat: 37.2660, lon: 127.0568, pin: "000000" },
    { name: "죽전", lat: 37.3245, lon: 127.1073, pin: "000000" },
    { name: "동탄2", lat: 37.199024, lon: 127.113144, pin: "000000" }
    // { name: "지점명", lat: 위도, lon: 경도, pin: "핀번호" },
];

runMacroBtn.addEventListener('click', async () => {
    runMacroBtn.innerText = "업데이트 중...";
    runMacroBtn.disabled = true;

    try {
        // 리스트를 순회하며 추가/수정 (merge: true 옵션 덕분에 문서가 없으면 생성, 있으면 업데이트됩니다)
        for (const branch of branchDataList) {
            const docRef = doc(db, "branches", branch.name);
            await setDoc(docRef, { lat: branch.lat, lon: branch.lon, pin: branch.pin }, { merge: true });
            console.log(`${branch.name} 지점 업데이트 완료!`);
        }

        alert(`성공! 총 ${branchDataList.length}개 지점의 좌표가 추가/업데이트 되었습니다.`);
    } catch (error) {
        console.error("에러 발생:", error);
        alert("업데이트 중 에러가 발생했습니다. 콘솔을 확인하세요.");
    }
    
    runMacroBtn.innerText = "매크로 실행하기";
    runMacroBtn.disabled = false;
});