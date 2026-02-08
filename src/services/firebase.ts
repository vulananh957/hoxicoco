import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc,
  deleteDoc,
  query, 
  where,
  Timestamp,
  GeoPoint as FirestoreGeoPoint,
  onSnapshot,
  orderBy, arrayUnion, arrayRemove, getDoc
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Toilet, Review } from '../types';
import { MOCK_TOILETS, DEFAULT_ADMIN_EMAILS } from '../constants';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIyIu1I_qdbYPiKHICYonLtI_-H7EQQf8",
  authDomain: "hoxicoco-4926c.firebaseapp.com",
  projectId: "hoxicoco-4926c",
  storageBucket: "hoxicoco-4926c.firebasestorage.app",
  messagingSenderId: "22237520495",
  appId: "1:22237520495:web:e024c2c65161c22ce5e39a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Export Firestore functions for direct use
export { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
// Nếu user có nhiều tài khoản Google, bắt buộc chọn tài khoản
googleProvider.setCustomParameters({
  'prompt': 'select_account'
});

// ==================== AUTHENTICATION ====================

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    return null;
  }
};

export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// ==================== TOILETS ====================

export const fetchToilets = async (_lat: number, _lng: number, _radius: number): Promise<Toilet[]> => {
  try {
    const toiletsRef = collection(db, 'toilets');
    const snapshot = await getDocs(toiletsRef);
    
    // Return empty array if no toilets - don't fallback to mock
    if (snapshot.empty) {
      return [];
    }

    const toilets: Toilet[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      toilets.push({
        id: docSnap.id,
        name: data.name,
        location: {
          lat: data.location.latitude,
          lng: data.location.longitude
        },
        address: data.address,
        type: data.type,
        price_type: data.price_type,
        price_amount: data.price_amount,
        gender: data.gender,
        accessibility: data.accessibility === true, // Explicitly check for true, default to false
        amenities: data.amenities || [],
        status: data.status || 'active',
        clean_score: data.clean_score || 0,
        images: data.images || []
      });
    });

    return toilets;
  } catch (error) {
    console.error("Error fetching toilets:", error);
    // Return empty array on error - don't use mock data
    return [];
  }
};

// Realtime listener for toilets - auto update when data changes
export const subscribeToToilets = (callback: (toilets: Toilet[]) => void): (() => void) => {
  const toiletsRef = collection(db, 'toilets');
  
  const unsubscribe = onSnapshot(toiletsRef, (snapshot) => {
    const toilets: Toilet[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      toilets.push({
        id: docSnap.id,
        name: data.name,
        location: {
          lat: data.location.latitude,
          lng: data.location.longitude
        },
        address: data.address,
        type: data.type,
        price_type: data.price_type,
        price_amount: data.price_amount,
        gender: data.gender,
        accessibility: data.accessibility === true, // Explicitly check for true, default to false
        amenities: data.amenities || [],
        status: data.status || 'active',
        clean_score: data.clean_score || 0,
        images: data.images || []
      });
    });
    callback(toilets);
  }, (error) => {
    console.error("Error in toilets subscription:", error);
    callback([]);
  });

  return unsubscribe;
};

export const addToilet = async (
  toilet: Omit<Toilet, 'id' | 'clean_score' | 'images'>,
  images: File[],
  userId: string,
  userName?: string,
  userEmail?: string
): Promise<string | null> => {
  try {
    // Upload images first
    const imageUrls: string[] = [];
    for (const image of images) {
      const imageRef = ref(storage, `toilets/${Date.now()}_${image.name}`);
      await uploadBytes(imageRef, image);
      const url = await getDownloadURL(imageRef);
      imageUrls.push(url);
    }

    // Add toilet document
    const toiletData = {
      name: toilet.name,
      location: new FirestoreGeoPoint(toilet.location.lat, toilet.location.lng),
      address: toilet.address,
      type: toilet.type,
      price_type: toilet.price_type,
      price_amount: toilet.price_amount || 0,
      gender: toilet.gender,
      accessibility: toilet.accessibility,
      amenities: toilet.amenities,
      status: 'pending' as const, // Mặc định chờ duyệt
      clean_score: 0,
      images: imageUrls,
      created_by: userId,
      created_by_name: userName || 'User',
      created_by_email: userEmail || '',
      created_at: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'toilets'), toiletData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding toilet:", error);
    return null;
  }
};

// ==================== REVIEWS ====================

export const fetchReviews = async (toiletId: string): Promise<Review[]> => {
  try {
    const reviewsRef = collection(db, 'reviews');
    // Note: If using where + orderBy, Firestore needs a composite index
    // For now, we filter and sort in code to avoid index requirement
    const q = query(
      reviewsRef, 
      where('toilet_id', '==', toiletId)
    );
    const snapshot = await getDocs(q);

    const reviews: Review[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      reviews.push({
        id: docSnap.id,
        toilet_id: data.toilet_id,
        user_id: data.user_id,
        user_name: data.user_name,
        rating: data.rating,
        comment: data.comment,
        media: data.media || [],
        timestamp: data.timestamp?.toMillis() || Date.now()
      });
    });

    // Sort by timestamp descending (newest first)
    reviews.sort((a, b) => b.timestamp - a.timestamp);

    return reviews;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
};

// ==================== POSTS / BLOG (backwards-compatible API) ====================

export interface Post {
  id: string;
  title: string;
  content: string;
  image?: string;
  images?: string[]; // Support multiple images
  authorName?: string;
  createdAt: number;
  likesCount?: number;
  commentsCount?: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: number;
}

export const subscribeToPosts = (callback: (posts: Post[]) => void): (() => void) => {
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, orderBy('created_at', 'desc'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items: Post[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      items.push({
        id: docSnap.id,
        title: data.title || data.caption || '',
        content: data.content || data.caption || '',
        image: Array.isArray(data.images) && data.images.length > 0 ? data.images[0] : data.image || '',
        images: data.images || (data.image ? [data.image] : []), // Support both single and multiple images
        authorName: data.authorName || data.created_by || '',
        createdAt: data.created_at ? (data.created_at as Timestamp).toMillis() : Date.now(),
        likesCount: Array.isArray(data.likes) ? data.likes.length : (data.likesCount || 0),
        commentsCount: data.commentsCount || 0
      });
    });
    callback(items);
  }, (err) => {
    console.error('subscribeToPosts error:', err);
    callback([]);
  });

  return unsubscribe;
};

export const addPost = async (
  title: string,
  content: string,
  userId: string,
  authorName: string,
  imageFiles?: File[]
): Promise<string | null> => {
  try {
    console.log('[addPost] Starting with params:', { title, content, userId, authorName, imageCount: imageFiles?.length || 0 });
    
    const imageUrls: string[] = [];
    if (imageFiles && imageFiles.length > 0) {
      try {
        console.log('[addPost] Uploading images:', imageFiles.map(f => f.name));
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const fileRef = ref(storage, `posts/${Date.now()}_${i}_${file.name}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          imageUrls.push(url);
        }
        console.log('[addPost] All images uploaded successfully:', imageUrls);
      } catch (uploadError) {
        console.error('[addPost] Image upload failed:', uploadError);
        throw new Error(`Failed to upload images: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
      }
    }

    const postData: any = {
      title: title.trim(),
      content: content.trim(),
      images: imageUrls,
      image: imageUrls[0] || '', // Keep backward compatibility
      authorName: authorName || userId,
      created_by: userId,
      created_at: Timestamp.now(),
      likes: []
    };

    console.log('[addPost] Creating document with data:', postData);
    const docRef = await addDoc(collection(db, 'posts'), postData);
    console.log('[addPost] Document created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[addPost] Error occurred:', error);
    if (error instanceof Error) {
      console.error('[addPost] Error message:', error.message);
      console.error('[addPost] Error stack:', error.stack);
    }
    return null;
  }
};

export const deletePost = async (postId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'posts', postId));
    return true;
  } catch (error) {
    console.error('deletePost error:', error);
    return false;
  }
};

export const toggleLikePost = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const snap = await getDoc(postRef as any);
    if (!snap.exists()) return false;
    const data = snap.data() as any;
    const likes: string[] = data.likes || [];
    if (likes.includes(userId)) {
      await updateDoc(postRef, { likes: arrayRemove(userId) });
      return false;
    } else {
      await updateDoc(postRef, { likes: arrayUnion(userId) });
      return true;
    }
  } catch (error) {
    console.error('toggleLikePost error:', error);
    return false;
  }
};

// ==================== COMMENTS ====================

export const addComment = async (
  postId: string,
  userId: string,
  userName: string,
  userAvatar: string | null,
  content: string
): Promise<string | null> => {
  try {
    console.log('[addComment] Starting with:', { postId, userId, userName, userAvatar, contentLength: content.length });
    
    const commentData = {
      postId,
      userId,
      userName: userName || 'Anonymous',
      userAvatar: userAvatar || '',
      content: content.trim(),
      createdAt: Timestamp.now()
    };

    console.log('[addComment] Creating comment with data:', commentData);
    const docRef = await addDoc(collection(db, 'comments'), commentData);
    console.log('[addComment] Comment created with ID:', docRef.id);
    
    // Update post's comments count
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const currentCount = postSnap.data().commentsCount || 0;
      await updateDoc(postRef, { commentsCount: currentCount + 1 });
      console.log('[addComment] Updated post comments count:', currentCount + 1);
    }
    
    return docRef.id;
  } catch (error) {
    console.error('[addComment] Error:', error);
    return null;
  }
};

export const subscribeToComments = (postId: string, callback: (comments: Comment[]) => void): (() => void) => {
  const commentsRef = collection(db, 'comments');
  // Temporary: Remove orderBy to avoid index requirement
  const q = query(commentsRef, where('postId', '==', postId));
  
  console.log('[subscribeToComments] Subscribing to comments for postId:', postId);
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    console.log('[subscribeToComments] Snapshot received, size:', snapshot.size);
    const comments: Comment[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      console.log('[subscribeToComments] Comment data:', data);
      comments.push({
        id: docSnap.id,
        postId: data.postId,
        userId: data.userId,
        userName: data.userName,
        userAvatar: data.userAvatar || '',
        content: data.content,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toMillis() : Date.now()
      });
    });
    
    // Sort comments manually by createdAt ascending
    comments.sort((a, b) => a.createdAt - b.createdAt);
    
    console.log('[subscribeToComments] Returning comments:', comments);
    callback(comments);
  }, (error) => {
    console.error('[subscribeToComments] Error:', error);
    callback([]);
  });

  return unsubscribe;
};

export const deleteComment = async (commentId: string, postId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'comments', commentId));
    
    // Update post's comments count
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const currentCount = Math.max(0, (postSnap.data().commentsCount || 1) - 1);
      await updateDoc(postRef, { commentsCount: currentCount });
    }
    
    return true;
  } catch (error) {
    console.error('deleteComment error:', error);
    return false;
  }
};

export const addReview = async (
  toiletId: string,
  userId: string,
  userName: string,
  rating: number,
  comment: string,
  mediaFiles?: File[]
): Promise<boolean> => {
  try {
    // Upload media files if any
    const mediaUrls: string[] = [];
    if (mediaFiles && mediaFiles.length > 0) {
      for (const file of mediaFiles) {
        // Sanitize filename - remove special characters
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}_${sanitizedName}`;
        const fileRef = ref(storage, `reviews/${toiletId}/${fileName}`);
        
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        mediaUrls.push(url);
      }
    }

    await addDoc(collection(db, 'reviews'), {
      toilet_id: toiletId,
      user_id: userId,
      user_name: userName,
      rating,
      comment,
      media: mediaUrls,
      timestamp: Timestamp.now()
    });

    // Update toilet's average clean_score
    await updateToiletScore(toiletId);
    
    return true;
  } catch (error) {
    console.error("Error adding review:", error);
    return false;
  }
};

const updateToiletScore = async (toiletId: string): Promise<void> => {
  try {
    const reviews = await fetchReviews(toiletId);
    if (reviews.length === 0) return;

    const avgScore = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const toiletRef = doc(db, 'toilets', toiletId);
    await updateDoc(toiletRef, { clean_score: avgScore });
  } catch (error) {
    console.error("Error updating toilet score:", error);
  }
};

// ==================== REPORTS ====================

export type ReportType = 'dirty' | 'broken' | 'no_paper' | 'camera' | 'harassment' | 'other';

export interface Report {
  id: string;
  toilet_id: string;
  user_id: string;
  issue_type: ReportType;
  description: string;
  status: 'open' | 'resolved';
  created_at: number;
}

export const addReport = async (
  toiletId: string,
  userId: string,
  userName: string,
  userEmail: string,
  issueType: ReportType,
  description: string
): Promise<boolean> => {
  try {
    await addDoc(collection(db, 'reports'), {
      toilet_id: toiletId,
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      issue_type: issueType,
      description,
      status: 'open',
      created_at: Timestamp.now()
    });

    // Nếu là báo cáo khẩn cấp, cập nhật status toilet thành 'danger'
    if (issueType === 'camera' || issueType === 'harassment') {
      const toiletRef = doc(db, 'toilets', toiletId);
      await updateDoc(toiletRef, { status: 'danger' });
    }

    return true;
  } catch (error) {
    console.error("Error adding report:", error);
    return false;
  }
};

// ==================== SEED DATA (Dev only) ====================

export const seedMockData = async (): Promise<void> => {
  try {
    // Check if data already exists
    const snapshot = await getDocs(collection(db, 'toilets'));
    if (!snapshot.empty) {
      return;
    }

    // Add mock toilets
    for (const toilet of MOCK_TOILETS) {
      await addDoc(collection(db, 'toilets'), {
        name: toilet.name,
        location: new FirestoreGeoPoint(toilet.location.lat, toilet.location.lng),
        address: toilet.address,
        type: toilet.type,
        price_type: toilet.price_type,
        price_amount: toilet.price_amount || 0,
        gender: toilet.gender,
        accessibility: toilet.accessibility,
        amenities: toilet.amenities,
        status: toilet.status,
        clean_score: toilet.clean_score,
        images: toilet.images,
        created_by: 'system',
        created_at: Timestamp.now()
      });
    }
  } catch (error) {
    console.error("Error seeding data:", error);
  }
};

// ==================== ADMIN MANAGEMENT ====================

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  addedBy: string;
  addedAt: number;
}

// Fetch all admins from Firestore
export const fetchAdmins = async (): Promise<AdminUser[]> => {
  try {
    const adminsRef = collection(db, 'admins');
    const snapshot = await getDocs(adminsRef);

    const admins: AdminUser[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      admins.push({
        id: docSnap.id,
        email: data.email,
        name: data.name || data.email.split('@')[0],
        addedBy: data.added_by || 'system',
        addedAt: data.added_at?.toMillis() || Date.now()
      });
    });

    return admins;
  } catch (error) {
    console.error("Error fetching admins:", error);
    return [];
  }
};

// Check if email is admin (from Firestore + default list)
export const checkIsAdmin = async (email: string | null | undefined): Promise<boolean> => {
  if (!email) return false;
  
  const lowerEmail = email.toLowerCase();
  
  // Check default admin list first
  if (DEFAULT_ADMIN_EMAILS.includes(lowerEmail)) {
    return true;
  }
  
  // Check Firestore
  try {
    const adminsRef = collection(db, 'admins');
    const q = query(adminsRef, where('email', '==', lowerEmail));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking admin:", error);
    return false;
  }
};

// Add new admin
export const addAdmin = async (
  email: string,
  name: string,
  addedByEmail: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const lowerEmail = email.toLowerCase().trim();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lowerEmail)) {
      return { success: false, error: 'Email không hợp lệ' };
    }
    
    // Check if already admin
    const isAlreadyAdmin = await checkIsAdmin(lowerEmail);
    if (isAlreadyAdmin) {
      return { success: false, error: 'Email này đã là admin' };
    }
    
    // Add to Firestore
    await addDoc(collection(db, 'admins'), {
      email: lowerEmail,
      name: name.trim() || lowerEmail.split('@')[0],
      added_by: addedByEmail,
      added_at: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error adding admin:", error);
    return { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' };
  }
};

// Remove admin
export const removeAdmin = async (adminId: string, adminEmail: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Prevent removing default admins
    if (DEFAULT_ADMIN_EMAILS.includes(adminEmail.toLowerCase())) {
      return { success: false, error: 'Không thể xóa admin mặc định của hệ thống' };
    }
    
    await deleteDoc(doc(db, 'admins', adminId));
    return { success: true };
  } catch (error) {
    console.error("Error removing admin:", error);
    return { success: false, error: 'Có lỗi xảy ra, vui lòng thử lại' };
  }
};

// ==================== ADMIN DASHBOARD STATS ====================

export interface DashboardStats {
  totalToilets: number;
  activeToilets: number;
  pendingToilets: number;
  dangerToilets: number;
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  avgCleanScore: number;
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Fetch all toilets
    const toiletsSnapshot = await getDocs(collection(db, 'toilets'));

    // Fetch all reviews so we can compute per-toilet averages and avoid
    // treating unreviewed toilets as 0 when calculating the dashboard average.
    const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
    const reviewRatings: Record<string, number[]> = {};
    reviewsSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const toiletId = data.toilet_id;
      if (toiletId) {
        reviewRatings[toiletId] = reviewRatings[toiletId] || [];
        reviewRatings[toiletId].push(typeof data.rating === 'number' ? data.rating : 0);
      }
    });

    // Build minimal toilets array (we only need status and id here)
    const toilets: { status: string; id: string }[] = [];
    toiletsSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      toilets.push({ status: data.status, id: docSnap.id });
    });
    
    // Fetch all reports
    const reportsSnapshot = await getDocs(collection(db, 'reports'));
    const reports: { status: string }[] = [];
    reportsSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      reports.push({ status: data.status });
    });
    
    // Calculate stats
    const totalToilets = toilets.length;
    const activeToilets = toilets.filter(t => t.status === 'active').length;
    const pendingToilets = toilets.filter(t => t.status === 'pending').length;
    const dangerToilets = toilets.filter(t => t.status === 'danger').length;
    
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === 'open' || r.status === 'new' || r.status === 'received' || r.status === 'processing').length;
    const resolvedReports = reports.filter(r => r.status === 'resolved').length;
    
    // Compute average clean score only from toilets that have at least one review.
    let sumAvgRatings = 0;
    let ratedCount = 0;
    toilets.forEach(t => {
      const ratings = reviewRatings[t.id] || [];
      if (ratings.length > 0) {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        sumAvgRatings += avg;
        ratedCount++;
      }
    });

    const avgCleanScore = ratedCount > 0 ? (sumAvgRatings / ratedCount) : 0;
    
    return {
      totalToilets,
      activeToilets,
      pendingToilets,
      dangerToilets,
      totalReports,
      pendingReports,
      resolvedReports,
      avgCleanScore: Math.round(avgCleanScore * 10) / 10
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalToilets: 0,
      activeToilets: 0,
      pendingToilets: 0,
      dangerToilets: 0,
      totalReports: 0,
      pendingReports: 0,
      resolvedReports: 0,
      avgCleanScore: 0
    };
  }
};

// ==================== ADMIN TOILETS MANAGEMENT ====================

export interface AdminToilet {
  id: string;
  name: string;
  address: string;
  type: 'public' | 'commercial' | 'event';
  status: 'active' | 'maintenance' | 'danger' | 'pending';
  clean_score: number;
  reportsCount: number;
  reviewsCount: number;
  createdAt: number;
  location: { lat: number; lng: number };
  images: string[];
  amenities: string[];
}

export const fetchAllToilets = async (): Promise<AdminToilet[]> => {
  try {
    const toiletsRef = collection(db, 'toilets');
    const toiletsSnapshot = await getDocs(toiletsRef);
    
    // Get report counts per toilet
    const reportsSnapshot = await getDocs(collection(db, 'reports'));
    const reportCounts: Record<string, number> = {};
    reportsSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const toiletId = data.toilet_id;
      if (toiletId) {
        reportCounts[toiletId] = (reportCounts[toiletId] || 0) + 1;
      }
    });

    // Get review counts and avg rating per toilet
    const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
    const reviewCounts: Record<string, number> = {};
    const reviewRatings: Record<string, number[]> = {};
    reviewsSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const toiletId = data.toilet_id;
      if (toiletId) {
        reviewCounts[toiletId] = (reviewCounts[toiletId] || 0) + 1;
        if (!reviewRatings[toiletId]) reviewRatings[toiletId] = [];
        reviewRatings[toiletId].push(data.rating || 0);
      }
    });
    
    const toilets: AdminToilet[] = [];
    toiletsSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const ratings = reviewRatings[docSnap.id] || [];
      const avgRating = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0;
      
      toilets.push({
        id: docSnap.id,
        name: data.name,
        address: data.address,
        type: data.type || 'public',
        status: data.status || 'active',
        clean_score: avgRating, // Use calculated avg instead of stored value
        reportsCount: reportCounts[docSnap.id] || 0,
        reviewsCount: reviewCounts[docSnap.id] || 0,
        createdAt: data.created_at?.toMillis() || Date.now(),
        location: {
          lat: data.location?.latitude || 0,
          lng: data.location?.longitude || 0
        },
        images: data.images || [],
        amenities: data.amenities || []
      });
    });
    
    return toilets;
  } catch (error) {
    console.error("Error fetching all toilets:", error);
    return [];
  }
};

export const updateToiletStatus = async (toiletId: string, status: string): Promise<boolean> => {
  try {
    const toiletRef = doc(db, 'toilets', toiletId);
    await updateDoc(toiletRef, { status });
    return true;
  } catch (error) {
    console.error("Error updating toilet status:", error);
    return false;
  }
};

export const deleteToilet = async (toiletId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'toilets', toiletId));
    return true;
  } catch (error) {
    console.error("Error deleting toilet:", error);
    return false;
  }
};

// ==================== ADMIN REPORTS MANAGEMENT ====================

export type AdminReportStatus = 'new' | 'received' | 'processing' | 'resolved';

export interface AdminReport {
  id: string;
  toiletId: string;
  toiletName: string;
  toiletAddress: string;
  type: ReportType;
  description: string;
  status: AdminReportStatus;
  reportedBy: {
    id: string;
    name: string;
    email: string;
  };
  reportedAt: number;
  isUrgent: boolean;
}

export const fetchAllReports = async (): Promise<AdminReport[]> => {
  try {
    const reportsRef = collection(db, 'reports');
    const reportsSnapshot = await getDocs(reportsRef);
    
    // Get all toilets for name/address lookup
    const toiletsSnapshot = await getDocs(collection(db, 'toilets'));
    const toiletMap: Record<string, { name: string; address: string }> = {};
    toiletsSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      toiletMap[docSnap.id] = { name: data.name, address: data.address };
    });
    
    const reports: AdminReport[] = [];
    reportsSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const toilet = toiletMap[data.toilet_id] || { name: 'Unknown', address: '' };
      const issueType = data.issue_type as ReportType;
      
      reports.push({
        id: docSnap.id,
        toiletId: data.toilet_id,
        toiletName: toilet.name,
        toiletAddress: toilet.address,
        type: issueType,
        description: data.description || '',
        status: data.status === 'open' ? 'new' : (data.status as AdminReportStatus) || 'new',
        reportedBy: {
          id: data.user_id || '',
          name: data.user_name || 'Ẩn danh',
          email: data.user_email || ''
        },
        reportedAt: data.created_at?.toMillis() || Date.now(),
        isUrgent: issueType === 'camera' || issueType === 'harassment'
      });
    });
    
    // Sort by urgent first, then by date
    reports.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return b.reportedAt - a.reportedAt;
    });
    
    return reports;
  } catch (error) {
    console.error("Error fetching all reports:", error);
    return [];
  }
};

export const updateReportStatus = async (reportId: string, status: AdminReportStatus): Promise<boolean> => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, { status });
    return true;
  } catch (error) {
    console.error("Error updating report status:", error);
    return false;
  }
};

// ==================== PENDING TOILETS (FOR APPROVAL) ====================

export interface PendingToiletData {
  id: string;
  name: string;
  address: string;
  type: 'public' | 'commercial' | 'event';
  submittedBy: {
    id: string;
    name: string;
    email: string;
  };
  submittedAt: number;
  location: { lat: number; lng: number };
  images: string[];
  amenities: string[];
}

export const fetchPendingToilets = async (): Promise<PendingToiletData[]> => {
  try {
    const toiletsRef = collection(db, 'toilets');
    const q = query(toiletsRef, where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    
    const pending: PendingToiletData[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      pending.push({
        id: docSnap.id,
        name: data.name,
        address: data.address,
        type: data.type || 'public',
        submittedBy: {
          id: data.created_by || '',
          name: data.created_by_name || 'Ẩn danh',
          email: data.created_by_email || ''
        },
        submittedAt: data.created_at?.toMillis() || Date.now(),
        location: {
          lat: data.location?.latitude || 0,
          lng: data.location?.longitude || 0
        },
        images: data.images || [],
        amenities: data.amenities || []
      });
    });
    
    return pending;
  } catch (error) {
    console.error("Error fetching pending toilets:", error);
    return [];
  }
};


export const approveToilet = async (toiletId: string): Promise<boolean> => {
  try {
    console.log('[DEBUG] approveToilet: Approving toilet ID:', toiletId);
    const toiletRef = doc(db, 'toilets', toiletId);
    await updateDoc(toiletRef, { status: 'active' });
    console.log('[DEBUG] approveToilet: Successfully updated status to active');
    return true;
  } catch (error) {
    console.error("[DEBUG] Error approving toilet:", error);
    return false;
  }
};

export const rejectToilet = async (toiletId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'toilets', toiletId));
    return true;
  } catch (error) {
    console.error("Error rejecting toilet:", error);
    return false;
  }
};

// ==================== ADMIN ADD TOILET ====================

export interface NewToiletData {
  name: string;
  address: string;
  type: 'public' | 'commercial' | 'event';
  price_type: 'free' | 'paid';
  price_amount?: number;
  gender: 'separated' | 'unisex';
  accessibility: boolean;
  amenities: string[];
  location: { lat: number; lng: number };
  images: File[];
}

export const addToiletAdmin = async (
  data: NewToiletData,
  adminEmail: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    // Upload images first
    const imageUrls: string[] = [];
    if (data.images && data.images.length > 0) {
      for (const image of data.images) {
        try {
          const imageRef = ref(storage, `toilets/${Date.now()}_${image.name}`);
          await uploadBytes(imageRef, image);
          const url = await getDownloadURL(imageRef);
          imageUrls.push(url);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw new Error('Lỗi upload ảnh: ' + (uploadError instanceof Error ? uploadError.message : 'Không xác định'));
        }
      }
    }

    // Add toilet document with status = 'active' (admin adds directly)
    const toiletData = {
      name: data.name.trim(),
      location: new FirestoreGeoPoint(data.location.lat, data.location.lng),
      address: data.address.trim(),
      type: data.type,
      price_type: data.price_type,
      price_amount: data.price_amount || 0,
      gender: data.gender,
      accessibility: data.accessibility,
      amenities: data.amenities || [],
      status: 'active',
      clean_score: 0,
      images: imageUrls,
      created_by: adminEmail,
      created_by_name: 'Admin',
      created_by_email: adminEmail,
      created_at: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'toilets'), toiletData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding toilet by admin:", error);
    const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra, vui lòng thử lại';
    return { success: false, error: errorMessage };
  }
};

export const updateToiletAdmin = async (
  toiletId: string,
  data: Partial<NewToiletData>,
  newImages?: File[],
  imagesToKeep?: string[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Upload new images if provided
    let imageUrls: string[] = imagesToKeep || [];
    if (newImages && newImages.length > 0) {
      for (const image of newImages) {
        try {
          const imageRef = ref(storage, `toilets/${Date.now()}_${image.name}`);
          await uploadBytes(imageRef, image);
          const url = await getDownloadURL(imageRef);
          imageUrls.push(url);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw new Error('Lỗi upload ảnh: ' + (uploadError instanceof Error ? uploadError.message : 'Không xác định'));
        }
      }
    }

    // Update toilet document
    const updateData: Record<string, any> = {};
    
    if (data.name) updateData.name = data.name.trim();
    if (data.location) updateData.location = new FirestoreGeoPoint(data.location.lat, data.location.lng);
    if (data.address) updateData.address = data.address.trim();
    if (data.type) updateData.type = data.type;
    if (data.price_type) updateData.price_type = data.price_type;
    if (data.price_amount !== undefined) updateData.price_amount = data.price_amount || 0;
    if (data.gender) updateData.gender = data.gender;
    if (data.accessibility !== undefined) updateData.accessibility = data.accessibility;
    if (data.amenities) updateData.amenities = data.amenities;
    if (imageUrls.length > 0) updateData.images = imageUrls;
    
    updateData.updated_at = Timestamp.now();

    const toiletRef = doc(db, 'toilets', toiletId);
    await updateDoc(toiletRef, updateData);
    
    return { success: true };
  } catch (error) {
    console.error("Error updating toilet by admin:", error);
    const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra, vui lòng thử lại';
    return { success: false, error: errorMessage };
  }
};

// ==================== BULK IMPORT ====================

export interface BulkImportResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  failedRows: Array<{ rowIndex: number; name: string; error: string }>;
}

export const addMultipleToiletsAdmin = async (
  toiletsData: Array<any>
): Promise<BulkImportResult> => {
  const adminEmail = auth.currentUser?.email || 'system@admin.local';
  const results: BulkImportResult = {
    success: true,
    totalProcessed: toiletsData.length,
    successCount: 0,
    failureCount: 0,
    failedRows: []
  };

  try {
    for (let i = 0; i < toiletsData.length; i++) {
      const data = toiletsData[i];
      
      try {
        // Download and upload images from URLs
        const imageUrls: string[] = [];
        const imageUrlsFromCsv = data.imageUrls || [];
        
        for (const imgUrl of imageUrlsFromCsv) {
          try {
            const response = await fetch(imgUrl);
            if (!response.ok) throw new Error('Failed to fetch image');
            
            const blob = await response.blob();
            const imageRef = ref(storage, `toilets/${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${imgUrl.split('/').pop()}`);
            await uploadBytes(imageRef, blob);
            const downloadUrl = await getDownloadURL(imageRef);
            imageUrls.push(downloadUrl);
          } catch (error) {
            console.warn(`Failed to download image from ${imgUrl}:`, error);
          }
        }

        const toiletData = {
          name: data.name.trim(),
          location: new FirestoreGeoPoint(data.location.lat, data.location.lng),
          address: data.address.trim(),
          type: data.type,
          price_type: data.price_type,
          price_amount: data.price_amount || 0,
          gender: data.gender,
          accessibility: data.accessibility,
          amenities: data.amenities || [],
          status: 'active',
          clean_score: 0,
          images: imageUrls,
          created_by: adminEmail,
          created_by_name: 'Admin',
          created_by_email: adminEmail,
          created_at: Timestamp.now()
        };

        await addDoc(collection(db, 'toilets'), toiletData);
        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.failedRows.push({
          rowIndex: i + 1,
          name: data.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (results.failureCount > 0) {
      results.success = false;
    }

    return results;
  } catch (error) {
    console.error("Error in bulk import:", error);
    return {
      ...results,
      success: false,
      failureCount: toiletsData.length,
      failedRows: toiletsData.map((item, idx) => ({
        rowIndex: idx + 1,
        name: item.name,
        error: 'Batch operation failed'
      }))
    };
  }
};