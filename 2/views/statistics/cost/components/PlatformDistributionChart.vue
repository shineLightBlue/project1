<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import * as echarts from 'echarts'
require('echarts/theme/macarons')
import resize from '@/views/dashboard/mixins/resize'

export default {
  name: 'PlatformDistributionChart',
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
        name: item.platformName || item.name || item.platformCode,
        value: item.value || 0
      }))

      const colors = [
        '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
        '#909399', '#00BFFF', '#FF69B4', '#32CD32',
        '#FFD700', '#8A2BE2'
      ]

      this.chart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            const value = params.value || 0
            let formattedValue
            if (value >= 1000000) {
              formattedValue = (value / 1000000).toFixed(2) + 'M'
            } else if (value >= 1000) {
              formattedValue = (value / 1000).toFixed(2) + 'K'
            } else {
              formattedValue = value.toLocaleString()
            }
            return `${params.name}: ${formattedValue} (${params.percent}%)`
          }
        },
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'center',
          textStyle: {
            color: '#606266'
          }
        },
        series: [
          {
            name: '平台分布',
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
            color: colors
          }
        ]
      })
    }
  }
}
</script>

