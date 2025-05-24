<template>
    <q-page padding>
      <div class="text-h5 q-mb-md">我的人际关系网络</div>
      <div class="row items-center q-mb-md q-gutter-sm">
          <q-toggle v-model="showFriendships" label="显示好友关系" @update:model-value="drawGraph"/>
          <q-toggle v-model="showSharedAnchors" label="显示共同锚点关系" @update:model-value="drawGraph"/>
          <q-toggle v-model="showAiRelations" label="显示AI推断关系" @update:model-value="drawGraph" :disable="true"/>
          <q-space />
          <q-btn icon="refresh" @click="drawGraph" flat round dense>
              <q-tooltip>刷新图谱</q-tooltip>
          </q-btn>
      </div>
  
      <div ref="networkContainer" style="height: calc(100vh - 200px); border: 1px solid #ccc; background-color: #f9f9f9;">
          </div>
  
      <q-dialog v-model="showNodeDetailDialog" >
        <q-card style="min-width: 350px" v-if="selectedNodeData">
          <q-toolbar class="bg-primary text-white">
              <q-avatar> <img :src="selectedNodeData.image || '/mock_assets/avatars/default_avatar.png'"> </q-avatar>
              <q-toolbar-title>{{selectedNodeData.label}}</q-toolbar-title>
              <q-btn flat round dense icon="close" v-close-popup />
          </q-toolbar>
          <q-card-section>
            <div v-if="selectedNodeData.character">
              <p><strong>关系标签:</strong> {{ selectedNodeData.character.relation_label || '无' }}</p>
              <p v-if="selectedNodeData.character.system_user_id"><strong>平台用户ID:</strong> {{ selectedNodeData.character.system_user_id }}</p>
              <div class="text-subtitle1 q-mt-md">相关记忆锚点:</div>
              <q-list dense bordered separator v-if="getNodeRelatedAnchors(selectedNodeData.id).length > 0">
                  <q-item v-for="anchor in getNodeRelatedAnchors(selectedNodeData.id)" :key="anchor.id" clickable v-ripple @click="viewAnchor(anchor.id)">
                      <q-item-section avatar v-if="anchor.media && anchor.media.length > 0 && anchor.media[0].media_type === 'image'">
                          <q-avatar rounded size="sm"><img :src="anchor.media[0].file_url"></q-avatar>
                      </q-item-section>
                       <q-item-section avatar v-else><q-icon name="location_on" /></q-item-section>
                      <q-item-section>{{anchor.name}}</q-item-section>
                  </q-item>
              </q-list>
              <p v-else class="text-caption">暂无直接相关的记忆锚点。</p>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
  
    </q-page>
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick} from 'vue';
  import { useRouter } from 'vue-router';
  import { Network } from 'vis-network/standalone/esm/vis-network'; // 确保导入路径正确
  import 'vis-network/styles/vis-network.css'; // 导入Vis.js的CSS
  
  import {
      mockCharactersReactive,
      mockAnchorsReactive,
      mockRelationshipsReactive,
      mockFriendsReactive,
      getFriends, // 需要此函数
      isFriend
  } from 'src/mockDB';
  import { useQuasar } from 'quasar';
  
  const $q = useQuasar();
  const router = useRouter();
  const networkContainer = ref(null);
  let networkInstance = null;
  
  const showFriendships = ref(true);
  const showSharedAnchors = ref(true);
  const showAiRelations = ref(false); // AI关系默认先不显示，因为mock数据可能不完善
  
  const showNodeDetailDialog = ref(false);
  const selectedNodeData = ref(null); // { id (character.id), label, image, character (original object) }
  
  const currentUser = computed(() => {
      const userData = localStorage.getItem('mockUserData');
      return userData ? JSON.parse(userData) : { id: null };
  });
  
  const nodes = computed(() => {
    return mockCharactersReactive.value.map(char => ({
      id: char.id,
      label: char.name || '未知人物',
      shape: 'circularImage', // 使用圆形图片作为节点
      image: char.avatar_url || '/mock_assets/avatars/default_avatar.png',
      borderWidth: char.is_user_self ? 3 : 1,
      color: char.is_user_self ? { border: '#027be3', background: 'white' } : { border: '#cccccc', background: 'white' },
      character: char // 保存原始对象以便在点击时使用
    }));
  });
  
  const edges = computed(() => {
    let allEdges = [];
    const edgeIds = new Set(); // 用于边去重
  
    const addEdge = (from, to, label, color = '#848484', dashes = false, type = 'unknown') => {
        const edgeId1 = `${from}-${to}-${type}`;
        const edgeId2 = `${to}-${from}-${type}`; // 考虑无向图的重复
        if (!edgeIds.has(edgeId1) && !edgeIds.has(edgeId2)) {
            allEdges.push({ from, to, label, color, dashes, font: {size: 10, color: color, strokeWidth:0} });
            edgeIds.add(edgeId1);
        }
    };
  
    // 1. 好友关系 (如果当前用户已登录)
    if (showFriendships.value && currentUser.value.id) {
      const myId = mockCharactersReactive.value.find(c => c.is_user_self && c.name === currentUser.value.name)?.id;
      if (myId) {
          const friends = getFriends(currentUser.value.id); // 这是平台用户好友
          friends.forEach(friendPlatformUser => {
              // 需要找到这个平台好友对应的人物库ID
              const friendInCharLib = mockCharactersReactive.value.find(c => c.system_user_id === friendPlatformUser.id || c.name === friendPlatformUser.name); // 简单匹配
              if (friendInCharLib) {
                  addEdge(myId, friendInCharLib.id, '好友', 'green', false, 'friend');
              }
          });
      }
    }
  
    // 2. 共同锚点关系 (计算共现)
    if (showSharedAnchors.value) {
      const cooccurrence = {}; // { 'charId1-charId2': count }
      mockAnchorsReactive.value.forEach(anchor => {
        const peopleInAnchor = new Set();
        anchor.media?.forEach(m => {
          m.recognized_faces?.forEach(face => {
            if (face.person_id) peopleInAnchor.add(face.person_id);
          });
        });
        const peopleArray = Array.from(peopleInAnchor);
        for (let i = 0; i < peopleArray.length; i++) {
          for (let j = i + 1; j < peopleArray.length; j++) {
            const pair = [peopleArray[i], peopleArray[j]].sort().join('-');
            cooccurrence[pair] = (cooccurrence[pair] || 0) + 1;
          }
        }
      });
      for (const pairKey in cooccurrence) {
        if (cooccurrence[pairKey] > 0) { // 可以设置阈值
          const [p1, p2] = pairKey.split('-');
          addEdge(p1, p2, `共同经历 ${cooccurrence[pairKey]} 次`, '#42a5f5', true, 'shared_anchor');
        }
      }
    }
  
    // 3. AI推断的关系 (来自 mockRelationshipsReactive)
    if (showAiRelations.value) {
        mockRelationshipsReactive.value.forEach(rel => {
            addEdge(rel.from_person_id, rel.to_person_id, rel.type, '#ff7043', false, 'ai_relation');
        });
    }
  
    return allEdges;
  });
  
  const getNodeRelatedAnchors = (characterId) => {
      if (!characterId) return [];
      return mockAnchorsReactive.value.filter(anchor =>
          anchor.media?.some(m =>
              m.recognized_faces?.some(face => face.person_id === characterId)
          )
      ).slice(0, 5); // 最多显示5条
  };
  
  const viewAnchor = (anchorId) => {
      showNodeDetailDialog.value = false;
      router.push(`/anchors/${anchorId}`);
  };
  
  const drawGraph = () => {
    if (!networkContainer.value) return;
    if (networkInstance) {
      networkInstance.destroy(); // 销毁旧实例
      networkInstance = null;
    }
  
    const data = {
      nodes: nodes.value,
      edges: edges.value,
    };
    const options = {
      autoResize: true,
      height: '100%',
      width: '100%',
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -3000,
          centralGravity: 0.1,
          springLength: 120,
          springConstant: 0.05,
          damping: 0.09,
          avoidOverlap: 0.1
        },
        solver: 'barnesHut', //  'forceAtlas2Based', 'repulsion'
        stabilization: { iterations: 150 }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        navigationButtons: true, // 显示导航按钮 (缩放、适应)
        keyboard: true
      },
      nodes: {
          borderWidth: 2,
          size: 30, // 基础大小
          font: {
              size: 12,
              face: 'Arial',
              color: '#333'
          },
          shapeProperties: {
              useImageSize: false, // 如果为true, size会被图片覆盖
              interpolation: true // 图片缩放质量
          }
      },
      edges: {
          width: 1,
          smooth: {
              enabled: true,
              type: "dynamic", // continuous, discrete, diagonalCross, straightCross, curvedCW, curvedCCW, cubicBezier, dynamic
              roundness: 0.5
          },
          arrows: {
              to: { enabled: false, scaleFactor: 0.5 } // 关系通常是无向的，除非特别指定
          }
      },
      layout: {
          // randomSeed: undefined,
          // improvedLayout:true,
      }
    };
  
    networkInstance = new Network(networkContainer.value, data, options);
  
    networkInstance.on("click", function (params) {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodes.value.find(n => n.id === nodeId);
        if (node) {
          selectedNodeData.value = node;
          showNodeDetailDialog.value = true;
        }
      } else {
          // showNodeDetailDialog.value = false; // 点击空白处关闭弹窗
      }
    });
     // networkInstance.stabilize(200); // 稳定迭代次数
     // networkInstance.fit(); // 适应所有节点
  };
  
  onMounted(() => {
    // 确保在DOM元素可用后再绘制
    nextTick(() => {
      drawGraph();
    });
    // 监听数据变化，自动重绘图谱
    watch([mockCharactersReactive, mockAnchorsReactive, mockRelationshipsReactive, mockFriendsReactive], () => {
        console.log("RelationshipGraphPage: Data changed, redrawing graph.");
        drawGraph();
    }, { deep: true });
  });
  
  onBeforeUnmount(() => {
    if (networkInstance) {
      networkInstance.destroy();
      networkInstance = null;
    }
  });
  </script>
  
  <style scoped>
  /* vis-network.min.css 已通过 import 'vis-network/styles/vis-network.css'; 引入 */
  .timeline-container { /* 如果是从IndexPage复制过来的，确保这里的样式适用于当前页面 */
      /* ... */
  }
  .bg-white-transparent {
      background-color: rgba(255,255,255,0.9);
  }
  </style>