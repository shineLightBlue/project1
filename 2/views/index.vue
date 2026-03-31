<template>
  <div class="dashboard-container">

    <!-- 顶部欢迎语 -->
    <el-card class="welcome-card">
      <div class="welcome-title">欢迎使用管理后台</div>
      <div class="welcome-subtitle">当前版本：v{{ version }}</div>
    </el-card>

    <!-- 数据统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col
        :xs="12"
        :sm="6"
        v-for="item in stats"
        :key="item.label"
      >
        <el-card
          shadow="hover"
          class="stats-card"
          :class="{ 'clickable-card': item.clickable }"
          @click.native="handleCardClick(item)"
        >
          <div class="stats-number">
            <!-- 修改点1：使用v-if判断加载状态 -->
            <span v-if="item.loading">加载中...</span>
            <span v-else>{{ item.value }}</span>
          </div>
          <div class="stats-label">{{ item.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- BT 面板入口（你的两个服务器） -->
    <el-row :gutter="20" class="bt-panel-row">
      <el-col :xs="12" :sm="6">
        <el-button
          type="warning"
          plain
          class="quick-btn"
          @click="openUrl('https://47.251.8.30:18036/6cb4f767')"
        >
          硅谷服务器BT面板
        </el-button>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-button
          type="warning"
          plain
          class="quick-btn"
          @click="openUrl('https://47.112.205.54:19242/fc392490')"
        >
          深圳服务器BT面板
        </el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script>
// 修改点2：引入请求方法（根据您的项目实际情况）
// 如果使用axios
import { getUserCount, getOrderCount, getTodayVisitCount,getSevercieOrderCount, getSubscripeOrderCount } from "@/api/system/dashboard";
// 或者如果您有统一的请求工具
// import request from '@/utils/request'

export default {
  name: "Index",
  data() {
    return {
      version: "1.0.0",
      // 修改点3：初始化stats数据，添加loading状态和默认值
      stats: [
        /* {
          label: "今日访问",
          value: 0, // 初始值为0
          clickable: false,
          loading: true, // 添加loading状态
          apiKey: "todayVisit", // 用于标识对应的接口
          apiMethod: "getTodayVisitCount" // 对应的API方法
        }, */
        {
          label: "用户总数",
          value: 0, // 初始值为0
          clickable: true,
          loading: true, // 添加loading状态
          path: "/vappuser/system/vappuser",
          apiKey: "userCount", // 用于标识对应的接口
          apiMethod: "getUserCount" // 对应的API方法
        },
        {
          label: "会员订阅订单总数",
          value: 0, // 初始值为0
          clickable: true,
          loading: true, // 添加loading状态
          path: "/order/system/subscribeOrder",
          apiKey: "orderSubscripeCount", // 用于标识对应的接口
          apiMethod: "getSubscribeOrderCount" // 对应的API方法
        },
        {
          label: "补充包订单总数",
          value: 0, // 初始值为0
          clickable: true,
          loading: true, // 添加loading状态
          path: "/order/system/servicebag",
          apiKey: "orderServiceCount", // 用于标识对应的接口
          apiMethod: "getServiceOrderCount" // 对应的API方法
        }
      ],

      shortcuts: [
        { name: "用户管理", path: "/system/user" },
        { name: "角色管理", path: "/system/role" },
        { name: "菜单管理", path: "/system/menu" },
        { name: "系统监控", path: "/monitor/server" }
      ],
    };
  },
  // 修改点4：在组件挂载时调用接口获取数据
  mounted() {
    this.fetchDashboardData();
  },
  methods: {
    // 修改点5：获取仪表板数据的方法
    async fetchDashboardData() {
      try {
        // 并行调用所有需要的接口
        const [userCountRes, orderSubscripeCountRes,orderServiceCountRes, todayVisitRes ] = await Promise.all([
          this.fetchUserCount(),
        //  this.fetchOrderCount(),

          this.fetchSubscripeOrderCount(),
          this.fetchSevercieOrderCount(),
          this.fetchTodayVisitCount()
        ]);

        // 更新对应的统计数据
        this.updateStatValue('userCount', userCountRes);
       // this.updateStatValue('orderCount', orderCountRes);
        this.updateStatValue('orderSubscripeCount', orderSubscripeCountRes);
        this.updateStatValue('orderServiceCount', orderServiceCountRes);
        this.updateStatValue('todayVisit', todayVisitRes);

      } catch (error) {
        console.error("获取仪表板数据失败:", error);
        // 可以添加错误提示
        this.$message.error("获取统计数据失败，请稍后重试");
      }
    },

    // 修改点6：获取用户总数的具体方法
    async fetchUserCount() {
      try {
        // 调用用户总数接口
        // 假设接口返回格式为：{ code: 200, data: { total: 102 } }
        const response = await getUserCount();
        if (response.code === 200) {
          // 根据实际接口返回的数据结构调整
          return  response.data;
        } else {
          console.error("获取用户总数失败:", response.message);
          return 0;
        }
      } catch (error) {
        console.error("获取用户总数异常:", error);
        return 0;
      }
    },

    // 修改点7：获取订单总数的具体方法
    async fetchOrderCount() {
      try {
        // 调用订单总数接口
        const response = await getOrderCount();

        if (response.code === 200) {
          // 根据实际接口返回的数据结构调整
          return  response.data;
        } else {
          console.error("获取订单总数失败:", response.message);
          return 0;
        }
      } catch (error) {
        console.error("获取订单总数异常:", error);
        return 0;
      }
    },

    // 修改点7.1：获取会员订阅订单总数的具体方法
    async fetchSubscripeOrderCount() {
      try {
        // 调用订单总数接口
        const response = await getSubscripeOrderCount();

        if (response.code === 200) {
          // 根据实际接口返回的数据结构调整
          return  response.data;
        } else {
          console.error("获取订单总数失败:", response.message);
          return 0;
        }
      } catch (error) {
        console.error("获取订单总数异常:", error);
        return 0;
      }
    },

    // 修改点7.2：获取订单总数的具体方法
    async fetchSevercieOrderCount() {
      try {
        // 调用订单总数接口
        const response = await getSevercieOrderCount();

        if (response.code === 200) {
          // 根据实际接口返回的数据结构调整
          return  response.data;
        } else {
          console.error("获取订单总数失败:", response.message);
          return 0;
        }
      } catch (error) {
        console.error("获取订单总数异常:", error);
        return 0;
      }
    },

    // 修改点8：获取今日访问量的具体方法（可选）
    async fetchTodayVisitCount() {
      try {
        // 调用今日访问量接口
        const response = await getTodayVisitCount();

        if (response.code === 200) {
          // 根据实际接口返回的数据结构调整
          return  response.data;
        } else {
          console.error("获取今日访问量失败:", response.message);
          return 0;
        }
      } catch (error) {
        console.error("获取今日访问量异常:", error);
        return 0;
      }
    },

    // 修改点9：更新统计数据的方法
    updateStatValue(apiKey, value) {
      const index = this.stats.findIndex(item => item.apiKey === apiKey);
      if (index !== -1) {
        this.stats[index].value = value;
        this.stats[index].loading = false;
      }
    },

    // 处理卡片点击事件
    handleCardClick(item) {
      if (item.clickable && item.path) {
        this.$router.push(item.path);
      }
    },

    goTarget(url) {
      this.$router.push(url);
    },

    openUrl(url) {
      window.open(url, "_blank");
    }
  },
};
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.welcome-card {
  text-align: center;
  padding: 20px 0;
  margin-bottom: 20px;
}
.welcome-title {
  font-size: 22px;
  font-weight: bold;
}
.welcome-subtitle {
  color: #888;
  margin-top: 5px;
}

.stats-row {
  margin-bottom: 20px;
}
.stats-card {
  text-align: center;
  padding: 15px 0;
  cursor: default; /* 默认不可点击 */
  transition: all 0.3s;
}
.stats-card.clickable-card {
  cursor: pointer;
}
.stats-card.clickable-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409EFF;
}
.stats-number {
  font-size: 26px;
  font-weight: bold;
  min-height: 36px; /* 添加最小高度防止布局跳动 */
  display: flex;
  align-items: center;
  justify-content: center;
}
.stats-label {
  color: #666;
  margin-top: 5px;
}

.bt-panel-row {
  margin-top: 20px;
}
.quick-btn {
  width: 100%;
  margin-bottom: 15px;
}
</style>
