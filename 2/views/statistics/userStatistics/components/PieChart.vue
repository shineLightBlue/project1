<template>
  <div ref="chart" :style="{ height: height, width: '100%' }"></div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'PieChart',
  props: {
    chartData: {
      type: Array,
      required: true
    },
    labelType: {
      type: String,
      default: '用户数'
    },
    height: {
      type: String,
      default: '350px'
    }
  },
  data() {
    return {
      chart: null
    };
  },
  watch: {
    chartData: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          this.initChart();
        });
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initChart();
    });
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    initChart() {
      if (!this.$refs.chart) return;

      if (this.chart) {
        this.chart.dispose();
      }

      this.chart = echarts.init(this.$refs.chart);

      // 计算总数
      const total = this.chartData.reduce((sum, item) => sum + (item.value || 0), 0);

      const option = {
        color: [
          '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
          '#66B1FF', '#95D475', '#EEBE77', '#F78989', '#A6A9AD',
          '#3A8EE6', '#5DAF34', '#CF9236', '#DD6161', '#82848A'
        ],
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: [12, 16],
          textStyle: {
            color: '#1e293b',
            fontSize: 13
          },
          formatter: (params) => {
            const percent = total > 0 ? ((params.value / total) * 100).toFixed(2) : 0;
            return `
              <div style="font-weight: 600; margin-bottom: 6px; color: #1e293b;">${params.name}</div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${params.color};"></span>
                <span style="color: #64748b;">${this.labelType}:</span>
                <span style="font-weight: 600; color: #1e293b;">${params.value}</span>
              </div>
              <div style="margin-top: 4px; color: #64748b;">占比: <span style="font-weight: 600; color: #409eff;">${percent}%</span></div>
            `;
          }
        },
        legend: {
          orient: 'vertical',
          right: '8%',
          top: 'center',
          itemGap: 12,
          itemWidth: 12,
          itemHeight: 12,
          textStyle: {
            color: '#475569',
            fontSize: 13,
            fontWeight: 500
          },
          formatter: (name) => {
            const item = this.chartData.find(d => d.name === name);
            const value = item ? item.value : 0;
            const percent = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
            return `${name} (${percent}%)`;
          }
        },
        series: [
          {
            type: 'pie',
            radius: ['45%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 3,
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.1)',
              shadowOffsetY: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              scale: true,
              scaleSize: 8,
              itemStyle: {
                shadowBlur: 20,
                shadowColor: 'rgba(64, 158, 255, 0.3)'
              },
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 700,
                color: '#1e293b',
                formatter: (params) => {
                  const percent = total > 0 ? ((params.value / total) * 100).toFixed(2) : 0;
                  return `{name|${params.name}}\n{value|${params.value}}\n{percent|${percent}%}`;
                },
                rich: {
                  name: {
                    fontSize: 14,
                    color: '#64748b',
                    lineHeight: 22,
                    fontWeight: 500
                  },
                  value: {
                    fontSize: 24,
                    color: '#1e293b',
                    lineHeight: 32,
                    fontWeight: 700
                  },
                  percent: {
                    fontSize: 16,
                    color: '#409eff',
                    lineHeight: 24,
                    fontWeight: 600
                  }
                }
              }
            },
            labelLine: {
              show: false
            },
            animationType: 'scale',
            animationEasing: 'elasticOut',
            animationDelay: (idx) => idx * 50,
            data: this.chartData
          }
        ]
      };

      this.chart.setOption(option);
    },
    handleResize() {
      if (this.chart) {
        this.chart.resize();
      }
    }
  }
};
</script>

<style scoped>
</style>
