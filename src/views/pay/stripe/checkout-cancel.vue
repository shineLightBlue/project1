<template>
  <div class="cancel-container">
    <el-card>
      <div class="cancel-content">
        <div class="cancel-icon">
          <i class="el-icon-close" style="font-size: 64px; color: #F56C6C;"></i>
        </div>
        <h1>支付已取消</h1>
        <p>您的支付已被取消，没有扣款。</p>
        <el-button type="primary" @click="goBack" style="margin-top: 20px;">返回继续购物</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'PaymentCancel',
  methods: {
    goBack() {
      // 返回上一页或首页
      if (window.history.length > 1) {
        this.$router.go(-1)
      } else {
        this.$router.push('/')
      }
    }
  }
}
</script>

<style scoped>
.cancel-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
}

.cancel-content {
  text-align: center;
}

.cancel-icon {
  margin-bottom: 20px;
}

.cancel-content h1 {
  color: #F56C6C;
  margin-bottom: 20px;
}

.cancel-content p {
  color: #606266;
  margin-bottom: 20px;
}
</style>

