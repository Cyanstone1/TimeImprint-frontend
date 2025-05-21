// src/layouts/MainLayout.vue
<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title>
          时光印记
        </q-toolbar-title>
        <div v-if="isLoggedIn && currentUser">
          <q-avatar size="md" class="q-mr-sm cursor-pointer" @click="promptProfileSetup">
            <img :src="currentUser.avatar_url || '/mock_assets/avatars/default_avatar.png'">
            <q-tooltip>编辑个人信息</q-tooltip>
          </q-avatar>
          <span class="q-mr-md gt-xs">{{ currentUser.name }}</span>
          <q-btn flat label="登出" @click="handleLogout" />
        </div>
        <q-btn v-else flat label="登录" to="/login" />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-grey-1"
    >
      <q-list>
        <q-item-label header class="text-grey-8">
          导航菜单
        </q-item-label>

        <q-item clickable v-ripple to="/" exact>
          <q-item-section avatar> <q-icon name="map" /> </q-item-section>
          <q-item-section>首页 (地图)</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/create-anchor">
          <q-item-section avatar> <q-icon name="add_location_alt" /> </q-item-section>
          <q-item-section>创建新锚点</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/video-creation">
          <q-item-section avatar> <q-icon name="movie_creation" /> </q-item-section>
          <q-item-section>影像创作</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/video-library" :disable="true"> <q-item-section avatar> <q-icon name="video_library" /> </q-item-section>
          <q-item-section>我的影像</q-item-section>
          <q-tooltip>功能开发中</q-tooltip>
        </q-item>
         <q-item clickable v-ripple to="/social-feed" :disable="true">
          <q-item-section avatar> <q-icon name="dynamic_feed" /> </q-item-section>
          <q-item-section>社交圈</q-item-section>
          <q-tooltip>功能开发中</q-tooltip>
        </q-item>
        <q-item clickable v-ripple @click="navigateToCharacterLibrary" :disable="!isLoggedIn">
          <q-item-section avatar> <q-icon name="people" /> </q-item-section>
          <q-item-section>我的人物库</q-item-section>
           <q-tooltip v-if="!isLoggedIn">请先登录</q-tooltip>
        </q-item>
         <q-item clickable v-ripple @click="promptProfileSetup" v-if="isLoggedIn">
            <q-item-section avatar> <q-icon name="account_circle" /> </q-item-section>
            <q-item-section>个人信息设置</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-dialog v-model="showProfileSetupDialog" persistent>
      <q-card style="width: 400px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">{{ profileDialogTitle }}</div>
          <div v-if="isInitialProfileSetup" class="text-caption text-grey-7">为了更好的体验，并让AI能更好地识别您，请上传您的头像。</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-center q-mb-md">
            <!-- <q-avatar size="100px" font-size="52px" color="grey-4" text-color="white" icon="person">
              <img v-if="newAvatarPreview || currentUser?.avatar_url" :src="newAvatarPreview || currentUser?.avatar_url">
            </q-avatar> -->
            <q-avatar size="100px" color="grey-3" text-color="white">
              <img
                v-if="newAvatarPreview || (currentUser && currentUser.avatar_url && !currentUser.avatar_url.includes('default_avatar.png'))"
                :src="newAvatarPreview || currentUser.avatar_url"
                alt="用户头像"
                style="object-fit: cover; width: 100%; height: 100%; border-radius: inherit;"
                @error="(e) => {
                  console.warn('Avatar image load error in dialog:', e.target.src);
                  // 当图片加载失败时，可以尝试隐藏img标签，让QAvatar的icon或背景色显示
                  e.target.style.display = 'none';
                }"
              >
              <q-icon name="person" v-else />
            </q-avatar>
          </div>
          <q-file
            v-model="newAvatarFile"
            label="选择头像图片"
            filled
            dense
            clearable
            accept="image/*"
            @update:model-value="handleNewAvatarSelection"
            class="q-mb-sm"
          >
            <template v-slot:prepend> <q-icon name="photo_camera" /> </template>
          </q-file>
          <q-input
            v-model="editableUserName"
            label="昵称"
            filled
            dense
            :rules="[val => !!val && val.trim() !== '' || '昵称不能为空']"
          />
          <div class="text-caption q-mt-xs text-grey-6">当前用户: {{ currentUser?.name || '未登录' }}</div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="grey" v-close-popup @click="cancelProfileUpdate" />
          <q-btn label="保存信息" color="primary" @click="saveUserProfile" :disable="!isProfileFormValid"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { addMockCharacter, mockCharactersReactive } from 'src/mockDB';

const router = useRouter();
const $q = useQuasar();

const leftDrawerOpen = ref(false);
const isLoggedIn = ref(false);
const currentUser = ref(null); // { id, name, avatar_url, embedding }

const showProfileSetupDialog = ref(false);
const newAvatarFile = ref(null);       // 用于 QFile v-model
const newAvatarPreview = ref(null);    // 用于头像预览 Data URL
const editableUserName = ref('');      // 用于编辑对话框中的昵称
const isInitialProfileSetup = ref(false); // 标记是否为首次强制设置

const profileDialogTitle = computed(() => isInitialProfileSetup.value ? '请完善您的初始信息' : '编辑个人信息');
const isProfileFormValid = computed(() => {
    if (isInitialProfileSetup.value) { // 首次设置必须有头像和昵称
        return !!newAvatarFile.value && !!editableUserName.value && editableUserName.value.trim() !== '';
    }
    // 编辑时，至少要有昵称，头像可以不改
    return !!editableUserName.value && editableUserName.value.trim() !== '';
});


const toggleLeftDrawer = () => { leftDrawerOpen.value = !leftDrawerOpen.value; };

const handleLogout = () => {
  isLoggedIn.value = false;
  currentUser.value = null;
  localStorage.removeItem('mockUserToken');
  localStorage.removeItem('mockUserData');
  // TODO (Pinia): authStore.logout();
  router.push('/login');
};

const updateLoginStateAndCheckProfile = () => {
  const token = localStorage.getItem('mockUserToken');
  const userDataString = localStorage.getItem('mockUserData');

  if (token && userDataString) {
    isLoggedIn.value = true;
    try {
      currentUser.value = JSON.parse(userDataString);
      editableUserName.value = currentUser.value.name; // 初始化编辑框的昵称

      // 确保当前登录用户在人物库中
      let userChar = mockCharactersReactive.value.find(c => c.is_user_self && c.name === currentUser.value.name);
      if (!userChar) {
        userChar = addMockCharacter({
            name: currentUser.value.name,
            avatar_url: currentUser.value.avatar_url, // 可能初始时没有
            embedding: `emb_${currentUser.value.name.toLowerCase()}_real_user`,
            is_user_self: true
        });
         // 如果新加入，更新 localStorage 中的 user 信息 (特别是 ID 和 embedding)
        currentUser.value.avatar_url = userChar.avatar_url; // 使用来自人物库的头像（可能刚被设为默认）
        currentUser.value.embedding = userChar.embedding; // 假设 embedding 在 addMockCharacter 中生成
        // currentUser.value.id = userChar.id; // 如果登录时没有唯一用户ID，可以从人物库获取
        localStorage.setItem('mockUserData', JSON.stringify(currentUser.value));
      } else {
        // 如果已在人物库，确保本地 currentUser 的头像与人物库一致（如果人物库更新了）
        if (userChar.avatar_url && currentUser.value.avatar_url !== userChar.avatar_url) {
            currentUser.value.avatar_url = userChar.avatar_url;
            localStorage.setItem('mockUserData', JSON.stringify(currentUser.value));
        }
      }

      // 检查头像是否有效 (不是默认头像或空)
      if (!currentUser.value.avatar_url || currentUser.value.avatar_url.includes('default_avatar.png')) {
         console.log("MainLayout: User profile (avatar) is default or missing. Prompting setup.");
         isInitialProfileSetup.value = true; // 标记为首次强制设置
         showProfileSetupDialog.value = true;
      } else {
        console.log("MainLayout: User profile seems complete.");
        isInitialProfileSetup.value = false;
        showProfileSetupDialog.value = false; // 确保如果之前是 true，现在关闭
      }

    } catch (e) {
      console.error("Error parsing user data or checking profile:", e);
      handleLogout(); // 数据有问题，强制登出
    }
  } else {
    isLoggedIn.value = false;
    currentUser.value = null;
    showProfileSetupDialog.value = false;
  }
};

const promptProfileSetup = () => {
    if (currentUser.value) {
        editableUserName.value = currentUser.value.name; // 加载当前昵称
        newAvatarFile.value = null; // 清空上次选择
        newAvatarPreview.value = currentUser.value.avatar_url; // 显示当前头像作为预览
    }
    isInitialProfileSetup.value = !currentUser.value?.avatar_url || currentUser.value.avatar_url.includes('default_avatar.png');
    showProfileSetupDialog.value = true;
};

const handleNewAvatarSelection = (file) => {
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => { newAvatarPreview.value = e.target.result; };
    reader.readAsDataURL(file);
    newAvatarFile.value = file;
  } else {
    newAvatarPreview.value = currentUser.value?.avatar_url; // 没有选择新文件，恢复显示当前头像
    newAvatarFile.value = null;
  }
};

const saveUserProfile = () => {
  if (!currentUser.value || !editableUserName.value || editableUserName.value.trim() === '') {
      $q.notify({type: 'negative', message: '昵称不能为空'});
      return;
  }

  let finalAvatarUrlToSave = currentUser.value.avatar_url;

  if (newAvatarFile.value) {
    // Mock: 假设新头像是 newAvatarFile.value.name，并放在特定目录下
    // 真实场景：这里会调用上传API，获取返回的URL
    finalAvatarUrlToSave = `/mock_assets/avatars/${newAvatarFile.value.name}`; // 确保这个文件存在于public下
    console.log(`Mock User Profile: New avatar selected. Assumed path: ${finalAvatarUrlToSave}`);
    // 您需要手动将用户选择的图片复制到 public/mock_assets/avatars/ 并使用选择时的文件名
    // 例如，如果用户选择了 "my_photo.png"，您需要确保 public/mock_assets/avatars/my_photo.png 存在
    // 为了简单演示，我们也可以固定一个已存在的mock头像文件名
    // finalAvatarUrlToSave = '/mock_assets/avatars/xiaoming_custom.jpg'; // 假设这个文件存在
  } else if (isInitialProfileSetup.value) { // 首次设置且没有选择新头像
      $q.notify({type: 'negative', message: '首次设置请上传头像'});
      return;
  }

  // 更新或添加用户到人物库
  const updatedCharacter = addMockCharacter({
    name: editableUserName.value.trim(), // 使用编辑后的昵称
    avatar_url: finalAvatarUrlToSave,
    embedding: currentUser.value.embedding || `emb_${editableUserName.value.trim().toLowerCase()}_real_user_updated`, // 更新或保持
    is_user_self: true
  });

  // 更新 localStorage 中的 currentUser
  currentUser.value.name = updatedCharacter.name;
  currentUser.value.avatar_url = updatedCharacter.avatar_url;
  currentUser.value.embedding = updatedCharacter.embedding;
  localStorage.setItem('mockUserData', JSON.stringify(currentUser.value));

  $q.notify({ type: 'positive', message: '个人信息已更新！', position: 'top' });
  showProfileSetupDialog.value = false;
  newAvatarFile.value = null; // 清理
  newAvatarPreview.value = null;
  isInitialProfileSetup.value = false; // 完成了初始设置
};

const cancelProfileUpdate = () => {
    newAvatarFile.value = null;
    newAvatarPreview.value = null;
    // 如果是首次强制设置，且用户没有完成（没有有效头像），则不应该轻易关闭
    if (isInitialProfileSetup.value && (!currentUser.value?.avatar_url || currentUser.value.avatar_url.includes('default_avatar.png'))) {
        $q.notify({type: 'warning', message: '为了完整体验，建议您上传头像。'});
        // return; // 可以考虑不关闭对话框
    }
    showProfileSetupDialog.value = false;
};

const navigateToCharacterLibrary = () => {
    // router.push('/character-library'); // 假设有这个路由
    $q.notify("跳转到人物库页面 (待实现)");
};

onMounted(() => {
  updateLoginStateAndCheckProfile();
  window.addEventListener('mock-login-success', (event) => {
    isLoggedIn.value = true;
    currentUser.value = event.detail.user;
    editableUserName.value = currentUser.value.name;
    updateLoginStateAndCheckProfile(); // 登录后也检查profile
  });
});

onBeforeUnmount(() => {
    window.removeEventListener('mock-login-success', (event) => {
        isLoggedIn.value = true;
        currentUser.value = event.detail.user;
        editableUserName.value = currentUser.value.name;
        updateLoginStateAndCheckProfile();
    });
});
</script>