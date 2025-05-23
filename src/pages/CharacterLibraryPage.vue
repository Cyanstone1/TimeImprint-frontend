<template>
    <q-page padding>
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h5">我的人物库</div>
        <div>
          <q-input
            v-model="searchTerm"
            dense
            outlined
            placeholder="搜索人物..."
            clearable
            class="q-mr-sm inline-block"
            style="width: 250px;"
            @update:model-value="filterCharacters"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-btn
            label="手动添加人物"
            color="primary"
            icon="person_add"
            @click="promptAddManualCharacter"
            :disable="true"
          >
             <q-tooltip>功能待实现</q-tooltip>
          </q-btn>
        </div>
      </div>
  
      <div v-if="isLoading" class="text-center q-pa-xl">
        <q-spinner-dots color="primary" size="40px" />
        <p class="q-mt-sm">加载人物库中...</p>
      </div>
  
      <div v-else-if="filteredCharacters.length > 0" class="row q-col-gutter-md">
        <div
          v-for="character in filteredCharacters"
          :key="character.id"
          class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
        >
          <q-card class="character-card q-hoverable cursor-pointer" v-ripple @click="openCharacterDetail(character)">
            <q-img
              :src="character.avatar_url || '/mock_assets/avatars/default_avatar.png'"
              :ratio="1"
              spinner-color="primary"
              @error="(e) => e.target.src = '/mock_assets/avatars/default_avatar.png'"
            >
              <template v-slot:error>
                  <div class="absolute-full flex flex-center bg-grey-4 text-white">
                      <q-icon name="person" size="lg"/>
                  </div>
              </template>
              <div v-if="character.is_user_self" class="absolute-top-right q-pa-xs">
                  <q-chip dense color="secondary" text-color="white" icon="face" label="我" size="sm"/>
              </div>
            </q-img>
            <q-card-section class="text-center">
              <div class="text-subtitle1 ellipsis">{{ character.name || '未命名' }}</div>
              <div v-if="character.relation_label && !character.is_user_self" class="text-caption text-grey-7">
                ({{ character.relation_label }})
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">
                相关记忆: {{ getMemoryCount(character.id) }} 条
              </div>
            </q-card-section>
             <q-card-actions align="center" class="q-pt-none">
               <q-btn flat dense color="primary" label="查看详情" @click.stop="openCharacterDetail(character)" />
               </q-card-actions>
          </q-card>
        </div>
      </div>
      <div v-else class="text-center text-grey-7 q-pa-xl">
        <q-icon name="sentiment_dissatisfied" size="xl" />
        <p class="q-mt-md">
          {{ searchTerm ? '没有找到匹配的人物。' : '您的人物库还是空的。在浏览照片时为人脸命名，他们就会出现在这里。' }}
        </p>
        <q-btn
          v-if="!searchTerm"
          label="去浏览我的锚点"
          color="secondary"
          outline
          to="/"
        />
      </div>
      <CharacterDetailDialog
      v-model="showDetailDialog"
      :character-id="selectedCharacterId"
      @updated="onCharacterUpdatedInLibrary"
    />
      </q-page>
  </template>
  
  <script setup>
  import { ref, computed, onMounted ,watch} from 'vue';
  import { useRouter } from 'vue-router';
  import { useQuasar } from 'quasar';
  import { mockCharactersReactive, mockAnchorsReactive, addMockCharacter } from 'src/mockDB';
  import CharacterDetailDialog from 'components/CharacterDetailDialog.vue'; // 稍后创建
  
  const router = useRouter();
  const $q = useQuasar();
  
  const isLoading = ref(true);
  const searchTerm = ref('');
  const allCharacters = ref([]); // 本地副本，用于过滤
  const filteredCharacters = ref([]);
  
  const showDetailDialog = ref(false);
  const selectedCharacterId = ref(null);

  
  
  const openCharacterDetailDialog = (character) => {
  if (character && character.id) {
    selectedCharacterId.value = character.id; // <--- 传递ID
    showDetailDialog.value = true;
  } else {
    console.error("Attempted to open detail for invalid character:", character);
  }
};

const onCharacterUpdatedInLibrary = () => {
  // 当 CharacterDetailDialog 触发了 @updated 事件后，重新加载列表
  loadCharacters(); // 假设您有这个函数来刷新 allCharacters 和 filteredCharacters
  $q.notify({ type: 'info', message: '人物库已刷新。' });
};
  // 从 mockDb 加载数据并初始化
  const loadCharacters = () => {
    isLoading.value = true;
    // mockCharactersReactive 已经是响应式的，但为了搜索，我们可能需要一个本地副本或计算属性
    // 直接使用 mockCharactersReactive 并让 computed 属性处理过滤
    // 如果直接修改 mockCharactersReactive 可能会影响其他地方，所以用 slice() 创建副本
    allCharacters.value = [...mockCharactersReactive.value].sort((a, b) => {
      if (a.is_user_self) return -1; // 把“我”放在最前面
      if (b.is_user_self) return 1;
      return (a.name || '').localeCompare(b.name || ''); // 按名字排序
    });
    filterCharacters(); // 初始化过滤
    isLoading.value = false;
  };
  
  const filterCharacters = () => {
    if (!searchTerm.value) {
      filteredCharacters.value = [...allCharacters.value];
    } else {
      const lowerSearchTerm = searchTerm.value.toLowerCase();
      filteredCharacters.value = allCharacters.value.filter(char =>
        (char.name && char.name.toLowerCase().includes(lowerSearchTerm)) ||
        (char.relation_label && char.relation_label.toLowerCase().includes(lowerSearchTerm))
      );
    }
  };
  
  const getMemoryCount = (personId) => {
    if (!personId) return 0;
    let count = 0;
    mockAnchorsReactive.value.forEach(anchor => {
      if (anchor.media && anchor.media.some(m => m.recognized_faces && m.recognized_faces.some(f => f.person_id === personId))) {
        count++;
      }
    });
    return count;
  };
  
  const openCharacterDetail = (character) => {
    // selectedCharacter.value = character;
    // showDetailDialog.value = true;
    // $q.notify(`点击了人物：${character.name} (详情功能待实现)`);
    // TODO: 弹出 CharacterDetailDialog.vue
    // 也可以直接导航到人物详情页: router.push(`/characters/${character.id}`);
    if (character && character.id) {
    selectedCharacterId.value = character.id; // 设置要传递给对话框的 characterId
    showDetailDialog.value = true;          // 打开对话框
    console.log("Opening detail dialog for character ID:", character.id);
  } else {
    console.error("CharacterLibraryPage: Attempted to open detail for invalid character:", character);
    $q.notify({type: 'negative', message: '无法查看该人物详情，数据错误。'});
  }
  };
  
  const editCharacter = (character) => {
      // openCharacterDetail(character); // 编辑通常也通过详情弹窗
      $q.notify(`编辑人物：${character.name} (待实现)`);
  };
  
  
  const promptAddManualCharacter = () => {
    $q.dialog({
      title: '手动添加人物',
      message: '请输入新人物的名称：',
      prompt: {
        model: '',
        type: 'text',
        isValid: val => val && val.trim().length > 0,
      },
      cancel: true,
      persistent: true
    }).onOk(name => {
      const newChar = addMockCharacter({
          name: name.trim(),
          avatar_url: '/mock_assets/avatars/default_avatar.png', // 手动添加的可以用默认头像，之后在详情编辑
          // system_user_id 和 relation_label 可以后续编辑
      });
      if (newChar) {
          $q.notify({ type: 'positive', message: `人物 "${newChar.name}" 已添加！` });
          loadCharacters(); // 重新加载并排序/过滤列表
      } else {
          $q.notify({ type: 'negative', message: '添加人物失败或人物已存在。'});
      }
    });
  };
  
  const onCharacterUpdated = () => {
    // 当 CharacterDetailDialog 编辑保存后，重新加载列表
    // loadCharacters();
    console.log("CharacterLibraryPage: Received 'updated' event from dialog. Reloading characters.");
    loadCharacters(); // 重新加载并排序/过滤列表
  };
  
  onMounted(() => {
    // 确保当前登录用户（小明）一定在人物库中 (MainLayout.vue 应该已经处理了)
    // console.log("CharacterLibraryPage onMounted, current characters:", mockCharactersReactive.value);
    loadCharacters();
  
    // 监听 mockCharactersReactive 的变化，以便在其他地方添加了人物后，这里也能刷新
    // 对于 ref 包裹的数组，直接 watch 其 .value
    watch(mockCharactersReactive, () => {
        console.log("CharacterLibraryPage: mockCharactersReactive changed, reloading characters.");
        loadCharacters();
    }, { deep: true });
  });
  
  </script>
  
  <style scoped lang="scss">
  .character-card {
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }
    .q-img {
      border-bottom: 1px solid rgba(0,0,0,0.05);
    }
  }
  .bg-white-transparent {
      background-color: rgba(255,255,255,0.9);
  }
  </style>