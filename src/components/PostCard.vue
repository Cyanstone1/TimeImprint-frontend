// src/components/PostCard.vue
<template>
  <q-card class="q-mb-lg post-card" flat bordered v-if="postData">
    <q-item>
      <q-item-section avatar>
        <q-avatar>
          <img :src="postData.author_avatar_url || '/mock_assets/avatars/default_avatar.png'"
               @error="(e) => e.target.src='/mock_assets/avatars/default_avatar.png'">
        </q-avatar>
      </q-item-section>
      <q-item-section>
        <q-item-label class="text-weight-bold">{{ postData.author_name || '匿名用户' }}</q-item-label>
        <q-item-label caption>{{ formatDisplayDate(postData.created_at) }}</q-item-label>
      </q-item-section>
      <q-item-section side top>
        <q-btn flat round dense icon="more_vert" >
          <q-tooltip>更多选项</q-tooltip>
          </q-btn>
      </q-item-section>
    </q-item>

    <q-card-section class="q-pt-none caption-text">
      <p style="white-space: pre-wrap; word-break: break-word;">{{ postData.caption }}</p>
    </q-card-section>

    <q-card-section v-if="postData.video_url" class="q-pa-none video-section">
      <q-video
        :src="postData.video_url"
        style="width: 100%; aspect-ratio: 16/9; border-top: 1px solid #eee; border-bottom: 1px solid #eee;"
        controls
        :poster="postData.video_thumbnail_url || ''" 
        preload="metadata" 
      />
    </q-card-section>
    <div v-else-if="postData.video_title" class="q-pa-md text-grey-7 text-center">
        影像： {{postData.video_title}} (无法加载视频预览)
    </div>


    <q-card-actions align="around" class="text-grey-8 action-buttons">
      <q-btn flat round :icon="localIsLiked ? 'favorite' : 'favorite_border'" :color="localIsLiked ? 'red' : 'grey-8'" @click="handleToggleLike">
        <span class="q-ml-xs text-caption">{{ localLikes }}</span>
        <q-tooltip>{{ localIsLiked ? '取消点赞' : '点赞' }}</q-tooltip>
      </q-btn>
      <q-btn flat round icon="chat_bubble_outline" @click="toggleCommentsSection">
         <span class="q-ml-xs text-caption">{{ localComments.length || 0 }}</span>
        <q-tooltip>评论</q-tooltip>
      </q-btn>
      <q-btn flat round icon="share" @click="shareThisPost" :disable="true">
        <q-tooltip>分享 (待实现)</q-tooltip>
      </q-btn>
    </q-card-actions>

    <q-slide-transition>
      <div v-show="showComments">
        <q-separator />
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">评论 ({{ localComments.length }})</div>
          <div v-if="localComments.length > 0" class="q-mb-md" style="max-height: 200px; overflow-y: auto;">
            <q-list dense>
              <q-item v-for="comment in localComments" :key="comment.id" class="q-py-xs comment-item">
                <q-item-section avatar top style="min-width: 36px; padding-right: 8px;">
                  <q-avatar size="sm">
                    <img :src="comment.author_avatar || '/mock_assets/avatars/default_avatar.png'">
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <div>
                    <span class="text-weight-medium" style="font-size: 0.8rem;">{{ comment.author_name }}</span>
                    <span class="text-caption text-grey-6 q-ml-xs" style="font-size: 0.7rem;">{{ formatDisplayDate(comment.created_at, true) }}</span>
                  </div>
                  <div style="font-size: 0.85rem; white-space: pre-wrap; word-break: break-word;">{{ comment.text }}</div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
          <div v-else class="text-caption text-grey-6 q-my-sm">暂无评论，快来抢沙发吧！</div>
          <q-input
            v-model="newCommentText"
            placeholder="发表你的看法..."
            dense
            outlined
            autogrow
            @keyup.enter.stop.prevent="submitComment"
          >
            <template v-slot:append>
              <q-btn round dense flat icon="send" @click="submitComment" :disable="!newCommentText.trim()"/>
            </template>
          </q-input>
        </q-card-section>
      </div>
    </q-slide-transition>
  </q-card>
</template>

<script setup>
import { ref, computed, watch, toRefs } from 'vue'; // 引入 toRefs
import { date as qDateUtils, useQuasar } from 'quasar';
import { toggleLikePost as mockToggleLike, addCommentToPost as mockAddComment, mockSocialFeedPostsReactive } from 'src/mockDB';

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
});

const $q = useQuasar();
const newCommentText = ref('');
const showComments = ref(false);

// 为了使 prop 的内部属性（如 likes, comments, liked_by）在本地修改后能响应UI，
// 我们创建本地的 ref，并在 prop 更新时同步它们。
// 或者，更好的做法是，当 mockDb 中的数据更新时，依赖于整个 PostCard 组件因 prop 更新而重渲染。
// 这里我们采用一个混合方法：本地 ref 用于即时 UI 反馈，同时操作 mockDb。

const postData = ref(JSON.parse(JSON.stringify(props.post))); // 创建一个本地深拷贝副本

// 监听外部 prop 的变化，以更新本地副本 (例如，如果父列表排序或过滤)
watch(() => props.post, (newPost) => {
  postData.value = JSON.parse(JSON.stringify(newPost));
  // 更新本地点赞和评论状态，以防外部数据源变化 (例如其他用户点赞)
  localLikes.value = newPost.likes || 0;
  localIsLiked.value = newPost.liked_by && newPost.liked_by.includes(currentUser.value.id);
  localComments.value = newPost.comments ? [...newPost.comments].sort((a,b) => new Date(a.created_at) - new Date(b.created_at)) : [];
}, { deep: true });


const localLikes = ref(props.post.likes || 0);
const localComments = ref(props.post.comments ? [...props.post.comments].sort((a,b) => new Date(a.created_at) - new Date(b.created_at)) : []); // 评论按时间升序

const currentUser = computed(() => {
    const userData = localStorage.getItem('mockUserData');
    return userData ? JSON.parse(userData) : { id: `guest_${Date.now()}` }; // 为未登录用户生成临时ID
});

const isOwnPost = computed(() => { // 这个暂时用不上，因为没有删除和编辑的实际操作
  return postData.value.author_id === currentUser.value.id;
});

const localIsLiked = ref(props.post.liked_by && props.post.liked_by.includes(currentUser.value.id));


const formatDisplayDate = (isoDate, isComment = false) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);

  if (diffSeconds < 5) return '刚刚';
  if (diffSeconds < 60) return `${diffSeconds}秒前`;
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (isComment && diffHours < 48 && now.getDate() - date.getDate() === 1) return '昨天 ' + qDateUtils.formatDate(date, 'HH:mm');
  if (now.getFullYear() === date.getFullYear()) return qDateUtils.formatDate(date, 'MM月DD日 HH:mm');
  return qDateUtils.formatDate(date, 'YYYY年MM月DD日');
};


const handleToggleLike = () => {
    const success = mockToggleLike(postData.value.id, currentUser.value.id);
    if (success) {
        // 更新本地状态以立即反馈UI
        const originalPostInDb = mockSocialFeedPostsReactive.value.find(p => p.id === postData.value.id);
        if (originalPostInDb) {
            localLikes.value = originalPostInDb.likes;
            localIsLiked.value = originalPostInDb.liked_by && originalPostInDb.liked_by.includes(currentUser.value.id);
        }
    } else {
        $q.notify({type: 'negative', message: '点赞操作失败 (mock)'});
    }
};

const toggleCommentsSection = () => {
  showComments.value = !showComments.value;
};

const submitComment = () => {
  if (!newCommentText.value.trim()) return;
  const addedComment = mockAddComment(postData.value.id, newCommentText.value.trim());
  if (addedComment) {
    // 更新本地评论列表以即时反馈
    const originalPostInDb = mockSocialFeedPostsReactive.value.find(p => p.id === postData.value.id);
     if (originalPostInDb) {
        localComments.value = originalPostInDb.comments ? [...originalPostInDb.comments].sort((a,b) => new Date(a.created_at) - new Date(b.created_at)) : [];
     }
    newCommentText.value = '';
  } else {
    $q.notify({type: 'negative', message: '评论失败 (mock)'});
  }
};

const shareThisPost = () => { $q.notify("分享功能待实现 (mock)"); };

</script>

<style scoped lang="scss">
.post-card {
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  border-radius: 8px; /* 给卡片一些圆角 */
}
.caption-text p {
    margin-bottom: 0; /* 移除段落的默认下边距 */
    line-height: 1.6;
}
.video-section {
    background-color: #000;
}
.action-buttons .q-btn {
    font-size: 0.9rem; // 调整按钮内文字/图标大小
}
.comment-item {
    background-color: #f9f9f9;
    margin-bottom: 4px;
    border-radius: 4px;
}
</style>