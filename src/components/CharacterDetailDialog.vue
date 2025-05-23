// src/components/CharacterDetailDialog.vue
<template>
  <q-dialog :model-value="show" @update:model-value="updateShow" persistent max-width="600px">
    <q-card v-if="characterData">
      <q-toolbar class="bg-primary text-white">
        <q-avatar size="md" class="q-mr-sm">
          <img :src="characterData.avatar_url || '/mock_assets/avatars/default_avatar.png'"
               @error="(e) => e.target.src='/mock_assets/avatars/default_avatar.png'">
        </q-avatar>
        <q-toolbar-title>
          <span v-if="!isEditingName">{{ characterData.name || '人物详情' }}</span>
          <q-input
            v-else
            v-model="editableName"
            dense
            autofocus
            dark
            color="white"
            input-style="font-size: 1.25rem; font-weight: 500;"
            @keyup.enter="saveName"
            @blur="isEditingName = false"
          />
        </q-toolbar-title>
        <q-btn flat round dense icon="edit" @click="toggleEditName" v-if="!isEditingName && !characterData.is_user_self"/>
        <q-btn flat round dense icon="save" @click="saveName" v-if="isEditingName"/>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-xs-12 col-sm-4 text-center">
            <q-avatar size="120px" rounded class="shadow-2">
              <img :src="newAvatarPreview || characterData.avatar_url || '/mock_assets/avatars/default_avatar.png'"
                   @error="(e) => e.target.src='/mock_assets/avatars/default_avatar.png'">
            </q-avatar>
            <q-file
              v-model="newAvatarFile"
              label="更换头像"
              dense
              clearable
              accept="image/*"
              @update:model-value="handleAvatarFileSelection"
              class="q-mt-sm"
              v-if="!characterData.is_user_self"
            >
              <template v-slot:prepend><q-icon name="photo_camera" /></template>
            </q-file>
            <q-btn
              v-if="newAvatarFile && !characterData.is_user_self"
              label="上传新头像"
              color="secondary"
              dense
              @click="uploadNewAvatar"
              class="q-mt-xs full-width"
              size="sm"
            />
          </div>
          <div class="col-xs-12 col-sm-8">
            <q-input
              v-model="editableRelationLabel"
              label="我对TA的备注/关系"
              dense
              outlined
              autogrow
              class="q-mb-sm"
              :readonly="characterData.is_user_self"
            />
            <div v-if="characterData.is_user_self" class="text-caption text-grey-7">（这是您自己，备注在此处不可编辑）</div>

            <div class="text-caption text-grey-7 q-mt-sm">人物ID (仅供参考): {{ characterData.id }}</div>
            <div v-if="characterData.system_user_id" class="text-caption text-green-7 q-mt-xs">
              <q-icon name="verified_user" /> 已关联到平台用户: {{ characterData.system_user_id }}
            </div>
            <q-btn
                v-else-if="!characterData.is_user_self"
                label="关联到平台用户"
                icon="link"
                color="info"
                outline
                dense
                size="sm"
                class="q-mt-sm"
                @click="promptLinkToSystemUser"
                :disable="true"
            >
                <q-tooltip>功能待实现</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="text-subtitle1 q-mb-xs">相关记忆片段</div>
        <div v-if="relatedMemories.length > 0" class="related-memories-container" style="max-height: 300px; overflow-y: auto;">
          <q-list bordered separator>
            <q-item v-for="memory in relatedMemories" :key="memory.anchorId + (memory.mediaId || '')" clickable v-ripple @click="goToMemory(memory)">
              <q-item-section avatar v-if="memory.thumbnail">
                <q-avatar rounded>
                  <img :src="memory.thumbnail" @error="(e) => e.target.src='/mock_assets/media_error.png'">
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="ellipsis">{{ memory.anchorName }}</q-item-label>
                <q-item-label caption class="ellipsis">
                  {{ memory.mediaCaption || memory.anchorDescription || '点击查看详情' }}
                </q-item-label>
                <q-item-label caption class="text-grey-6">{{ formatDateTime(memory.date) }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div v-else class="text-caption text-grey-7">暂无与此人相关的记忆片段。</div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn label="关闭" color="grey-7" flat v-close-popup />
        <q-btn label="保存更改" color="primary" @click="saveCharacterChanges" v-if="!characterData.is_user_self" :disable="!isFormDirty"/>
      </q-card-actions>
    </q-card>
    <q-card v-else>
        <q-card-section class="text-center">
            <q-spinner-dots color="primary" size="40px" />
            <p>加载人物信息...</p>
        </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue';
import { useQuasar, date as qDateUtils } from 'quasar';
import { useRouter } from 'vue-router';
import { mockAnchorsReactive, mockCharactersReactive, addMockCharacter, updateMediaInMockAnchor, findMockCharacterById } from 'src/mockDB'; // 确保导入了 findMockCharacterById

const props = defineProps({
  modelValue: Boolean, // 用于 v-model 控制对话框显隐
  characterId: String  // 传入要显示/编辑的人物ID
});

const emit = defineEmits(['update:modelValue', 'updated']);

const $q = useQuasar();
const router = useRouter();

const show = ref(props.modelValue);
const characterData = ref(null); // 存储从mockDb加载的人物数据副本
const editableName = ref('');
const editableRelationLabel = ref('');
const newAvatarFile = ref(null);
const newAvatarPreview = ref(null);
const isEditingName = ref(false);

const isFormDirty = computed(() => {
    if (!characterData.value) return false;
    return (editableName.value !== characterData.value.name) ||
           (editableRelationLabel.value !== characterData.value.relation_label) ||
           !!newAvatarFile.value;
});

const updateShow = (value) => {
  emit('update:modelValue', value);
  if (!value) { // 对话框关闭时重置
    resetFormState();
  }
};

const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  return qDateUtils.formatDate(isoString, 'YYYY年M月D日 HH:mm'); // 您可以根据需要调整格式
};

const resetFormState = () => {
    // characterData.value = null; // 不重置这个，否则对话框内容会闪烁
    isEditingName.value = false;
    newAvatarFile.value = null;
    newAvatarPreview.value = null;
    // editableName 和 editableRelationLabel 会在 watch(props.characterId) 中重新加载
};

watch(() => props.modelValue, (newValue) => {
  show.value = newValue;
  if (newValue && props.characterId) {
    loadCharacterData();
  } else if (!newValue) {
    resetFormState();
  }
});

watch(() => props.characterId, (newId) => {
  if (show.value && newId) { // 只有当对话框可见且有新ID时才加载
    loadCharacterData();
  }
});

const loadCharacterData = () => {
  if (!props.characterId) {
      characterData.value = null; // 清空之前的数据
      return;
  }
  const char = findMockCharacterById(props.characterId);
  if (char) {
    characterData.value = JSON.parse(JSON.stringify(char)); // 深拷贝，避免直接修改mockDb源数据
    editableName.value = characterData.value.name || '';
    editableRelationLabel.value = characterData.value.relation_label || '';
    newAvatarPreview.value = null; // 清空上次头像预览
    newAvatarFile.value = null;
    console.log("CharacterDetailDialog: Loaded character data", characterData.value);
  } else {
    console.error("CharacterDetailDialog: Character not found with ID", props.characterId);
    characterData.value = null;
    $q.notify({type: 'negative', message: '加载人物信息失败！'});
    emit('update:modelValue', false); // 关闭对话框
  }
};

const toggleEditName = () => {
    if (characterData.value?.is_user_self) return; // 不允许编辑自己的名字（通常在个人中心改）
    isEditingName.value = !isEditingName.value;
    if (isEditingName.value) {
        nextTick(() => {
            // 尝试聚焦到 q-input (如果q-input有ref的话)
        });
    }
};

const saveName = () => {
    if (characterData.value?.is_user_self) {
        isEditingName.value = false;
        return;
    }
    if (editableName.value.trim() === '') {
        $q.notify({type: 'warning', message: '昵称不能为空'});
        return;
    }
    if (characterData.value) {
        characterData.value.name = editableName.value.trim(); // 仅更新本地副本，等待“保存更改”
    }
    isEditingName.value = false;
};

const handleAvatarFileSelection = (file) => {
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => { newAvatarPreview.value = e.target.result; };
    reader.readAsDataURL(file);
    newAvatarFile.value = file;
  } else {
    newAvatarPreview.value = null; // 清除预览
    newAvatarFile.value = null;
  }
};

const uploadNewAvatar = () => {
    if (!newAvatarFile.value || !characterData.value) return;
    // Mock: 假设新头像是 newAvatarFile.value.name，并放在特定目录下
    const newMockAvatarUrl = `/mock_assets/avatars/${newAvatarFile.value.name}`;
    // 实际应用中，这里会上传文件到服务器，然后获取返回的URL
    console.log(`Mock Avatar Upload: Pretending to upload ${newAvatarFile.value.name} to ${newMockAvatarUrl}`);

    characterData.value.avatar_url = newMockAvatarUrl; // 更新本地副本的头像URL
    newAvatarFile.value = null; // 清空文件选择
    // newAvatarPreview 会因为 characterData.avatar_url 的变化而更新（如果img的src绑定的是它）
    // 但我们是优先用 newAvatarPreview，所以需要手动清除它，让img重新绑定到 characterData.avatar_url
    newAvatarPreview.value = null;
    $q.notify({ type: 'info', message: '新头像已选择，请点击“保存更改”以生效。' });
};


const saveCharacterChanges = () => {
  if (!characterData.value || characterData.value.is_user_self) {
    if(characterData.value.is_user_self) $q.notify({type: 'info', message: '您自己的信息请在个人中心修改。'});
    return;
  }

  const updates = {
    name: editableName.value.trim(),
    relation_label: editableRelationLabel.value.trim(),
    // avatar_url 会在 uploadNewAvatar 中先更新到 characterData.value.avatar_url
    avatar_url: characterData.value.avatar_url
  };

  // 调用 mockDb.js 中的 addMockCharacter (它会处理更新逻辑)
  const updatedChar = addMockCharacter({ ...characterData.value, ...updates }); // 传递完整对象以供查找和更新

  if (updatedChar) {
    $q.notify({ type: 'positive', message: `人物 "${updatedChar.name}" 信息已保存！` });
    emit('updated'); // 通知父组件数据已更新
    emit('update:modelValue', false); // 关闭对话框
  } else {
    $q.notify({ type: 'negative', message: '保存人物信息失败。' });
  }
};

const relatedMemories = computed(() => {
  if (!characterData.value || !characterData.value.id) return [];
  const personId = characterData.value.id;
  const memories = [];
  mockAnchorsReactive.value.forEach(anchor => {
    if (anchor.media && anchor.media.length > 0) {
      anchor.media.forEach(m => {
        if (m.recognized_faces && m.recognized_faces.some(f => f.person_id === personId)) {
          memories.push({
            type: 'media',
            anchorId: anchor.id,
            anchorName: anchor.name,
            mediaId: m.id,
            thumbnail: m.media_type === 'image' ? m.file_url : (m.thumbnail_url || '/mock_assets/avatars/default_avatar.png'), // 视频可能需要预生成缩略图
            mediaCaption: m.ai_description || m.user_caption || `来自锚点: ${anchor.name}`,
            date: m.uploaded_at || anchor.start_time
          });
        }
      });
    }
    // 也可以检查锚点描述或标题是否提及此人，但那就需要NLP了
    // 为了简化，只检查媒体中的人脸识别
  });
  // 按日期倒序排列相关记忆
  return memories.sort((a, b) => new Date(b.date) - new Date(a.date));
});

const goToMemory = (memory) => {
  if (memory.anchorId) {
    router.push(`/anchors/${memory.anchorId}`); // 跳转到锚点详情页
    emit('update:modelValue', false); // 关闭对话框
  }
};

const promptLinkToSystemUser = () => {
    $q.notify({type: 'info', message: '关联到平台用户功能待实现。'});
};

const formatDisplayDate = (isoString) => qDateUtils.formatDate(isoString, 'YYYY年M月D日');

</script>

<style scoped lang="scss">
.related-memories-container {
  .q-list .q-item {
    padding-top: 8px;
    padding-bottom: 8px;
  }
  .q-avatar img {
    object-fit: cover;
  }
}
</style>