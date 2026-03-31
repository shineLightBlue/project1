<template>
  <Teleport to="body">
      <div v-if="modelValue" class="feedback-modal">
          <div class="modal-content">
              <div class="modal-header">
                  <h3>{{ t('layout.settings.helpFeedback.submitFeedback') }}</h3>
                  <button class="close-btn" @click="closeModal">×</button>
              </div>
              <div class="modal-body">
                  <!-- 描述输入 -->
                  <div class="form-item">
                      <div class="image-upload-label">
                          {{ t('layout.settings.helpFeedback.feedbackModal.description') }}
                      </div>
                      <textarea
                          v-model="feedbackText"
                          :placeholder="t('layout.sidebar.editFolder.namePlaceholder')"
                          maxlength="200"
                          rows="4"
                          class="feedback-textarea"
                      ></textarea>
                      <div class="word-count">{{ feedbackText.length }}/200</div>
                  </div>
                  <!-- 图片上传 -->
                  <div class="form-item">
                      <div class="image-upload-label">
                          {{ t('layout.settings.helpFeedback.feedbackModal.images') }} 
                      </div>
                      <div class="image-list">
                          <!-- 上传按钮 -->
                          <label v-if="imageFiles.length < 6" class="upload-btn">
                              <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  @change="handleImageUpload"
                                  class="hidden-input"
                              />
                              <span>+</span>
                          </label>
                          <!-- 已上传图片预览 -->
                          <div
                              v-for="(img, index) in imagePreviews"
                              :key="index"
                              class="image-preview"
                          >
                              <img :src="img" class="preview-img" />
                              <button class="remove-img" @click="removeImage(index)">×</button>
                          </div>
                      </div>
                  </div>
              </div>
              <div class="modal-footer">
                  <button 
                      class="submit-btn" 
                      @click="submitFeedback" 
                      :disabled="submitting || feedbackText.length < 10"
                  >
                      {{ t('layout.settings.helpFeedback.feedbackModal.submit') }}
                  </button>
              </div>
          </div>
      </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { submitSuggestion } from '@/api/index.ts'

const props = defineProps<{ 
  modelValue: boolean 
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit-success'): void
  (e: 'submit-failed', message: string): void 
}>()

const { t } = useI18n()

const feedbackText = ref('')
const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])
const submitting = ref(false)

watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
      setTimeout(() => {
          feedbackText.value = ''
          imageFiles.value = []
          imagePreviews.value = []
      }, 200)
  }
})

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files) return

  const files = Array.from(input.files)
  const remainingSlots = 6 - imageFiles.value.length
  const validFiles = files.slice(0, remainingSlots)

  for (const file of validFiles) {
      if (!file.type.startsWith('image/')) {
          emit('submit-failed', t('layout.settings.helpFeedback.invalidImageType'))
          continue
      }
      if (file.size > 5 * 1024 * 1024) {
          emit('submit-failed', t('layout.settings.helpFeedback.imageTooLarge'))
          continue
      }
      const reader = new FileReader()
      reader.onload = (e) => {
          imagePreviews.value.push(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      imageFiles.value.push(file)
  }

  input.value = ''
}

const removeImage = (index: number) => {
  imageFiles.value.splice(index, 1)
  imagePreviews.value.splice(index, 1)
}

const submitFeedback = async () => {
  if (!feedbackText.value.trim()) {
      emit('submit-failed', t('layout.settings.helpFeedback.descriptionRequired'))
      return
  }

  const formData = new FormData()
  formData.append('suggestion', feedbackText.value.trim())
  imageFiles.value.forEach(file => {
      formData.append('files', file)
  })
  formData.append('platForm', 'web')

  submitting.value = true
  try {
      const response = await submitSuggestion(formData) 
      if (response.code === 200) {
          emit('submit-success')
          closeModal()
      } else {
          emit('submit-failed', t('layout.mainContent.transcription.markdownViewer.feedbackModal.feedback.submitFailed'))
      }
  } catch (error) {
      emit('submit-failed', t('layout.mainContent.transcription.markdownViewer.feedbackModal.feedback.submitFailed'))
  } finally {
      submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.feedback-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  border-radius: 6px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
      font-size: 18px;
      font-weight: 700;
      color: rgba(0, 0, 0);
      margin: 0;
  }

  .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
  }
}

.modal-body {
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 16px;
}

.feedback-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
      outline: none;
      border-color: #007aff;
  }
}

.word-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.image-upload-label {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.image-preview {
  position: relative;
  width: 65px;
  height: 65px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-img {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
      background-color: rgba(0, 0, 0, 0.8);
  }
}

.upload-btn {
  width: 70px;
  height: 70px;
  border: 1px dashed #ccc;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
  font-size: 24px;
  transition: border-color 0.2s;

  &:hover {
      border-color: #007aff;
  }

  .hidden-input {
      display: none;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  button {
      padding: 6.5px 24px;
      border-radius: 6px;
      font-size: 14px;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;

      &.cancel-btn {
          background-color: #f0f0f0;
          color: #333;

          &:hover {
              background-color: rgba(0, 117, 255, 0.2);
          }
      }

      &.submit-btn {
          background-color: #007aff;
          color: #fff;

          &:hover {
              background-color: #005bbf;
          }

          &:disabled {
              background-color: rgba(0, 117, 255, 0.2);
              cursor: not-allowed;
          }
      }
  }
}
</style>