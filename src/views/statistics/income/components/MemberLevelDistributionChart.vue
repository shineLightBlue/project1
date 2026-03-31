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
    periodType: {
      type: String,
      default: 'day'
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
    periodType() {
      this.setOptions()
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
      const that = this
      const periods = [...new Set(data.map(item => item.period || ''))].sort()
      const memberLevels = ['普通', '探索版', '专业版', '大师版']

      const seriesData = memberLevels.map(level => {
        return {
          name: level,
          type: 'bar',
          data: periods.map(period => {
            const item = data.find(d => d.period === period && d.memberLevel === level)
            return item ? (item.amount || 0) : 0
          })
        }
      })

      this.chart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params) {
            let result = params[0].name + '<br/>'
            params.forEach(param => {
              result += param.seriesName + ': ' + that.formatAmount(param.value) + '<br/>'
            })
            return result
          }
        },
        legend: {
          data: memberLevels
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: periods
        },
        yAxis: {
          type: 'value',
          name: '收入金额'
        },
        series: seriesData
      })
    }
  }
}
</script>
