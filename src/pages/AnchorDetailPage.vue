// src/pages/AnchorDetailPage.vue
<template>
    <q-page padding v-if="currentAnchorData">
        <q-btn flat icon="arrow_back" label="返回列表/地图" @click="goBack" class="q-mb-md" />
        <q-card>
            <q-card-section>
                <div class="text-h4">{{ currentAnchorData.name }}</div>
                <div class="text-subtitle2">
                    {{ formatDateTime(currentAnchorData.start_time) }} - {{ formatDateTime(currentAnchorData.end_time)
                    }}
                </div>
                <div v-if="currentAnchorData.location_coordinates" class="text-caption">
                    位置: 纬度 {{ currentAnchorData.location_coordinates[1] }}, 经度 {{
                        currentAnchorData.location_coordinates[0] }}
                </div>
                <p class="q-mt-sm">{{ currentAnchorData.description }}</p>
            </q-card-section>

            <q-separator />

            <q-card-section>
                <div class="text-h6 q-mb-sm">添加新媒体</div>
                <q-file v-model="filesToSelect" label="选择照片/视频 (可多选)" multiple filled clearable accept="image/*,video/*"
                    @update:model-value="handleFileSelection" class="q-mb-md">
                    <template v-slot:prepend>
                        <q-icon name="attach_file" />
                    </template>
                </q-file>

                <div v-if="localFilePreviews.length" class="q-mb-md">
                    <div class="text-subtitle1">待上传预览：</div>
                    <q-list bordered separator class="rounded-borders">
                        <q-item v-for="(filePreview, index) in localFilePreviews" :key="index">
                            <q-item-section thumbnail class="q-pr-md">
                                <q-img v-if="filePreview.type.startsWith('image/')" :src="filePreview.previewUrl"
                                    style="width: 80px; height: 60px; object-fit: cover; border-radius: 3px;"
                                    alt="图片预览" />
                                <q-icon v-else-if="filePreview.type.startsWith('video/')" name="movie" size="xl"
                                    color="grey-7" />
                                <q-icon v-else name="insert_drive_file" size="xl" color="grey-7" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label lines="1">{{ filePreview.name }}</q-item-label>
                                <q-item-label caption>{{ (filePreview.size / 1024).toFixed(2) }} KB</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-btn flat dense round icon="close" @click="removeFileFromPreview(index)" />
                            </q-item-section>
                        </q-item>
                    </q-list>
                    <q-btn label="确认并开始AI处理" color="primary" @click="submitSelectedFiles" class="q-mt-sm"
                        :disable="!localFilePreviews.length" icon-right="biotech" />
                </div>

                <div class="text-h6 q-mt-lg q-mb-sm">已关联媒体</div>
                <div v-if="currentAnchorMedia && currentAnchorMedia.length" class="q-gutter-md">
                    <q-card v-for="media in currentAnchorMedia" :key="media.id" flat bordered>
                        <q-card-section class="row items-start q-gutter-md">
                            <div class="col-xs-12 col-sm-4">
                                <q-img v-if="media.media_type === 'image'" :src="media.file_url"
                                    style="max-height: 200px; border-radius: 3px; width:100%; object-fit: contain;"
                                    @error="onMediaError(media)">
                                    <q-badge v-if="isMediaProcessing(media)" color="orange" floating transparent>
                                        <q-spinner-dots color="white" size="1.5em" /> AI处理中...
                                    </q-badge>
                                </q-img>
                                <video v-else-if="media.media_type === 'video'" :src="media.file_url" controls
                                    style="max-width: 100%; max-height: 200px; border-radius: 3px;"
                                    @error="onMediaError(media)"></video>
                                <div v-else class="text-grey-7">预览类型不支持: {{ media.file_url }}</div>
                            </div>

                            <div class="col">
                                <div v-if="media.ai_status === 'completed'">
                                    <div class="text-weight-bold">AI描述:</div>
                                    <p style="white-space: pre-wrap;">{{ media.ai_description || '暂无描述' }}</p>
                                    <div class="text-weight-bold q-mt-sm">AI标签:</div>
                                    <q-chip dense v-for="tag in media.tags" :key="tag" :label="tag" color="secondary"
                                        text-color="white" class="q-mr-xs q-mb-xs" />
                                    <div v-if="!media.tags || !media.tags.length">暂无标签</div>

                                    <div class="text-weight-bold q-mt-sm">识别到的人物:</div>
                                    <div v-if="media.recognized_faces && media.recognized_faces.length">
                                        <q-list dense separator class="rounded-borders q-mt-xs">
                                            <q-item v-for="(face, faceIndex) in media.recognized_faces"
                                                :key="face.person_id || faceIndex">
                                                <!-- <q-item-section avatar v-if="getCharacterAvatar(face.person_id)">
                                                    <q-avatar size="md">
                                                        <img :src="getCharacterAvatar(face.person_id)">
                                                    </q-avatar>
                                                </q-item-section>
                                                <q-item-section>
                                                    <q-item-label>{{ face.name || '未命名人物' }}</q-item-label>
                                                    <q-item-label caption
                                                        v-if="face.status === 'unidentified_new_person'">
                                                        (新发现)
                                                        <q-btn flat dense color="primary" label="命名此人"
                                                            @click="promptIdentifyFace(media, face)"
                                                            class="q-ml-sm q-px-xs" size="sm" />
                                                    </q-item-label>
                                                </q-item-section> -->
                                                <q-item-section avatar>
                                                    <q-avatar size="md">
                                                        <img :src="(face.status === 'unidentified_new_person' && face.temp_avatar_url) ? face.temp_avatar_url : getCharacterAvatar(face.person_id)">
                                                        </q-avatar>
                                                </q-item-section>
                                                <q-item-section>
                                                    <q-item-label>{{ face.name || '未命名人物' }}</q-item-label>
                                                    <q-item-label caption v-if="face.status === 'unidentified_new_person'">
                                                    (新发现) <q-btn flat dense color="primary" label="命名此人" @click="promptIdentifyFace(media, face)" class="q-ml-sm q-px-xs" size="sm"/>
                                                    </q-item-label>
                                                </q-item-section>
                                            </q-item>
                                        </q-list>
                                    </div>
                                    <div v-else class="text-caption">未识别到人物</div>
                                </div>
                                <div v-else-if="isMediaProcessing(media)">
                                    <q-linear-progress indeterminate query color="amber" class="q-my-md" />
                                    <div class="text-caption text-orange-8">AI正在分析 ({{
                                        media.ai_status.replace('processing_', '阶段: ')
                                    }})... 请稍候。</div>
                                </div>
                                <div v-else-if="media.ai_status === 'pending'">
                                    <div class="text-caption text-grey-7">等待AI处理...</div>
                                </div>
                                <div v-else-if="media.ai_status && media.ai_status.startsWith('failed')">
                                    <q-icon name="error" color="negative" /> <span class="text-negative">AI处理失败: {{
                                        media.ai_status
                                    }}</span>
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
                <div v-else class="text-grey-7 q-mt-md">此锚点暂无媒体文件。</div>
            </q-card-section>
        </q-card>

        <q-dialog v-model="identifyFaceDialog.show">
            <q-card style="min-width: 350px">
                <q-card-section>
                    <div class="text-h6">为新发现的人物命名</div>
                </q-card-section>
                <q-card-section class="q-pt-none">
                    <q-input dense v-model="identifyFaceDialog.name" autofocus @keyup.enter="confirmFaceIdentity"
                        label="人物名称" :rules="[val => !!val && val.trim() !== '' || '名称不能为空']" />
                </q-card-section>
                <q-card-actions align="right" class="text-primary">
                    <q-btn flat label="取消" v-close-popup />
                    <q-btn flat label="确认命名" @click="confirmFaceIdentity" />
                </q-card-actions>
            </q-card>
        </q-dialog>

    </q-page>
    <q-page v-else class="flex flex-center">
        <div v-if="loadingAnchor">
            <q-spinner color="primary" size="3em" />
            <div class="q-mt-md text-grey-8">加载锚点信息中...</div>
        </div>
        <div v-else class="text-h6 text-grey-7">
            未找到该锚点信息 (ID: {{ anchorId }})，或加载失败。
        </div>
    </q-page>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { date as qDateUtils, useQuasar } from 'quasar';
import {
    findMockAnchorById,
    addMediaToMockAnchor,
    updateMediaInMockAnchor,
    addMockCharacter,
    mockCharactersReactive // 用于获取头像
} from 'src/mockDB'; // <--- 修改：导入 mockDb 函数, 改为 mockDB

// import { useAnchorStore } from 'src/stores/anchorStore'; // 后续启用
// import { useCharacterStore } from 'src/stores/characterStore'; // 后续启用

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
// const anchorStore = useAnchorStore(); // 后续启用
// const characterStore = useCharacterStore(); // 后续启用

const anchorId = ref(route.params.id);
const currentAnchorData = ref(null); // 本地 ref 模拟 store.currentAnchor
const currentAnchorMedia = ref([]); // 本地 ref 模拟 store.currentAnchorMedia
const loadingAnchor = ref(true);

const filesToSelect = ref(null); // 用于 q-file v-model, @update:model-value 会给单个或数组
const localFilePreviews = ref([]);

const identifyFaceDialog = ref({
    show: false,
    media: null, // 完整的媒体对象
    face: null,  // 正在命名的face对象
    name: ''
});

const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    return qDateUtils.formatDate(isoString, 'YYYY年MM月DD日 HH:mm');
}

const onMediaError = (media) => {
    console.error('媒体加载失败:', media.file_url);
    $q.notify({ type: 'negative', message: `媒体文件 ${media.file_url} 加载失败` });
    media.file_url = '/mock_assets/media_error.png'; // 确保你有这个占位图
}

const isMediaProcessing = (media) => {
    return media.ai_status === 'pending' || media.ai_status === 'processing_face' || media.ai_status === 'processing_description';
}

// xiaoben
const getCharacterAvatar = (personId) => {
    if (!personId) return '/mock_assets/avatars/default_avatar.png'; // 默认头像
    const character = mockCharactersReactive.value.find(c => c.id === personId);
    return character?.avatar_url || '/mock_assets/avatars/default_avatar.png';
}


const fetchCurrentAnchorDetails = () => {
    loadingAnchor.value = true;
    const foundAnchor = findMockAnchorById(anchorId.value);
    if (foundAnchor) {
        // 使用深拷贝，确保 currentAnchorData 的修改不会直接影响 mockDb 的源对象，除非通过特定函数
        currentAnchorData.value = JSON.parse(JSON.stringify(foundAnchor));
        currentAnchorMedia.value = currentAnchorData.value.media ? [...currentAnchorData.value.media] : [];
        // 确保mock media url是可访问的 (这个逻辑最好在addMediaToMockAnchor时就处理好)
        currentAnchorMedia.value.forEach(m => {
            if (m.file_url && m.file_url.startsWith('blob:') || m.file_url.startsWith('data:')) {
                // 本地预览URL，通常是临时的，AI处理后应更新为持久化（mock的云）URL
            } else if (m.file_url && !m.file_url.startsWith('http') && !m.file_url.startsWith('/')) {
                m.file_url = `/mock_media/${m.file_url}`;
            }
        });
    } else {
        currentAnchorData.value = null;
        currentAnchorMedia.value = [];
    }
    loadingAnchor.value = false;
    // TODO (Pinia): await anchorStore.fetchAnchorDetails(anchorId.value);
    // currentAnchorData.value = anchorStore.currentAnchor;
    // currentAnchorMedia.value = anchorStore.currentAnchorMedia;
}

onMounted(() => {
    fetchCurrentAnchorDetails();
});

const goBack = () => {
    router.push('/'); // 或者 router.go(-1) 如果确定上一页是列表
}

const handleFileSelection = (newFilesValue) => {
    const filesArray = Array.isArray(newFilesValue) ? newFilesValue : (newFilesValue ? [newFilesValue] : []);
    localFilePreviews.value = []; // 清空之前的，等待用户确认这一批

    if (filesArray.length > 0) {
        filesArray.forEach(file => {
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    localFilePreviews.value.push({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        previewUrl: e.target.result,
                        originalFile: file
                    });
                };
                reader.readAsDataURL(file);
            } else {
                localFilePreviews.value.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    previewUrl: null,
                    originalFile: file
                });
                $q.notify({ type: 'warning', message: `文件 ${file.name} 不是支持的图片或视频格式，将仅记录文件名。` });
            }
        });
    }
    // filesToSelect.value = null; // 选择后立即清空 q-file 输入框，避免重复处理相同选择
}

const removeFileFromPreview = (index) => {
    localFilePreviews.value.splice(index, 1);
    // 如果 filesToSelect 与 localFilePreviews 的 File 对象是同步的，也需要更新 filesToSelect
    // 为了简化，我们假设 q-file 的 modelValue (filesToSelect) 在用户下次选择时会覆盖
    // 如果要实现从 q-file 模型中移除特定文件，会更复杂一些
}

const submitSelectedFiles = async () => {
    if (!localFilePreviews.value.length) {
        $q.notify({ type: 'warning', message: '没有待上传的文件。' });
        return;
    }

    const filesToProcess = [...localFilePreviews.value]; // 复制一份，因为下面会清空
    localFilePreviews.value = []; // 清空预览列表
    filesToSelect.value = null; // 清空QFile组件的model

    $q.notify({ type: 'info', position: 'top', message: `已提交 ${filesToProcess.length} 个文件进行AI处理...` });

    for (const preview of filesToProcess) {
        const mediaDetails = {
            // 对于本地预览的 Data URL，AI处理后通常会替换为云存储URL
            // 在mock中，我们可以先用原始文件名构造一个mock路径
            file_url: `/mock_media/${preview.name}`, // 假设上传后会是这个路径
            file_key: `mock_uploads/${anchorId.value}/${Date.now()}_${preview.name}`,
            media_type: preview.type.startsWith('image/') ? 'image' : 'video',
            uploaded_at: new Date().toISOString(),
            ai_status: 'pending', // 初始状态
            ai_description: null,
            tags: [],
            recognized_faces: []
        };

        const newMediaItem = addMediaToMockAnchor(anchorId.value, mediaDetails); // 添加到 mockDb
        if (newMediaItem) {
            mockSimulateAIProcessingWithDelay(newMediaItem.id, anchorId.value, 8000); // 使用新函数
        }
    }
    // 提交后，应该重新获取锚点详情以刷新 currentAnchorMedia 列表
    // fetchCurrentAnchorDetails(); // mockSimulateAIProcessingWithDelay 会在最后调用它
}

// const mockSimulateAIProcessingWithDelay = (mediaId, forAnchorId, delay) => {
//     // 确保操作的是 mockDb 中的数据
//     updateMediaInMockAnchor(forAnchorId, mediaId, { ai_status: 'processing_face' });
//     fetchCurrentAnchorDetails(); // 立刻刷新一次UI显示"处理中"
//     const currentMediaItem = findMockAnchorById(forAnchorId)?.media.find(m => m.id === mediaId);
//     console.log(`Mock AI: ${mediaId} - processing_face (will complete in ${delay / 1000}s) for ${currentMediaItem?.file_url}`);

//     setTimeout(() => {
//         const mediaInDbForDesc = findMockAnchorById(forAnchorId)?.media.find(m => m.id === mediaId);
//         if (!mediaInDbForDesc) {
//             console.error("Media item not found in DB for desc processing:", mediaId);
//             return;
//         }

//         let updatedMediaDataForDesc = { ai_status: 'processing_description', recognized_faces: [] };

//         if (mediaInDbForDesc.file_url.includes('graduation_campus.png')) {
//             // 确保人物在mockCharactersReactive中存在，如果不存在则添加并获取ID
//             const xiaoming = addMockCharacter({ name: '小明', avatar_url: '/mock_assets/avatars/xiaoming.jpg', embedding: 'embedding_xiaoming_mock' });
//             const xiaojie = addMockCharacter({ name: '小杰', avatar_url: '/mock_assets/avatars/default_avatar.png', embedding: 'embedding_xiaojie_mock' });
//             const xiaoben = addMockCharacter({ name: '小本', avatar_url: '/mock_assets/avatars/default_avatar.png', embedding: 'embedding_xiaoben_mock' });

//             updatedMediaDataForDesc.recognized_faces = [
//                 { person_id: xiaoming.id, name: xiaoming.name, bounding_box: { x: 10, y: 10, w: 20, h: 30 }, status: 'identified' },
//                 { person_id: xiaojie.id, name: xiaojie.name, bounding_box: { x: 40, y: 10, w: 20, h: 30 }, status: 'identified' },
//                 { person_id: xiaoben.id, name: xiaoben.name, bounding_box: { x: 70, y: 10, w: 20, h: 30 }, status: 'identified' },
//                 { person_id: null, name: null, bounding_box: { x: 100, y: 10, w: 20, h: 30 }, status: 'unidentified_new_person', temp_embedding_info: `embedding_for_${mediaId}_unknown_face_idx0` } // 确保唯一性
//             ];
//         } else if (mediaInDbForDesc.file_url.includes('huangshan_sunrise.png')) {
//             updatedMediaDataForDesc.recognized_faces = []; // 黄山日出图，没有检测到人物
//         }
//         // 可以为其他图片添加通用mock人脸
//         // else if (mediaInDbForDesc.media_type === 'image') {
//         //    updatedMediaDataForDesc.recognized_faces = [
//         //        { person_id: null, name: null, bounding_box: { x: 15, y: 15, w: 25, h: 35 }, status: 'unidentified_new_person', temp_embedding_info: `embedding_for_${mediaId}_generic_face_idx0` }
//         //    ];
//         // }


//         updateMediaInMockAnchor(forAnchorId, mediaId, updatedMediaDataForDesc);
//         fetchCurrentAnchorDetails(); // 刷新UI
//         console.log(`Mock AI: ${mediaId} - processing_description`, updatedMediaDataForDesc.recognized_faces);

//         setTimeout(() => {
//             const mediaInDbFinal = findMockAnchorById(forAnchorId)?.media.find(m => m.id === mediaId);
//             if (!mediaInDbFinal) {
//                 console.error("Media item not found in DB for final AI processing:", mediaId);
//                 return;
//             }

//             let finalAIData = { ai_status: 'completed', ai_description: 'AI为这张图片生成的精彩描述，内容丰富，引人入胜。', tags: ['风景', '旅行', 'AI生成'] };

//             if (mediaInDbFinal.file_url.includes('graduation_group_photo.png')) {
//                 finalAIData.ai_description = '一张四人在校园内的合影，其中有小明，小杰，小本，以及一位不认识的同学。背景是一栋具有古典风格的建筑，建筑顶部飘扬着一面红旗，周围绿树环绕。画面洋溢着青春气息，推测可能是毕业季相关场景。';
//                 finalAIData.tags = ['毕业季', '校园合影', '青春', '友谊', '古典建筑', '红旗'];
//             } else if (mediaInDbFinal.file_url.includes('huangshan_sunrise.png')) {
//                 finalAIData.ai_description = '这是一幅壮美绝伦的自然景观图，展现了黄山日出云海的震撼场景。画面中，太阳正从云海尽头缓缓升起，散发出耀眼的金色光芒，将天边染成橙红色，与上方深蓝色的天空形成鲜明对比。';
//                 finalAIData.tags = ['黄山', '日出', '云海', '自然奇观', '金色光芒', '旅行'];
//             }

//             updateMediaInMockAnchor(forAnchorId, mediaId, finalAIData);
//             fetchCurrentAnchorDetails(); // 最终刷新UI
//             console.log(`Mock AI: ${mediaId} - completed`, finalAIData.ai_description, finalAIData.tags);
//             $q.notify({ type: 'positive', message: `媒体文件 ${mediaInDbFinal.file_url.split('/').pop()} AI处理完成!`, position: 'bottom-right' });
//         }, delay / 2);
//     }, delay / 2);
// }

const mockSimulateAIProcessingWithDelay = (mediaId, forAnchorId, delay) => {
    // 立即更新状态为"人脸处理中"，并刷新UI
    updateMediaInMockAnchor(forAnchorId, mediaId, { ai_status: 'processing_face' });
    fetchCurrentAnchorDetails(); // 重新从mockDb加载，以更新currentAnchorMedia中的对应项
    
    const mediaBeingProcessed = findMockAnchorById(forAnchorId)?.media.find(m => m.id === mediaId);
    console.log(`Mock AI (Stage 1/3): ${mediaId} - 人脸检测与识别开始 for ${mediaBeingProcessed?.file_url}. 将在 ${delay / 1000}s 内逐步完成。`);

    // 模拟人脸处理耗时
    setTimeout(() => {
        const mediaInDbForFaces = findMockAnchorById(forAnchorId)?.media.find(m => m.id === mediaId);
        if (!mediaInDbForFaces) {
            console.error("MOCK AI ERROR: Media item not found in DB for face processing:", mediaId);
            updateMediaInMockAnchor(forAnchorId, mediaId, { ai_status: 'failed_face_processing' });
            fetchCurrentAnchorDetails();
            return;
        }

        let recognized_faces_result = []; // 默认无识别人物

        // --- 根据文件名应用特定的人脸识别结果 ---
        // 假设您的演示合影文件名是 'graduation_group_photo.jpg' (请替换为您实际使用的mock文件名)
        // 对应您提供的 graduation_group_photo_box_with_stranger.jpg 的场景
        if (mediaInDbForFaces.file_url.includes('graduation_group_photo.png')) { // <--- 请确保这个文件名与您上传的mock文件名一致
            
            console.log("MOCK AI: Applying specific face detection for graduation_group_photo.png");
            // 1. 查找小明 (当前登录用户，应该已在人物库中，并有头像)
            const xiaomingUser = JSON.parse(localStorage.getItem('mockUserData')); // 获取当前登录用户信息
            let xiaomingInCharacterDb = null;
            // if (xiaomingUser && xiaomingUser.name === '小明') { // 确保当前用户是小明
            //      xiaomingInCharacterDb = mockCharactersReactive.value.find(
            //         c => c.is_user_self && c.name === xiaomingUser.name
            //      );
            // }

            if (xiaomingUser && xiaomingUser.name === '小明') { // 确保当前是小明在操作
             xiaomingInCharacterDb = mockCharactersReactive.value.find(
                c => c.is_user_self === true && c.name === xiaomingUser.name
             );
             console.log("MOCK AI: Attempting to find '小明' (self) in character DB. Found:", xiaomingInCharacterDb);
            } else {
                console.log("MOCK AI: Current logged in user is not '小明', or no user data found.");
            }

            if (xiaomingInCharacterDb && xiaomingInCharacterDb.avatar_url && !xiaomingInCharacterDb.avatar_url.includes('default_avatar')) {
                recognized_faces_result.push({
                    person_id: xiaomingInCharacterDb.id,
                    name: xiaomingInCharacterDb.name,
                    // avatar_url: xiaomingInCharacterDb.avatar_url, // recognized_faces 通常不直接存头像，通过person_id去人物库取
                    bounding_box: { x: 680, y: 130, w: 260, h: 380 }, // 小明 - 根据您的图片调整
                    status: 'identified'
                });
            } else {
                console.warn("MOCK AI: '小明' (self) not found in character DB with a valid avatar, or avatar is default. Treating as new for this photo if not matched by embedding.");
                // 如果因为某些原因小明没在人物库或头像不对，这里让她也变成一个可被命名的“新面孔”，但这应避免
                 recognized_faces_result.push({
                    person_id: null, name: null, bounding_box: { x: 680, y: 130, w: 260, h: 380 },
                    status: 'unidentified_new_person',
                    temp_embedding_info: `embedding_for_${mediaId}_face_xiaoming_candidate`, // 给一个临时embedding
                    temp_avatar_url: '/mock_assets/avatars/xiaoming.png' // 依然用小明的图作为裁剪图
                });
            }

            // 2. 其他三个是未识别的新面孔 (小杰、小张、小本)
            recognized_faces_result.push(
                // 小杰 - 使用裁剪头像 stranger_xiaojie_face.png (或者您裁剪好的 xiaojie_face.png)
                { person_id: null, name: null, bounding_box: { x: 380, y: 160, w: 270, h: 350 }, status: 'unidentified_new_person', temp_embedding_info: `embedding_for_${mediaId}_xiaojie_candidate`, temp_avatar_url: '/mock_assets/avatars/xiaojie_face.png' },
                // 小张 - 使用裁剪头像 stranger_xiaozhang_face.png (或者您裁剪好的 xiaozhang_face.png)
                { person_id: null, name: null, bounding_box: { x: 60, y: 200, w: 280, h: 400 }, status: 'unidentified_new_person', temp_embedding_info: `embedding_for_${mediaId}_xiaozhang_candidate`, temp_avatar_url: '/mock_assets/avatars/xiaozhang_face.png' },
                // 小本 - 使用裁剪头像 stranger_xiaoben_face.png
                { person_id: null, name: null, bounding_box: { x: 480, y: 230, w: 220, h: 300 }, status: 'unidentified_new_person', temp_embedding_info: `embedding_for_${mediaId}_xiaoben_candidate`, temp_avatar_url: '/mock_assets/avatars/stranger_xiaoben_face.png' }
            );
        } else if (mediaInDbForFaces.file_url.includes('huangshan_sunrise.png')) { // <--- 确保文件名一致
            console.log("MOCK AI: Applying no face detection for huangshan_sunrise.png");
            recognized_faces_result = []; // 黄山日出无人物
        }
        // 您可以为其他图片添加通用的mock人脸结果，或者保持为空
        // else if (mediaInDbForFaces.media_type === 'image') {
        //    console.log("MOCK AI: Applying generic face detection for other image.");
        //    recognized_faces_result = [
        //        { person_id: null, name: null, bounding_box: { x: 15, y: 15, w: 25, h: 35 }, status: 'unidentified_new_person', temp_embedding_info: `embedding_for_${mediaId}_generic_face_idx0` }
        //    ];
        // }
        // --- 结束人脸识别逻辑 ---

        updateMediaInMockAnchor(forAnchorId, mediaId, {
            ai_status: 'processing_description', // 更新状态到下一阶段
            recognized_faces: recognized_faces_result
        });
        fetchCurrentAnchorDetails(); // 刷新UI，显示识别出的人脸
        console.log(`Mock AI (Stage 2/3): ${mediaId} - 人脸处理完成, 待描述生成. Faces:`, recognized_faces_result);

        // 模拟描述和标签生成耗时
        setTimeout(() => {
            const mediaInDbFinal = findMockAnchorById(forAnchorId)?.media.find(m => m.id === mediaId);
            if (!mediaInDbFinal) {
                console.error("MOCK AI ERROR: Media item not found for final AI processing:", mediaId);
                updateMediaInMockAnchor(forAnchorId, mediaId, { ai_status: 'failed_description_processing' });
                fetchCurrentAnchorDetails();
                return;
            }

            let finalAIData = {
                ai_status: 'completed', // 最终状态
                ai_description: 'AI为这张图片生成的通用描述，内容丰富，引人入胜。例如，它捕捉到了画面的主要元素和氛围。',
                tags: ['AI通用标签', '风景或人物', '自动生成']
            };

            // --- 根据文件名应用特定的描述和标签 ---
            if (mediaInDbFinal.file_url.includes('graduation_group_photo.png')) { // <--- 确保文件名一致
                console.log("MOCK AI: Applying specific description for graduation_group_photo.png");
                finalAIData.ai_description = '一张四人在校园内的合影，包括已识别的小明、小杰、小张。背景是标志性的教学楼和人群，充满了青春的朝气与对未来的展望，猜测与毕业季相关。';
                finalAIData.tags = ['毕业典礼', '校园合影', '青春时光', '深厚友谊', '人生新篇章'];
            } else if (mediaInDbFinal.file_url.includes('huangshan_sunrise.png')) { // <--- 确保文件名一致
                console.log("MOCK AI: Applying specific description for huangshan_sunrise.png");
                finalAIData.ai_description = '壮丽的黄山日出景观，云海在山峦间翻腾，初升的太阳将天空染成一片绚烂的橙红色，远山如黛，构成一幅绝美的自然画卷。';
                finalAIData.tags = ['黄山', '日出奇观', '云海仙境', '自然风光', '旅行记忆', '摄影'];
            }
            // --- 结束描述和标签逻辑 ---

            updateMediaInMockAnchor(forAnchorId, mediaId, finalAIData);
            fetchCurrentAnchorDetails(); // 最终刷新UI
            console.log(`Mock AI (Stage 3/3): ${mediaId} - AI处理全部完成. Description:`, finalAIData.ai_description);
            $q.notify({ type: 'positive', message: `"${mediaInDbFinal.file_url.split('/').pop()}” AI分析完成!`, position: 'bottom-right', timeout: 3500 });
        }, delay / 2); // 假设描述生成占一半时间
    }, delay / 2); // 假设人脸处理占一半时间
}

const promptIdentifyFace = (media, face) => {
    identifyFaceDialog.value.media = media;
    identifyFaceDialog.value.face = face;
    identifyFaceDialog.value.name = '';
    identifyFaceDialog.value.show = true;
}

// const confirmFaceIdentity = () => {
//     const { media, face, name } = identifyFaceDialog.value;
//     if (!name || !name.trim()) {
//         $q.notify({ type: 'warning', message: '请输入人物名称' });
//         return;
//     }

//     if (media && face && face.status === 'unidentified_new_person') {
//         // 1. 在 mockCharactersReactive 中创建或查找人物
//         // 使用 addMockCharacter，它会处理存在性检查并返回人物对象（包含ID）
//         const character = addMockCharacter({
//             name: name.trim(),
//             // 如果 face 对象中有 temp_embedding_info，可以传过去
//             embedding: face.temp_embedding_info
//             // avatar_url 可以使用默认的，或者后续允许用户编辑人物时再上传
//         });

//         // 2. 更新媒体文件中的人脸信息
//         const mediaToUpdate = findMockAnchorById(anchorId.value)?.media.find(m => m.id === media.id);
//         if (mediaToUpdate && mediaToUpdate.recognized_faces) {
//             // 找到要更新的那个未识别的人脸，通常通过 temp_embedding_info 或其在数组中的原始位置
//             const faceIndex = mediaToUpdate.recognized_faces.findIndex(
//                 f => f.status === 'unidentified_new_person' && f.temp_embedding_info === face.temp_embedding_info
//             );

//             if (faceIndex !== -1) {
//                 const updatedFaceEntry = {
//                     ...mediaToUpdate.recognized_faces[faceIndex], // 保留 bounding_box 等
//                     person_id: character.id,
//                     name: character.name,
//                     status: 'identified'
//                 };
//                 // 创建一个新的 recognized_faces 数组以确保响应性
//                 const newRecognizedFaces = [...mediaToUpdate.recognized_faces];
//                 newRecognizedFaces[faceIndex] = updatedFaceEntry;
//                 updateMediaInMockAnchor(anchorId.value, media.id, { recognized_faces: newRecognizedFaces });
//             } else {
//                 console.warn("Could not find the exact 'unidentified_new_person' face to update by temp_embedding_info.");
//             }
//         }
//         fetchCurrentAnchorDetails(); // 刷新UI
//     }
//     identifyFaceDialog.value.show = false;
//     $q.notify({ type: 'positive', message: `人物 "${name.trim()}" 已命名并关联!`, position: 'bottom-right' });
//     // TODO (Pinia): await anchorStore.identifyRecognizedFace(media.id, face.temp_embedding_info, name.trim());
// }
const confirmFaceIdentity = () => {
    const { media, face, name } = identifyFaceDialog.value; // media 和 face 是在 promptIdentifyFace 中设置的
    if (!name || !name.trim()) {
        $q.notify({ type: 'warning', message: '请输入人物名称' });
        return;
    }

    // if (media && face && face.status === 'unidentified_new_person') {
    //     // 1. 在 mockCharactersReactive 中创建或查找人物 "小本"
    //     // 注意：这里我们演示的是将"未识别"命名为"小本"
    //     // 您可以将 name.trim() 作为参数传递给 addMockCharacter
    //     const characterName = name.trim(); // 用户输入的名字
    //     let character = mockCharactersReactive.value.find(c => c.name === characterName);
    //     if (!character) {
    //         // 如果人物库中没有这个名字，创建一个新的。
    //         // 假设新人物用默认头像，除非您有方法在此时关联特定头像
    //         // 对于 "小本"，如果他就是那个之前未识别的，我们这里创建他
    //         character = addMockCharacter({
    //             name: characterName,
    //             avatar_url: '/mock_assets/avatars/stranger_xiaoben_face.png', // 或者您为"小本"准备的特定头像
    //             embedding: face.temp_embedding_info // 保存这个临时（或真实）的 embedding 信息
    //         });
    //         console.log(`MockDB: New character "${characterName}" added with ID ${character.id}`);
    //     } else {
    //         console.log(`MockDB: Character "${characterName}" already exists with ID ${character.id}`);
    //     }


    //     // 2. 更新媒体文件中的这个人脸信息
    //     const mediaToUpdate = findMockAnchorById(anchorId.value)?.media.find(m => m.id === media.id);
    //     if (mediaToUpdate && mediaToUpdate.recognized_faces) {
    //         // 通过 temp_embedding_info (或在数组中的索引) 找到准确的未识别条目
    //         const faceIndex = mediaToUpdate.recognized_faces.findIndex(
    //             f => f.status === 'unidentified_new_person' && f.temp_embedding_info === face.temp_embedding_info
    //         );

    //         if (faceIndex !== -1) {
    //             const updatedFaceEntry = {
    //                 ...mediaToUpdate.recognized_faces[faceIndex], // 保留 bounding_box 等
    //                 person_id: character.id, // 关联到人物库中的ID
    //                 name: character.name,    // 更新为用户输入的名字
    //                 status: 'identified'     // 状态更新为已识别
    //             };
    //             // 为了Vue的响应式更新，最好替换整个数组或数组中的对象
    //             const newRecognizedFaces = [...mediaToUpdate.recognized_faces];
    //             newRecognizedFaces[faceIndex] = updatedFaceEntry;
    //             updateMediaInMockAnchor(anchorId.value, media.id, { recognized_faces: newRecognizedFaces });
    //             console.log(`Mock AI: Face in media ${media.id} identified as "${character.name}" (ID: ${character.id})`);
    //         } else {
    //             console.warn("MOCK AI WARN: Could not find the exact 'unidentified_new_person' face to update by temp_embedding_info in media:", media.id, face.temp_embedding_info);
    //         }
    //     }
    //     fetchCurrentAnchorDetails(); // 刷新UI以显示更新后的人脸信息
    // }
    if (media && face && face.status === 'unidentified_new_person') {
        const characterName = name.trim(); // 用户输入的名字，例如 “小本”

        // 当为“小本”创建人物条目时，使用他特定的陌生人头像
        // 如果 face 对象中记录了 temp_avatar_url，就用它
        // const avatarForNewCharacter = face.temp_avatar_url || '/mock_assets/avatars/default_avatar.png';
        const avatarUrlForCharacter = face.temp_avatar_url || '/mock_assets/avatars/default_avatar.png';


        let character = addMockCharacter({ // addMockCharacter 内部会处理查找或新建
            name: characterName,
            avatar_url: avatarUrlForCharacter,
            embedding: face.temp_embedding_info // 传递这个作为识别依据
        });
        // if (!character) {
        //     character = addMockCharacter({
        //         name: characterName,
        //         avatar_url: avatarForNewCharacter, // <--- 使用小本的特定头像
        //         embedding: face.temp_embedding_info
        //     });
        //     console.log(`MockDB: New character "${characterName}" added with ID ${character.id} using avatar ${avatarForNewCharacter}`);
        // } else {
        //      // 如果找到了同名同embedding的人物，可能也需要更新其头像（如果之前是默认头像）
        //     if (character.avatar_url === '/mock_assets/avatars/default_avatar.png' && avatarForNewCharacter !== '/mock_assets/avatars/default_avatar.png') {
        //         character.avatar_url = avatarForNewCharacter;
        //         // 注意：如果 mockCharactersReactive 中的对象不是深度响应的，直接修改属性可能不会触发所有依赖它的组件更新。
        //         // addMockCharacter 内部的 saveDataToLocalStorage 会保存。
        //         // 为了确保UI绝对更新，可以考虑在 mockDb.js 的 addMockCharacter 中，如果找到已存在的人物并更新了，也触发一次 mockCharactersReactive.value 的整体替换（slice 或 filter）
        //     }
        //     console.log(`MockDB: Character "${characterName}" (ID: ${character.id}) updated/found. Using avatar ${character.avatar_url}`);
        // }

        // --- 更新媒体文件中的人脸信息 (与之前类似) ---
        const mediaToUpdate = findMockAnchorById(anchorId.value)?.media.find(m => m.id === media.id);
        if (mediaToUpdate && mediaToUpdate.recognized_faces) {
            const faceIndex = mediaToUpdate.recognized_faces.findIndex(
                f => f.status === 'unidentified_new_person' && f.temp_embedding_info === face.temp_embedding_info
            );
            if (faceIndex !== -1) {
                const updatedFaceEntry = {
                    ...mediaToUpdate.recognized_faces[faceIndex],
                    person_id: character.id,
                    name: character.name, // 已命名
                    status: 'identified',
                    // temp_avatar_url 可以在这里移除，因为现在可以通过 person_id 找到正式头像了
                    // temp_avatar_url: undefined (或者 delete updatedFaceEntry.temp_avatar_url)
                };
                delete updatedFaceEntry.temp_avatar_url; // 清理临时头像URL

                const newRecognizedFaces = [...mediaToUpdate.recognized_faces];
                newRecognizedFaces[faceIndex] = updatedFaceEntry;
                updateMediaInMockAnchor(anchorId.value, media.id, { recognized_faces: newRecognizedFaces });
            }
        }
        fetchCurrentAnchorDetails(); // 刷新UI
    }


    identifyFaceDialog.value.show = false; // 关闭对话框
    $q.notify({ type: 'positive', message: `人物 "${name.trim()}" 已命名并关联!`, position: 'bottom-right' });

    // TODO (Pinia): await anchorStore.identifyRecognizedFace(media.id, face.temp_embedding_info, name.trim(), character.id);
    /*
    // TODO (API): 后续API调用可能如下
    // 1. 如果character是新创建的，先调用API创建人物，获取后端返回的person_id
    //    let backendPersonId = character.id; // 假设mock ID可以直接用，或从API获取
    //    if (isNewCharacter) {
    //        const personResponse = await api.post('/people/characters/', { name: character.name, embedding_vector: character.embedding });
    //        backendPersonId = personResponse.data.id;
    //    }
    // 2. 更新媒体识别记录
    //    await api.put(`/media/${media.id}/recognitions/${face.recognition_db_id_or_identifier}/`, { person_id: backendPersonId, status: 'identified' });
    //    fetchCurrentAnchorDetails(); // 从后端重新获取数据
    */
}
</script>

<style scoped>
/* 确保图片在卡片中适应并显示良好 */
.q-img {
    border-radius: 3px;
}

.q-card-section .row .col-xs-12.col-sm-4 {
    /* 媒体预览列 */
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 150px;
    /* 给预览区一个最小高度 */
}

.rounded-borders {
    border-radius: 4px;
}
</style>