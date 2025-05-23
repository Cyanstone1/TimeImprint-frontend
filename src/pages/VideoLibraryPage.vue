<template>
    <q-page padding>
      <div class="text-h5 q-mb-md">我的影像库</div>
  
      <div v-if="!allVideos || allVideos.length === 0" class="text-center text-grey-7 q-pa-xl">
        <q-icon name="movie_filter" size="xl" />
        <p class="q-mt-md">您的影像库还是空的哦！</p>
        <q-btn
          label="去创作第一个影像"
          color="primary"
          icon="add_photo_alternate"
          to="/video-creation"
        />
      </div>
  
      <div v-if="processingVideos.length > 0" class="q-mb-xl">
          <div class="text-h6 q-mb-sm text-orange-8">正在创作中...</div>
          <q-list bordered separator class="rounded-borders">
              <q-item v-for="video in processingVideos" :key="video.id">
                  <q-item-section avatar>
                      <q-spinner-puff color="primary" size="2em" />
                  </q-item-section>
                  <q-item-section>
                      <q-item-label>{{ video.title }}</q-item-label>
                      <q-item-label caption>状态: {{ getVideoStatusText(video.status) }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                       <q-btn flat dense round icon="construction" @click="goToVideoCreationStepper(video)" color="grey">
                          <q-tooltip>查看进度</q-tooltip>
                      </q-btn>
                  </q-item-section>
              </q-item>
          </q-list>
      </div>
  
      <div v-if="completedVideos.length > 0">
          <div class="text-h6 q-mb-sm">已完成的影像</div>
          <div class="row q-col-gutter-md">
              <div
                  v-for="video in completedVideos"
                  :key="video.id"
                  class="col-xs-12 col-sm-6 col-md-4 col-lg-3"
              >
                  <q-card class="video-card full-height column q-hoverable" v-ripple:primary>
                    <span class="video-card-link" @click="playVideo(video)"></span>
                      <!-- <div
                          class="video-thumbnail-container bg-grey-2 row items-center justify-center"
                          :style="{ aspectRatio: '16/9' }"
                      >
                          <q-img
                              v-if="video.thumbnail_url && !video.thumbnail_error"
                              :src="video.thumbnail_url"
                              :ratio="16/9"
                              class="video-actual-thumbnail"
                              spinner-color="primary"
                              @error="handleThumbnailError(video)"
                          >
                               <div class="absolute-bottom text-subtitle2 text-center q-pa-xs bg-black-transparent">
                                  {{ video.title }}
                               </div>
                               <q-icon name="play_circle_filled" size="xl" color="white" class="absolute-center thumbnail-play-icon" />
                          </q-img>
                          <div v-else class="column items-center justify-center full-height text-center q-pa-sm">
                              <q-icon name="movie_creation" size="xl" color="grey-5" />
                              <div class="text-caption text-grey-7 q-mt-xs ellipsis-2-lines">{{ video.title }}</div>
                              <q-icon name="play_circle_outline" size="lg" color="grey-5" class="absolute-center thumbnail-play-icon-fallback" />
                          </div>
                      </div> -->
                      <div
                            class="cursor-pointer video-thumbnail-container bg-grey-2 row items-center justify-center"
                            :style="{ aspectRatio: '16/9', position: 'relative' }" @click="playVideo(video)"
                        >
                            <img
                                v-if="video.thumbnail_url && !video.thumbnail_error_flag"
                                :src="video.thumbnail_url"
                                style="width: 100%; height: 100%; object-fit: cover; display: block;"
                                alt="Video Thumbnail"
                                @error="onThumbnailLoadError(video)"
                            />
                            <div v-if="video.thumbnail_url && !video.thumbnail_error_flag" class="absolute-full">
                                <div class="absolute-bottom text-subtitle2 text-center q-pa-xs bg-black-transparent" style="width:100%;">
                                    {{ video.title }}
                                </div>
                                <q-icon name="play_circle_filled" size="xl" color="white" class="absolute-center thumbnail-play-icon" />
                            </div>

                            <div v-else class="column items-center justify-center full-height text-center q-pa-sm">
                                <q-icon name="movie_creation" size="xl" color="grey-5" />
                                <div class="text-caption text-grey-7 q-mt-xs ellipsis-2-lines">{{ video.title }}</div>
                                <q-icon name="play_circle_outline" size="lg" color="grey-5" class="absolute-center thumbnail-play-icon-fallback" />
                            </div>
                        </div>
  
                      <q-card-section>
                          <div class="text-caption text-grey-7">
                              创建于: {{ formatDateTime(video.created_at) }}
                          </div>
                          <div class="text-caption text-grey-7 q-mt-xs ellipsis-2-lines" :title="video.user_prompt">
                              创作提示: {{ video.user_prompt || '无' }}
                          </div>
                      </q-card-section>
  
                      <q-space />
  
                      <q-card-actions align="around" class="q-pt-none">
                          <q-btn flat round color="primary" icon="play_arrow" @click="playVideo(video)">
                              <q-tooltip>播放</q-tooltip>
                          </q-btn>
                          <q-btn flat round color="secondary" icon="share" @click="openShareDialog(video)">
                              <q-tooltip>分享</q-tooltip>
                          </q-btn>
                          <q-btn flat round color="grey-7" icon="edit_note" @click="editVideo(video)" :disable="true">
                              <q-tooltip>编辑 (待实现)</q-tooltip>
                          </q-btn>
                           <q-btn flat round color="negative" icon="delete_outline" @click="confirmDeleteVideo(video)" :disable="true">
                              <q-tooltip>删除 (待实现)</q-tooltip>
                          </q-btn>
                      </q-card-actions>
                  </q-card>
              </div>
          </div>
      </div>
  
      <q-dialog v-model="showVideoPlayerDialog" persistent maximized @hide="playingVideo = null">
        <q-card class="bg-black text-white column no-wrap full-height">
          <q-toolbar class="bg-primary">
            <q-toolbar-title class="ellipsis">{{ playingVideo?.title }}</q-toolbar-title>
            <q-space />
            <q-btn flat round dense icon="close" v-close-popup />
          </q-toolbar>
          <q-card-section class="col row items-center justify-center q-pa-none" style="overflow: hidden;">
            <div v-if="showVideoPlayerDialog && playingVideo?.video_url" style="width: 90vw; max-width: 1280px; max-height: 90vh; aspect-ratio: 16/9; background-color: #111;">
              <q-video
                :src="playingVideo.video_url"
                style="width: 100%; height: 100%;"
                autoplay
                controls
                muted
              />
            </div>
            <div v-else-if="showVideoPlayerDialog && !playingVideo?.video_url" class="text-h6">视频链接无效或正在加载...</div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </q-page>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, nextTick } from 'vue';
  import { useRouter } from 'vue-router';
  import { useQuasar, date as qDateUtils } from 'quasar';
  import { mockGeneratedVideosReactive, addSocialPost } from 'src/mockDB';
  
  const router = useRouter();
  const $q = useQuasar();
  
  // Directly use the reactive array for computations
  const allVideos = computed(() => {
    return [...mockGeneratedVideosReactive.value].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  });
  
  const completedVideos = computed(() => {
    return allVideos.value.filter(v => v.status === 'completed');
  });
  
  const processingVideos = computed(() => {
    return allVideos.value.filter(v => v.status && (v.status.startsWith('pending') || v.status.startsWith('generating') || v.status === 'rendering'));
  });
  
  const showVideoPlayerDialog = ref(false);
  const playingVideo = ref(null); // Stores the video object to be played
  
  const formatDateTime = (isoString) => {
      if (!isoString) return '未知时间';
      return qDateUtils.formatDate(isoString, 'YYYY年MM月DD日 HH:mm');
  };
  
  const getVideoStatusText = (status) => {
      const map = {
          'pending_script': '等待脚本',
          'generating_script': 'AI脚本生成中',
          'script_generated': '脚本就绪',
          'rendering': '视频渲染中',
          'failed_script': '脚本失败',
          'failed_render': '渲染失败'
      };
      return map[status] || status || '未知状态';
  };
  
  const playVideo = (video) => {
    if (video && video.video_url) {
      let videoPath = video.video_url;
      if (!videoPath.startsWith('/')) { // Ensure path is absolute from public
          videoPath = `/${videoPath.replace(/^mock_media\//, 'mock_media/')}`;
      }
      console.log('Playing video:', video.title, 'URL:', videoPath);
      playingVideo.value = { ...video, video_url: videoPath };
      nextTick(() => { showVideoPlayerDialog.value = true; });
    } else {
      $q.notify({ type: 'negative', message: '无法播放：视频链接无效。' });
    }
  };
  
  const handleThumbnailError = (video) => {
      console.warn('Thumbnail load error for:', video.title, video.thumbnail_url);
      // To make the v-else for generic icon show up, we need a way to tell Vue
      // that this specific video's thumbnail is in an error state.
      // We can add a temporary flag to the video object in the *local computed array*
      // but this won't persist if `completedVideos` recomputes from scratch.
      // A more robust way would be to have a separate ref for error states if needed,
      // or ensure mockDb.js returns a clearly invalid/placeholder URL for errored thumbs.
      // For now, the q-img's own error slot or just letting it be blank is an option.
      // The `e.target.src = '/mock_assets/media_error.png'` from your previous code is a good fallback.
      // Let's ensure the v-else condition catches this by making thumbnail_url truly invalid.
      const videoInArray = completedVideos.value.find(v => v.id === video.id);
      if (videoInArray) {
          videoInArray.thumbnail_error = true; // Add a flag
          // Force re-render if Vue doesn't pick up deep changes in computed arrays easily
          // This is a bit of a hack for non-store based reactivity on array items
          // completedVideos.value = [...completedVideos.value];
      }
  };
  
  
  const openShareDialog = (video) => {
  if (!video || !video.id) {
    console.error("Video data is invalid for sharing.", video);
    $q.notify({ type: 'negative', message: '无法分享此视频，数据不完整。' });
    return;
  }

  $q.dialog({
    title: `分享影像《${video.title || '无标题影像'}》`,
    message: '请输入您的分享感言：',
    prompt: {
      model: '', // 输入框的初始值
      type: 'textarea',
      isValid: val => val.length <= 280,
      counter: true
    },
    cancel: {
        label: '取消',
        color: 'grey'
    },
    persistent: true, // 防止点击外部关闭
    ok: {
        label: '发布到社交圈',
        color: 'primary'
    }
  }).onOk(data => { // data 是用户在 prompt 中输入的文本
    console.log('分享内容:', data, '视频对象:', video);
    const currentUser = JSON.parse(localStorage.getItem('mockUserData')); // 假设登录时存储了用户信息

    if (!currentUser) {
        $q.notify({ type: 'negative', message: '无法获取用户信息，请重新登录后尝试。' });
        return;
    }
    if (!video.video_url) {
        $q.notify({ type: 'negative', message: '该视频没有有效的播放链接，无法分享。' });
        return;
    }

    // 调用 mockDb.js 中的 addSocialPost 函数
    const newPost = addSocialPost({
      author_id: currentUser.id || 'unknown_user_id',
      author_name: currentUser.name || '匿名用户',
      author_avatar_url: currentUser.avatar_url || '/mock_assets/avatars/default_avatar.png',
      video_id_ref: video.id, // 引用原始视频的ID
      video_title: video.title,
      video_url: video.video_url, // 帖子中需要视频的播放链接
      video_thumbnail_url: video.thumbnail_url, // 帖子中可能需要视频的缩略图
      caption: data, // 用户输入的分享感言
      // created_at, likes, comments, id 会在 addSocialPost 内部生成
    });

    if (newPost) {
        $q.notify({
            type: 'positive',
            message: '影像已成功分享到社交圈!',
            position: 'top',
            actions: [
                { label: '查看社交圈', color: 'white', handler: () => { router.push('/social-feed'); } }
            ]
        });
        // 可选：直接跳转到社交圈
        // router.push('/social-feed');
    } else {
        $q.notify({ type: 'negative', message: '分享失败，请稍后再试。'});
    }
  }).onCancel(() => {
    console.log('用户取消了分享');
  });
};
  
  const editVideo = (video) => { $q.notify({type: 'info', message: '编辑功能待实现'}); };
  const confirmDeleteVideo = (video) => { $q.notify({type: 'info', message: '删除功能待实现'}); };
  
  const goToVideoCreationStepper = (videoJob) => {
      router.push({ name: 'VideoCreation', query: { jobId: videoJob.id } });
  };
  
  onMounted(() => {
      console.log("VideoLibraryPage Mounted. Completed videos:", completedVideos.value.length, "Processing:", processingVideos.value.length);
      // ... (onMounted logic for creationSuccess notification - unchanged)
  });
  
  </script>
  
  <style scoped lang="scss">
  .video-card {
    display: flex;
    flex-direction: column;
  }
  .video-card-link { // Makes the whole card area above actions clickable for playVideo
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 70px; /* Adjust this if your q-card-actions height is different */
      z-index: 1; /* Above thumbnail image content, below icons on thumbnail */
      cursor: pointer;
  }

  .video-actual-thumbnail { // 应用到 q-img
  .q-img__content {
    // 确保内容层不会有意外的背景色完全覆盖图片
    // background: transparent !important; // 强制内容层背景透明，让图片透出来
    // 或者只让包含文字和图标的子元素有背景
    display: flex;
    flex-direction: column;
    justify-content: space-between; // 让标题在底部，图标在中间
  }

  // 针对标题背景和播放按钮的定位可能需要更精细的调整
  // 如果上面的方法导致标题和按钮位置不对，可以这样：
  // .q-img__content > .absolute-bottom { // 只给标题栏半透明背景
  //   // bg-black-transparent 已经做了这个，这里是确认
  // }
  .q-img__content > .thumbnail-play-icon { // 确保播放按钮在最上层
    z-index: 1;
  }
  .q-img__image { // 确保图片本身是可见的
      opacity: 1 !important;
      visibility: visible !important;
  }
}
  
  .video-thumbnail-container {
    position: relative;
    overflow: hidden;
    border-radius: 4px 4px 0 0; /* Match card's top rounding */
    background-color: $grey-2; /* Fallback background */
  
    &:hover .thumbnail-play-icon,
    &:hover .thumbnail-play-icon-fallback {
      opacity: 0.9;
      transform: translate(-50%, -50%) scale(1.1);
    }
  }
  
//   .video-actual-thumbnail {
//       width: 100%;
//       height: 100%;
//       display: block; /* Ensure q-img behaves as a block */
//   }
  
  .thumbnail-play-icon, .thumbnail-play-icon-fallback {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.6;
    transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
    pointer-events: none; /* So it doesn't interfere with the @click on container */
    color: white; /* Make play icon more visible */
    filter: drop-shadow(0 0 3px rgba(0,0,0,0.7)); /* Add a slight shadow for better visibility */
  }
  .thumbnail-play-icon-fallback {
      color: $grey-7;
      filter: none;
  }
  
  .bg-black-transparent {
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 4px 8px;
  }
  
  .ellipsis-2-lines {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2; /* Standard property */
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.5em; /* Adjust for your font */
    max-height: 3em;   /* line-height * 2 */
  }
  </style>