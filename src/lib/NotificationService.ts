import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from './firebase';

export interface WebNotification {
  id?: string;
  title: string;
  body: string;
  category: 'pengumuman' | 'agenda' | 'kas' | 'system';
  createdAt?: any;
  senderName: string;
  linkUrl?: string;
}

const sessionStartTime = new Date();

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Browser tidak mendukung notifikasi.');
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  console.log('Notification permission status:', permission);
  return permission;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

// Push a notification to Firestore collection to multicast to all PWA devices
export const sendMulticastNotification = async (
  title: string,
  body: string,
  category: 'pengumuman' | 'agenda' | 'kas' | 'system',
  senderName: string,
  linkUrl?: string
) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      title,
      body,
      category,
      senderName,
      linkUrl: linkUrl || '/home',
      createdAt: serverTimestamp()
    });
    console.log('Multicast notification stored successfully in Firestore');
  } catch (error) {
    console.error('Error storing multicast notification in Firestore:', error);
  }
};

// Check if Service Worker is active and show standard native PWA push notification
export const triggerLocalSystemNotification = (title: string, body: string, linkUrl?: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // Set the launcher logo as absolute icon
  const iconUrl = 'https://res.cloudinary.com/dew39kqhy/image/upload/v1778155257/BackgroundEraser_20260507_190027268_bc5p07.png';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: iconUrl,
        badge: iconUrl,
        tag: 'vektorion-notif-' + Date.now(),
        vibrate: [100, 50, 100],
        data: { url: linkUrl || '/home' }
      } as any);
    }).catch(err => {

      // Fallback if Service Worker is not fully ready
      try {
        new Notification(title, { body, icon: iconUrl });
      } catch (e) {
        console.error('Notification constructor failed:', e);
      }
    });
  } else {
    // Standard Desktop fallback
    try {
      new Notification(title, { body, icon: iconUrl });
    } catch (e) {
      console.error('Notification fallback constructor failed:', e);
    }
  }
};

// Update the PWA Badge count on device launcher
export const updatePWABadge = (count: number) => {
  if ('setAppBadge' in navigator) {
    if (count > 0) {
      (navigator as any).setAppBadge(count).catch((err: any) => console.warn('Gagal setAppBadge:', err));
    } else {
      (navigator as any).clearAppBadge().catch((err: any) => console.warn('Gagal clearAppBadge:', err));
    }
  }
};

// Clear PWA Badge count on device launcher
export const clearPWABadge = () => {
  localStorage.setItem('vektorion_unread_count', '0');
  if ('clearAppBadge' in navigator) {
    (navigator as any).clearAppBadge().catch((err: any) => console.warn('Gagal clearAppBadge:', err));
  }
};

// Start listening to the Firestore 'notifications' collection in real-time
// Emits only notifications created after the user opened the page
export const listenToRealTimeNotifications = (
  onNewNotification: (notif: WebNotification) => void
) => {
  // We query notifications ordered by createdAt desc, and filter them locally to ignore historical ones
  const q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(5)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        const id = change.doc.id;
        
        // Convert firestore timestamp or fallback to current date
        const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
        
        // Only trigger for notifications created after session startup (with 5-second buffer for clock skew)
        if (createdAt.getTime() > (sessionStartTime.getTime() - 5000)) {
          const item: WebNotification = {
            id,
            title: data.title,
            body: data.body,
            category: data.category,
            createdAt,
            senderName: data.senderName,
            linkUrl: data.linkUrl
          };

          // Increment local storage count & set device badge
          const currentCount = parseInt(localStorage.getItem('vektorion_unread_count') || '0', 10);
          const newCount = currentCount + 1;
          localStorage.setItem('vektorion_unread_count', newCount.toString());
          updatePWABadge(newCount);

          onNewNotification(item);
        }
      }
    });
  }, (error) => {
    if (error.code === 'permission-denied') {
      console.warn(
        'Vektorion PWA Notification: Akses baca koleksi "notifications" ditolak. ' +
        'Silakan deploy file firestore.rules terbaru ke Firebase Console Anda agar fitur real-time push notification bekerja sepenuhnya.'
      );
    } else {
      console.error('Error listening to notifications from Firestore:', error);
    }
  });
};
