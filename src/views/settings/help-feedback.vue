<template>
  <section class="settings-placeholder">
      <h2 class="settings-placeholder-title">{{ t('layout.settings.helpFeedback.suggestionsFeedback') }}</h2>
      <!-- 建议反馈 -->
      <div class="feedback-section">
          <div class="feedback-item" @click="handleFeedback">
              <div class="item-left">
                  <img src="@/assets/images/icon_email.svg" class="menu-svg" />
                  <span class="item-text">{{ t('layout.settings.helpFeedback.submitFeedback') }}</span>
              </div>
          </div>
      </div>
      <!-- 联系我们 -->
      <div class="contact-section">
          <h3 class="section-title">{{ t('layout.settings.helpFeedback.contactUs') }}</h3>
          <p class="work-time">{{ t('layout.settings.helpFeedback.operatingHours') }}</p>
          <div class="contact-list">
              <!-- WhatsApp -->
              <div class="contact-item" @click.stop="copyText('+86 12345678910')" >
                  <div class="item-left">
                      <img src="@/assets/images/icon_whatsaApp.svg" class="menu-svg" />
                      <span class="item-text">{{ t('layout.settings.helpFeedback.whatsapp') }}</span>
                  </div>
                  <div class="item-right">
                      <span class="contact-info">+86 18929355053</span>
                      <img 
                          src="@/assets/images/icon_copy.svg" 
                          class="menu-svg" 
                          @click.stop="copyText('+86 12345678910')" 
                      />
                  </div>
              </div>
              <!-- 邮件 -->
              <div class="contact-item" @click.stop="copyText('support@boya-mic.com')" >
                  <div class="item-left">
                      <img src="@/assets/images/icon_emails.svg" class="menu-svg" />
                      <span class="item-text">{{ t('layout.settings.helpFeedback.email') }}</span>
                  </div>
                  <div class="item-right">
                      <span class="contact-info">support@boya-mic.com</span>
                      <img 
                          src="@/assets/images/icon_copy.svg" 
                          class="menu-svg" 
                          @click.stop="copyText('support@boya-mic.com')" 
                      />
                  </div>
              </div>
              <!-- 在线客服 -->
              <div class="contact-item" @click="openOnlineService">
                  <div class="item-left">
                      <img src="@/assets/images/icon_Online.svg" class="menu-svg" />
                      <span class="item-text">{{ t('layout.settings.helpFeedback.onlineService') }}</span>
                  </div>
                  <div class="item-right">
                      <img src="@/assets/images/icon_IN.svg" class="menu-svg" />
                  </div>
              </div>
              <!-- 电话 -->
              <div class="contact-item" @click.stop="copyText('400 6131 096')" >
                  <div class="item-left">
                      <img src="@/assets/images/icon_PhoneNumber.svg" class="menu-svg" />
                      <span class="item-text">{{ t('layout.settings.helpFeedback.phone') }}</span>
                  </div>
                  <div class="item-right">
                      <span class="contact-info">400 6131 096</span>
                      <img 
                          src="@/assets/images/icon_copy.svg" 
                          class="menu-svg" 
                          @click.stop="copyText('400 6131 096')" 
                      />
                  </div>
              </div>
          </div>
      </div>
      <!-- 常见问题 -->
      <div class="faq-section">
          <h3 class="section-title">{{ t('layout.settings.helpFeedback.commonQuestions') }}</h3>
          <div class="faq-list">

          </div>
      </div>

      <!-- 反馈弹窗 -->
      <FeedbackModal
          v-model="showFeedbackModal"
          @submit-success="handleSubmitSuccess"
          @submit-failed="handleSubmitFailed"
      />

      <div v-if="toastVisible" class="toast-message">{{ toastText }}</div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FeedbackModal from '@/components/FeedbackModal.vue' 

const { t } = useI18n()

const toastVisible = ref(false)
const toastText = ref('')
const showFeedbackModal = ref(false)

const showToast = (message: string, duration = 2000) => {
  toastText.value = message
  toastVisible.value = true
  setTimeout(() => {
      toastVisible.value = false
  }, duration)
}

const copyText = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
      showToast(t('common.copySuccess'))
  }).catch(err => {
      console.error('复制失败：', err)
  })
}

// 打开反馈弹窗
const handleFeedback = () => {
  showFeedbackModal.value = true
}

// 提交成功
const handleSubmitSuccess = () => {
  showToast(t('layout.settings.helpFeedback.feedbackModal.submitSuccess'))
}

// 提交失败
const handleSubmitFailed = (message: string) => {
  showToast(message)  
}

// 在线客服
const openOnlineService = () => {
  const url = 'https://1335263.udeskglobal.com/im_client/?web_plugin_id=3653&cur_title=BOYA%20%7C%20Innovative%20Wireless%2C%20Lavalier%2C%20USB%20Microphones%20%26%20More&src_url=&cur_url=https%3A%2F%2Fwww.boyamic.com%2F&pre_url=https%3A%2F%2Fwww.boyamic.com%2F&language=en-us&_INVITE_USER_KEY=368d5aca-e52f-4b3b-848b-6e814af81eed&robot_enable_robot=true&robot_hosting_to_agent_key=&robot_reception_strategy=all_day&robot_enable_invite=false&robot_black_address_enable=false&robot_scene_id=5945&robot_hosting_show_robot=false&robot_auto_translate=false&robot_hosting_to_agent_enable=false&robot_hosting_threshold=&robot_manual_reception_strategy=[object%20Object]&robot_enable_agent=true&robot_auto_translate_mode=user&robot_hosting_scene_id=&robot_hosting_enable=false&robot_robot_work_time=0&robot_black_address_info=&robot_final_robot_id=247&robot_black_address_ids=&robot_hosting_udesk_robot_id=&robot_hosting_agent_to_robot=false&robot_udesk_robot_id=247&robot_show_robot_times=0&robot_hosting_switch_staff_type=false'
  window.open(url, '_blank')
}
</script>

<style lang="scss" scoped>
.settings-placeholder {
  padding: 0px 20px;
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
}

.settings-placeholder-title {
  font-weight: 600;
  font-size: 16px;
  color: #1a1a1a;
  margin: 0 0 20px 0;
  line-height: 28px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 12px 0;
  line-height: 22px;
}

.feedback-section {
  margin-bottom: 24px;
}

.feedback-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.05s;
  border: 1px solid #f0f0f0;

  &:hover {
    background-color: #f3f4f6;
  }

  &:active {
    transform: scale(0.98);
  }

  .item-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .item-text {
    font-size: 14px;
    color: #1a1a1a;
    line-height: 20px;
  }
}

.contact-section {
  margin-bottom: 24px;
}

.work-time {
  font-size: 12px;
  color: #666;
  margin: 0 0 12px 0;
  line-height: 18px;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.05s;
  border: 1px solid #f0f0f0;

  &:hover {
    background-color: #f3f4f6;
  }

  &:active {
    transform: scale(0.98);
  }

  .item-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .item-text {
    font-size: 14px;
    color: #1a1a1a;
    line-height: 20px;
  }

  .item-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .contact-info {
    font-size: 14px;
    color: rgb(0, 0, 0, 0.6);
    line-height: 20px;
  }

  .menu-svg {
    width: 12px;
    height: 12px;
    cursor: pointer;
    transition: transform 0.05s, opacity 0.1s;

    &:active {
      transform: scale(0.95);
      opacity: 0.7;
    }
  }
}

.faq-section {
  margin-bottom: 24px;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.faq-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.05s;
  border: 1px solid #f0f0f0;

  &:hover {
    background-color: #f3f4f6;
  }

  &:active {
    transform: scale(0.98);
  }

  .faq-text {
    font-size: 14px;
    color: #1a1a1a;
    line-height: 20px;
  }
}

.toast-message {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 1000;
  animation: fadeInOut 2s ease-in-out;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>