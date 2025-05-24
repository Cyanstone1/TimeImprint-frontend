<template>
    <q-page padding>
      <div class="text-h5 q-mb-md">我的好友与用户搜索</div>
  
      <q-tabs v-model="tab" dense class="text-grey" active-color="primary" indicator-color="primary" align="justify" narrow-indicator>
        <q-tab name="myFriends" label="我的好友" icon="groups" />
        <q-tab name="searchUsers" label="搜索用户" icon="person_search" />
        </q-tabs>
      <q-separator />
  
      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="myFriends">
          <div class="text-h6 q-mb-sm">我的好友列表</div>
          <q-list bordered separator v-if="myFriends.length > 0">
            <q-item v-for="friend in myFriends" :key="friend.id">
              <q-item-section avatar>
                <q-avatar>
                  <img :src="friend.avatar_url || '/mock_assets/avatars/default_avatar.png'"
                       @error="(e) => e.target.src='/mock_assets/avatars/default_avatar.png'">
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ friend.name }}</q-item-label>
                <q-item-label caption>{{ friend.email || friend.id }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round dense color="negative" icon="person_remove" @click="removeFriend(friend)" :disable="true">
                  <q-tooltip>移除好友 (待实现)</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else class="text-grey-7 q-pa-md text-center">
            您还没有好友，快去“搜索用户”添加吧！
          </div>
        </q-tab-panel>
  
        <q-tab-panel name="searchUsers">
          <div class="text-h6 q-mb-sm">搜索平台用户</div>
          <q-input
            v-model="userSearchTerm"
            label="输入昵称或邮箱搜索..."
            outlined
            dense
            clearable
            @keyup.enter="executeSearch"
            class="q-mb-md"
          >
            <template v-slot:append>
              <q-btn round dense flat icon="search" @click="executeSearch" :loading="isSearching" />
            </template>
          </q-input>
          <q-list bordered separator v-if="searchResults.length > 0">
            <q-item v-for="user in searchResults" :key="user.id">
              <q-item-section avatar>
                <q-avatar>
                  <img :src="user.avatar_url || '/mock_assets/avatars/default_avatar.png'">
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ user.name }}</q-item-label>
                <q-item-label caption>{{ user.email || user.id }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  v-if="!isAlreadyFriend(user.id)"
                  label="加好友"
                  color="positive"
                  size="sm"
                  dense
                  @click="addFriend(user)"
                  :loading="addingFriendId === user.id"
                />
                <q-chip v-else dense color="green-2" text-color="positive" icon="check_circle" label="已是好友" size="sm"/>
              </q-item-section>
            </q-item>
          </q-list>
          <div v-if="searched && searchResults.length === 0" class="text-grey-7 q-pa-md text-center">
            没有找到匹配的用户。
          </div>
           <div v-if="!searched && searchResults.length === 0" class="text-grey-7 q-pa-md text-center">
            请输入关键词开始搜索。
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-page>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { useQuasar } from 'quasar';
  import {
      mockPlatformUsersReactive,
      mockFriendsReactive,
      searchPlatformUsers,
      sendFriendRequest,
      getFriends,
      isFriend,
      mockCharactersReactive, // 需要它来更新人物库中的关联
      addMockCharacter,
      findCharacterInLibraryBySystemUserId
  } from 'src/mockDB';
  
  const $q = useQuasar();
  const tab = ref('myFriends');
  const userSearchTerm = ref('');
  const searchResults = ref([]);
  const isSearching = ref(false);
  const searched = ref(false); // 标记是否执行过搜索
  const addingFriendId = ref(null); // 标记正在添加哪个好友，用于loading状态
  
  const currentUser = computed(() => {
      const userData = localStorage.getItem('mockUserData');
      return userData ? JSON.parse(userData) : { id: null };
  });
  
  const myFriends = computed(() => {
      if (currentUser.value.id) {
          return getFriends(currentUser.value.id);
      }
      return [];
  });
  
  const executeSearch = () => {
    if (!userSearchTerm.value.trim()) {
      searchResults.value = [];
      searched.value = false;
      return;
    }
    isSearching.value = true;
    searched.value = true;
    // 模拟异步搜索
    setTimeout(() => {
      searchResults.value = searchPlatformUsers(userSearchTerm.value.trim());
      isSearching.value = false;
    }, 500);
  };
  
  const isAlreadyFriend = (targetUserId) => {
      if (currentUser.value.id) {
          return isFriend(currentUser.value.id, targetUserId);
      }
      return false;
  };
  
  const addFriend = async (targetUser) => {
    if (!currentUser.value.id) {
      $q.notify({ type: 'negative', message: '请先登录！' });
      return;
    }
    addingFriendId.value = targetUser.id;
    // 模拟异步请求
    await new Promise(resolve => setTimeout(resolve, 1000));
  
    const success = sendFriendRequest(currentUser.value.id, targetUser.id);
    if (success) {
      $q.notify({ type: 'positive', message: `已发送好友请求给 ${targetUser.name} (mock中自动成为好友)` });
      // 看看人物库中是否已存在此人（可能通过照片识别但未关联系统用户）
      let characterInLib = findCharacterInLibraryBySystemUserId(targetUser.id);
      if (characterInLib) {
          // 如果已存在，更新其 system_user_id (可能之前是null) 和 relation_label
          addMockCharacter({ ...characterInLib, system_user_id: targetUser.id, relation_label: '好友' });
      } else {
          // 如果不存在，则在人物库中创建一个新条目
          addMockCharacter({
              name: targetUser.name,
              avatar_url: targetUser.avatar_url,
              system_user_id: targetUser.id,
              relation_label: '好友',
              // embedding: null // 此时我们不知道TA在“我”的照片中的面部特征
          });
      }
    } else {
      $q.notify({ type: 'negative', message: '添加好友失败 (mock)' });
    }
    addingFriendId.value = null;
    // 重新计算 myFriends (或者让响应式系统自动处理)
  };
  
  const removeFriend = (friend) => {
      $q.notify({ type: 'info', message: `移除好友 ${friend.name} 功能待实现` });
  };
  
  onMounted(() => {
    // console.log("Friends Page Mounted. Current User ID:", currentUser.value.id);
    // console.log("My Friends:", myFriends.value);
  });
  </script>
  
  <style scoped lang="scss">
  .q-tab-panel {
    padding-top: 16px;
  }
  </style>