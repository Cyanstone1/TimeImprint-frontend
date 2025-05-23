<template>
    <q-page padding>
      <div class="row items-center justify-between q-mb-md">
          <div class="text-h5">社交圈动态</div>
          <q-btn
              label="发布新动态 (测试)"
              color="secondary"
              icon="add_circle_outline"
              @click="testAddPost"
              size="sm"
          />
      </div>
  
      <q-pull-to-refresh @refresh="handleRefresh">
          <div v-if="isLoadingFeed" class="text-center q-pa-lg">
              <q-spinner-dots color="primary" size="40px" />
              <div>加载动态中...</div>
          </div>
          <div v-else-if="feedPosts.length > 0" class="feed-list">
              <PostCard
                  v-for="post in feedPosts"
                  :key="post.id"
                  :post="post"
                  class="q-mb-md"
              />
              <div v-if="canLoadMore" class="text-center q-my-lg">
                  <q-btn label="加载更多" @click="loadMorePosts" :loading="isLoadingMore" outline color="primary"/>
              </div>
          </div>
          <div v-else class="text-center text-grey-7 q-pa-xl">
              <q-icon name="forum" size="xl" />
              <p class="q-mt-md">社交圈还没有动态哦，快去分享你的影像吧！</p>
              <q-btn label="去影像库分享" color="primary" to="/video-library" />
          </div>
      </q-pull-to-refresh>
    </q-page>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { mockSocialFeedPostsReactive, addSocialPost, mockGeneratedVideosReactive } from 'src/mockDB';
  import PostCard from 'components/PostCard.vue'; // 确保路径正确
  
  const isLoadingFeed = ref(true); // 初始加载状态
  const isLoadingMore = ref(false); // 加载更多状态
  const postsPerPage = 5; // 示例：每页加载5条
  const currentPage = ref(1);
  
  // 直接使用从 mockDb 导入的响应式 ref，它已经是按 unshift 添加的（新的在前）
  const allMockPosts = computed(() => mockSocialFeedPostsReactive.value);
  
  const feedPosts = computed(() => {
    // 实现简单的分页逻辑
    return allMockPosts.value.slice(0, currentPage.value * postsPerPage);
  });
  
  const canLoadMore = computed(() => {
    return feedPosts.value.length < allMockPosts.value.length;
  });
  
  const loadMorePosts = () => {
    if (canLoadMore.value) {
      isLoadingMore.value = true;
      setTimeout(() => { // 模拟网络延迟
        currentPage.value++;
        isLoadingMore.value = false;
      }, 1000);
    }
  };
  
  const handleRefresh = async (done) => {
    console.log("下拉刷新社交圈...");
    isLoadingFeed.value = true;
    currentPage.value = 1; // 重置到第一页
    // 真实场景下会重新请求API
    await new Promise(resolve => setTimeout(resolve, 1500)); // 模拟API延迟
    // mockSocialFeedPostsReactive 已经是响应式的，如果mockDb有更新，这里会自动反应
    isLoadingFeed.value = false;
    done(); // 告诉 QPullToRefresh 刷新完成
  };
  
  
  // 测试函数：手动添加一个帖子以便查看效果
  const testAddPost = () => {
    const currentUser = JSON.parse(localStorage.getItem('mockUserData')) || { id: 'test_user', name: '测试用户', avatar_url: '/mock_assets/avatars/default_avatar.png' };
    const firstCompletedVideo = mockGeneratedVideosReactive.value.find(v => v.status === 'completed');
  
    if (!firstCompletedVideo) {
      alert("请先创作一个已完成的视频才能测试发布！");
      return;
    }
  
    addSocialPost({
      // author_id, author_name, author_avatar_url 会在 addSocialPost 内部从 currentUser 获取（如果已登录）
      video_id_ref: firstCompletedVideo.id,
      video_title: firstCompletedVideo.title,
      video_url: firstCompletedVideo.video_url,
      video_thumbnail_url: firstCompletedVideo.thumbnail_url,
      caption: `[测试帖子] 我刚创作的视频《${firstCompletedVideo.title}》！ ${new Date().toLocaleTimeString()}`,
    });
    currentPage.value = 1; // 添加新帖子后，回到第一页以显示最新内容
  };
  
  onMounted(() => {
      // 模拟初始加载
      isLoadingFeed.value = true;
      setTimeout(() => {
          isLoadingFeed.value = false;
          console.log("SocialFeedPage Mounted. Feed posts count:", feedPosts.value.length);
      }, 500);
  });
  
  </script>
  
  <style scoped>
  .feed-list {
    max-width: 650px; /* 控制信息流最大宽度 */
    margin: 0 auto;
  }
  </style>