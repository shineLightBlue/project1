<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import * as echarts from 'echarts'
require('echarts/theme/macarons')
import resize from '@/views/dashboard/mixins/resize'

export default {
  name: 'PieChart',
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
      default: '300px'
    },
    chartData: {
      type: Array,
      default: () => []
    },
    colors: {
      type: Array,
      default: () => ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#00BFFF', '#FF69B4', '#32CD32']
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
      const data = this.chartData || []
      const pieData = data.map(item => ({
        name: item.name || item.productName || item.platform || item.country,
        value: item.value || item.deviceCount || 0
      }))

      this.chart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            const value = params.value || 0
            const formattedValue = this.formatNumber(value)
            return `${params.name}<br/>设备数: ${formattedValue}<br/>占比: ${params.percent}%`
          }
        },
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'center',
          textStyle: {
            color: '#606266',
            fontSize: 12
          },
          formatter: (name) => {
            const item = data.find(d => (d.name || d.productName || d.platform || d.country) === name)
            if (item) {
              const value = item.value || item.deviceCount || 0
              const proportion = item.proportion || 0
              return `${name} (${proportion}%)`
            }
            return name
          }
        },
        series: [
          {
            name: '统计',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 6,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: pieData,
            color: this.colors.length > 0 ? this.colors : ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#00BFFF', '#FF69B4', '#32CD32']
          }
        ]
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
