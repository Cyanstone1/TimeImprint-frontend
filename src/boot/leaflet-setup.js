// src/boot/leaflet-setup.js
import { boot } from 'quasar/wrappers'
import L from 'leaflet' // 显式导入 Leaflet 核心库
import 'leaflet/dist/leaflet.css' // 再次确认CSS导入在这里或app.scss

// Vue Leaflet 组件可能依赖于全局的 L 对象，或者通过 Provide/Inject 机制
// 尝试将其挂载到 Vue app 实例上，或者确保它能被 @vue-leaflet/vue-leaflet 找到
// 这通常不是必需的，因为 @vue-leaflet/vue-leaflet 应该自己处理 L 的导入，
// 但在遇到这种 'default' 错误时，值得一试。

// 如果 @vue-leaflet/vue-leaflet 需要 L 全局可用，可以这样做（但不推荐长期）
// if (typeof window !== 'undefined') {
//   window.L = L;
// }

// 更好的做法是检查 @vue-leaflet/vue-leaflet 的文档，看它如何期望 Leaflet 被提供。
// 大多数现代库会自己 import L from 'leaflet';

export default boot(({ app }) => {
  // 你也可以通过 provide/inject 的方式提供 L，如果 @vue-leaflet 支持的话
  // app.provide('L', L);

  // 或者只是确保 L 被正确加载了。
  // 如果@vue-leaflet/vue-leaflet内部无法正确解析'leaflet'的'default'导出
  // 可能意味着其构建与当前Vite或leaflet版本有兼容问题
  console.log('Leaflet version in boot:', L.version); // 检查L是否正确加载
})