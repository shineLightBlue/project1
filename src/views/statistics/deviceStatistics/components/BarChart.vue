<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import * as echarts from 'echarts'
require('echarts/theme/macarons')
import resize from '@/views/dashboard/mixins/resize'

export default {
  name: 'BarChart',
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
      default: () => ({ xAxis: [], series: [] })
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
      const dates = data.xAxis || []
      const series = data.series || []

      this.chart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params) => {
            let result = `<div style="margin-bottom: 5px;"><strong>${params[0].axisValue}</strong></div>`
            params.forEach(param => {
              const value = param.value || 0
              result += `<div>${param.seriesName}: ${this.formatNumber(value)}</div>`
            })
            return result
          }
        },
        legend: {
          data: series.map(s => s.name),
          top: 10,
          textStyle: {
            fontSize: 12
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisTick: {
            show: false
          },
          axisLabel: {
            fontSize: 12
          }
        },
        yAxis: {
          type: 'value',
          axisTick: {
            show: false
          },
          axisLabel: {
            formatter: (value) => {
              return this.formatNumber(value)
            }
          }
        },
        series: series.map(s => ({
          name: s.name,
          type: 'bar',
          data: s.data,
          itemStyle: {
            color: s.color || '#409EFF',
            borderRadius: [4, 4, 0, 0]
          }
        }))
      })
    },
    formatNumber(num) {
      if (num == null) return '0'
      if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M'
      } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K'
      }
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
  }
}
</script>
