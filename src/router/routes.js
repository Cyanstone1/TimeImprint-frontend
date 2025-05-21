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
      { path: 'video-library', component: () => import('pages/VideoLibraryPage.vue'), name: 'VideoLibrary' } // 先把影像库的路由也加上
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
