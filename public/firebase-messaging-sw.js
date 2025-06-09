importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDuq1WXXuaSNu299Fbsf7qxvLqhbwxhBBk",
    authDomain: "lug-canvas-dec11.firebaseapp.com",
    projectId: "lug-canvas-dec11",
    storageBucket: "lug-canvas-dec11.appspot.com",
    messagingSenderId: "266426239949",
    appId: "1:266426239949:web:fd31dc32447df476c69284",
    measurementId: "G-9VXDEB0L50"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();


messaging.onBackgroundMessage((payload) => {
    console.log(
        "[firebase-messaging-sw.js] Received background message ",
        payload
    );
    const notificationTitle = payload.notification.title || 'no title';
    const notificationOptions = {
        body: payload.notification.body || 'no body'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});