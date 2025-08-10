self.addEventListener("install", () => {
    console.log("Service Worker Installed ✅");
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow("/") // يفتح الصفحة الرئيسية عند الضغط على الإشعار
    );
});
