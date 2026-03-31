<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import * as echarts from 'echarts'
require('echarts/theme/macarons')
import resize from '@/views/dashboard/mixins/resize'

export default {
  name: 'TokenTrendChart',
  mixins: [resize],
  props: {
    className: {
      type: String,
      default: 'chart'
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '350px'
    },
    chartData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      chart: null
    }
  },
  watch: {
    chartData: {
      deep: true,
      handler() {
        this.setOptions()
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initChart()
    })
  },
  beforeDestroy() {
    if (!this.chart) {
      return
    }
    this.chart.dispose()
    this.chart = null
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$el, 'macarons')
      this.setOptions()
    },
    setOptions() {
      const data = this.chartData || {}
      const xAxis = data.xAxis || []
      const series = data.series || []

      const seriesData = series.map((item, index) => {
        const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
        return {
          name: item.name,
          type: 'line',
          smooth: true,
          data: item.data || [],
          itemStyle: {
            color: colors[index % colors.length]
          },
          areaStyle: index === 0 ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ])
          } : null
        }
      })

      this.chart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: function(params) {
            let result = params[0].name + '<br/>'
            params.forEach(param => {
              const value = param.value || 0
              let formattedValue
              if (value >= 1000000) {
                formattedValue = (value / 1000000).toFixed(2) + 'M'
              } else if (value >= 1000) {
                formattedValue = (value / 1000).toFixed(2) + 'K'
              } else {
                formattedValue = value.toLocaleString()
              }
              result += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${param.color};margin-right:5px;"></span>`
              result += param.seriesName + ': ' + formattedValue + '<br/>'
            })
            return result
          }
        },
        legend: {
          data: series.map(s => s.name),
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: xAxis,
          axisLine: {
            lineStyle: {
              color: '#dcdfe6'
            }
          },
          axisLabel: {
            color: '#606266'
          }
        },
        yAxis: {
          type: 'value',
          name: 'Token数量',
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: '#f0f0f0'
            }
          },
          axisLabel: {
            color: '#606266',
            formatter: function(value) {
              if (value >= 1000000) {
                return (value / 1000000) + 'M'
              } else if (value >= 1000) {
                return (value / 1000) + 'K'
              }
              return value
            }
          }
        },
        series: seriesData
      })
    }
  }
}
</script>

