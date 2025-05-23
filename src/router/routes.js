const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'create-anchor', component: () => import('pages/CreateAnchorPage.vue') },
      { path: 'anchors/:id', component: () => import('pages/AnchorDetailPage.vue'), name: 'AnchorDetail' }, // 给路由命名方便跳转
      { path: 'video-creation', component: () => import('pages/VideoCreationPage.vue'), name: 'VideoCreation' },
      { path: 'video-library', component: () => import('pages/VideoLibraryPage.vue'), name: 'VideoLibrary' } ,// 先把影像库的路由也加上
      { path: 'character-library', component: () => import('pages/CharacterLibraryPage.vue'), name: 'CharacterLibrary', meta: { requiresAuth: true } }, // 示例：添加人物库路由
      { path: 'social-feed', component: () => import('pages/SocialFeedPage.vue'), name: 'SocialFeed', meta: { requiresAuth: true } }, // 示例：添加社交圈路由
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
