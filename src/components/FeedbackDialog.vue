<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('dialogs.feedback.title')"
    width="500px"
    @close="handleClose"
    class="feedback-dialog"
  >
    <p class="subtitle">{{ t('dialogs.feedback.subtitle') }}</p>

    <div class="feedback-tags">
      <el-button
        v-for="tag in predefinedTags"
        :key="tag"
        :class="{ active: localFeedbackSelection.includes(tag) }"
        @click="toggleTag(tag)"
      >
        {{ tag }}
      </el-button>
    </div>

    <div class="other-feedback">
      <el-input
        v-model="localFeedbackContent"
        type="textarea"
        :rows="4"
        :placeholder="t('dialogs.feedback.placeholderOther')"
      />
    </div>

    <div class="share-permission">
      <el-checkbox v-model="localSharePermission">
        {{ t('dialogs.feedback.agreeShare') }}
      </el-checkbox>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="handleSubmit">{{ t('dialogs.feedback.send') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElDialog, ElButton, ElInput, ElCheckbox } from 'element-plus';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits(['update:visible', 'submit']);

const { t } = useI18n();

const dialogVisible = ref(props.visible);
const predefinedTags = computed(() => [
  t('dialogs.feedback.tag1'),
  t('dialogs.feedback.tag2'),
  t('dialogs.feedback.tag3'),
  t('dialogs.feedback.tag4'),
]);
const localFeedbackSelection = ref<string[]>([]);
const localFeedbackContent = ref('');
const localSharePermission = ref(false);

watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal;
  if (!newVal) {
    resetForm();
  }
});

function handleClose() {
  emit('update:visible', false);
}

function toggleTag(tag: string) {
  const index = localFeedbackSelection.value.indexOf(tag);
  if (index > -1) {
    localFeedbackSelection.value.splice(index, 1);
  } else {
    localFeedbackSelection.value.push(tag);
  }
}

function handleSubmit() {
  emit('submit', {
    feedbackSelection: localFeedbackSelection.value,
    feedbackContent: localFeedbackContent.value,
    sharePermission: localSharePermission.value,
  });
  handleClose();
}

function resetForm() {
    localFeedbackSelection.value = [];
    localFeedbackContent.value = '';
    localSharePermission.value = false;
}
</script>

<style lang="scss" scoped>
.feedback-dialog {
  .subtitle {
    color: #666;
    font-size: 14px;
    margin-top: -10px;
    margin-bottom: 20px;
  }

  .feedback-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-content: flex-start;
    gap: 10px;
    margin-bottom: 20px;
    text-align: left;

    .el-button {
      margin: 0;
      flex: 0 0 auto;

      &.active {
        background-color: var(--el-color-primary);
        color: white;
      }
    }
  }

  .other-feedback {
    margin-bottom: 20px;
    label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-size: 14px;
    }
  }

  .share-permission {
    margin-bottom: 20px;
  }
}
</style>
