<template>
    <q-page class="flex flex-center bg-grey-2">
      <q-card class="q-pa-md" style="width: 400px">
        <q-card-section>
          <div class="text-h6 text-center">时光印记 - 登录</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="handleLogin" class="q-gutter-md">
            <q-input
              filled
              v-model="username"
              label="用户名/邮箱"
              lazy-rules
              :rules="[val => val && val.length > 0 || '请输入用户名']"
            />
            <q-input
              filled
              type="password"
              v-model="password"
              label="密码"
              lazy-rules
              :rules="[val => val && val.length > 0 || '请输入密码']"
            />
            <div>
              <q-btn label="登录" type="submit" color="primary" class="full-width"/>
            </div>
          </q-form>
        </q-card-section>
         <q-card-section class="text-center q-pt-none">
          <a href="#" @click.prevent="goToRegister">还没有账户？去注册</a>
        </q-card-section>
      </q-card>
    </q-page>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  // import { useAuthStore } from 'src/stores/authStore' // 后续启用
  
  const username = ref('xiaoming') // Mock 默认值，方便演示
  const password = ref('password123') // Mock 默认值
  const router = useRouter()
  // const authStore = useAuthStore() // 后续启用
  
  const handleLogin = async () => {
    console.log('尝试登录:', username.value, password.value)
    if (username.value === 'xiaoming' && password.value === 'password123') { // 纯前端Mock登录
      const mockUser = { id: 'xiaoming123', name: '小明', avatar_url: '/mock_assets/avatars/xiaoming.png' };
      const mockToken = 'mock_jwt_token_for_xiaoming';
  
      localStorage.setItem('mockUserToken', mockToken);
      localStorage.setItem('mockUserData', JSON.stringify(mockUser));
  
      // TODO (Pinia): await authStore.login({ username: username.value, password: password.value });
      // 实际的 authStore.login 内部会更新 isLoggedIn 和 user 的 ref
      // 并通过 api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`; 设置请求头
  
      // 手动更新 MainLayout.vue 中的 isLoggedIn 和 user (因为 Pinia 未启用)
      // 这是一种 hacky 的方式，仅为当前无 Pinia 的演示服务
      // 更好的方式是通过事件总线或 Provide/Inject，但为了简单，暂时这样
      // 理想情况下，登录后状态应由 Pinia 管理，MainLayout 从 store 中读取
      window.dispatchEvent(new CustomEvent('mock-login-success', { detail: { user: mockUser, token: mockToken } }));
  
  
      router.push('/'); // 跳转到首页
    } else {
      alert('用户名或密码错误 (Mock)');
    }
  
    /*
    // TODO (API): 后续启用API调用
    try {
      // await authStore.login({ username: username.value, password: password.value });
      // router.push('/');
    } catch (e) {
      // Quasar 的 Notify 组件更友好
      alert('登录失败 (API): ' + (e.response?.data?.detail || e.message));
    }
    */
  }
  
  const goToRegister = () => {
      // router.push('/register'); // 如果有注册页
      alert("跳转到注册页面 (待实现)");
  }
  
  // 在 MainLayout.vue 中添加监听 (仅为无 Pinia 演示)
  // onMounted(() => {
  //   ...
  //   window.addEventListener('mock-login-success', (event) => {
  //     isLoggedIn.value = true;
  //     user.value = event.detail.user;
  //     // api.defaults.headers.common['Authorization'] = `Bearer ${event.detail.token}`; // 假设 api 实例已在 MainLayout 可访问
  //     console.log('MainLayout received mock-login-success');
  //   });
  // })
  // beforeUnmount(() => { // 清理监听器
  //   window.removeEventListener('mock-login-success', ...);
  // })
  </script>