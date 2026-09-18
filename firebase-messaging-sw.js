importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// 본인의 Firebase 프로젝트 설정 값으로 변경해 주세요
    const firebaseConfig = {
      apiKey: "AIzaSyBNSF0jYs3TeiwgPKCWZ0irFfPtWD8fScs",
      authDomain: "class209.firebaseapp.com",
      databaseURL: "https://class209-default-rtdb.firebaseio.com",
      projectId: "class209",
      storageBucket: "class209.firebasestorage.app",
      messagingSenderId: "584432141678",
      appId: "1:584432141678:web:bda51797fc8da12df4ed7f",
      measurementId: "G-TMNCF0TM8T"
    }

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 앱이 백그라운드 상태일 때 푸시 알림 수신
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification.title;
  const options = {
    body: payload.notification.body,
    icon: '/icon.png'
  };
  self.registration.showNotification(title, options);
});