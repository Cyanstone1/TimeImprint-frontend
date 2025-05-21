// src/pages/CreateAnchorPage.vue
<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">创建新的时空锚点</div>
    <q-form @submit="handleCreateAnchor" class="q-gutter-md">
      <q-input filled v-model="anchorData.name" label="锚点名称 *" :rules="[val => !!val || '名称不能为空']"/>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input filled v-model="anchorData.start_date" label="开始日期 *" mask="date" :rules="['date']">
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="anchorData.start_date" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6">
          <q-input filled v-model="anchorData.start_time" label="开始时间 *" mask="time" :rules="['time']">
            <template v-slot:append>
              <q-icon name="access_time" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time v-model="anchorData.start_time" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
      </div>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
            <q-input filled v-model="anchorData.end_date" label="结束日期 *" mask="date" :rules="['date']">
                <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="anchorData.end_date" />
                    </q-popup-proxy>
                    </q-icon>
                </template>
            </q-input>
        </div>
        <div class="col-12 col-sm-6">
            <q-input filled v-model="anchorData.end_time" label="结束时间 *" mask="time" :rules="['time']">
                <template v-slot:append>
                    <q-icon name="access_time" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-time v-model="anchorData.end_time" />
                    </q-popup-proxy>
                    </q-icon>
                </template>
            </q-input>
        </div>
      </div>

      <div class="text-subtitle1 q-mt-lg">选择地理位置</div>
      <div style="height: 400px; width: 100%;" class="q-mb-md">
        <l-map
          ref="locationMap"
          v-model:zoom="mapZoom"
          :center="mapCenter"
          @click="handleMapClick"
          style="cursor: pointer;"
        >
          <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            layer-type="base"
            name="OpenStreetMap"
            attribution="&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
          />
          <l-marker
            v-if="markerLocation.lat && markerLocation.lng"
            :lat-lng="markerLocation"
            draggable
            @update:lat-lng="handleMarkerDrag"
          >
            <l-tooltip>选定的位置 (可拖动)</l-tooltip>
          </l-marker>
        </l-map>
      </div>
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col">
            <q-input readonly filled v-model.number="anchorData.location.latitude" label="纬度" />
        </div>
        <div class="col">
            <q-input readonly filled v-model.number="anchorData.location.longitude" label="经度" />
        </div>
      </div>
      <div>提示：点击地图选择位置，或拖动标记调整。</div>

      <q-input
        filled
        v-model="anchorData.description"
        label="详细描述"
        type="textarea"
        autogrow
      />

      <div class="q-mt-lg">
        <q-btn label="创建锚点" type="submit" color="primary" :disabled="anchorData.location.latitude === null || anchorData.location.longitude === null"/>
        <q-btn label="重置"  type="reset" color="primary" class="q-ml-sm" @click="resetForm" style="color: black;"/>
      </div>
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { date as qDateUtils, useQuasar } from 'quasar';
import { LMap, LTileLayer, LMarker, LTooltip } from "@vue-leaflet/vue-leaflet";
import { addMockAnchor } from 'src/mockDB'; // <--- 修改：导入 addMockAnchor, 改为 mockDB

// import { useAnchorStore } from 'src/stores/anchorStore'; // 后续启用

const router = useRouter();
const $q = useQuasar();
// const anchorStore = useAnchorStore(); // 后续启用

const initialAnchorData = () => ({
    name: '',
    start_date: qDateUtils.formatDate(Date.now(), 'YYYY/MM/DD'),
    start_time: qDateUtils.formatDate(Date.now(), 'HH:mm'),
    end_date: qDateUtils.formatDate(Date.now(), 'YYYY/MM/DD'),
    end_time: qDateUtils.formatDate(Date.now(), 'HH:mm'),
    location: { latitude: null, longitude: null },
    description: ''
});

const anchorData = ref(initialAnchorData());
const locationMap = ref(null);

const mapZoom = ref(5);
const mapCenter = ref([39.9042, 116.4074]);
const markerLocation = ref({ lat: null, lng: null });

const handleMapClick = (event) => {
  if (event.latlng) {
    markerLocation.value = { lat: event.latlng.lat, lng: event.latlng.lng };
    anchorData.value.location.latitude = parseFloat(event.latlng.lat.toFixed(6));
    anchorData.value.location.longitude = parseFloat(event.latlng.lng.toFixed(6));
  }
};

const handleMarkerDrag = (newLatLng) => {
  if (newLatLng) {
    anchorData.value.location.latitude = parseFloat(newLatLng.lat.toFixed(6));
    anchorData.value.location.longitude = parseFloat(newLatLng.lng.toFixed(6));
  }
};

const resetForm = () => {
    anchorData.value = initialAnchorData();
    markerLocation.value = { lat: null, lng: null };
    mapCenter.value = [39.9042, 116.4074];
    mapZoom.value = 5;
};

const handleCreateAnchor = async () => {
    if (anchorData.value.location.latitude === null || anchorData.value.location.longitude === null) {
        $q.notify({ type: 'negative', message: '请在地图上选择一个位置' });
        return;
    }
    const start_datetime_str = `${anchorData.value.start_date} ${anchorData.value.start_time}`;
    const end_datetime_str = `${anchorData.value.end_date} ${anchorData.value.end_time}`;
    const start_iso = new Date(start_datetime_str.replace(/\//g, '-')).toISOString();
    const end_iso = new Date(end_datetime_str.replace(/\//g, '-')).toISOString();

    if (new Date(end_iso) <= new Date(start_iso)) {
        $q.notify({ type: 'negative', message: '结束时间必须晚于开始时间' });
        return;
    }

    const dataToSubmit = {
        name: anchorData.value.name,
        start_time: start_iso,
        end_time: end_iso,
        description: anchorData.value.description,
        location_coordinates: [
            anchorData.value.location.longitude, // 经度在前
            anchorData.value.location.latitude  // 纬度在后
        ]
    };

    const newAnchor = addMockAnchor(dataToSubmit); // <--- 修改：使用 mockDB 中的函数

    $q.notify({ type: 'positive', message: `锚点 "${newAnchor.name}" (Mock)创建成功! ID: ${newAnchor.id}` });
    router.push(`/anchors/${newAnchor.id}`);
    // TODO (Pinia): await anchorStore.createAnchor(dataToSubmit);
    /*
    // TODO (API):
    try {
      // const response = await api.post('/anchors/', dataToSubmit);
      // router.push(`/anchors/${response.data.id}`);
    } catch (error) {
      // $q.notify({ type: 'negative', message: '创建锚点失败: ' + (error.response?.data?.detail || error.message) });
    }
    */
};

onMounted(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      mapCenter.value = [userLat, userLng];
      mapZoom.value = 13;
    }, () => {
      console.warn("无法获取用户地理位置，使用默认中心点。");
    });
  }
});
</script>

<style>
.leaflet-container {
  height: 100%;
  width: 100%;
}
</style>