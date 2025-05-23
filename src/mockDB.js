// src/mockDb.js
import { ref } from 'vue';

// --- 锚点数据 ---
const initialAnchors = (() => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('timeImprintMockAnchorsData'); // 更改key，避免冲突
        try { return stored ? JSON.parse(stored) : []; } catch (e) { console.error("Failed to parse mockAnchorsData", e); return []; }
    }
    return [];
})();
export const mockAnchorsReactive = ref(initialAnchors);

// --- 人物数据 ---
const initialCharacters = (() => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('timeImprintMockCharactersData'); // 更改key
        try { return stored ? JSON.parse(stored) : []; } catch (e) { console.error("Failed to parse mockCharactersData", e); return []; }
    }
    return [];
})();
export const mockCharactersReactive = ref(initialCharacters);

// --- 影像数据 ---
const initialGeneratedVideos = (() => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('timeImprintMockGeneratedVideosData');
        try { return stored ? JSON.parse(stored) : []; } catch (e) { console.error("Failed to parse mockGeneratedVideosData", e); return []; }
    }
    return [];
})();
export const mockGeneratedVideosReactive = ref(initialGeneratedVideos);

// --- 社交圈帖子数据 ---
const initialSocialFeedPosts = (() => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('timeImprintMockSocialFeedPostsData');
        try { return stored ? JSON.parse(stored) : []; }
        catch (e) { console.error("Failed to parse mockSocialFeedPostsData", e); return []; }
    }
    return [];
})();
export const mockSocialFeedPostsReactive = ref(initialSocialFeedPosts);

export function addSocialPost(postDetails) {
    const currentUser = JSON.parse(localStorage.getItem('mockUserData')) || { id: 'unknown_user', name: '匿名用户', avatar_url: '/mock_assets/avatars/default_avatar.png' };

    const newPost = {
        id: `post_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        author_id: currentUser.id,
        author_name: currentUser.name,
        author_avatar_url: currentUser.avatar_url,
        created_at: new Date().toISOString(),
        likes: 0,
        comments: [], // { id, author_name, author_avatar, text, created_at }
        ...postDetails, // 应该包含 video_id_ref, video_title, video_url, video_thumbnail_url, caption
    };
    mockSocialFeedPostsReactive.value.unshift(newPost); // 新帖子放最前面
    saveDataToLocalStorage('timeImprintMockSocialFeedPostsData', mockSocialFeedPostsReactive.value);
    console.log("MockDB: Social Post added", newPost);
    return newPost;
}

// (可选) 添加点赞和评论的 mock 函数
export function toggleLikePost(postId, userId) {
    const post = mockSocialFeedPostsReactive.value.find(p => p.id === postId);
    if (post) {
        if (!post.liked_by) post.liked_by = [];
        const userIndex = post.liked_by.indexOf(userId);
        if (userIndex > -1) {
            post.likes--;
            post.liked_by.splice(userIndex, 1);
        } else {
            post.likes++;
            post.liked_by.push(userId);
        }
        saveDataToLocalStorage('timeImprintMockSocialFeedPostsData', mockSocialFeedPostsReactive.value);
        return true;
    }
    return false;
}

export function addCommentToPost(postId, commentText) {
    const post = mockSocialFeedPostsReactive.value.find(p => p.id === postId);
    const currentUser = JSON.parse(localStorage.getItem('mockUserData')) || { name: '评论者', avatar_url: '/mock_assets/avatars/default_avatar.png' };
    if (post) {
        if (!post.comments) post.comments = [];
        const newComment = {
            id: `comment_${Date.now()}`,
            author_name: currentUser.name,
            author_avatar: currentUser.avatar_url,
            text: commentText,
            created_at: new Date().toISOString()
        };
        post.comments.push(newComment);
        saveDataToLocalStorage('timeImprintMockSocialFeedPostsData', mockSocialFeedPostsReactive.value);
        return newComment;
    }
    return null;
}


export function addGeneratedVideo(videoDetails) {
    const videoFileName = videoDetails.video_url ? videoDetails.video_url.split('/').pop().replace(/\.(mp4|mov|avi|wmv)$/i, '') : `video_${Date.now()}`;
    const mockThumbnailUrl = `/mock_media/generated_videos/thumbnails/${videoFileName}_thumb.png`; // Or .jpg if your thumbs are jpg

    const newVideo = {
        id: `video_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        status: 'pending_script',
        created_at: new Date().toISOString(),
        thumbnail_url: mockThumbnailUrl, // Set thumbnail based on video name
        ...videoDetails,
    };
    mockGeneratedVideosReactive.value.unshift(newVideo);
    saveDataToLocalStorage('timeImprintMockGeneratedVideosData', mockGeneratedVideosReactive.value);
    console.log("MockDB: Generated Video entry created", newVideo);
    return newVideo;
}

export function updateGeneratedVideo(videoId, updates) {
    const videoIndex = mockGeneratedVideosReactive.value.findIndex(v => v.id === videoId);
    if (videoIndex !== -1) {
        let currentVideo = mockGeneratedVideosReactive.value[videoIndex];
        let newUpdates = { ...updates };

        // If video_url is being updated and thumbnail_url is not explicitly provided in updates,
        // try to derive it.
        if (updates.video_url && !updates.thumbnail_url) {
            const videoFileName = updates.video_url.split('/').pop().replace(/\.(mp4|mov|avi|wmv)$/i, '');
            newUpdates.thumbnail_url = `/mock_media/generated_videos/thumbnails/${videoFileName}_thumb.png`; // Or .jpg
        }

        mockGeneratedVideosReactive.value[videoIndex] = { ...currentVideo, ...newUpdates };
        saveDataToLocalStorage('timeImprintMockGeneratedVideosData', mockGeneratedVideosReactive.value);
        console.log("MockDB: Generated Video updated", videoId, mockGeneratedVideosReactive.value[videoIndex]);
        return mockGeneratedVideosReactive.value[videoIndex];
    }
    console.warn("MockDB: Generated Video not found for update", videoId);
    return null;
}


// --- 操作函数 ---
function saveDataToLocalStorage(key, data) {
    if (typeof window !== 'undefined') {
        try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.error(`Failed to save ${key}`, e); }
    }
}

export function addMockAnchor(anchorDetails) { /* ... 保持不变 ... */
    const newAnchor = {
        ...anchorDetails,
        id: `mock_anchor_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        media: []
    };
    mockAnchorsReactive.value.push(newAnchor);
    saveDataToLocalStorage('timeImprintMockAnchorsData', mockAnchorsReactive.value);
    console.log('MockDB: Anchor added', newAnchor);
    return newAnchor;
}

export function findMockAnchorById(anchorId) { /* ... 保持不变 ... */
    return mockAnchorsReactive.value.find(a => a.id === anchorId);
}

export function addMediaToMockAnchor(anchorId, mediaDetails) { /* ... 保持不变 ... */
    const anchor = findMockAnchorById(anchorId);
    if (anchor) {
        if (!anchor.media) {
            anchor.media = [];
        }
        const newMediaItem = {
            ...mediaDetails,
            id: `media_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        };
        anchor.media.push(newMediaItem);
        saveDataToLocalStorage('timeImprintMockAnchorsData', mockAnchorsReactive.value);
        console.log('MockDB: Media added to anchor', anchorId, newMediaItem);
        return newMediaItem;
    }
    console.warn('MockDB: Anchor not found for adding media', anchorId);
    return null;
}

export function updateMediaInMockAnchor(anchorId, mediaId, updates) { /* ... 保持不变 ... */
    const anchor = findMockAnchorById(anchorId);
    if (anchor && anchor.media) {
        const mediaIndex = anchor.media.findIndex(m => m.id === mediaId);
        if (mediaIndex !== -1) {
            anchor.media[mediaIndex] = { ...anchor.media[mediaIndex], ...updates };
            saveDataToLocalStorage('timeImprintMockAnchorsData', mockAnchorsReactive.value);
            console.log('MockDB: Media updated', anchorId, mediaId, updates);
            return true;
        }
    }
    console.warn('MockDB: Media not found for update', anchorId, mediaId);
    return false;
}

export function addMockCharacter(characterDetails) {
    let existingCharacter = null;
    // 优先通过 is_user_self 和 name 查找用户本人
    if (characterDetails.is_user_self && characterDetails.name) {
        existingCharacter = mockCharactersReactive.value.find(
            c => c.is_user_self && c.name === characterDetails.name
        );
    }
    // 其次通过 embedding (如果提供了唯一的)
    if (!existingCharacter && characterDetails.embedding) {
        existingCharacter = mockCharactersReactive.value.find(c => c.embedding === characterDetails.embedding);
    }
    // 最后通过名字 (作为简单mock的查重)
    if (!existingCharacter && characterDetails.name) {
        existingCharacter = mockCharactersReactive.value.find(c => c.name === characterDetails.name && !c.is_user_self); // 避免错误匹配用户本人
    }

    if (existingCharacter) {
        let updated = false;
        if (characterDetails.avatar_url && existingCharacter.avatar_url !== characterDetails.avatar_url) {
            existingCharacter.avatar_url = characterDetails.avatar_url;
            updated = true;
        }
        if (characterDetails.embedding && existingCharacter.embedding !== characterDetails.embedding) {
             // 通常用户本人的 embedding 不应轻易改变，除非是重新“学习”
             // 对于非用户本人，如果提供了新的 embedding，可以更新
            if (!existingCharacter.is_user_self || !existingCharacter.embedding) { // 用户本人的embedding如果已存在，不轻易覆盖
                existingCharacter.embedding = characterDetails.embedding;
                updated = true;
            }
        }
        if (characterDetails.name && existingCharacter.name !== characterDetails.name && !existingCharacter.is_user_self){ // 用户本人的名字不应通过此函数修改
            existingCharacter.name = characterDetails.name;
            updated = true;
        }

        if (updated) {
            saveDataToLocalStorage('timeImprintMockCharactersData', mockCharactersReactive.value);
            console.log('MockDB: Character updated', existingCharacter);
        } else {
            console.log('MockDB: Character found, no update needed or restricted', existingCharacter);
        }
        return existingCharacter;
    }

    // 如果不存在，则创建新的
    const newCharacter = {
        id: `person_mock_${(characterDetails.name || 'unknown').trim().toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        name: characterDetails.name || null,
        avatar_url: characterDetails.avatar_url || '/mock_assets/avatars/default_avatar.png',
        embedding: characterDetails.embedding || `emb_mock_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        is_user_self: characterDetails.is_user_self || false, // 新增：标记是否为用户本人
    };
    mockCharactersReactive.value.push(newCharacter);
    saveDataToLocalStorage('timeImprintMockCharactersData', mockCharactersReactive.value);
    console.log('MockDB: Character added', newCharacter);
    return newCharacter;
}

export function findMockCharacterById(characterId) { /* ... 保持不变 ... */
    return mockCharactersReactive.value.find(c => c.id === characterId);
}

const ensureInitialMockVideos = () => {
    if (mockGeneratedVideosReactive.value.length === 0) {
        console.log("MockDB: No videos in localStorage, adding initial mock videos.");
        addGeneratedVideo({
            title: "我的黄山日出大片",
            user_prompt: "黄山日出，云海，震撼",
            selected_anchor_ids: ['mock_anchor_1', 'mock_anchor_2'],
            duration_preference: "30s",
            generate_subtitles: true,
            music_preference: "大气史诗",
            json_script: { scenes: [{media_path:"...", duration:5}] },
            video_url: "/mock_media/generated_videos/sample_huangshan_video.mp4",
            // thumbnail_url will be derived by addGeneratedVideo
            status: 'completed',
            created_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
        });
        addGeneratedVideo({
            title: "毕业季的我们",
            user_prompt: "毕业快乐，校园回忆，友谊",
            selected_anchor_ids: ['mock_anchor_3'],
            duration_preference: "60s",
            generate_subtitles: true,
            music_preference: "温馨感人",
            json_script: { scenes: [{media_path:"...", duration:5}] },
            video_url: "/mock_media/generated_videos/sample_graduation_video.mp4",
            // thumbnail_url will be derived
            status: 'completed',
            created_at: new Date(Date.now() - 172800000).toISOString() // Day before yesterday
        });
        addGeneratedVideo({ // Example of a video that might be "processing"
            title: "旅行Vlog (渲染中)",
            user_prompt: "我的旅行记录",
            selected_anchor_ids: ['mock_anchor_4'],
            status: 'rendering', // Or any other processing status
            json_script: {scenes:[]},
            video_url: null, // No video URL yet
            thumbnail_url: null // No thumbnail yet
        });
    }
};

// Initialize with some data if local storage is empty
if (typeof window !== 'undefined' && !localStorage.getItem('timeImprintMockGeneratedVideosData')) {
    ensureInitialMockVideos();
}

// 确保在 mockDb.js 初始化时，如果 localStorage 为空，也初始化 mockSocialFeedPostsReactive
if (typeof window !== 'undefined' && !localStorage.getItem('timeImprintMockSocialFeedPostsData')) {
    // 可以添加一些初始的 mock 帖子数据，或者让它为空
    // addSocialPost({ /* ... mock post 1 ... */ });
    // addSocialPost({ /* ... mock post 2 ... */ });
    console.log("MockDB: Initialized empty social feed posts.");
}