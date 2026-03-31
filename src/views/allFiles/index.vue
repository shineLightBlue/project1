<template>
  <el-container class="page-container">
    <!-- 全部文件模块 -->
    <el-aside :width="uiStore.isL2AsideVisible ? '339px' : '0'" class="l2-aside">
      <List ref="listRef" @file-selected="handleFileClick" />
    </el-aside>

    <!-- 转写、纪要、导图 -->
    <el-main class="l3-main">
      <img
        v-if="!uiStore.isL2AsideVisible"
        src="@/assets/images/icon_second_menu_button.svg"
        :alt="t('layout.headerRight.messages.showL2Nav')"
        class="show-l2-icon"
        @click="uiStore.toggleL2Aside(true)"
      />
      <!-- Transcription Content -->
      <div v-if="selectedFile" class="l3-main-content">
        <div class="l3-main-header" :class="{ 'has-show-icon': !uiStore.isL2AsideVisible }">
          <div class="tabs-row">
            <el-tabs v-model="activeTab" class="transcription-tabs">
              <el-tab-pane :label="t('layout.mainContent.tabs.transcription')" name="transcription">
                <div class="transcription-pane-content">
                  <div class="audio-player-container">
                    <CustomAudioPlayer
                      ref="audioPlayerRef"
                      :src="currentAudioUrl"
                      :sentence-infos="sentenceInfos"
                      :segment-marker-ms="jiayzProgressMarkersMs"
                      :key="currentAudioUrl"
                      @pause="handleAudioEvent"
                      @ended="handleAudioEvent"
                      @crop="isAudioEditorVisible = true"
                    />
                  </div>
                  <!-- 生成中 -->
                  <div v-if="isGenerating" class="generating-placeholder">
                    <img
                      :src="iconTransliterationGenerating"
                      :alt="t('layout.mainContent.transcription.generatingView.loading')"
                      class="generating-bg"
                    />
                    <div class="generating-status">
                      <div class="generating-text">
                        <span class="generating-spinner"></span>
                        {{ t('layout.mainContent.transcription.generatingView.loading') }}
                      </div>
                      <p>{{ t('layout.mainContent.transcription.generatingView.hint') }}</p>
                    </div>
                  </div>
                  <!-- 已转写：展示转写列表 -->
                  <div v-else-if="selectedFile.status === '1'" class="transcription-list">
                    <div v-if="!sentenceInfos.length" class="transcription-empty">
                      {{ t('common.noData') }}
                    </div>
                    <div
                      v-for="(sentence, sentenceIdx) in sentenceInfos"
                      :key="sentence.startMs"
                      class="transcription-item"
                      :class="{ 'is-editing': editingSentenceStartMs === sentence.startMs }"
                    >
                      <div class="transcription-item-main">
                        <div class="transcription-content">
                          <div class="timestamp">
                            <span class="speaker-label" @click="openEditSpeakerDialog(sentence)"
                              >{{ t('layout.headerRight.shareMenu.speaker')
                              }}{{ sentence.speaker ?? '0' }}</span
                            >
                            {{ sentence.start }}
                            <el-button
                              type="default"
                              circle
                              size="small"
                              class="sentence-play-btn"
                              @click="toggleSentencePlayback(sentence)"
                            >
                              <img
                                :src="
                                  playingSentenceStartMs === sentence.startMs ? pauseIcon : playIcon
                                "
                                class="sentence-play-icon"
                                alt=""
                              />
                            </el-button>
                          </div>
                          <div
                            v-if="editingSentenceStartMs === sentence.startMs"
                            class="transcription-edit"
                          >
                            <el-input
                              v-model="editingText"
                              type="textarea"
                              :rows="3"
                              autofocus
                              class="edit-textarea"
                            />
                          </div>
                          <div v-else class="text">
                            <template
                              v-for="(seg, segIdx) in getSentenceTextSegments(sentence, sentenceIdx)"
                              :key="segIdx"
                            >
                              <span v-if="seg.highlight" class="text-marker-highlight">{{ seg.text }}</span>
                              <template v-else>{{ seg.text }}</template>
                            </template>
                          </div>
                        </div>
                        <div class="transcription-item-actions">
                          <template v-if="editingSentenceStartMs === sentence.startMs">
                            <el-button size="small" @click="cancelEditSentence"
                              >{{ t('common.cancel') }}
                            </el-button>
                            <el-button type="primary" size="small" @click="saveEditSentence"
                              >{{ t('common.save') }}
                            </el-button>
                          </template>
                          <template v-else>
                            <el-tooltip :content="t('common.edit')" placement="top">
                              <el-button
                                type="primary"
                                link
                                size="small"
                                class="action-btn action-btn-edit"
                                @click="startEditSentence(sentence)"
                              >
                                <img
                                  src="@/assets/allfiles/iconedit.svg"
                                  :alt="t('common.edit')"
                                  class="action-icon default"
                                />
                                <img
                                  src="@/assets/allfiles/iconedit_hover.svg"
                                  :alt="t('common.edit')"
                                  class="action-icon hover"
                                />
                              </el-button>
                            </el-tooltip>
                            <el-tooltip :content="t('common.copy')" placement="top">
                              <el-button
                                type="primary"
                                link
                                size="small"
                                class="action-btn action-btn-copy"
                                @click="copySentenceText(sentence)"
                              >
                                <img
                                  src="@/assets/allfiles/iconcopy.svg"
                                  :alt="t('common.copy')"
                                  class="action-icon default"
                                />
                                <img
                                  src="@/assets/allfiles/iconcopy_hover.svg"
                                  :alt="t('common.copy')"
                                  class="action-icon hover"
                                />
                              </el-button>
                            </el-tooltip>
                          </template>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- 未转写：展示占位提示 -->
                  <div v-else class="no-transcription-placeholder">
                    <img
                      :src="iconTransliterationDefault"
                      :alt="t('layout.mainContent.transcription.noTranscription')"
                      class="placeholder-image"
                    />
                    <h2>{{ t('layout.mainContent.transcription.noTranscription') }}</h2>
                    <p>{{ t('layout.mainContent.transcription.willShowAfterGeneration') }}</p>
                    <el-button
                      type="primary"
                      class="generate-button"
                      @click="handleGenerateTranscription"
                    >
                      <img
                        :src="iconTransliterationGenerated"
                        :alt="t('layout.mainContent.transcription.generate')"
                      />
                      {{ t('layout.mainContent.transcription.generate') }}
                    </el-button>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane :label="t('layout.mainContent.tabs.summary')" name="summary">
                <template v-if="selectedFile.status === '1'">
                  <div class="summary-pane">
                    <div class="summary-main">
                      <!-- 标题 -->
                      <h1
                        v-if="
                          summaryResult?.summaryResult?.content &&
                          activeTab === 'summary' &&
                          summaryResult?.summaryResult?.title
                        "
                        class="summary-title"
                      >
                        {{ summaryResult.summaryResult.title }}
                      </h1>
                      <!-- 关键词区域 -->
                      <div
                        v-if="summaryResult?.summaryResult?.content && activeTab === 'summary'"
                        class="summary-keywords-row"
                      >
                        <el-tag
                          v-for="(kw, idx) in summaryKeywords"
                          :key="idx"
                          class="keyword-tag"
                          closable
                          @close="removeKeyword(idx)"
                        >
                          {{ kw || t('layout.headerRight.shareMenu.keywords') }}
                        </el-tag>
                        <el-popover
                          :visible="isKeywordPopoverVisible"
                          placement="bottom-start"
                          :width="220"
                          trigger="manual"
                        >
                          <template #reference>
                            <span
                              class="keyword-add-btn"
                              @click="isKeywordPopoverVisible = !isKeywordPopoverVisible"
                            >
                              <span class="keyword-add-icon">+</span>
                            </span>
                          </template>
                          <div class="keyword-add-popover">
                            <el-input
                              v-model="newKeywordInput"
                              :placeholder="t('layout.headerRight.shareMenu.keywords')"
                              size="small"
                              clearable
                              @keyup.enter="addKeyword"
                            />
                            <el-button
                              type="primary"
                              size="small"
                              class="keyword-add-confirm"
                              @click="addKeyword"
                            >
                              {{ t('layout.headerRight.keywordAdd') }}
                            </el-button>
                          </div>
                        </el-popover>
                      </div>
                      <div ref="summaryContentRef" class="summary-content-wrap">
                        <BlockNoteEditor
                          ref="blockNoteEditorRef"
                          v-if="summaryResult?.summaryResult?.content"
                          :key="selectedFile?.fileUuid"
                          :model-value="summaryContentForRender"
                          class="summary-editor"
                          @update:model-value="updateSummaryContent"
                        />
                        <div v-else class="transcription-empty">{{ t('common.noData') }}</div>
                      </div>
                    </div>
                    <div
                      v-show="summaryToc.length"
                      class="markdown-viewer-toc"
                      :class="{ collapsed: !isSummaryTocVisible }"
                    >
                      <div class="toc-header">
                        <button
                          v-if="!isSummaryTocVisible"
                          type="button"
                          class="toc-toggle-btn"
                          :aria-label="t('common.showDirectory')"
                          @click="isSummaryTocVisible = true"
                        >
                          <img :src="iconMeetingDisplayDirectory" alt="" />
                        </button>
                        <button
                          v-else
                          type="button"
                          class="toc-toggle-btn"
                          :aria-label="t('common.hideDirectory')"
                          @click="isSummaryTocVisible = false"
                        >
                          <img :src="iconMeetingHiddenDirectory" alt="" />
                        </button>
                      </div>
                      <div v-show="isSummaryTocVisible" class="toc-body">
                        <div
                          v-for="(item, index) in summaryToc"
                          :key="index"
                          class="summary-toc-item"
                          @click="scrollToTocItem(index)"
                        >
                          {{ item.text }}
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                <div v-else class="no-transcription-placeholder">
                  <img
                    :src="iconTransliterationDefault"
                    :alt="t('layout.mainContent.summary.noSummary')"
                    class="placeholder-image"
                  />
                  <h2>{{ t('layout.mainContent.summary.noSummary') }}</h2>
                  <p>{{ t('layout.mainContent.summary.willShowAfterGeneration') }}</p>
                  <el-button
                    type="primary"
                    class="generate-button"
                    @click="handleGenerateTranscription"
                  >
                    <img
                      :src="iconTransliterationGenerated"
                      :alt="t('layout.mainContent.transcription.generate')"
                    />
                    {{ t('layout.mainContent.transcription.generate') }}
                  </el-button>
                </div>
              </el-tab-pane>
              <el-tab-pane :label="t('layout.mainContent.tabs.mindMap')" name="mindmap">
                <template v-if="selectedFile.status === '1'">
                  <MindMapViewer
                    v-if="activeTab === 'mindmap' && xmindMarkdown"
                    :markdown="xmindMarkdown"
                  />
                  <div v-else class="transcription-empty">{{ t('common.noData') }}</div>
                </template>
                <div v-else class="no-transcription-placeholder">
                  <img
                    :src="iconTransliterationDefault"
                    :alt="t('layout.mainContent.mindMap.noMindmap')"
                    class="placeholder-image"
                  />
                  <h2>{{ t('layout.mainContent.mindMap.noMindmap') }}</h2>
                  <p>{{ t('layout.mainContent.mindMap.willShowAfterGeneration') }}</p>
                  <el-button
                    type="primary"
                    class="generate-button"
                    @click="handleGenerateTranscription"
                  >
                    <img
                      :src="iconTransliterationGenerated"
                      :alt="t('layout.mainContent.transcription.generate')"
                    />
                    {{ t('layout.mainContent.transcription.generate') }}
                  </el-button>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
          <div class="header-actions">
            <el-dropdown
              placement="bottom-end"
              trigger="click"
              @visible-change="(v: boolean) => (isShareDropdownVisible = v)"
            >
              <span
                class="header-action-btn header-action-btn-share"
                :class="{ 'is-active': isShareDropdownVisible }"
              >
                <img
                  src="@/assets/allfiles/icon_header_share.svg"
                  :alt="t('layout.headerRight.share')"
                  class="action-icon"
                />
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleShareLink">
                    <img :src="iconShareLink" alt="" class="share-dropdown-icon" />
                    {{ t('layout.headerRight.shareMenu.shareLink') }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleCopyTranscription">
                    <img :src="iconCopyTranscribe" alt="" class="share-dropdown-icon" />
                    {{ t('layout.headerRight.shareMenu.copyTranscribe') }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleCopySummary">
                    <img :src="iconCopySummary" alt="" class="share-dropdown-icon" />
                    {{ t('layout.headerRight.shareMenu.copySummary') }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleExportAudio">
                    <img :src="iconExportAudio" alt="" class="share-dropdown-icon" />
                    {{ t('layout.headerRight.shareMenu.exportAudio') }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleExportTranscription">
                    <img :src="iconExportTranscribe" alt="" class="share-dropdown-icon" />
                    {{ t('layout.headerRight.shareMenu.exportTranscribe') }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleExportSummary">
                    <img :src="iconExportSummary" alt="" class="share-dropdown-icon" />
                    {{ t('layout.headerRight.shareMenu.exportSummary') }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleExportMindMap">
                    <img :src="iconExportMindMap" alt="" class="share-dropdown-icon" />
                    {{ t('layout.headerRight.shareMenu.exportMindMap') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-dropdown
              placement="bottom-end"
              trigger="click"
              @visible-change="(v: boolean) => (isMoreDropdownVisible = v)"
            >
              <span
                class="header-action-btn header-action-btn-more"
                :class="{ 'is-active': isMoreDropdownVisible }"
              >
                <img
                  src="@/assets/allfiles/icon_header_more.svg"
                  :alt="t('layout.headerRight.more')"
                  class="action-icon"
                />
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click.stop="moveToFolder">
                    <img :src="iconMoveToFolder" alt="" class="share-dropdown-icon" />
                    {{ t('layout.headerRight.moreMenu.moveToFolder') }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleGenerateTranscription">
                    <img :src="iconRegenerate" alt="" class="share-dropdown-icon" />
                    {{ t('layout.headerRight.moreMenu.regenerate') }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="activeTab === 'transcription'"
                    @click="openSpeakerNameDialog"
                  >
                    <img :src="iconNameSpeaker" alt="" class="share-dropdown-icon" />
                    {{ t('layout.headerRight.moreMenu.nameSpeaker') }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="activeTab === 'summary'" @click="openTranslateDialog">
                    <img :src="iconTranslation" alt="" class="share-dropdown-icon" />
                    {{ t('layout.headerRight.moreMenu.translate') }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="activeTab === 'summary'"
                    @click="searchReplaceShow = true"
                  >
                    <img :src="iconFindAndReplace" alt="" class="share-dropdown-icon" />
                    {{ t('layout.headerRight.moreMenu.findAndReplace') }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="moveToRecycle">
                    <img :src="iconMoveToRecycling" alt="" class="share-dropdown-icon" />
                    {{ t('layout.headerRight.moreMenu.moveToRecycleBin') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <div class="ask-ai flex-center" @click="drawer = true">
              <img src="@/assets/images/icon_ask_ai.svg" alt="" />
              <div>{{ t('layout.sidebar.askAI') }}</div>
            </div>
          </div>
        </div>
        <div
          class="feedback-actions"
          v-if="
            !isGenerating &&
            selectedFile.status === '1' &&
            (activeTab === 'transcription' || activeTab === 'summary')
          "
        >
          <el-button v-if="summaryResult?.summaryResult?.feedback === '1'" disabled>
            <img :src="praiseSelectedIcon" :alt="t('common.praise')" />
          </el-button>
          <el-button v-else-if="summaryResult?.summaryResult?.feedback === '2'" disabled>
            <img :src="criticizeSelectedIcon" :alt="t('common.criticize')" />
          </el-button>
          <template v-else>
            <el-button @click="handlePraise">
              <img :src="praiseIcon" :alt="t('common.praise')" />
            </el-button>
            <el-button @click="handleCriticize">
              <img :src="criticizeIcon" :alt="t('common.criticize')" />
            </el-button>
          </template>
        </div>
      </div>

      <!-- Welcome Placeholder -->
      <div v-else class="welcome-placeholder">
        <img src="@/assets/images/icon_notra.svg" alt="logo" />
        <p>{{ t('layout.mainContent.welcome') }}</p>
      </div>
    </el-main>

    <!-- ask ai -->
    <el-aside class="ask-ai-section" :width="drawer ? '461px' : '0'">
      <AskAI :id="selectedFile?.fileUuid" @close="drawer = false" />
    </el-aside>

    <TranslateDialog v-model:visible="isTranslateDialogVisible" @translate="handleTranslate" />
    <ShareLinkDialog
      v-model:visible="isShareLinkDialogVisible"
      :transcribe-id="selectedFile?.fileUuid ?? ''"
    />
    <ExportAudioDialog
      v-model:visible="isExportAudioDialogVisible"
      :oss-key="selectedFile?.ossKey ?? ''"
      :file-name="selectedFile?.displayName ?? ''"
    />
    <ExportTranscriptionDialog
      v-model:visible="isExportTranscriptionDialogVisible"
      :sentence-infos="sentenceInfos"
      :file-name="selectedFile?.displayName ?? ''"
      :title="summaryResult?.summaryResult?.title ?? ''"
    />
    <ExportSummaryDialog
      v-model:visible="isExportSummaryDialogVisible"
      :content="summaryContentForExport"
      :file-name="selectedFile?.displayName ?? ''"
    />
    <ExportMindMapDialog
      v-model:visible="isExportMindMapDialogVisible"
      :markdown="xmindMarkdown"
      :file-name="selectedFile?.displayName ?? ''"
    />
    <FeedbackDialog v-model:visible="isFeedbackDialogVisible" @submit="submitDetailedFeedback" />
    <GenerateMethodDialog
      ref="generateMethodDialogRef"
      v-model:visible="isGenerateMethodDialogVisible"
      @confirm="handleGenerateMethodConfirm"
      @open-template="handleOpenTemplateDialog"
    />
    <SummaryTemplateDialog
      v-model:visible="isSummaryTemplateDialogVisible"
      :initial-model-id="templateDialogSettings.modelId"
      :initial-language-code="templateDialogSettings.languageCode"
      :initial-distinguish-speaker="templateDialogSettings.distinguishSpeaker"
      @confirm="handleTemplateConfirm"
    />
    <BindingDeviceDialog v-model:visible="isBindingDeviceDialogVisible" />
    <AudioEditorDialog
      v-model:visible="isAudioEditorVisible"
      :audio-url="currentAudioUrl"
      :file-name="selectedFile?.displayName ?? ''"
      @save="handleAudioEditorSave"
    />

    <!-- 命名发言人弹窗 -->
    <el-dialog
      v-model="isSpeakerNameDialogVisible"
      :title="t('layout.headerRight.speakerNameDialog.title')"
      width="600px"
      :align-center="false"
      top="40px"
      class="speaker-name-dialog common-modal"
      @closed="onSpeakerNameDialogClosed"
    >
      <div v-if="sentenceInfos.length" class="speaker-segments">
        <div
          v-for="group in speakerGroups"
          :key="group.key === '' ? '__empty_speaker__' : group.key"
          class="speaker-group-block"
        >
          <el-input
            v-model="speakerGroupNames[group.key]"
            class="speaker-name-input name-speaker-modal-speaker-input"
            :placeholder="t('layout.headerRight.speakerNameDialog.speakerNamePlaceholder')"
          />
          <div class="speaker-total-duration">
            {{ t('layout.headerRight.speakerNameDialog.totalDuration') }}:
            {{ Math.round(group.totalDurationMs / 1000) }}s
          </div>
          <div
            v-for="(seg, segIndex) in group.segments"
            :key="`${seg.startMs}-${seg.endMs}-${segIndex}`"
            class="segment-block"
          >
            <div class="time-range">
              <span class="name-speaker-modal-segment-time">{{ seg.start }}-{{ seg.end }}</span>
              <span class="name-speaker-modal-segment-duration"
                >{{ Math.round(((seg.endMs ?? 0) - (seg.startMs ?? 0)) / 1000) }}s</span
              >
            </div>
            <div class="segment-row">
              <el-button
                type="default"
                circle
                size="small"
                class="segment-play-btn name-speaker-modal-segment-play-btn"
                @click="toggleSentencePlayback(seg)"
              >
                <img
                  :src="playingSentenceStartMs === seg.startMs ? pauseIcon : playIcon"
                  class="sentence-play-icon name-speaker-modal-segment-play-icon"
                  alt=""
                />
              </el-button>
              <div class="segment-text">{{ seg.text }}</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="speaker-empty">
        {{ t('layout.headerRight.speakerNameDialog.noSpeakerData') }}
      </div>
      <template #footer>
        <div class="common-modal-footer">
          <el-button
            class="common-modal-secondary-button"
            @click="isSpeakerNameDialogVisible = false"
            >{{ t('common.cancel') }}
          </el-button>
          <el-button class="common-modal-button" @click="saveSpeakerNames"
            >{{ t('common.save') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑发言人弹窗 -->
    <el-dialog
      v-model="isEditSpeakerDialogVisible"
      :title="t('layout.headerRight.editSpeakerDialog.title')"
      width="400px"
      :close-on-click-modal="false"
      class="edit-speaker-dialog"
    >
      <el-input
        v-model="editSpeakerName"
        :placeholder="t('layout.headerRight.speakerNameDialog.speakerNamePlaceholder')"
        clearable
      />
      <el-radio-group v-model="editSpeakerScope" class="edit-speaker-scope">
        <el-radio :value="'current'">{{ t('share.applyToCurrent') }}</el-radio>
        <el-radio :value="'all'">{{ t('share.applyToAll') }}</el-radio>
      </el-radio-group>
      <template #footer>
        <el-button type="primary" class="edit-speaker-save-btn" @click="saveEditSpeaker"
          >{{ t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </el-container>

  <!-- 查找和替换 -->
  <SpeakerNameDialog
    :visible="searchReplaceShow"
    :total-matches="searchMatches.length"
    :current-index="searchMatches.length > 0 ? currentMatchIndex + 1 : 0"
    @close="handleSearchReplaceClose"
    @search="(text, isEnterKey) => toSearch(text, isEnterKey)"
    @navigate="handleNavigate"
    @replace="(data) => toHandleReplace(data.oldName, data.newName)"
    @replaceAll="(data) => toHandleReplaceAll(data.oldName, data.newName)"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElLoading,
  ElMessage,
  ElTabPane,
  ElTabs,
} from 'element-plus'
import List from './list.vue'
import {
  againTranscribe,
  apiAsrSaveSummary,
  batchTranscribe,
  fastTranscribe,
  getDownloadUrl,
  getSummaryResult,
  getTranslateSummary,
  preTranscribe,
  saveTranscribe,
  submitFeedback,
} from '@/api/allFiles'
import { useLoginStore } from '@/stores/login'
import { useUiStore } from '@/stores/ui'
import CustomAudioPlayer from '@/components/CustomAudioPlayer.vue'
import MindMapViewer from '@/components/MindMapViewer.vue'
import TranslateDialog from '@/components/TranslateDialog.vue'
import ShareLinkDialog from '@/components/ShareLinkDialog.vue'
import ExportAudioDialog from '@/components/ExportAudioDialog.vue'
import ExportTranscriptionDialog from '@/components/ExportTranscriptionDialog.vue'
import ExportMindMapDialog from '@/components/ExportMindMapDialog.vue'
import ExportSummaryDialog from '@/components/ExportSummaryDialog.vue'
import FeedbackDialog from '@/components/FeedbackDialog.vue'
import GenerateMethodDialog from '@/components/GenerateMethodDialog.vue'
import SummaryTemplateDialog from '@/components/SummaryTemplateDialog.vue'
import BindingDeviceDialog from '@/components/BindingDeviceDialog.vue'
import AudioEditorDialog from '@/components/AudioEditorDialog.vue'
import BlockNoteEditor from '@/components/BlockNoteEditor.vue'
import { useSearchHighlight } from './composables/useSearchHighlight'
import playIcon from '@/assets/allfiles/icon_transliteration_play.svg'
import pauseIcon from '@/assets/allfiles/icon_transliteration_pause.svg'
import praiseIcon from '@/assets/allfiles/icon_minutes_praise.svg'
import criticizeIcon from '@/assets/allfiles/icon_minutes_criticize.svg'
import praiseSelectedIcon from '@/assets/allfiles/icon_minutes_praise_selected.svg'
import criticizeSelectedIcon from '@/assets/allfiles/icon_minutes_criticize_selected.svg'
import iconTransliterationGenerated from '@/assets/allfiles/icon_transliteration_generated.svg'
import iconTransliterationDefault from '@/assets/allfiles/icon_transliteration_default.svg'
import iconTransliterationGenerating from '@/assets/allfiles/icon_transliteration_generating.svg'
import iconMeetingHiddenDirectory from '@/assets/allfiles/icon_meeting_hidden_directory.svg'
import iconMeetingDisplayDirectory from '@/assets/allfiles/icon_meeting_display_directory.svg'
import iconShareLink from '@/assets/allfiles/icon_meeting_header_share_link.svg'
import iconCopyTranscribe from '@/assets/allfiles/icon_meeting_header_copy_transcribe.svg'
import iconCopySummary from '@/assets/allfiles/icon_meeting_header_copy_summary.svg'
import iconExportAudio from '@/assets/allfiles/icon_meeting_header_export_audio.svg'
import iconExportTranscribe from '@/assets/allfiles/icon_meeting_header_export_transcribe.svg'
import iconExportSummary from '@/assets/allfiles/icon_meeting_header_export_summary.svg'
import iconExportMindMap from '@/assets/allfiles/icon_meeting_header_export_mind_map-D4azFJz0.svg'
import iconMoveToFolder from '@/assets/allfiles/icon_meeting_header_move_to_folder.svg'
import iconRegenerate from '@/assets/allfiles/icon_meeting_header_regenerate.svg'
import iconTranslation from '@/assets/allfiles/icon_meeting_header_translation.svg'
import iconNameSpeaker from '@/assets/allfiles/icon_generated_method_speaker.svg'
import iconFindAndReplace from '@/assets/allfiles/icon_meeting_header_find_and_replace.svg'
import iconMoveToRecycling from '@/assets/allfiles/icon_meeting_header_move_to_recycling.svg'
import AskAI from '@/views/allFiles/askAI.vue'
import SpeakerNameDialog from '@/views/allFiles/components/SpeakerNameDialog.vue'
import { useLoadingStore } from '@/stores/loading.ts'
import { analyzeFileHeader, isJyzFileName } from '@/utils/fileHeader.ts'
import { sentenceTextSegmentsForJiayzMarkers } from '@/utils/jiayzMarkerHighlight.ts'

const router = useRouter()

type CloudFileItem = Record<string, any>

const { t } = useI18n()
const loginStore = useLoginStore()
const uiStore = useUiStore()
const loadingStore = useLoadingStore()

const selectedFile = ref<CloudFileItem | null>(null)
const currentAudioUrl = ref('')
const isAudioEditorVisible = ref(false)
const listRef = ref<InstanceType<typeof List> | null>(null)
const summaryResult = ref<any>(null)
const summaryContentRef = ref<HTMLElement | null>(null)
const blockNoteEditorRef = ref<InstanceType<typeof BlockNoteEditor> | null>(null)
const activeTab = ref('transcription')
const audioPlayerRef = ref<InstanceType<typeof CustomAudioPlayer> | null>(null)
const isTranslateDialogVisible = ref(false)
const isShareLinkDialogVisible = ref(false)
const isExportAudioDialogVisible = ref(false)
const isExportTranscriptionDialogVisible = ref(false)
const isExportSummaryDialogVisible = ref(false)
const isExportMindMapDialogVisible = ref(false)
const isFeedbackDialogVisible = ref(false)
const isGenerateMethodDialogVisible = ref(false)
const isSummaryTemplateDialogVisible = ref(false)
const isBindingDeviceDialogVisible = ref(false)
const isSpeakerNameDialogVisible = ref(false)
/** 按发言人原始 key（speaker ?? ''）分组后的显示名编辑 */
const speakerGroupNames = ref<Record<string, string>>({})
const isEditSpeakerDialogVisible = ref(false)
const editSpeakerSentence = ref<any>(null)
const editSpeakerName = ref('')
const editSpeakerScope = ref<'current' | 'all'>('all')
const isGenerating = ref(false)
const generateMethodDialogRef = ref<InstanceType<typeof GenerateMethodDialog> | null>(null)
const templateDialogSettings = ref({
  modelId: 'auto',
  languageCode: 'zh-CN',
  distinguishSpeaker: true,
})
/** 仅 .jyz 填充 JiayzTag.tagList（毫秒）；非 .jyz 恒为 []，进度条不打点 */
const jiayzProgressMarkersMs = ref<number[]>([])
const isSummaryTocVisible = ref(true)
const isShareDropdownVisible = ref(false)
const isMoreDropdownVisible = ref(false)
const playingSentenceStartMs = ref<number | null>(null)
const editingSentenceStartMs = ref<number | null>(null)

const editingText = ref('')

const drawer = ref(false)

function openTranslateDialog() {
  isTranslateDialogVisible.value = true
}

function openEditSpeakerDialog(sentence: any) {
  editSpeakerSentence.value = sentence
  editSpeakerName.value = sentence.speaker ?? ''
  editSpeakerScope.value = 'all'
  isEditSpeakerDialogVisible.value = true
}

async function saveEditSpeaker() {
  if (!editSpeakerSentence.value || !summaryResult.value?.sentenceInfos || !selectedFile.value)
    return
  const newName = editSpeakerName.value.trim()
  if (!newName) return

  const infos = summaryResult.value.sentenceInfos
  const targetSpeaker = editSpeakerSentence.value.speaker

  if (editSpeakerScope.value === 'current') {
    const idx = infos.findIndex((s: any) => s.startMs === editSpeakerSentence.value.startMs)
    if (idx >= 0) infos[idx].speaker = newName
  } else {
    for (const s of infos) {
      if (s.speaker === targetSpeaker) s.speaker = newName
    }
  }

  try {
    await saveTranscribe({
      sentenceInfos: infos,
      transcribeId: selectedFile.value.fileUuid,
      userId: loginStore.loginData.userId,
    })
    ElMessage.success(t('share.saveSuccess'))
    listRef.value?.refreshFiles()
    const summaryRes = await getSummaryResult(selectedFile.value.fileUuid)
    if (summaryRes?.data) summaryResult.value = summaryRes.data
    isEditSpeakerDialogVisible.value = false
  } catch (e) {
    ElMessage.error(t('share.saveFailed'))
  }
}

function openSpeakerNameDialog() {
  const next: Record<string, string> = {}
  for (const g of speakerGroups.value) {
    next[g.key] = g.key
  }
  speakerGroupNames.value = next
  isSpeakerNameDialogVisible.value = true
}

function onSpeakerNameDialogClosed() {
  speakerGroupNames.value = {}
}

async function saveSpeakerNames() {
  if (!summaryResult.value?.sentenceInfos || !selectedFile.value) return

  const infos = summaryResult.value.sentenceInfos
  const names = speakerGroupNames.value
  for (const seg of infos) {
    const k = seg.speaker ?? ''
    const newName = names[k]
    if (newName !== undefined && newName !== seg.speaker) {
      seg.speaker = newName
    }
  }

  try {
    await saveTranscribe({
      sentenceInfos: infos,
      transcribeId: selectedFile.value.fileUuid,
      userId: loginStore.loginData.userId,
    })
    ElMessage.success(t('share.saveSuccess'))
    listRef.value?.refreshFiles()
    const summaryRes = await getSummaryResult(selectedFile.value.fileUuid)
    if (summaryRes?.data) summaryResult.value = summaryRes.data
    isSpeakerNameDialogVisible.value = false
  } catch (e) {
    ElMessage.error(t('share.saveFailed'))
  }
}

function handleAudioEditorSave() {
  isAudioEditorVisible.value = false
  listRef.value?.refreshFiles()
}

async function handleTranslate(languageCode: string) {
  if (!selectedFile.value) return

  const loading = ElLoading.service({
    lock: true,
    text: t('layout.headerRight.translate.loading'),
    background: 'rgba(0, 0, 0, 0.7)',
  })

  try {
    const res = await getTranslateSummary({
      languageCode,
      transcribeId: selectedFile.value.fileUuid,
      userId: loginStore.loginData.userId,
    })

    if (res.data && summaryResult.value?.summaryResult) {
      const sr = summaryResult.value.summaryResult
      const d = res.data as Record<string, unknown>
      if (d.content !== undefined) sr.content = d.content as string
      if (d.xmind !== undefined) sr.xmind = d.xmind as string
      if (d.title !== undefined) sr.title = d.title as string
      if (Array.isArray(d.keywords)) sr.keywords = d.keywords as string[]
      if (d.version !== undefined) sr.version = d.version as string
      if (d.translationId !== undefined) sr.translationId = d.translationId as string
      if (d.updateTime !== undefined) sr.updateTime = d.updateTime as string
      activeTab.value = 'summary'
    }
  } catch (error) {
    console.error('Failed to translate summary:', error)
  } finally {
    loading.close()
  }
}

async function handlePraise() {
  if (!selectedFile.value || !summaryResult.value?.summaryResult) return

  try {
    await submitFeedback({
      transcribeId: selectedFile.value.fileUuid,
      feedback: '1',
      userId: loginStore.loginData.userId,
    })
    summaryResult.value.summaryResult.feedback = '1'

    ElMessage.success(t('layout.headerRight.messages.feedbackSubmitSuccess'))

    listRef.value?.patchFileFeedback(selectedFile.value.fileUuid, '1')
  } catch (error) {
    console.error('Failed to submit praise feedback:', error)
  }
}

async function handleCriticize() {
  isFeedbackDialogVisible.value = true
}

async function submitDetailedFeedback(payload: {
  feedbackSelection: string[]
  feedbackContent: string
}) {
  if (!selectedFile.value || !summaryResult.value?.summaryResult) return

  try {
    await submitFeedback({
      transcribeId: selectedFile.value.fileUuid,
      feedback: '2',
      userId: loginStore.loginData.userId,
      feedbackSelection: payload.feedbackSelection.join(','),
      feedbackContent: payload.feedbackContent,
    })

    summaryResult.value.summaryResult.feedback = '2'

    ElMessage.success(t('layout.headerRight.messages.feedbackSubmitSuccess'))
    listRef.value?.patchFileFeedback(selectedFile.value.fileUuid, '2')
  } catch (error) {
    console.error('Failed to submit detailed feedback:', error)
  }
}

const sentenceInfos = computed(() => {
  if (Array.isArray(summaryResult.value?.sentenceInfos)) {
    return summaryResult.value.sentenceInfos
  }
  return []
})

function getSentenceTextSegments(sentence: (typeof sentenceInfos.value)[number], idx: number | string) {
  return sentenceTextSegmentsForJiayzMarkers(
    sentence,
    Number(idx),
    sentenceInfos.value,
    jiayzProgressMarkersMs.value
  )
}

/** 按 speaker 合并：相同 speaker 共用一个输入框，总时长为各句段时长之和 */
const speakerGroups = computed(() => {
  const list = sentenceInfos.value
  if (!Array.isArray(list) || !list.length) return []
  const map = new Map<string, any[]>()
  for (const seg of list) {
    const k = seg.speaker ?? ''
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(seg)
  }
  return Array.from(map.entries()).map(([key, segments]) => ({
    key,
    segments,
    totalDurationMs: segments.reduce((acc, s) => acc + ((s.endMs ?? 0) - (s.startMs ?? 0)), 0),
  }))
})

const xmindMarkdown = computed(() => {
  return summaryResult.value?.summaryResult?.xmind || ''
})

const summaryContent = computed(() => {
  return summaryResult.value?.summaryResult?.content || ''
})

const summaryToc = computed(() => {
  const content = summaryContent.value
  if (!content) return []
  const headings: { level: number; text: string }[] = []
  const mdRegex = /^(#{1,6})\s+(.+)$/gm
  let m
  while ((m = mdRegex.exec(content)) !== null) {
    if (m[1] != null && m[2] != null) {
      headings.push({ level: m[1].length, text: m[2].trim() })
    }
  }
  if (headings.length > 0) return headings
  const romanRegex = /^([IVXLCDM]+\.)\s+(.+?):?\s*$/gm
  while ((m = romanRegex.exec(content)) !== null) {
    if (m[1] != null && m[2] != null) {
      headings.push({ level: 2, text: `${m[1]} ${m[2].trim()}`.replace(/:$/, '') })
    }
  }
  return headings
})

const summaryKeywords = computed({
  get: () =>
    Array.isArray(summaryResult.value?.summaryResult?.keywords)
      ? summaryResult.value.summaryResult.keywords
      : [],
  set: (val: string[]) => {
    if (summaryResult.value?.summaryResult) {
      summaryResult.value.summaryResult.keywords = val
    }
  },
})

const isKeywordPopoverVisible = ref(false)
const newKeywordInput = ref('')

function ensureKeywordsArray() {
  if (!summaryResult.value?.summaryResult) return
  if (!Array.isArray(summaryResult.value.summaryResult.keywords)) {
    summaryResult.value.summaryResult.keywords = []
  }
}

function addKeyword() {
  const val = newKeywordInput.value?.trim()
  if (!val) return
  ensureKeywordsArray()
  summaryResult.value!.summaryResult.keywords.push(val)
  newKeywordInput.value = ''
  isKeywordPopoverVisible.value = false
  saveKeywordsToBackend()
}

function removeKeyword(index: number) {
  ensureKeywordsArray()
  summaryResult.value!.summaryResult.keywords.splice(index, 1)
  saveKeywordsToBackend()
}

async function saveKeywordsToBackend() {
  if (!selectedFile.value || !summaryResult.value?.summaryResult) return
  try {
    const sr = summaryResult.value.summaryResult
    const res = await apiAsrSaveSummary({
      transcribeId: selectedFile.value.fileUuid,
      userId: loginStore.loginData.userId,
      keywords: Array.isArray(sr.keywords) ? sr.keywords : undefined,
      content: summaryContent.value || '',
      xmind: sr.xmind || '',
      title: sr.title || '',
      version: Number(sr.version) || 0,
    })
    // 更新版本号（后台可能返回字符串）
    if (res?.data?.version != null) {
      summaryResult.value.summaryResult.version = res.data.version
    }
  } catch {
    // 静默失败，本地已更新
  }
}

const summaryContentForRender = computed(() => {
  const content = summaryContent.value
  if (!content) return ''
  if (/^#{1,6}\s/m.test(content)) return content
  return content.replace(/^([IVXLCDM]+\.)\s+(.+?):?\s*$/gm, '## $1 $2\n')
})

const summaryContentForExport = computed(() => {
  const content = summaryContentForRender.value
  if (!content) return ''
  const sr = summaryResult.value?.summaryResult
  const title = sr?.title ?? ''
  const keywords = Array.isArray(sr?.keywords) ? sr.keywords : []
  const parts: string[] = []
  if (title) parts.push(`# ${title}\n`)
  if (keywords.length)
    parts.push(
      `${t('layout.headerRight.keywordsLabel')}${keywords.join(t('layout.headerRight.keywordJoiner'))}\n`,
    )
  parts.push(content)
  return parts.join('')
})

function updateSummaryContent(v: string) {
  if (summaryResult.value?.summaryResult) {
    summaryResult.value.summaryResult.content = v
  }
}

function scrollToTocItem(index: number) {
  nextTick(() => {
    const el = summaryContentRef.value
    if (!el) return
    const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const target = headings[index]
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function handleAudioEvent() {
  playingSentenceStartMs.value = null
}

function toggleSentencePlayback(sentence: any) {
  if (!audioPlayerRef.value) return

  if (playingSentenceStartMs.value === sentence.startMs) {
    audioPlayerRef.value.pause()
    playingSentenceStartMs.value = null
  } else {
    const timeInSeconds = sentence.startMs / 1000
    audioPlayerRef.value.seekAndPlay(timeInSeconds)
    playingSentenceStartMs.value = sentence.startMs
  }
}

function startEditSentence(sentence: any) {
  editingSentenceStartMs.value = sentence.startMs
  editingText.value = sentence.text ?? ''
}

function cancelEditSentence() {
  editingSentenceStartMs.value = null
  editingText.value = ''
}

async function saveEditSentence() {
  if (
    !summaryResult.value?.sentenceInfos ||
    editingSentenceStartMs.value == null ||
    !selectedFile.value
  )
    return
  const sentence = summaryResult.value.sentenceInfos.find(
    (s: any) => s.startMs === editingSentenceStartMs.value,
  )
  if (!sentence) return
  sentence.text = editingText.value
  editingSentenceStartMs.value = null
  editingText.value = ''

  try {
    await saveTranscribe({
      sentenceInfos: summaryResult.value.sentenceInfos,
      transcribeId: selectedFile.value.fileUuid,
      userId: loginStore.loginData.userId,
    })
    ElMessage.success(t('share.saveSuccess'))
    listRef.value?.refreshFiles()
    const summaryRes = await getSummaryResult(selectedFile.value.fileUuid)
    if (summaryRes?.data) summaryResult.value = summaryRes.data
  } catch (e) {
    ElMessage.error(t('share.saveFailed'))
  }
}

async function copySentenceText(sentence: any) {
  try {
    await navigator.clipboard.writeText(sentence.text ?? '')
    ElMessage.success(t('common.copySuccess'))
  } catch {
    ElMessage.error(t('common.copyFailed'))
  }
}

function handleShareLink() {
  if (!selectedFile.value?.fileUuid) {
    ElMessage.warning(t('layout.headerRight.messages.selectFileFirst'))
    return
  }
  isShareLinkDialogVisible.value = true
}

async function handleCopyTranscription() {
  if (!summaryResult.value?.sentenceInfos?.length) {
    ElMessage.warning(t('layout.headerRight.messages.noTranscriptionContent'))
    return
  }
  try {
    const text = summaryResult.value.sentenceInfos
      .map((s: any) => {
        const speaker = `${t('layout.headerRight.shareMenu.speaker')}${s.speaker ?? '0'}`
        const timeRange = s.start && s.end ? `[${s.start}-${s.end}] ` : ''
        return `${timeRange}${speaker}: ${s.text ?? ''}`
      })
      .join('\n')
    await navigator.clipboard.writeText(text)
    ElMessage.success(t('common.copySuccess'))
  } catch {
    ElMessage.error(t('common.copyFailed'))
  }
}

async function handleCopySummary() {
  // 复制当前显示的纪要文本（原文或译文），包含标题、关键词和正文
  const content = summaryContentForRender.value
  if (!content) {
    ElMessage.warning(t('layout.headerRight.messages.noSummaryContent'))
    return
  }
  const sr = summaryResult.value?.summaryResult
  const title = sr?.title ?? ''
  const keywords = Array.isArray(sr?.keywords) ? sr.keywords : []
  const parts: string[] = []
  if (title) parts.push(`# ${title}\n`)
  if (keywords.length)
    parts.push(
      `${t('layout.headerRight.keywordsLabel')}${keywords.join(t('layout.headerRight.keywordJoiner'))}\n`,
    )
  parts.push(content)
  try {
    await navigator.clipboard.writeText(parts.join(''))
    ElMessage.success(t('common.copySuccess'))
  } catch {
    ElMessage.error(t('common.copyFailed'))
  }
}

function handleExportAudio() {
  if (!selectedFile.value?.ossKey) {
    ElMessage.warning(t('layout.headerRight.messages.noAudio'))
    return
  }
  isExportAudioDialogVisible.value = true
}

function handleExportTranscription() {
  if (!summaryResult.value?.sentenceInfos?.length) {
    ElMessage.warning(t('layout.headerRight.messages.noTranscriptionContent'))
    return
  }
  isExportTranscriptionDialogVisible.value = true
}

function handleExportSummary() {
  const content = summaryContentForExport.value
  if (!content) {
    ElMessage.warning(t('layout.headerRight.messages.noSummaryContent'))
    return
  }
  isExportSummaryDialogVisible.value = true
}

function handleExportMindMap() {
  const content = xmindMarkdown.value
  if (!content) {
    ElMessage.warning(t('layout.headerRight.messages.noMindmapContent'))
    return
  }
  isExportMindMapDialogVisible.value = true
}

function handleGenerateTranscription() {
  isGenerateMethodDialogVisible.value = true
}

async function handleGenerateMethodConfirm(payload: {
  method: 'auto' | 'custom'
  modelId: string
  platform: string
  languageCode: string
  distinguishSpeaker: boolean
  prompt?: string
}) {
  if (!selectedFile.value) return
  await submitTranscriptionTask({
    languageCode: payload.languageCode,
    model: payload.modelId,
    platform: payload.platform,
    enableSpeaker: payload.distinguishSpeaker,
    prompt: payload.prompt,
  })
}

function handleOpenTemplateDialog(settings: {
  modelId: string
  languageCode: string
  distinguishSpeaker: boolean
}) {
  templateDialogSettings.value = { ...settings }
  nextTick(() => {
    isSummaryTemplateDialogVisible.value = true
  })
}

async function handleTemplateConfirm(payload: {
  templateCode: string
  modelId: string
  platform: string
  languageCode: string
  distinguishSpeaker: boolean
}) {
  if (!selectedFile.value) return
  await submitTranscriptionTask({
    languageCode: payload.languageCode,
    model: payload.modelId,
    platform: payload.platform,
    enableSpeaker: payload.distinguishSpeaker,
    prompt: payload.templateCode,
  })
}

async function submitTranscriptionTask(settings: {
  languageCode: string
  model: string
  platform: string
  enableSpeaker: boolean
  prompt?: string
}) {
  if (!selectedFile.value) return

  isGenerating.value = true

  try {
    let result: any = null

    if (selectedFile.value.status === '1') {
      const modelForApi = settings.model === 'auto' ? 'Auto' : settings.model
      const platformForApi = settings.platform === 'auto' ? 'Auto' : settings.platform
      const res = await againTranscribe({
        transcribeId: selectedFile.value.fileUuid,
        userId: loginStore.loginData.userId,
        languageCode: settings.languageCode,
        prompt: settings.prompt,
        model: modelForApi,
        platform: platformForApi,
        duration: String(selectedFile.value.duration),
        enableSpeaker: settings.enableSpeaker ? '1' : '0',
      })
      if (res?.msgCode === '3003') {
        ElMessage.warning(res.msg || t('layout.headerRight.messages.templateMemberMismatch'))
        isGenerating.value = false
        return
      }
      result = res?.data
    } else {
      const res = await preTranscribe({
        duration: String(selectedFile.value.duration),
        fileSize: String(selectedFile.value.fileSize),
        languageCode: settings.languageCode,
        userId: loginStore.loginData.userId,
      })

      if (res.data?.transcribeType === '1') {
        try {
          const fileRes = await fetch(currentAudioUrl.value)
          const fileBlob = await fileRes.blob()
          const fileName =
            selectedFile.value?.displayName || selectedFile.value?.fileName || 'audio.mp3'
          const ext = fileName.split('.').pop()?.toLowerCase()
          const mimeMap: Record<string, string> = {
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
            m4a: 'audio/mp4',
            webm: 'audio/webm',
            ogg: 'audio/ogg',
          }
          const mimeType = mimeMap[ext || ''] || 'audio/mpeg'
          const file = new File([fileBlob], fileName, { type: mimeType })
          const formData = new FormData()
          formData.append('file', file)
          const modelForApi = settings.model === 'auto' ? 'Auto' : settings.model
          const platformForApi = settings.platform === 'auto' ? 'Auto' : settings.platform
          const meta = {
            transcribeId: selectedFile.value.fileUuid,
            userId: loginStore.loginData.userId,
            languageCode: settings.languageCode,
            prompt: settings.prompt || '',
            model: modelForApi,
            platform: platformForApi,
            duration: String(selectedFile.value.duration),
            enableSpeaker: settings.enableSpeaker ? '1' : '0',
          }
          formData.append('meta', new Blob([JSON.stringify(meta)], { type: 'application/json' }))
          const fastRes = await fastTranscribe(formData, loginStore.loginData.token || '')
          if (fastRes?.msgCode === '3003') {
            ElMessage.warning(
              fastRes.msg || t('layout.headerRight.messages.templateMemberMismatch'),
            )
            isGenerating.value = false
            return
          }
          if (fastRes?.data) {
            summaryResult.value = fastRes.data
            if (selectedFile.value) selectedFile.value.status = '1'
          }
        } catch (fastErr: any) {
          console.error('Fast transcribe failed:', fastErr)
          ElMessage.error(
            fastErr?.msg ||
              fastErr?.message ||
              t('layout.headerRight.messages.fastTranscribeFailed'),
          )
        }
        isGenerating.value = false
        return
      } else if (res.data?.transcribeType === '2') {
        const modelForApi = settings.model === 'auto' ? 'Auto' : settings.model
        const platformForApi = settings.platform === 'auto' ? 'Auto' : settings.platform
        const batchRes = await batchTranscribe({
          transcribeId: selectedFile.value.fileUuid,
          audioUrl: currentAudioUrl.value,
          userId: loginStore.loginData.userId,
          languageCode: settings.languageCode,
          prompt: settings.prompt,
          model: modelForApi,
          platform: platformForApi,
          duration: String(selectedFile.value.duration),
          enableSpeaker: settings.enableSpeaker ? '1' : '0',
        })
        if (batchRes?.msgCode === '3003') {
          ElMessage.warning(batchRes.msg || t('layout.headerRight.messages.templateMemberMismatch'))
          isGenerating.value = false
          return
        }
        const transcribeId = batchRes?.data?.transcribeId || selectedFile.value.fileUuid
        pollTranscriptionResult(transcribeId)
        return
      }
    }

    if (result) {
      summaryResult.value = result
      if (selectedFile.value) selectedFile.value.status = '1'
    }
    isGenerating.value = false
  } catch (error: any) {
    isGenerating.value = false
    if (error?.code === 500 && error?.msg === '未开会员未绑定设备未购买加加叠包') {
      isBindingDeviceDialogVisible.value = true
    } else {
      console.error('Failed to submit transcription task:', error)
    }
  }
}

let pollingTimer: ReturnType<typeof setTimeout> | null = null

function stopPolling() {
  if (pollingTimer) {
    clearTimeout(pollingTimer)
    pollingTimer = null
  }
}

async function pollTranscriptionResult(transcribeId: string) {
  stopPolling()

  try {
    const res = await getSummaryResult(transcribeId)

    if (res?.msgCode === '2404') {
      pollingTimer = setTimeout(() => pollTranscriptionResult(transcribeId), 5000)
      return
    }

    if (res?.msgCode === '2406' || res?.msgCode === '200') {
      if (res.data) {
        summaryResult.value = res.data
        if (selectedFile.value) selectedFile.value.status = '1'
      }
      isGenerating.value = false
      return
    }

    ElMessage.warning(res?.msg || t('layout.headerRight.messages.transcriptionFailed'))
    isGenerating.value = false
  } catch (error) {
    console.error('Polling transcription result failed:', error)
    ElMessage.error(t('layout.headerRight.messages.queryTranscriptionFailed'))
    isGenerating.value = false
  }
}

async function handleFileClick(item: CloudFileItem) {
  if (!item.ossKey || !item.fileUuid) {
    selectedFile.value = null
    return
  }

  stopPolling()
  selectedFile.value = item
  currentAudioUrl.value = ''
  jiayzProgressMarkersMs.value = []
  summaryResult.value = null
  activeTab.value = 'transcription'
  isGenerating.value = false

  try {
    const downloadRes = await getDownloadUrl(item.ossKey)
    if (downloadRes.data) {
      currentAudioUrl.value = downloadRes.data.url
      const fileLabel = String(item.displayName || item.fileName || '')
      if (isJyzFileName(fileLabel)) {
        const headerInfo = await analyzeFileHeader(currentAudioUrl.value, 512)
        const tags = headerInfo.jiayzHeader?.tagList
        if (tags?.length) {
          jiayzProgressMarkersMs.value = [...new Set(tags)].sort((a, b) => a - b)
        } else {
          jiayzProgressMarkersMs.value = []
        }
      }
    }

    if (item.status === '1') {
      const summaryRes = await getSummaryResult(item.fileUuid)
      if (summaryRes && summaryRes.data) {
        summaryResult.value = summaryRes.data
      } else {
        summaryResult.value = null
      }

      if (summaryResult.value?.summaryResult && item.feedback) {
        summaryResult.value.summaryResult.feedback = item.feedback
      }
    }
  } catch (error) {
    console.error('Failed to get file data:', error)
  }
}

//===================== 查找和替换
const {
  searchReplaceShow,
  searchMatches,
  currentMatchIndex,
  handleNavigate,
  toSearch,
  handleSearchReplaceClose,
  handleReplace,
  handleReplaceAll,
} = useSearchHighlight(summaryContentRef, activeTab)

// 包装替换函数，替换后获取最新的 markdown 内容
function toHandleReplace(oldName: string, newName: string) {
  handleReplace(oldName, newName)
  saveMarkdown()
}

// 包装全部替换函数，替换后获取最新的 markdown 内容
function toHandleReplaceAll(oldName: string, newName: string) {
  handleReplaceAll(oldName, newName)
  saveMarkdown(true)
}

/**
 * 保存查找和替换数据
 * @param isAll
 */
function saveMarkdown(isAll?: boolean) {
  // 获取最新的 markdown 内容
  nextTick(() => {
    const latestMarkdown = getLatestMarkdown()
    // console.log('替换后的最新 Markdown 内容:', latestMarkdown)
    apiSaveMarkdown(latestMarkdown, isAll)
  })
}

/**
 * 替换和全部替换
 * @param latestMarkdown
 * @param isAll
 */
async function apiSaveMarkdown(latestMarkdown: string, isAll?: boolean) {
  loadingStore.setLoading(true)
  const sr = summaryResult.value?.summaryResult
  let res = await apiAsrSaveSummary({
    transcribeId: selectedFile.value.fileUuid,
    userId: loginStore.loginData.userId,
    content: latestMarkdown,
    keywords: Array.isArray(sr?.keywords) ? sr.keywords : undefined,
    xmind: sr?.xmind || '',
    title: sr?.title || '',
    version: Number(sr?.version) || 0,
  })
  console.log(res, '保存结果')
  loadingStore.setLoading(false)
  // 更新版本号（后台每次保存成功都会返回新版本号）
  if (res?.data?.version != null) {
    summaryResult.value.summaryResult.version = res.data.version
  }
  if (isAll) {
    ElMessage.success(t('layout.headerRight.findAndReplaceModal.replaceAllSuccess'))
  }
}

// 获取最新的 markdown 内容
function getLatestMarkdown(): string {
  if (!blockNoteEditorRef.value) {
    console.warn('BlockNoteEditor ref 不存在')
    return ''
  }

  // 通过组件实例获取 editor
  const editor = (blockNoteEditorRef.value as any).getEditor?.()
  if (!editor) {
    console.warn('无法获取 BlockNote editor')
    return ''
  }

  // 获取 markdown 内容
  const markdown = editor.blocksToMarkdownLossy?.() ?? ''
  return markdown
}

//=================  移至文件夹
function moveToFolder() {
  listRef.value.showMoveFolder(selectedFile.value)
}

//=================  移至回收站
function moveToRecycle() {
  listRef.value.deleteApi('2', [selectedFile.value.fileUuid])
}
</script>

<style lang="scss" scoped>
.page-container {
  height: 100%;
  background-color: #fff;
}

.l2-aside {
  border-right: 1px solid #e0e0e0;
  transition: width 0.3s ease;
  overflow: hidden;
  background: #f8f8f8;
}

.l3-main {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  background-color: #fafafa;
  padding: 0;

  .show-l2-icon {
    position: absolute;
    left: 20px;
    top: 30px;
    width: 20px;
    height: 20px;
    cursor: pointer;
    transform: rotate(180deg);
    z-index: 10;
  }

  .welcome-placeholder {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    color: #ccc;

    img {
      width: 100px;
      margin-bottom: 20px;
    }

    p {
      font-size: 18px;
    }
  }

  .l3-main-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 20px;
    box-sizing: border-box;
  }

  .audio-player-container {
    padding-bottom: 20px;
    margin-bottom: 20px;
    border-bottom: 1px solid #e0e0e0;
  }

  .summary-container {
    padding-top: 15px;
  }

  .summary-pane {
    display: flex;
    gap: 24px;
    height: 100%;
    overflow: hidden;
  }

  .summary-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  .summary-title {
    font-size: 35px;
    font-weight: 600;
    color: #000;
    margin: 0 0 16px 0;
    padding: 0;
    line-height: 1.4;
    text-align: center;
  }

  .summary-keywords-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 1px solid #e8e8e8;
  }

  .keyword-tag {
    background-color: #e8f4ff;
    border-color: #b3d8ff;
    color: #0052ff;
  }

  .keyword-add-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background-color: #e8f4ff;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #b3d8ff;
    }
  }

  .keyword-add-icon {
    font-size: 18px;
    font-weight: 500;
    color: #0052ff;
  }

  .keyword-add-popover {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .keyword-add-confirm {
    flex-shrink: 0;
  }

  .summary-content-wrap {
    flex: 1;
    overflow-y: auto;
    min-width: 0;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .markdown-viewer-toc {
    position: sticky;
    top: 0;
    width: 240px;
    flex-shrink: 0;
    background-color: var(--color-toc-bg, #ffffff);
    display: flex;
    flex-direction: column;
    align-self: flex-start;
    max-height: 100vh;
    transition: width 0.2s ease;
    overflow: hidden;

    &.collapsed {
      width: 40px;
    }

    .toc-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      gap: 8px;
      flex-shrink: 0;
    }

    &.collapsed .toc-header {
      justify-content: center;
      padding: 12px 8px;
    }

    .toc-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 0 16px 12px;
    }
  }

  .toc-toggle-btn {
    width: 24px;
    height: 24px;
    margin: 0;
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    font: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(0, 0, 0, 0.06);
    }

    img {
      width: 24px;
      height: 24px;
    }
  }

  .markdown-viewer-toc .summary-toc-item {
    font-size: 13px;
    color: #409eff;
    cursor: pointer;
    padding: 4px 0;
    line-height: 1.5;
    transition: color 0.2s ease;

    &:hover {
      color: #66b1ff;
    }
  }

  .summary-editor {
    height: 100%;
    min-height: 400px;
  }

  .transcription-list {
    overflow-y: auto;
    flex-grow: 1;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }

    .transcription-item {
      margin-bottom: 15px;
      padding: 12px 16px;
      border-radius: 8px;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f5f5;

        .transcription-item-actions {
          opacity: 1;
        }
      }

      &.is-editing {
        background-color: #fff;
        border: 1px solid #e0e0e0;

        .transcription-item-actions {
          opacity: 1;
        }
      }

      .text .text-marker-highlight {
        background: linear-gradient(
          180deg,
          transparent 0%,
          rgba(0, 81, 255, 0.2) 45%,
          rgba(0, 81, 255, 0.12) 100%
        );
        border-radius: 2px;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }

      .transcription-item-main {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        justify-content: space-between;
      }

      .transcription-content {
        flex: 1;
        min-width: 0;
      }

      .timestamp {
        color: #999;
        font-size: 14px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 10px;

        .speaker-label {
          color: #409eff;
          font-weight: 500;
          cursor: pointer;

          &:hover {
            color: #66b1ff;
          }
        }
      }

      .text {
        color: #333;
        font-size: 14px;
        line-height: 1.6;
        flex: 1;
      }

      .transcription-item-actions {
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s;
        flex-shrink: 0;
      }

      .action-btn {
        padding: 4px;
        min-width: auto;
        position: relative;

        .action-icon {
          width: 16px;
          height: 16px;
          display: block;

          &.hover {
            display: none;
          }
        }

        &:hover .action-icon.default {
          display: none;
        }

        &:hover .action-icon.hover {
          display: block;
        }
      }

      .transcription-edit {
        margin-top: 8px;

        .edit-textarea {
          font-size: 14px;

          :deep(textarea),
          :deep(.el-textarea__inner) {
            padding: 0;
            border: none;
            box-shadow: none;
            background-color: transparent;
          }

          :deep(.el-input__wrapper) {
            box-shadow: none !important;
            padding: 0;
            background-color: transparent;
          }
        }
      }
    }
  }

  .transcription-empty {
    color: #999;
    padding-top: 15px;
  }

  .sentence-play-btn {
    padding: 0;
    min-width: 28px;
    height: 28px;

    .sentence-play-icon {
      width: 14px;
      height: 14px;
      display: block;
    }
  }
}

.feedback-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.speaker-name-dialog {
  :deep(.el-dialog__title) {
    font-weight: 700;
    font-size: 18px;
    line-height: 1.25;
    color: #1a1a1a;
    padding: 0;
    margin: 0;
  }

  :deep(.el-dialog__footer) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    box-sizing: border-box;
    padding-top: 0 !important;
  }

  .speaker-segments {
    overflow-y: auto;
  }

  .speaker-group-block {
    &:last-child {
      margin-bottom: 0;
    }
  }

  .speaker-name-input.name-speaker-modal-speaker-input {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    margin-bottom: 8px;
    box-sizing: border-box;
    margin-top: 10px;

    :deep(.el-input__wrapper) {
      height: 40px !important;
      min-height: 40px !important;
      border-radius: 6px !important;
      background-color: #f4f3f3;
      box-shadow: 0 0 0 1px #f4f3f3 inset;

      &:hover {
        background-color: #f4f3f3;
        box-shadow: 0 0 0 1px #f4f3f3 inset;
      }

      &.is-focus {
        background-color: #f4f3f3;
        box-shadow: 0 0 0 1px #f4f3f3 inset;
      }
    }

    :deep(.el-input__inner) {
      font-family:
        PingFang SC,
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        sans-serif;
      font-weight: 400;
      font-size: 14px;
      line-height: 14px;
      letter-spacing: 0;
      text-align: left;
    }
  }

  .speaker-total-duration {
    font-size: 14px;
    color: #666;
    margin-bottom: 12px;
  }

  .segment-block {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .time-range {
    margin-bottom: 12px;
    display: block;
  }

  .name-speaker-modal-segment-time {
    font-family:
      PingFang SC,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
    font-weight: 500;
    font-size: 12px;
    color: #000000;
    line-height: 14px;
    letter-spacing: 0;
    text-align: left;
    white-space: nowrap;
  }

  .name-speaker-modal-segment-duration {
    font-family:
      PingFang SC,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
    font-weight: 500;
    font-size: 12px;
    color: #7f7f7f;
    line-height: 14px;
    letter-spacing: 0;
    text-align: left;
    white-space: nowrap;
    margin-left: 15px;
  }

  .segment-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0;
    padding: 8px;

    .segment-play-btn.name-speaker-modal-segment-play-btn {
      width: 20px;
      height: 20px;
      min-width: 20px !important;
      padding: 0 !important;
      border: none !important;
      border-radius: 50%;
      background-color: var(--color-transcription-play-btn-bg, rgba(0, 117, 255, 0.08));
      cursor: pointer;
      color: var(--color-primary, #0075ff);
      transition: opacity 0.2s;
      position: relative;
      flex-shrink: 0;
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin-right: 6px;

      .name-speaker-modal-segment-play-icon {
        width: 5.71px;
        height: 8px;
        object-fit: contain;
        position: absolute;
        left: 8px;
        top: 50%;
        transform: translateY(-50%);
      }
    }

    .segment-text {
      flex: 1;
      min-width: 0;
      font-size: 14px;
      line-height: 1.5;
      color: #262626;
    }
  }

  .speaker-empty {
    padding: 40px;
    text-align: center;
    color: #999;
  }
}

.edit-speaker-dialog {
  .edit-speaker-scope {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-top: 16px;
  }

  :deep(.el-dialog__footer) {
    display: block;
  }

  .edit-speaker-save-btn {
    width: 100%;
  }
}

.transcription-tabs {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;

  :deep(.el-tabs__header) {
    flex-shrink: 0;
  }

  :deep(.el-tabs__content) {
    flex-grow: 1;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  :deep(.el-tab-pane) {
    height: 100%;
  }

  .transcription-pane-content {
    display: flex;
    flex-direction: column;
    // height: 100%;
  }
}

.markdown-body {
  :deep(h1, h2, h3, h4, h5, h6) {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
  }

  :deep(h1) {
    font-size: 2em;
  }

  :deep(h2) {
    font-size: 1.5em;
  }

  :deep(h3) {
    font-size: 1.25em;
  }

  :deep(p) {
    margin-bottom: 16px;
    line-height: 1.6;
  }

  :deep(ul, ol) {
    padding-left: 2em;
    margin-bottom: 16px;
  }

  :deep(li) {
    margin-bottom: 0.5em;
  }
}

.l3-main-header {
  position: relative;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .tabs-row {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow: hidden;
  }

  .header-actions {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: 15px;
    z-index: 1;
  }

  &.has-show-icon .tabs-row {
    padding-left: 45px;
  }

  .action-icon {
    cursor: pointer;
  }

  .header-action-btn {
    --hover-color: #ecebeb;
    --icon-size: 22px;
    margin-left: 0;
    margin-right: 0;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 31px;
    height: 31px;
    border-radius: 3px;
    transition: background-color 0.2s ease;
    outline: none;
    line-height: 1;

    &:hover {
      background-color: var(--hover-color);
    }

    &.is-active .action-icon {
      filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(190deg) brightness(98%)
        contrast(101%);
    }

    .action-icon {
      width: var(--icon-size);
      height: var(--icon-size);
      transition: filter 0.2s ease;
    }
  }
}

.generating-placeholder {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;

  .generating-bg {
    width: 80%;
    max-width: 500px;
    margin-bottom: 30px;
  }

  .generating-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .generating-text {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }

  .generating-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid #e0e0e0;
    border-top-color: #409eff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  p {
    font-size: 14px;
    color: #409eff;
    margin: 0;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.no-transcription-placeholder {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding-bottom: 10%;

  .placeholder-image {
    width: 150px;
    height: 150px;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin: 0 0 10px 0;
  }

  p {
    font-size: 14px;
    color: #999;
    margin: 0 0 30px 0;
  }

  .generate-button {
    width: 250px;
    height: 50px;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: none;
    border-radius: 25px;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;

    &:hover {
      background: linear-gradient(135deg, #3d9bf7 0%, #00d4e0 100%);
    }

    img {
      width: 20px;
      height: 20px;
    }
  }
}

// 搜索高亮样式
.search-highlight {
  background-color: #ffeb3b;
  color: #000;
  padding: 2px 4px;
  border-radius: 2px;
  font-weight: bold;
  transition: all 0.2s;

  &:hover {
    background-color: #ffc107;
  }
}
</style>

<!-- 全局样式覆盖 Element Plus 下拉菜单悬停样式 -->
<style lang="scss">
.el-dropdown-menu.el-dropdown-menu {
  .el-dropdown-menu__item {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 8px;
    padding: 0 16px !important;
    color: #262626 !important;
    width: 168px;
    height: 30px;

    &:not(.is-disabled):hover {
      background-color: #ecebeb !important;
    }

    .share-dropdown-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .dropdown-item-text {
      flex: 1;
    }

    .check-icon {
      margin-left: 20px;
    }
  }
}

.ask-ai-section {
  transition: width 0.3s ease;
  overflow: hidden;
  background: #fff;
}

.ask-ai {
  width: 95px;
  height: 30px;
  gap: 5px;
  border: 1px solid transparent;
  background-image:
    linear-gradient(to top, #fff, #ffffff),
    linear-gradient(to right, #0051ff, #0075ff, #12acff, #24e3ff);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  box-shadow: 0 4px 12px rgba(0, 117, 255, 0.15);
  border-radius: 102px;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;

  img {
    width: 16px;
  }
}
</style>
