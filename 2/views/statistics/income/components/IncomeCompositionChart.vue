<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import * as echarts from 'echarts'
require('echarts/theme/macarons')
import resize from '@/views/dashboard/mixins/resize'

export default {
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
    currencyCode: {
      type: String,
      default: 'CNY'
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
    },
    currencyCode() {
      this.setOptions()
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
    formatAmount(value) {
      // 币种缩写转符号映射表
      const currencySymbolMap = {
        'CNY': '¥',      // 人民币
        'USD': '$',      // 美元
        'JPY': '¥',      // 日元
        'HKD': 'HK$',    // 港币
        'TWD': 'NT$',    // 台币
        'GBP': '£',      // 英镑
        'AUD': 'A$',     // 澳币
        'EUR': '€'       // 欧元
      };

      const num = parseFloat(value) || 0
      const formatted = num.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })

      if (this.currencyCode === 'ORIGINAL') {
        return formatted
      }

      const symbol = currencySymbolMap[this.currencyCode]
      return symbol ? `${symbol}${formatted}` : `${this.currencyCode} ${formatted}`
    },
    setOptions() {
      const data = this.chartData || []
      const total = data.reduce((sum, item) => sum + (item.amount || 0), 0)
      const that = this

      const pieData = data.map(item => ({
        value: item.amount || 0,
        name: item.type || '未知'
      }))

      this.chart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            return params.seriesName + '<br/>' + params.name + ': ' + that.formatAmount(params.value) + ' (' + params.percent + '%)'
          }
        },
        legend: {
          left: 'center',
          bottom: '10',
          data: data.map(item => item.type || '未知')
        },
        series: [
          {
            name: '收入构成比',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            data: pieData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: {
              formatter: '{b}: {d}%'
            }
          }
        ]
      })
    }
  }
}
</script>
