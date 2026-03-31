<template>
  <div class="success-container">
    <el-card>
      <div v-if="loading" class="loading">
        <i class="el-icon-loading"></i>
        <p>加载中...</p>
      </div>
      <div v-else-if="error" class="error">
        <el-alert :title="error" type="error" :closable="false"></el-alert>
        <el-button type="primary" @click="goHome" style="margin-top: 20px;">返回首页</el-button>
      </div>
      <div v-else class="success">
        <div class="success-icon">
          <i class="el-icon-success" style="font-size: 64px; color: #67C23A;"></i>
        </div>
        <h1>支付成功!</h1>
        <div class="details">
          <p><strong>会话ID:</strong> {{ sessionId }}</p>
          <p v-if="sessionDetails.paymentStatus"><strong>支付状态:</strong> {{ sessionDetails.paymentStatus }}</p>
          <p v-if="sessionDetails.customer"><strong>客户ID:</strong> {{ sessionDetails.customer }}</p>
          <p v-if="sessionDetails.subscription"><strong>订阅ID:</strong> {{ sessionDetails.subscription }}</p>
          <p v-if="sessionDetails.paymentIntent"><strong>支付意图ID:</strong> {{ sessionDetails.paymentIntent }}</p>
        </div>
        <el-button type="primary" @click="goHome" style="margin-top: 30px;">返回首页</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { getCheckoutSessionStatus } from '@/api/pay/stripe'

export default {
  name: 'PaymentSuccess',
  data() {
    return {
      loading: true,
      error: null,
      sessionId: '',
      sessionDetails: {}
    }
  },
  async created() {
    // 从URL获取session_id
    this.sessionId = this.$route.query.session_id

    if (!this.sessionId) {
      this.error = '无效的会话ID'
      this.loading = false
      return
    }

    try {
      // 从后端获取会话详情
      const response = await getCheckoutSessionStatus(this.sessionId)

      if (response.code === 200 && response.data) {
        this.sessionDetails = response.data
      } else {
        throw new Error(response.msg || '获取会话详情失败')
      }
    } catch (e) {
      this.error = e.message || '获取会话详情失败'
      console.error('获取Checkout Session状态失败:', e)
    } finally {
      this.loading = false
    }
  },
  methods: {
    goHome() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.success-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
}

.success {
  text-align: center;
}

.success-icon {
  margin-bottom: 20px;
}

.success h1 {
  color: #67C23A;
  margin-bottom: 30px;
}

.details {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  text-align: left;
}

.details p {
  margin: 10px 0;
  color: #606266;
}

.details strong {
  color: #303133;
  margin-right: 10px;
}

.loading {
  text-align: center;
  font-size: 18px;
  color: #409EFF;
}

.loading i {
  font-size: 32px;
  margin-bottom: 10px;
}

.error {
  text-align: center;
}
</style>

