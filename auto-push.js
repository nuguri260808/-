const admin = require('firebase-admin');

// Firebase Service Account 키 설정
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com" // ⚠️ 본인의 Realtime Database URL로 변경해 주세요!
});

async function sendScheduledNotifications() {
  const db = admin.database();
  
  // 한국 시간(KST) 기준 날짜 계산
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kstNow = new Date(utc + (9 * 60 * 60 * 1000));

  const todayStr = kstNow.toISOString().split('T')[0];
  
  const tomorrow = new Date(kstNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // DB에서 데이터 읽기
  const [assignmentsSnap, studentsSnap] = await Promise.all([
    db.ref('assignments').once('value'),
    db.ref('students').once('value')
  ]);
  
  const assignments = assignmentsSnap.val() || {};
  const students = studentsSnap.val() || {};

  const dDayAssignments = Object.values(assignments).filter(a => a.dueDate === todayStr);
  const d1Assignments = Object.values(assignments).filter(a => a.dueDate === tomorrowStr);

  async function dispatchPush(itemList, titlePrefix, typeText) {
    for (const item of itemList) {
      for (const student of Object.values(students)) {
        if (!student.fcmToken) continue; // 알림 동의한 학생만 발송

        const isNotice = item.subject === '공지' || item.type === 'notice';
        const isMyClass = item.targetClass === 'all' || item.targetClass === student.classNum;
        const isMySubject = isNotice || (student.subjects && student.subjects.includes(item.subject));

        if (isMyClass && isMySubject) {
          let notiTitle = '';
          let notiBody = '';

          // 공지사항 및 수행평가 알림 문구 구분
          if (isNotice) {
            notiTitle = `📢 [공지] ${item.title}`;
            notiBody = `[${item.title}] 공지를 확인하세요!`;
          } else {
            notiTitle = `${titlePrefix} [${item.subject}] 수행평가 안내`;
            notiBody = `${typeText} 마감인 [${item.title}] 수행평가를 잊지 말고 준비하세요!`;
          }

          try {
            await admin.messaging().send({
              token: student.fcmToken,
              notification: { title: notiTitle, body: notiBody }
            });
          } catch (err) {
            console.error(`발송 실패:`, err.message);
          }
        }
      }
    }
  }

  // 오늘 마감(D-Day) 및 내일 마감(D-1) 발송
  if (dDayAssignments.length > 0) await dispatchPush(dDayAssignments, '🔥 [D-Day]', '오늘');
  if (d1Assignments.length > 0) await dispatchPush(d1Assignments, '🚨 [D-1]', '내일');
}

sendScheduledNotifications()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });