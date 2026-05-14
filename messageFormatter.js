export function generateSummaryMessage(data) {
    const {
        branchName, dateText,
        hallC, hallA,
        deliveryC, deliveryA,
        unclassifiedC, unclassifiedA,
        totalA,
        couponC,
        memo
    } = data;

    let message = '솥국 일일 정산\n' +
        `[${branchName} 지점 - ${dateText}]\n\n` +
        `---------------------------------\n` +
        `✔️ 매출 정산\n` +
        `   • 홀(포장) : ${hallC}건 / ${hallA}원\n` +
        `   • 배달 : ${deliveryC}건 / ${deliveryA}원\n` +
        `   • 미분류 : ${unclassifiedC}건 / ${unclassifiedA}원\n` +
        `   총 매출액 : ${totalA}\n` +
        `---------------------------------\n` +
        `✔️ 쿠폰사용 : ${couponC}개\n` +
        `---------------------------------\n`;

    if (memo) {
        message += `✔️ 특이사항(전달사항)\n${memo}\n---------------------------------\n`;
    }

    message += '\n오늘 하루도 다들 수고 많으셨습니다!!!';
    
    return message;
}