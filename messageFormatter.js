export function generateSummaryMessage(data) {
    const {
        branchName, dateText,
        weather,
        traffic,
        hallC, hallA,
        deliveryC, deliveryA,
        unclassifiedC, unclassifiedA,
        totalA,
        couponC,
        meat,
        meatTotal,
        memo,
        prep,
        inventory
    } = data;

    let message = `솥국 일일 정산 [${branchName}]\n` +
        `[${dateText}]\n` +
        `${weather} | 유동인구 [${traffic}]\n\n` +
        `---------------------------------\n`;

    message += `✔️ 재고 관리\n`;
    if (inventory && inventory.length > 0) {
        inventory.forEach(inv => {
            message += `   • ${inv.name} : ${inv.details}\n`;
        });
    } else {
        message += `   • 완판입니다!!! 🎉\n`;
    }
    message += `---------------------------------\n`;

    if (prep && prep.length > 0) {
        message += `✔️ 오늘 준비량\n`;
        prep.forEach(p => {
            message += `   • ${p.name} : ${p.total}\n`;
        });
        message += `---------------------------------\n`;
    }

    message += `✔️ 매출 정산\n` +
        `   • 홀(포장) : ${hallC}건 / ${hallA}원\n` +
        `   • 배달 : ${deliveryC}건 / ${deliveryA}원\n` +
        `   • 미분류 : ${unclassifiedC}건 / ${unclassifiedA}원\n` +
        `   총 매출액 : ${totalA}\n` +
        `---------------------------------\n` +
        `✔️ 쿠폰사용 : ${couponC}개\n` +
        `---------------------------------\n`;

    if (parseFloat(meat) > 0 || parseFloat(meatTotal) > 0) {
        message += `✔️ 고기사용량 : 오늘 ${meat}kg | 누적 ${meatTotal}\n` +
            `---------------------------------\n`;
    }

    if (memo) {
        message += `✔️ 특이사항(전달사항)\n${memo}\n---------------------------------\n`;
    } else {
        message += `✔️ 특이사항(전달사항) 없습니다.\n---------------------------------\n`;
    }

    message += '오늘 하루도 다들 수고 많으셨습니다!!!';
    
    return message;
}