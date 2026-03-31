<template>
  <div class="checkout-container">
    <!-- 参数错误提示 -->
    <el-alert
      v-if="paramError"
      :title="paramError"
      type="error"
      :closable="false"
      style="margin: 40px auto; max-width: 600px;">
    </el-alert>

    <!-- 加载中提示 -->
    <div v-if="!paramError && loading" class="loading-container">
      <i class="el-icon-loading" style="font-size: 48px;"></i>
      <p>正在创建支付会话，即将跳转...</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-container">
      <el-alert :title="error" type="error" :closable="false"></el-alert>
    </div>
  </div>
</template>

<script>
import { createCheckoutSession } from '@/api/pay/stripe'

export default {
  name: 'StripeCheckout',
  data() {
    return {
      loading: true, // 默认显示加载状态
      error: null,
      paramError: null,
      userId: '',
      productId: '',
      isAboardFlag: false, // true=国外=订阅，false=国内=一次性支付
      successUrl: '',
      cancelUrl: ''
    }
  },
  created() {
    console.log('=== Checkout页面创建 ===')
    console.log('路由信息:', this.$route)
    console.log('完整URL:', window.location.href)

    // 从路由参数或查询参数获取产品信息
    this.productId = this.$route.query.productId || this.$route.params.productId
    this.userId = this.$route.query.userId || this.$route.params.userId

    // 处理 isAboardFlag 参数（true=国外=订阅，false=国内=一次性支付）
    const isAboardFlagParam = this.$route.query.isAboardFlag
    if (isAboardFlagParam === 'true' || isAboardFlagParam === true) {
      this.isAboardFlag = true
    } else if (isAboardFlagParam === 'false' || isAboardFlagParam === false) {
      this.isAboardFlag = false
    } else {
      this.isAboardFlag = false // 默认为国内
    }

    console.log('解析的参数:', {
      productId: this.productId,
      userId: this.userId,
      isAboardFlag: this.isAboardFlag
    })

    // 检查必要参数
    if (!this.userId || !this.productId) {
      const missingParams = []
      if (!this.userId) missingParams.push('userId')
      if (!this.productId) missingParams.push('productId')
      this.paramError = `缺少必要参数：${missingParams.join('、')}。请通过URL参数传递，例如：/pay/stripe/checkout?userId=xxx&productId=xxx&isAboardFlag=false`
      console.error('参数错误:', this.paramError)
      return
    }

    // 构建成功和取消URL
    const baseUrl = window.location.origin
    this.successUrl = baseUrl + '/pay/stripe/checkout/success'
    this.cancelUrl = baseUrl + '/pay/stripe/checkout/cancel'
    console.log('成功URL:', this.successUrl)
    console.log('取消URL:', this.cancelUrl)

    // 直接调用支付接口并跳转
    this.redirectToCheckout()
  },
  methods: {
    async redirectToCheckout() {
      this.loading = true
      this.error = null

      if (!this.userId || !this.productId) {
        this.error = '缺少必要参数：userId 或 productId'
        this.loading = false
        return
      }

      const requestData = {
        userId: this.userId,
        productId: this.productId,
        isAboardFlag: this.isAboardFlag,
        successUrl: this.successUrl,
        cancelUrl: this.cancelUrl
      }

      console.log('准备调用创建Checkout Session API，请求数据:', requestData)

      try {
        console.log('开始调用 createCheckoutSession API...')
        const response = await createCheckoutSession(requestData)
        console.log('API响应:', response)

        if (response && response.code === 200 && response.data) {
          const { url, sessionId, orderId } = response.data
          console.log('获取到的数据:', { url, sessionId, orderId })

          if (url) {
            // 直接重定向到Checkout页面
            console.log('准备重定向到Stripe Checkout页面:', url)
            window.location.href = url
          } else if (sessionId) {
            this.error = '未获取到支付URL，但获取到sessionId: ' + sessionId
            this.loading = false
          } else {
            this.error = '创建支付会话失败：未返回有效数据'
            this.loading = false
          }
        } else {
          this.error = response?.msg || '创建支付会话失败，响应码: ' + (response?.code || '未知')
          console.error('API返回错误:', response)
          this.loading = false
        }
      } catch (e) {
        this.error = `发生错误: ${e.message || '未知错误'}`
        console.error('创建Checkout Session失败，详细错误:', e)
        console.error('错误堆栈:', e.stack)
        if (e.response) {
          console.error('HTTP响应:', e.response)
        }
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.checkout-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-container {
  text-align: center;
  padding: 40px;
}

.loading-container i {
  color: #409EFF;
  animation: rotating 2s linear infinite;
}

.loading-container p {
  margin-top: 20px;
  font-size: 16px;
  color: #606266;
}

.error-container {
  max-width: 600px;
  margin: 0 auto;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

