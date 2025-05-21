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


export function addGeneratedVideo(videoDetails) {
    const newVideo = {
        id: `video_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        status: 'pending_script', // pending_script, script_generated, rendering, completed, failed
        created_at: new Date().toISOString(),
        ...videoDetails, // 包含 title, user_prompt, selected_anchor_ids, json_script (稍后添加), video_url (渲染后添加)
    };
    mockGeneratedVideosReactive.value.unshift(newVideo); // 新的视频放最前面
    saveDataToLocalStorage('timeImprintMockGeneratedVideosData', mockGeneratedVideosReactive.value);
    console.log("MockDB: Generated Video entry created", newVideo);
    return newVideo;
}

export function updateGeneratedVideo(videoId, updates) {
    const videoIndex = mockGeneratedVideosReactive.value.findIndex(v => v.id === videoId);
    if (videoIndex !== -1) {
        mockGeneratedVideosReactive.value[videoIndex] = { ...mockGeneratedVideosReactive.value[videoIndex], ...updates };
        saveDataToLocalStorage('timeImprintMockGeneratedVideosData', mockGeneratedVideosReactive.value);
        console.log("MockDB: Generated Video updated", videoId, updates);
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

