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
        const stored = localStorage.getItem('timeImprintMockCharactersData');
        try {
            const chars = stored ? JSON.parse(stored) : [];
            // 确保旧数据也可能有新字段的默认值
            return chars.map(c => ({
                system_user_id: null, // 链接到的系统用户ID (如果是平台用户)
                relation_label: '',   // 用户对此人的关系标签 (例如 "大学同学", "家人")
                is_user_self: false,  // 默认为非用户本人
                ...c // 保留原有属性
            }));
        } catch (e) { console.error("Failed to parse mockCharactersData", e); return []; }
    }
    return [];
})();

// --- 人物关系数据 (新增) ---
const initialRelationships = (() => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('timeImprintMockRelationshipsData');
        try { return stored ? JSON.parse(stored) : []; }
        catch (e) { console.error("Failed to parse mockRelationshipsData", e); return []; }
    }
    return [];
})();

const initialPlatformUsers = [ // 预设一些平台用户用于搜索
    { id: 'user_jack_001', name: '小杰平台号', avatar_url: '/mock_assets/avatars/xiaojie_face.png', email: 'jack@example.com' },
    { id: 'user_rose_002', name: '小张平台号', avatar_url: '/mock_assets/avatars/xiaozhang_face.png', email: 'rose@example.com' },
    { id: 'user_ben_003', name: '小本平台号', avatar_url: '/mock_assets/avatars/stranger_xiaoben_face.png', email: 'ben@example.com' },
    { id: 'user_lucy_004', name: '露西', avatar_url: '/mock_assets/avatars/default_avatar.png', email: 'lucy@example.com' },
    // 注意：当前登录用户“小明”不应该出现在这里，因为不能添加自己为好友
];
export const mockPlatformUsersReactive = ref(initialPlatformUsers);
export const mockRelationshipsReactive = ref(initialRelationships);

export const mockCharactersReactive = ref(initialCharacters);

// --- 好友关系数据 (新增 - 存储 A 是 B 的好友) ---
// 结构: { userId1: string, userId2: string, status: 'pending' | 'accepted' | 'declined', requested_by: userId }
// 或者更简单： Map<userId, Set<friendId>>
const initialFriends = (() => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('timeImprintMockFriendsData');
        try { return stored ? JSON.parse(stored) : {}; } // 使用对象存储好友列表，例如 { 'xiaoming123': ['user_jack_001'] }
        catch (e) { console.error("Failed to parse mockFriendsData", e); return {}; }
    }
    return {};
})();
export const mockFriendsReactive = ref(initialFriends); // 例如: { xiaoming123: Set{'user_jack_001', ...}, user_jack_001: Set{...} }

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


/**
 * 添加或更新人物到人物库 (升级)
 * @param {object} characterDetails - 人物信息
 * @param {string} characterDetails.name - 人物名称
 * @param {string} [characterDetails.avatar_url] - 头像URL
 * @param {string} [characterDetails.embedding] - (模拟的)面部特征向量
 * @param {boolean} [characterDetails.is_user_self=false] - 是否为当前登录用户本人
 * @param {string} [characterDetails.system_user_id=null] - 如果此人物是平台注册用户，其用户ID
 * @param {string} [characterDetails.relation_label=''] - 当前用户对此人的关系标注
 */
export function addMockCharacter(characterDetails) {
    let existingCharacter = null;
    // 查找逻辑：优先通过 is_user_self 和 name (用户本人)，其次 embedding，最后 name
    if (characterDetails.is_user_self && characterDetails.name) {
        existingCharacter = mockCharactersReactive.value.find(
            c => c.is_user_self && c.name === characterDetails.name
        );
    }
    if (!existingCharacter && characterDetails.embedding) {
        existingCharacter = mockCharactersReactive.value.find(c => c.embedding === characterDetails.embedding && !c.is_user_self); // embedding应该是唯一的，除了用户自己可能在不同设备有不同embedding
    }
    if (!existingCharacter && characterDetails.name && !characterDetails.is_user_self) { // 非用户本人，才通过名字简单查重
        existingCharacter = mockCharactersReactive.value.find(c => c.name === characterDetails.name && !c.is_user_self);
    }

    if (existingCharacter) {
        let updated = false;
        if (characterDetails.avatar_url && existingCharacter.avatar_url !== characterDetails.avatar_url) {
            existingCharacter.avatar_url = characterDetails.avatar_url;
            updated = true;
        }
        if (characterDetails.embedding && (!existingCharacter.embedding || existingCharacter.embedding !== characterDetails.embedding)) {
            existingCharacter.embedding = characterDetails.embedding;
            updated = true;
        }
        if (characterDetails.hasOwnProperty('system_user_id') && existingCharacter.system_user_id !== characterDetails.system_user_id) {
            existingCharacter.system_user_id = characterDetails.system_user_id;
            updated = true;
        }
        if (characterDetails.hasOwnProperty('relation_label') && existingCharacter.relation_label !== characterDetails.relation_label) {
            existingCharacter.relation_label = characterDetails.relation_label;
            updated = true;
        }
        // 用户本人的名字不应通过此函数修改，除非有特定逻辑
        if (characterDetails.name && existingCharacter.name !== characterDetails.name && !existingCharacter.is_user_self){
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
        is_user_self: characterDetails.is_user_self || false,
        system_user_id: characterDetails.system_user_id || null,
        relation_label: characterDetails.relation_label || '',
    };
    mockCharactersReactive.value.push(newCharacter);
    saveDataToLocalStorage('timeImprintMockCharactersData', mockCharactersReactive.value);
    console.log('MockDB: Character added', newCharacter);
    return newCharacter;
}

export function findMockCharacterById(characterId) { /* ... 保持不变 ... */
    return mockCharactersReactive.value.find(c => c.id === characterId);
}

export function findCharacterInLibraryBySystemUserId(systemUserId) { // 新增：通过系统用户ID查找人物库条目
    return mockCharactersReactive.value.find(c => c.system_user_id === systemUserId);
}

// --- 新增好友系统相关函数 ---
export function searchPlatformUsers(searchTerm) {
    if (!searchTerm) return [];
    const lowerSearch = searchTerm.toLowerCase();
    const currentUser = JSON.parse(localStorage.getItem('mockUserData'));
    return mockPlatformUsersReactive.value.filter(
        user => user.id !== currentUser?.id && // 不能搜索到自己
                (user.name.toLowerCase().includes(lowerSearch) ||
                 user.email.toLowerCase().includes(lowerSearch))
    );
}

export function sendFriendRequest(fromUserId, toUserId) {
    // 在mock中，我们直接将其加为好友，并双向记录
    if (!mockFriendsReactive.value[fromUserId]) {
        mockFriendsReactive.value[fromUserId] = new Set();
    }
    mockFriendsReactive.value[fromUserId].add(toUserId);

    if (!mockFriendsReactive.value[toUserId]) {
        mockFriendsReactive.value[toUserId] = new Set();
    }
    mockFriendsReactive.value[toUserId].add(fromUserId); // Mock中直接互为好友

    // 更新本地存储 (Set 不能直接JSON序列化，需要转换)
    const serializableFriends = {};
    for (const userId in mockFriendsReactive.value) {
        serializableFriends[userId] = Array.from(mockFriendsReactive.value[userId]);
    }
    saveDataToLocalStorage('timeImprintMockFriendsData', serializableFriends);

    console.log(`MockDB: Friend request from ${fromUserId} to ${toUserId} - auto-accepted (mock).`);
    return true;
}

export function getFriends(userId) {
    const friendIds = mockFriendsReactive.value[userId] ? Array.from(mockFriendsReactive.value[userId]) : [];
    return mockPlatformUsersReactive.value.filter(user => friendIds.includes(user.id));
}

export function isFriend(userId1, userId2) {
    return mockFriendsReactive.value[userId1] && mockFriendsReactive.value[userId1].has(userId2);
}


/**
 * 添加人物关系 (新增)
 * @param {object} relationshipDetails
 * @param {string} relationshipDetails.from_person_id - 关系发起方的人物ID (通常是当前用户关联的人物库ID)
 * @param {string} relationshipDetails.to_person_id - 关系指向方的人物ID
 * @param {string} relationshipDetails.type - 关系类型 (例如 "好友", "室友", "同事", "家人", "AI推测：共同参与XX活动")
 * @param {string} [relationshipDetails.source_description] - (可选) 关系来源的描述，例如从哪段文字推断的
 */
export function addMockRelationship(relationshipDetails) {
    // 简单查重：避免完全相同的关系重复添加
    const exists = mockRelationshipsReactive.value.find(r =>
        r.from_person_id === relationshipDetails.from_person_id &&
        r.to_person_id === relationshipDetails.to_person_id &&
        r.type === relationshipDetails.type
    );
    if (exists) {
        console.log("MockDB: Relationship already exists", exists);
        return exists;
    }

    const newRelationship = {
        id: `rel_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        created_at: new Date().toISOString(),
        ...relationshipDetails
    };
    mockRelationshipsReactive.value.push(newRelationship);
    saveDataToLocalStorage('timeImprintMockRelationshipsData', mockRelationshipsReactive.value);
    console.log("MockDB: Relationship added", newRelationship);
    return newRelationship;
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

// 确保登录用户（小明）在人物库中，这个函数在 mockCharactersReactive 初始化时调用
function ensureUserCharacterExists(charactersArray) { // 这个函数移到这里，因为它被 initialCharacters 使用
    if (typeof window !== 'undefined') {
        const loggedInUser = JSON.parse(localStorage.getItem('mockUserData'));
        if (loggedInUser && loggedInUser.name) { // 假设登录用户总有名字
            let userChar = charactersArray.find(c => c.is_user_self && c.name === loggedInUser.name);
            if (!userChar) {
                userChar = {
                    id: `person_mock_${loggedInUser.name.toLowerCase()}_${Date.now()}`,
                    name: loggedInUser.name,
                    avatar_url: loggedInUser.avatar_url || '/mock_assets/avatars/default_avatar.png',
                    embedding: `emb_${loggedInUser.name.toLowerCase()}_real_user`,
                    is_user_self: true,
                    system_user_id: loggedInUser.id, // 关联到系统用户ID
                    relation_label: '自己'
                };
                charactersArray.unshift(userChar); // 确保用户本人存在
                console.log("MockDB: Ensured logged-in user exists in characters.", userChar);
            } else {
                // 更新现有用户数据
                userChar.avatar_url = loggedInUser.avatar_url || userChar.avatar_url || '/mock_assets/avatars/default_avatar.png';
                userChar.system_user_id = loggedInUser.id || userChar.system_user_id;
                userChar.is_user_self = true; // 确保标记正确
                if (!userChar.relation_label) userChar.relation_label = '自己';
            }
        }
    }
    return charactersArray;
}

// 确保 ensureUserCharacterExists 在 mockCharactersReactive 初始化之后，并且如果 mockCharactersReactive 为空，
// 它需要先从 localStorage 加载，然后确保用户存在，再保存回 localStorage。
// 上面的 initialCharacters 定义中已经包含了类似逻辑，但我们可以让 ensureUserCharacterExists 更主动。
// 或者，这个逻辑更适合放在 MainLayout.vue 的 onMounted 中，在登录信息确认后再调用 addMockCharacter。
// 为了保持 mockDb.js 的纯粹性，我们假设 MainLayout.vue 会在登录后调用 addMockCharacter 来确保用户本人在库中。
// 所以，initialCharacters 中的 ensureUserCharacterExists 可以简化或移除，依赖 MainLayout.vue 的逻辑。
// 让我们简化 initialCharacters，并依赖 MainLayout.vue 来添加/更新用户本人。
const simpleInitialCharacters = (() => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('timeImprintMockCharactersData');
        try { return stored ? JSON.parse(stored) : []; }
        catch (e) { return []; }
    }
    return [];
})();
// export const mockCharactersReactive = ref(simpleInitialCharacters); // 如果采用这种方式，MainLayout.vue的逻辑就非常重要
// 但为了向下兼容之前的 ensureUserCharacterExists 逻辑，我们暂时保留它在 initialCharacters 定义时的调用。

// 初始化确保 localStorage 中有这些 key，即使是空数组
if (typeof window !== 'undefined') {
    if (!localStorage.getItem('timeImprintMockAnchorsData')) {
        saveDataToLocalStorage('timeImprintMockAnchorsData', []);
    }
    if (!localStorage.getItem('timeImprintMockCharactersData')) {
        // 确保初始加载时也应用新字段的默认值
        saveDataToLocalStorage('timeImprintMockCharactersData', ensureUserCharacterExists([]));
    }
    if (!localStorage.getItem('timeImprintMockRelationshipsData')) {
        saveDataToLocalStorage('timeImprintMockRelationshipsData', []);
    }
    if (!localStorage.getItem('timeImprintMockGeneratedVideosData')) {
        // ensureInitialMockVideos(); // 这个函数之前是用来添加演示视频的，如果还需要可以保留
        saveDataToLocalStorage('timeImprintMockGeneratedVideosData', []);
    }
    if (!localStorage.getItem('timeImprintMockSocialFeedPostsData')) {
        saveDataToLocalStorage('timeImprintMockSocialFeedPostsData', []);
    }
    const storedFriends = localStorage.getItem('timeImprintMockFriendsData');
    if (storedFriends) {
        const parsed = JSON.parse(storedFriends);
        const friendsWithSets = {};
        for (const userId in parsed) {
            friendsWithSets[userId] = new Set(parsed[userId]);
        }
        mockFriendsReactive.value = friendsWithSets;
    }
}