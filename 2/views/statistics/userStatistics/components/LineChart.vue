<template>
  <div ref="chart" :style="{ height: height, width: '100%' }"></div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'LineChart',
  props: {
    chartData: {
      type: [Array, Object],
      required: true
    },
    height: {
      type: String,
      default: '400px'
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

      // 处理数据
      let dates = [];
      let series = [];

      if (Array.isArray(this.chartData)) {
        // 用户增长趋势数据格式
        dates = this.chartData.map(item => item.date);
        series = [
          {
            name: '总新增用户数',
            type: 'line',
            data: this.chartData.map(item => item.totalCount || 0)
          },
          {
            name: 'Android',
            type: 'line',
            data: this.chartData.map(item => item.androidCount || 0)
          },
          {
            name: 'iOS',
            type: 'line',
            data: this.chartData.map(item => item.iosCount || 0)
          },
          {
            name: 'Web',
            type: 'line',
            data: this.chartData.map(item => item.webCount || 0)
          },
          {
            name: '小程序',
            type: 'line',
            data: this.chartData.map(item => item.miniCount || 0)
          }
        ];
      }

      const option = {
        color: [
          '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'
        ],
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: [12, 16],
          textStyle: {
            color: '#1e293b',
            fontSize: 13
          },
          axisPointer: {
            type: 'cross',
            lineStyle: {
              color: '#94a3b8',
              type: 'dashed'
            },
            crossStyle: {
              color: '#94a3b8'
            }
          },
          formatter: (params) => {
            let result = `<div style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">${params[0].axisValue}</div>`;
            params.forEach(item => {
              result += `
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                  ${item.marker}
                  <span style="color: #64748b;">${item.seriesName}:</span>
                  <span style="font-weight: 600; color: #1e293b;">${item.value}</span>
                </div>
              `;
            });
            return result;
          }
        },
        legend: {
          data: series.map(s => s.name),
          top: 10,
          itemGap: 16,
          itemWidth: 14,
          itemHeight: 14,
          textStyle: {
            color: '#475569',
            fontSize: 13,
            fontWeight: 500
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '8%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLine: {
            lineStyle: {
              color: '#cbd5e1'
            }
          },
          axisLabel: {
            rotate: 45,
            color: '#64748b',
            fontSize: 12,
            fontWeight: 500
          },
          axisTick: {
            show: false
          }
        },
        yAxis: {
          type: 'value',
          name: '用户数',
          minInterval: 1,
          nameTextStyle: {
            color: '#64748b',
            fontSize: 12,
            fontWeight: 500,
            padding: [0, 0, 0, 0]
          },
          axisLine: {
            show: false
          },
          axisLabel: {
            color: '#64748b',
            fontSize: 12,
            fontWeight: 500
          },
          splitLine: {
            lineStyle: {
              color: '#e2e8f0',
              type: 'dashed'
            }
          }
        },
        series: series.map(s => ({
          ...s,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3
          },
          areaStyle: {
            opacity: 0.08
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              borderWidth: 2,
              borderColor: '#fff',
              shadowBlur: 10,
              shadowColor: 'rgba(64, 158, 255, 0.3)'
            }
          }
        }))
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
