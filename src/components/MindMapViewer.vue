<template>
  <div class="mindmap-viewer" ref="containerRef">
    <svg ref="svgRef" class="mindmap-svg"></svg>
    <div class="zoom-controls">
      <img :src="iconShrink" :alt="t('common.zoomOut')" class="zoom-icon" @click="zoomOut" />
      <input
        type="range"
        min="20"
        max="400"
        step="1"
        :value="zoomPercent"
        @input="handleSliderChange"
        class="zoom-slider"
      />
      <span class="zoom-level">{{ zoomPercent }}%</span>
      <img :src="iconMagnify" :alt="t('common.zoomIn')" class="zoom-icon" @click="zoomIn" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import iconShrink from '@/assets/allfiles/icon_editingpopup_crop_shrink.svg';
import iconMagnify from '@/assets/allfiles/icon_editingpopup_crop_magnify.svg';

const { t } = useI18n();
const props = defineProps<{ markdown: string }>();

const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const zoomPercent = ref(100);
const transformer = new Transformer();
let mm: Markmap | null = null;
let resizeObserver: ResizeObserver | null = null;

const MIN_W = 800;
const MIN_H = 400;

/** 与 range input 的 min / max 一致（百分比），scale = zoomPercent / 100 */
const ZOOM_MIN_PCT = 20;
const ZOOM_MAX_PCT = 400;

function clampZoomPercent(p: number): number {
  return Math.min(ZOOM_MAX_PCT, Math.max(ZOOM_MIN_PCT, Math.round(p)));
}

/** Markmap 需要 SVG 有稳定像素宽高；getBoundingClientRect 为 0 时 fit() 会得到 NaN transform */
function syncSvgPixelSize() {
  const container = containerRef.value;
  const svg = svgRef.value;
  if (!container || !svg) return;
  const rect = container.getBoundingClientRect();
  const w = Math.max(
    MIN_W,
    Math.round(rect.width || container.clientWidth || container.offsetWidth)
  );
  const h = Math.max(
    MIN_H,
    Math.round(rect.height || container.clientHeight || container.offsetHeight)
  );
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
}

/** 空或非法 markdown 会导致布局 rect 退化，进而 translate(NaN) */
function safeMindmapMarkdown(md: string) {
  const t = md?.trim() ?? '';
  if (!t) return '# ';
  return t;
}

function renderMarkmap() {
  if (!svgRef.value || !props.markdown) return;

  let root;
  try {
    root = transformer.transform(safeMindmapMarkdown(props.markdown)).root;
  } catch {
    root = transformer.transform('# ').root;
  }

  const mount = () => {
    syncSvgPixelSize();
    if (!svgRef.value) return;
    if (mm) {
      void mm.setData(root);
      nextTick(() => {
        syncSvgPixelSize();
        const inst = mm;
        if (inst) void safeFit(inst); 
      });
    } else {
      /* 勿传 create 第三参数：库内会在 setData 后无条件 fit()，仍可能 NaN */
      mm = Markmap.create(svgRef.value, {
        autoFit: false,
        duration: 0,
        maxInitialScale: 2,
        /** 默认 pan 会在 wheel 上叠加平移，与 d3-zoom 的滚轮缩放冲突；缩放到边界后平移仍会生效，表现为上下漂移。拖拽仍可平移。 */
        pan: false,
      });
      /** 与滑块一致，禁止滚轮/触控把缩放拖出 20%–400% */
      const zMin = ZOOM_MIN_PCT / 100;
      const zMax = ZOOM_MAX_PCT / 100;
      (mm as any).zoom.scaleExtent([zMin, zMax]);
      const onZoom = (mm as any).handleZoom.bind(mm) as (e: any) => void;
      (mm as any).zoom.on('zoom', (event: any) => {
        onZoom(event);
        const k = event?.transform?.k;
        if (typeof k === 'number' && Number.isFinite(k)) {
          zoomPercent.value = clampZoomPercent(Math.round(k * 100));
        }
      });
      void mm.setData(root).then(() => {
        syncSvgPixelSize();
        if (mm) void safeFit(mm);
      });
    }
  };

  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(mount);
    });
  });
}

/** fit 在 content 宽高为 0 时会产生 NaN，跳过非法 transform */
function safeFit(inst: InstanceType<typeof Markmap>) {
  const svgNode = (inst as any).svg?.node?.() as SVGSVGElement | undefined;
  if (!svgNode) return;
  const { width: nw, height: nh } = svgNode.getBoundingClientRect();
  if (nw < 1 || nh < 1) return;
  const rect = (inst as any).state?.rect;
  if (!rect) return;
  const dw = rect.x2 - rect.x1;
  const dh = rect.y2 - rect.y1;
  if (!(dw > 0) || !(dh > 0) || !Number.isFinite(dw) || !Number.isFinite(dh)) return;
  return inst.fit().catch(() => {});
}

function handleSliderChange(e: Event) {
  if (!mm) return;
  const target = e.target as HTMLInputElement;
  const pct = clampZoomPercent(Number(target.value));
  const newScale = pct / 100;
  (mm as any).zoom.scaleTo((mm as any).svg.transition().duration(0), newScale);
}

function zoomIn() {
  if (!mm) return;
  const next = clampZoomPercent(zoomPercent.value * 1.25);
  if (next === zoomPercent.value) return;
  (mm as any).zoom.scaleTo((mm as any).svg.transition().duration(0), next / 100);
}

function zoomOut() {
  if (!mm) return;
  const next = clampZoomPercent(zoomPercent.value * 0.8);
  if (next === zoomPercent.value) return;
  (mm as any).zoom.scaleTo((mm as any).svg.transition().duration(0), next / 100);
}

onMounted(() => {
  renderMarkmap();

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      syncSvgPixelSize();
      if (mm) void safeFit(mm);
    });
    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

watch(
  () => props.markdown,
  () => {
    renderMarkmap();
  }
);
</script>

<style lang="scss" scoped>
.mindmap-viewer {
  width: 100%;
  min-height: 400px;
  height: 100%;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

/* 宽高由 JS 写入 SVG 属性（像素），勿用 CSS 100%，否则会触发 SVGLength 错误 */
.mindmap-svg {
  display: block;
  max-width: 100%;
}

.zoom-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 6px 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.zoom-icon {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

.zoom-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 120px;
  height: 4px;
  border-radius: 2px;
  background: #e0e0e0;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #409eff;
    border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #409eff;
    border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    cursor: pointer;
  }
}

.zoom-level {
  font-size: 12px;
  color: #666;
  min-width: 36px;
  text-align: center;
  user-select: none;
  white-space: nowrap;
}
</style>
