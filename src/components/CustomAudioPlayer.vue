<template>
  <div class="custom-audio-player">
    <audio
      ref="audioRef"
      :src="props.src"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
    ></audio>

    <div class="btn-wrapper">
      <img
        :src="isPlaying ? pauseIcon : playIcon"
        class="play-pause-btn"
        @click="togglePlay"
      />
    </div>

    <div class="controls-center">
      <div class="progress-container">
        <div
          ref="progressContainerRef"
          class="custom-progress-bar"
          @click="handleProgressClick"
          @mousedown="onMouseDown"
        >
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
            <div
              v-for="(pos, idx) in segmentMarkerPositions"
              :key="idx"
              class="transcription-view-player-progress-segment-marker"
              :style="{ left: `${pos.left}%` }"
            />
          </div>
        </div>
      </div>
      <div class="actions-container">
        <div class="time-controls">
          <img
            :src="fastBackIcon"
            class="time-control-icon"
            @click="rewind(15)"
          />
          <el-dropdown trigger="click" @command="handleSpeedChange">
            <div class="playback-rate-control">
              <img :src="speedBgIcon" class="playback-rate-bg" />
              <span class="playback-rate-text">{{ playbackRate.toFixed(2) }}X</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="0.75">0.75x</el-dropdown-item>
                <el-dropdown-item command="1.0">1.0x</el-dropdown-item>
                <el-dropdown-item command="1.25">1.25x</el-dropdown-item>
                <el-dropdown-item command="1.5">1.5x</el-dropdown-item>
                <el-dropdown-item command="1.75">1.75x</el-dropdown-item>
                <el-dropdown-item command="2.0">2.0x</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <img
            :src="fastForwardIcon"
            class="time-control-icon"
            @click="forward(15)"
          />
        </div>
        <div class="time-display">
          {{ formattedCurrentTime }} / {{ formattedDuration }}
        </div>
      </div>
    </div>

    <div v-if="showCrop" class="btn-wrapper">
      <img :src="cropIcon" class="crop-btn" @click="emit('crop')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus';

import playIcon from '@/assets/allfiles/icon_transliteration_play.svg';
import pauseIcon from '@/assets/allfiles/icon_transliteration_pause.svg';
import cropIcon from '@/assets/allfiles/icon_transliteration_crop.svg';
import speedBgIcon from '@/assets/allfiles/icon_transliteration_double_speed.svg';
import fastBackIcon from '@/assets/allfiles/icon_transliteration_fast_back.svg';
import fastForwardIcon from '@/assets/allfiles/icon_transliteration_forward.svg';

interface SentenceInfo {
  startMs?: number
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    src: string
    showCrop?: boolean
    sentenceInfos?: SentenceInfo[]
    /** 进度条打点（毫秒），仅 .jyz 的 JiayzTag.tagList；非 jyz 传空数组 */
    segmentMarkerMs?: number[]
  }>(),
  { showCrop: true, sentenceInfos: () => [], segmentMarkerMs: () => [] }
);
const emit = defineEmits<{ (e: 'crop'): void; (e: 'pause'): void; (e: 'ended'): void }>();

function onPlay() {
  isPlaying.value = true;
}

function onPause() {
  isPlaying.value = false;
  emit('pause');
}

function onEnded() {
  isPlaying.value = false;
  emit('ended');
}

const audioRef = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const playbackRate = ref(1.0);
const isDragging = ref(false);
const progressContainerRef = ref<HTMLElement | null>(null);

function formatTime(timeInSeconds: number): string {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const formattedCurrentTime = computed(() => formatTime(currentTime.value));
const formattedDuration = computed(() => formatTime(duration.value));

const progressPercentage = computed(() => {
  if (duration.value === 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

const segmentMarkerPositions = computed(() => {
  const dur = duration.value;
  if (dur <= 0) return [];
  const list = props.segmentMarkerMs ?? [];
  return list
    .filter((ms) => ms >= 0)
    .map((ms) => {
      const left = (ms / 1000 / dur) * 100;
      return { left: Math.min(100, Math.max(0, left)) };
    });
});

function onLoadedMetadata() {
  if (audioRef.value) {
    duration.value = audioRef.value.duration;
  }
}

function onTimeUpdate() {
  if (audioRef.value && !isDragging.value) {
    currentTime.value = audioRef.value.currentTime;
  }
}

function togglePlay() {
  if (!audioRef.value) return;

  
  if (isPlaying.value) {
    audioRef.value.pause();
  } else {
    audioRef.value.play();
  }
}

function rewind(seconds: number) {
  if (!audioRef.value) return;
  audioRef.value.currentTime = Math.max(0, audioRef.value.currentTime - seconds);
}

function forward(seconds: number) {
  if (!audioRef.value) return;
  audioRef.value.currentTime = Math.min(
    duration.value,
    audioRef.value.currentTime + seconds
  );
}

function handleSpeedChange(command: string) {
  if (!audioRef.value) return;
  const rate = parseFloat(command);
  if (!isNaN(rate)) {
    playbackRate.value = rate;
    audioRef.value.playbackRate = rate;
  }
}

function updateCurrentTimeFromMouseEvent(event: MouseEvent) {
  if (!progressContainerRef.value || duration.value === 0) return;

  const rect = progressContainerRef.value.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const width = rect.width;
  
  const boundedOffsetX = Math.max(0, Math.min(offsetX, width));
  
  const newTime = (boundedOffsetX / width) * duration.value;
  
  currentTime.value = newTime;
  if (audioRef.value) {
    audioRef.value.currentTime = newTime;
  }
}

function handleProgressClick(event: MouseEvent) {
  updateCurrentTimeFromMouseEvent(event);
}

function onMouseDown(event: MouseEvent) {
  isDragging.value = true;
  audioRef.value?.pause();
  updateCurrentTimeFromMouseEvent(event);

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (isDragging.value) {
      updateCurrentTimeFromMouseEvent(moveEvent);
    }
  };

  const onMouseUp = () => {
    isDragging.value = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    if (isPlaying.value) {
      audioRef.value?.play();
    }
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function seekAndPlay(timeInSeconds: number) {
  if (audioRef.value) {
    audioRef.value.currentTime = timeInSeconds;
    currentTime.value = timeInSeconds;
    audioRef.value.play();
  }
}

function pause() {
  if (audioRef.value) {
    audioRef.value.pause();
  }
}

defineExpose({
  seekAndPlay,
  pause,
  isPlaying: computed(() => isPlaying.value),
});
</script>

<style lang="scss" scoped>
.custom-audio-player {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 50px;
  width: 100%;
  box-sizing: border-box;
}

.btn-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  background-color: rgba(74, 144, 226, 0.1);
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(74, 144, 226, 0.2);
  }
}

.play-pause-btn,
.crop-btn {
  width: 24px;
  height: 24px;
}

.controls-center {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.progress-container {
  width: 100%;
}

.actions-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-control-icon {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.playback-rate-control {
  position: relative;
  width: 50px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  .playback-rate-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .playback-rate-text {
    position: relative;
    color: #333;
    font-size: 12px;
  }
}

.time-display {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.custom-progress-bar {
  position: relative;
  width: 100%;
  height: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.progress-track {
  position: relative;
  width: 100%;
  height: 12px;
  background-color: #e9ecef;
  border-radius: 3px;
}

.transcription-view-player-progress-segment-marker {
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background-color: #fff;
  transform: translate(-50%);
  pointer-events: none;
  z-index: 2;
}


.progress-fill {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #0051FF 0%, #0075FF 33.33%, #12ACFF 66.66%, #24E3FF 100%);
  border-radius: 6px;
}

// .progress-slider {
//   --el-slider-main-bg-color: linear-gradient(to right, #0d6efd, #46a6ff);
//   --el-slider-runway-bg-color: #e9ecef;
//   --el-slider-button-size: 0;
//   --el-slider-height: 15px;

//   :deep(.el-slider__runway) {
//     border-radius: 10px;
//   }

//   :deep(.el-slider__bar) {
//     border-radius: 5px;
//   }
// }
</style>