<template>
    <q-page padding>
      <div class="text-h5 q-mb-md">AI 影像创作工作室</div>
  
      <q-stepper
        v-model="step"
        ref="stepper"
        color="primary"
        animated
        flat
        bordered
      >
        <q-step
          :name="1"
          title="选择素材锚点"
          icon="collections"
          :done="step > 1"
        >
          <div class="text-subtitle1 q-mb-sm">请选择您想要用来创作影像的“时空锚点”：</div>
          <div v-if="availableAnchors.length > 0" class="q-gutter-sm">
            <q-list bordered separator>
              <q-item v-for="anchor in availableAnchors" :key="anchor.id" tag="label" v-ripple>
                <q-item-section avatar>
                  <q-checkbox v-model="selectedAnchorIds" :val="anchor.id" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ anchor.name }}</q-item-label>
                  <q-item-label caption>{{ formatDateTime(anchor.start_time) }} - {{ anchor.location_coordinates.join(', ') }}</q-item-label>
                </q-item-section>
                <q-item-section side v-if="anchor.media && anchor.media.length > 0 && anchor.media[0].media_type === 'image'">
                  <q-avatar rounded size="lg">
                    <img :src="anchor.media[0].file_url" @error="(e)=> e.target.src='/mock_assets/media_error.png'">
                  </q-avatar>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
          <div v-else class="text-grey-7">
            您还没有创建任何锚点。请先 <router-link to="/create-anchor" class="text-primary">创建锚点</router-link> 并添加媒体素材。
          </div>
  
          <q-stepper-navigation>
            <q-btn @click="goToStep(2)" color="primary" label="下一步" :disable="selectedAnchorIds.length === 0" />
          </q-stepper-navigation>
        </q-step>
  
        <q-step
          :name="2"
          title="输入创作要求"
          icon="edit_note"
          :done="step > 2"
        >
          <div class="text-subtitle1 q-mb-sm">告诉AI您的创作想法：</div>
          <q-input filled v-model="creationForm.title" label="影像标题 *" class="q-mb-md" :rules="[val => !!val || '标题不能为空']"/>
          <q-input
            filled
            v-model="creationForm.prompt"
            label="主题/风格/关键内容描述 *"
            type="textarea"
            autogrow
            placeholder="例如：温馨的回忆，展现毕业旅行的快乐时光和深厚友谊，重点突出黄山日出的壮丽..."
            class="q-mb-md"
            :rules="[val => !!val || '描述不能为空']"
          />
          <q-select
            filled
            v-model="creationForm.duration_preference"
            :options="durationOptions"
            label="期望时长偏好"
            emit-value
            map-options
            class="q-mb-md"
          />
          <q-toggle v-model="creationForm.generate_subtitles" label="AI自动生成关键字幕" class="q-mb-md"/>
          <q-input filled v-model="creationForm.music_preference" label="背景音乐偏好/风格" placeholder="例如：轻快励志、温馨感人、史诗大气、纯音乐" class="q-mb-md"/>
  
          <q-stepper-navigation>
            <q-btn @click="generateAIScript" color="primary" label="生成AI脚本" :loading="isGeneratingScript" :disable="!creationForm.title || !creationForm.prompt"/>
            <q-btn flat @click="goToStep(1)" color="primary" label="上一步" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>
  
        <q-step
          :name="3"
          title="查看AI脚本与渲染"
          icon="receipt_long"
          :done="step > 3"
        >
          <div v-if="currentVideoJob && currentVideoJob.json_script">
            <div class="text-subtitle1 q-mb-sm">AI为你生成的影像脚本 (JSON预览)：</div>
            <q-card flat bordered class="q-pa-sm bg-grey-2" style="max-height: 300px; overflow-y: auto;">
              <pre style="white-space: pre-wrap; word-break: break-all;">{{ JSON.stringify(currentVideoJob.json_script, null, 2) }}</pre>
            </q-card>
            <div class="text-caption q-mt-xs text-grey-7">这是驱动视频合成的“剧本”，定义了素材顺序、时长、字幕等。</div>
          </div>
          <div v-else class="text-negative q-mb-md">
            脚本生成失败或未生成。请返回上一步重试。
          </div>
  
          <q-stepper-navigation>
            <q-btn @click="renderVideo" color="deep-orange" label="开始渲染视频" icon="movie" :loading="isRenderingVideo" :disable="!currentVideoJob || !currentVideoJob.json_script || currentVideoJob.status === 'rendering' || currentVideoJob.status === 'completed'"/>
            <q-btn flat @click="goToStep(2)" color="primary" label="修改要求" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>
  
        <q-step
          :name="4"
          title="查看成果"
          icon="theaters"
        >
          <div v-if="currentVideoJob && currentVideoJob.status === 'completed' && currentVideoJob.video_url">
              <div class="text-subtitle1 q-mb-sm">恭喜！您的影像《{{ currentVideoJob.title }}》已创作完成！</div>
              <q-video
                  :src="currentVideoJob.video_url"
                  style="width: 100%; max-width: 640px; height: auto; min-height: 300px; margin: 0 auto; border: 1px solid #ccc;"
              />
              <div class="q-mt-md text-center">
                  <q-btn color="secondary" label="分享到社交圈" icon="share" @click="shareToFeed" class="q-mr-sm"/>
                  <q-btn flat color="primary" label="创作新影像" @click="resetStepper"/>
              </div>
          </div>
          <div v-else-if="currentVideoJob && currentVideoJob.status === 'rendering'">
              <div class="text-center q-pa-xl">
                  <q-spinner-puff color="primary" size="3em" />
                  <div class="q-mt-md text-grey-8">您的影像《{{ currentVideoJob.title }}》正在快马加鞭渲染中...</div>
              </div>
          </div>
           <div v-else-if="currentVideoJob && currentVideoJob.status && currentVideoJob.status.startsWith('failed')">
              <div class="text-negative q-pa-md text-center">
                  <q-icon name="error_outline" size="lg" />
                  <div>影像创作失败 ({{ currentVideoJob.status }})。</div>
                  <q-btn flat color="primary" label="返回修改要求" @click="goToStep(2)" class="q-mt-sm"/>
              </div>
          </div>
          <div v-else class="text-grey-7 text-center q-pa-md">
              请先完成前面的步骤。
          </div>
  
          <q-stepper-navigation v-if="!(currentVideoJob && currentVideoJob.status === 'completed')">
            <q-btn flat @click="goToStep(3)" color="primary" label="返回查看脚本" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>
      </q-stepper>
    </q-page>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useQuasar, date as qDateUtils } from 'quasar';
  import { mockAnchorsReactive, addGeneratedVideo, updateGeneratedVideo } from 'src/mockDB'; // 导入视频操作函数
  
  const router = useRouter();
  const $q = useQuasar();
  
  const step = ref(1);
  const stepper = ref(null); // QStepper的ref
  
  const availableAnchors = computed(() => {
    // 确保锚点有媒体文件，这里简化为只要有锚点即可选择
    return mockAnchorsReactive.value.map(anchor => ({
      ...anchor,
      // 可以在这里预处理一些显示信息，比如第一个媒体的URL作为缩略图
      thumbnail: (anchor.media && anchor.media.length > 0 && anchor.media[0].media_type === 'image') ? anchor.media[0].file_url : null
    }));
  });
  const selectedAnchorIds = ref([]); // 存储选中的锚点ID
  
  const creationForm = ref({
    title: '',
    prompt: '',
    duration_preference: '30s', // 默认值
    generate_subtitles: true,
    music_preference: '轻快励志'
  });
  
  const durationOptions = [
    { label: '30秒左右', value: '30s' },
    { label: '1分钟左右', value: '60s' },
    { label: '2分钟左右', value: '120s' },
    { label: '尽量简短', value: 'short' }
  ];
  
  const isGeneratingScript = ref(false);
  const isRenderingVideo = ref(false);
  const currentVideoJob = ref(null); // 存储当前正在处理的视频任务对象
  
  const formatDateTime = (isoString) => qDateUtils.formatDate(isoString, 'YYYY/MM/DD HH:mm');
  
  const goToStep = (targetStep) => {
    stepper.value.goTo(targetStep);
  };
  
  const generateAIScript = async () => {
    if (!creationForm.value.title || !creationForm.value.prompt || selectedAnchorIds.value.length === 0) {
      $q.notify({ type: 'negative', message: '请填写所有必填项并选择至少一个锚点素材。' });
      return;
    }
    isGeneratingScript.value = true;
  
    // 1. 在mockDb中创建一个新的视频任务记录
    const videoJobDetails = {
      title: creationForm.value.title,
      user_prompt: creationForm.value.prompt,
      selected_anchor_ids: [...selectedAnchorIds.value], // 复制数组
      duration_preference: creationForm.value.duration_preference,
      generate_subtitles: creationForm.value.generate_subtitles,
      music_preference: creationForm.value.music_preference,
      status: 'generating_script',
      json_script: null, // 稍后填充
      video_url: null    // 稍后填充
    };
    const newJob = addGeneratedVideo(videoJobDetails);
    currentVideoJob.value = newJob;
  
    console.log("MOCK Video Creation: Requesting AI script generation for job ID:", newJob.id, creationForm.value);
    // TODO (API): POST /api/video-studio/jobs/ { ...videoJobDetails }
    // 后端接收请求，调用 Langchain+Gemini 生成脚本，然后更新任务状态和脚本内容。
    // 前端可以轮询任务状态，或者后端通过 WebSocket 推送更新。
  
    // --- Mock AI 脚本生成 ---
    await new Promise(resolve => setTimeout(resolve, 2500)); // 模拟网络延迟和AI处理时间
  
    // 根据选择的锚点和用户提示，伪造一个JSON脚本
    // 真实场景下，这个脚本由后端AI生成
    const mockSelectedAnchors = mockAnchorsReactive.value.filter(a => selectedAnchorIds.value.includes(a.id));
    let mockScenes = [];
    mockSelectedAnchors.forEach(anchor => {
      if (anchor.media && anchor.media.length > 0) {
        anchor.media.slice(0, 2).forEach(m => { // 每个锚点最多取2个媒体素材用于演示
          mockScenes.push({
            media_path: m.file_url, // 假设是可访问的URL
            duration: m.media_type === 'image' ? 3 : 5, // 图片3秒，视频5秒
            caption: { text: m.ai_description || anchor.name, position: "bottom_center" },
            transition_to_next: mockScenes.length % 2 === 0 ? "fade" : "wipeleft"
          });
        });
      } else {
          mockScenes.push({
              text_overlay: { title: anchor.name, subtitle: formatDateTime(anchor.start_time), duration: 3 },
              caption: {text: anchor.description || "精彩瞬间"},
              transition_to_next: "fade"
          });
      }
    });
    if (mockScenes.length === 0) { // 确保至少有一个场景
        mockScenes.push({text_overlay: {title: creationForm.value.title, duration: 5}, caption: {text: "即将呈现"}});
    }
  
  
    const mockJsonScript = {
      video_title: creationForm.value.title,
      target_duration_preference: creationForm.value.duration_preference,
      user_prompt_summary: creationForm.value.prompt.substring(0, 50) + "...",
      audio: {
        background_music_suggestion: creationForm.value.music_preference || "uplifting_orchestral.mp3",
        narration_script: creationForm.value.generate_subtitles ? "AI根据内容生成的旁白..." : null
      },
      scenes: mockScenes
    };
  
    updateGeneratedVideo(currentVideoJob.value.id, {
        json_script: mockJsonScript,
        status: 'script_generated'
    });
    currentVideoJob.value.json_script = mockJsonScript; // 更新本地ref
    currentVideoJob.value.status = 'script_generated';
  
    isGeneratingScript.value = false;
    $q.notify({ type: 'positive', message: 'AI脚本已生成！请查看并准备渲染。' });
    goToStep(3); // 自动进入下一步
    // --- 结束 Mock AI 脚本生成 ---
  };
  
  const renderVideo = async () => {
    if (!currentVideoJob.value || !currentVideoJob.value.json_script) {
      $q.notify({ type: 'negative', message: '没有可渲染的脚本。' });
      return;
    }
    isRenderingVideo.value = true;
    updateGeneratedVideo(currentVideoJob.value.id, { status: 'rendering' });
    currentVideoJob.value.status = 'rendering'; // 更新本地ref
  
    console.log("MOCK Video Creation: Requesting video rendering for job ID:", currentVideoJob.value.id);
    // TODO (API): POST /api/video-studio/videos/<video_id>/render (或类似接口触发渲染)
    // 后端接收请求，使用FFmpeg根据JSON脚本合成视频，完成后更新任务状态和 video_url
  
    // --- Mock 视频渲染 ---
    await new Promise(resolve => setTimeout(resolve, 5000)); // 模拟渲染耗时
  
    // 假设渲染成功，并得到一个mock视频URL
    // 您需要预先准备几个不同主题的短视频放在 public/mock_media/generated_videos/
    let mockRenderedVideoUrl = '/mock_media/generated_videos/sample_generic_video.mp4';
    if (creationForm.value.title.includes("毕业")) {
      mockRenderedVideoUrl = '/mock_media/generated_videos/sample_graduation_video.mp4';
    } else if (creationForm.value.title.includes("黄山") || creationForm.value.title.includes("日出")) {
      mockRenderedVideoUrl = '/mock_media/generated_videos/sample_huangshan_video.mp4';
    }
  
    updateGeneratedVideo(currentVideoJob.value.id, {
      video_url: mockRenderedVideoUrl,
      status: 'completed'
    });
    currentVideoJob.value.video_url = mockRenderedVideoUrl; // 更新本地ref
    currentVideoJob.value.status = 'completed';
  
    isRenderingVideo.value = false;
    $q.notify({ type: 'positive', message: '影像《' + creationForm.value.title + '》已成功渲染！' });
    goToStep(4); // 自动进入下一步
    // --- 结束 Mock 视频渲染 ---
  };
  
  const shareToFeed = () => {
      if(currentVideoJob.value && currentVideoJob.value.status === 'completed'){
          // router.push({ name: 'ShareVideo', params: { videoId: currentVideoJob.value.id } }); // 如果有专门的分享页面
          // 或者弹出一个对话框让用户填写分享语
          $q.dialog({
              title: '分享到社交圈',
              message: '请输入您的分享感言：',
              prompt: {
                  model: '',
                  type: 'textarea'
              },
              cancel: true,
              persistent: true
          }).onOk(data => {
              console.log('分享内容:', data, '视频ID:', currentVideoJob.value.id);
              // TODO: 调用 mockDb.js 中的 addSocialPost
              // addSocialPost({ video_id_ref: currentVideoJob.value.id, caption: data, ... });
              $q.notify({type: 'positive', message: '已分享到社交圈 (mock)!'});
              router.push('/social-feed'); // 跳转到社交圈查看
          });
      }
  };
  
  const resetStepper = () => {
    step.value = 1;
    selectedAnchorIds.value = [];
    creationForm.value = { title: '', prompt: '', duration_preference: '30s', generate_subtitles: true, music_preference: '轻快励志' };
    currentVideoJob.value = null;
    isGeneratingScript.value = false;
    isRenderingVideo.value = false;
  };
  
  onMounted(() => {
    // 如果是从某个锚点跳转过来创作，可以预选该锚点
    // const defaultAnchorId = router.currentRoute.value.query.anchorId;
    // if (defaultAnchorId && availableAnchors.value.find(a=>a.id === defaultAnchorId)) {
    //   selectedAnchorIds.value = [defaultAnchorId];
    // }
  });
  
  </script>
  
  <style scoped>
  .q-stepper--flat.q-stepper--bordered {
    border: 1px solid #e0e0e0;
  }
  pre {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 0.85em;
    background-color: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
  }
  </style>