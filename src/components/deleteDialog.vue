<template>
  <!-- 删除确认弹窗 -->
  <el-dialog
    align-center
    v-model="deleteDialogVisible"
    class="delete-confirm"
    :title="title"
    width="408px"
    :show-close="true"
  >
    <div class="delete-dialog-content">
      <slot></slot>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="deleteDialogVisible = false" class="cancel-btn"
          >{{ $t('layout.sidebar.editFolder.deleteConfirm.cancelButton') }}
        </el-button>
        <el-button type="danger" @click="emits('confirmDelete')" class="delete-btn"
          >{{ $t('layout.sidebar.editFolder.deleteConfirm.confirmButton') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup>
import { ElButton, ElDialog } from 'element-plus'

const deleteDialogVisible = defineModel()
const emits = defineEmits(['confirmDelete'])
defineProps(['title'])
</script>
<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 20px;

  .cancel-btn,
  .delete-btn {
    min-width: 92px;
    height: 37px;
  }

  .cancel-btn {
    color: #000;
    border-color: #979797;
  }

  .delete-btn {
    margin-left: 0;
    background-color: #fe5348;
  }
}
</style>
<style lang="scss">
.el-dialog.delete-confirm {
  padding: 20px;
  border-radius: 12px;

  .el-dialog__header {
    padding-bottom: 30px;
  }

  .el-dialog__title {
    color: #000;
  }

  .delete-dialog-content {
    p {
      font-size: 14px;
      line-height: 1.5;
      color: #000;
    }
  }

  .el-dialog__footer {
    padding-top: 30px;
  }
}
</style>
