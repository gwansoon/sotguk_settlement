import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 이미 로그인 도장이 있다면 메인(일일정산) 화면으로 즉시 이동
if (localStorage.getItem('savedBranchName') && sessionStorage.getItem('isLoggedIn') === 'true') {
    window.location.replace('../index.html');
}

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

// 화면이 모두 그려진 후 안전하게 실행되도록 보호
document.addEventListener('DOMContentLoaded', () => {
    const loginBranchNameInput = document.getElementById('loginBranchName');
    const loginPinInput = document.getElementById('loginPin');
    const loginBtn = document.getElementById('loginBtn');
    const pinDots = document.querySelectorAll('#pinDisplay .dot');
    const pinWrapper = document.querySelector('.pin-wrapper');

    const savedBranchName = localStorage.getItem('savedBranchName');
    if (savedBranchName && loginBranchNameInput) {
        loginBranchNameInput.value = savedBranchName;
    }

    // 핀 번호 영역 터치 시 강제로 키보드 띄우기
    if (pinWrapper && loginPinInput) {
        pinWrapper.addEventListener('click', () => {
            loginPinInput.focus();
        });

        // PIN 번호 애니메이션
        loginPinInput.addEventListener('input', (e) => {
            const length = e.target.value.length;
            pinDots.forEach((dot, index) => {
                if (index < length) dot.classList.add('filled');
                else dot.classList.remove('filled');
            });
        });
    }

    // 로그인 버튼 클릭
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const branchName = loginBranchNameInput.value.trim();
            const pin = loginPinInput.value;

            if (!branchName) { alert('지점명을 입력해주세요.'); loginBranchNameInput.focus(); return; }
            if (!pin || pin.length !== 6) { alert('6자리 PIN 번호를 입력해주세요.'); return; }

            try {
                const branchRef = doc(db, "branches", branchName);
                const branchSnap = await getDoc(branchRef);

                if (branchSnap.exists()) {
                    const dbData = branchSnap.data();
                    if (dbData.pin !== pin) {
                        alert('PIN 번호가 올바르지 않습니다.');
                        loginPinInput.value = '';
                        pinDots.forEach(dot => dot.classList.remove('filled'));
                        return;
                    }
                    
                    // 로그인 도장 찍고 메인으로 이동
                    localStorage.setItem('savedBranchName', branchName);
                    sessionStorage.setItem('isLoggedIn', 'true');
                    window.location.replace('../index.html');
                } else {
                    alert('등록되지 않은 지점입니다. 관리자에게 문의해주세요.');
                    loginBranchNameInput.value = '';
                }
            } catch (error) {
                console.error("Firebase 에러:", error);
                alert('데이터베이스 통신 중 오류가 발생했습니다.');
            }
        });
    }
});