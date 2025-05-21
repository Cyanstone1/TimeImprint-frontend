// src/pages/IndexPage.vue
<template>
  <q-page class="column">
    <div class="text-h5 q-pa-md row items-center justify-between">
      <span>欢迎回来，{{ mockUserName }}! 这是您的时空锚点地图。</span>
      <div>
        <q-btn
          flat
          round
          dense
          :icon="showPolyline ? 'timeline' : 'hdr_strong'" @click="togglePolyline"
          class="q-mr-sm"
        >
          <q-tooltip>{{ showPolyline ? '隐藏锚点连线' : '显示锚点连线' }}</q-tooltip>
        </q-btn>
        <q-btn
          flat
          round
          dense
          :icon="showTimeline ? 'event_note' : 'event_busy'" 
          @click="toggleTimeline"
        >
          <q-tooltip>{{ showTimeline ? '隐藏时光轴' : '显示时光轴' }}</q-tooltip>
        </q-btn>
      </div>
    </div>

    <div class="col row no-wrap"> <div class="col" style="min-height: 300px; position: relative;"> <l-map
          ref="overviewMap"
          v-model:zoom="mapZoom"
          :center="mapCenter"
          :options="{ scrollWheelZoom: true }"
        >
          <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            layer-type="base"
            name="OpenStreetMap"
            attribution="&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
          />
          <l-marker
          v-for="anchor in sortedAnchors"
          :key="anchor.id"
          :lat-lng="[anchor.location_coordinates[1], anchor.location_coordinates[0]]"
          @click="onMarkerClick(anchor)"
        >
          <l-popup :options="{ minWidth: '250px', maxWidth: '300px', className: 'custom-leaflet-popup' }">
            <div class="q-gutter-xs" v-if="anchor"> 
              <div class="text-weight-bold text-subtitle1 ellipsis" style="max-width: 270px;">{{ anchor.name || '未知锚点' }}</div>
              <div class="text-caption text-grey-8">{{ formatDateTime(anchor.start_time) }}</div>
              <q-img
                  v-if="anchor.media && anchor.media.length > 0 && anchor.media[0].media_type === 'image'"
                  :src="anchor.media[0].file_url"
                  style="width: 100%; max-height: 120px; margin-top: 5px; border-radius: 3px; object-fit: cover; background-color: #eee;"
                  alt="锚点预览"
                  @error="(e) => { console.warn('IndexPage Popup image error:', anchor.media[0].file_url, e.target.src); e.target.src = '/mock_assets/media_error.png'; }"
              >
                  <template v-slot:error>
                      <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
                          <q-icon name="broken_image" size="md"/>
                          <span class="q-ml-xs">无法加载</span>
                      </div>
                  </template>
              </q-img>
              <div v-else-if="anchor.media && anchor.media.length > 0" class="text-caption text-grey-7 q-mt-xs q-py-md text-center bg-grey-2 rounded-borders">
                  <q-icon :name="anchor.media[0].media_type === 'video' ? 'movie' : 'insert_drive_file'" size="md" />
                  <div class="q-mt-xs">{{ anchor.media[0].media_type === 'video' ? '含视频片段' : '含媒体文件' }}</div>
              </div>
              <div v-else class="text-caption text-grey-7 q-mt-xs q-py-md text-center bg-grey-2 rounded-borders">
                  暂无媒体预览
              </div>
              <q-btn
                flat
                dense
                label="查看锚点详情"
                @click.stop="viewAnchor(anchor.id)"
                class="q-mt-sm full-width"
                color="primary"
                icon-right="arrow_forward"
                padding="xs sm"
              />
            </div>
            <div v-else class="text-caption text-grey-7">锚点数据加载中...</div>
            </l-popup>
          <l-tooltip>{{ anchor.name }}</l-tooltip>
        </l-marker>
          <l-polyline
            v-if="showPolyline && sortedAnchors.length > 1" :lat-lngs="sortedAnchors.map(anchor => [anchor.location_coordinates[1], anchor.location_coordinates[0]])"
            color="deep-purple-7"
            :weight="4"
            :opacity="0.7"
          />
        </l-map>
         <div v-if="!sortedAnchors || !sortedAnchors.length" class="absolute-center text-grey-7 q-pa-md text-center">
            您还没有创建任何时空锚点，快去 <router-link class="text-primary" to="/create-anchor">创建一个</router-link> 吧！
        </div>
      </div>

      <q-slide-transition appear>
        <div
          v-show="showTimeline"
          class="q-pa-md shadow-2 bg-white timeline-container"
          style="width: 320px; /* 固定宽度或可调 */ max-width: 40%; /* 最大宽度 */ height: 100%; overflow-y: auto; border-left: 1px solid #eee;"
        >
          <div class="text-h6 q-mb-sm">时光轴</div>
          <q-timeline color="primary" layout="dense" v-if="sortedAnchors.length > 0">
            <q-timeline-entry
              v-for="anchor in sortedAnchors"
              :key="anchor.id + '-timeline'"
              :title="anchor.name"
              :subtitle="formatDateTime(anchor.start_time)"
              :icon="getTimelineIcon(anchor)"
              side="left"
            >
            <div>
                <p class="text-caption ellipsis-2-lines" :title="anchor.description || '暂无描述'">{{ anchor.description || '暂无描述' }}</p>
                <q-img
                v-if="anchor.media && anchor.media.length > 0 && anchor.media[0].media_type === 'image'"
                :src="anchor.media[0].file_url"
                style="width: 100px; height: 60px; object-fit: cover; border-radius: 3px; cursor: pointer;"
                @click="viewAnchor(anchor.id)"
                @error="(e) => { e.target.style.display='none'; }"
                >
                <template v-slot:error>
                    <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
                        <q-icon name="broken_image" size="sm"/>
                    </div>
                </template>
                </q-img>
                <q-btn v-else flat dense size="sm" label="查看详情" @click="viewAnchor(anchor.id)" color="secondary" class="q-mt-xs"/>
            </div>
            </q-timeline-entry>
          </q-timeline>
          <div v-else class="text-grey-7 text-center q-mt-md">暂无锚点可显示在时光轴上。</div>
        </div>
      </q-slide-transition>
    </div>
  </q-page>
</template>


<script setup>
import { ref, onMounted, computed, watch} from 'vue';
import { useRouter } from 'vue-router';
import { date as qDateUtils } from 'quasar';
import { LMap, LTileLayer, LMarker, LPopup, LTooltip, LPolyline } from "@vue-leaflet/vue-leaflet"; // <--- 修改：导入 LPolyline
import { mockAnchorsReactive } from 'src/mockDB'; // <--- 修改：导入响应式锚点数据, 改为 mockDB
import L from 'leaflet'

// import { useAuthStore } from 'src/stores/authStore'; // 后续启用

const router = useRouter();
// const authStore = useAuthStore(); // 后续启用

const mockUserName = ref('用户'); // 本地 ref 模拟用户名
const mapZoom = ref(4); // 调整初始缩放级别以看到更多中国区域
const mapCenter = ref([36.0, 105.0]); // 中国大概的中心点作为默认值 (之前是34,108)

const overviewMap = ref(null); // <--- 添加 ref 以便访问地图实例

const showTimeline = ref(true); // 控制时光轴的显示/隐藏，默认为显示
const showPolyline = ref(true); // 控制锚点连线的显示/隐藏，默认为显示

// 直接使用从 mockDB 导入的响应式 ref
const sortedAnchors = computed(() => {
  return [...mockAnchorsReactive.value].sort((a, b) => { // 从 mockAnchorsReactive 获取数据
    return new Date(a.start_time) - new Date(b.start_time);
  });
});

// 计算用于 Polyline 的坐标，并进行日志输出
const polylineLatLngs = computed(() => {
    if (sortedAnchors.value.length > 1) {
        const latLngs = sortedAnchors.value.map(anchor => {
            if (anchor.location_coordinates &&
                typeof anchor.location_coordinates[1] === 'number' &&
                typeof anchor.location_coordinates[0] === 'number') {
                return [anchor.location_coordinates[1], anchor.location_coordinates[0]]; // 纬度, 经度
            }
            return null; // 或者过滤掉无效坐标的锚点
        }).filter(coords => coords !== null); // 过滤掉无效坐标
        console.log('Polyline LatLngs:', latLngs); // 调试输出
        return latLngs.length > 1 ? latLngs : []; // 确保至少有两个有效点才返回坐标数组
    }
    return [];
});

const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  return qDateUtils.formatDate(isoString, 'YYYY年MM月DD日 HH:mm');
}

const viewAnchor = (anchorId) => {
  router.push(`/anchors/${anchorId}`);
}

const onMarkerClick = (anchor) => {
  console.log('Clicked on anchor on map:', anchor.name);
  // 如果希望点击标记时地图居中到该标记并放大
  // mapCenter.value = [anchor.location_coordinates[1], anchor.location_coordinates[0]];
  // mapZoom.value = 13; // 或者一个合适的放大级别
}

const toggleTimeline = () => {
  showTimeline.value = !showTimeline.value;
};

const togglePolyline = () => {
  showPolyline.value = !showPolyline.value;
};

const getTimelineIcon = (anchor) => {
    if (anchor.media && anchor.media.length > 0) {
        return anchor.media[0].media_type === 'image' ? 'image' : 'videocam';
    }
    return 'location_on';
};

watch(polylineLatLngs, (newVal) => {
    if (overviewMap.value && overviewMap.value.leafletObject && newVal.length > 0) {
        // 如果需要在 Polyline 数据变化时让地图适应边界
        // const bounds = L.latLngBounds(newVal);
        // overviewMap.value.leafletObject.fitBounds(bounds, { padding: [50, 50] });
        console.log("Polyline data updated, map instance:", overviewMap.value.leafletObject);
    }
}, { deep: true });

onMounted(() => {
  // 模拟获取用户名
  const userData = localStorage.getItem('mockUserData');
  if (userData) {
    mockUserName.value = JSON.parse(userData).name || '用户';
  }

  // 调整地图初始中心和缩放级别
  if (mockAnchorsReactive.value && mockAnchorsReactive.value.length > 0) {
    // 如果有锚点，可以将地图中心设置为第一个锚点的位置，或计算所有锚点的边界再居中
    const firstAnchor = sortedAnchors.value[0]; // 使用排序后的第一个
    if (firstAnchor.location_coordinates && firstAnchor.location_coordinates.length === 2) {
      mapCenter.value = [firstAnchor.location_coordinates[1], firstAnchor.location_coordinates[0]];
      mapZoom.value = 10;
    }
  } else {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        mapCenter.value = [position.coords.latitude, position.coords.longitude];
        mapZoom.value = 13;
      }, () => {
        console.warn("无法获取用户地理位置，使用默认中心点。");
      });
    }
  }
  // TODO (Pinia): const user = authStore.user; mockUserName.value = user?.name || '用户';
  // TODO (Pinia): await anchorStore.fetchAnchors(); // 异步获取锚点数据
});


</script>

<style scoped>
.q-page.column {
  display: flex;
  flex-direction: column;
  /* height: calc(100vh - 50px); /* 50px 是假设的顶栏高度, 需要根据实际情况调整 */
  /* 为了让地图和时光轴并排时高度正确，父级最好是flex容器，或者给它们显式高度 */
  /* 或者让整个页面可滚动，而不是内部元素滚动 */
  height: 100%; /* 或者一个具体的父容器高度 */
}

.col.row.no-wrap { /* 新增的父容器，用于并排放置地图和时光轴 */
  flex-grow: 1;
  overflow: hidden; /* 防止内部元素溢出导致滚动条 */
}
.col[style*="min-height"] { /* 地图容器 */
  flex-grow: 1;
  overflow: hidden;
}
.timeline-container { /* 时光轴容器 */
  transition: width 0.3s ease; /* 平滑过渡效果 */
}
.leaflet-container {
  height: 100%;
  width: 100%;
  background-color: #f0f0f0;
}
/* .col {
  flex-grow: 1;
  overflow: hidden;
} */

.leaflet-container {
  height: 100%;
  width: 100%;
  background-color: #f0f0f0;
  /* 给地图容器一个背景色，防止完全透明 */
}

.text-primary {
  /* 如果 router-link 默认不是这个颜色 */
  color: var(--q-primary);
  text-decoration: none;
}

.text-primary:hover {
  text-decoration: underline;
}
</style>