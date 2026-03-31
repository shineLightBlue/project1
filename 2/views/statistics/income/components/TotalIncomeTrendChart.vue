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
      const that = this
      const dates = data.map(item => item.date || '')
      const totalIncomes = data.map(item => item.totalIncome || 0)
      const subscriptionIncomes = data.map(item => item.subscriptionIncome || 0)
      const supplementIncomes = data.map(item => item.supplementIncome || 0)

      this.chart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
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
          data: ['总收入', '会员订阅收入', '补充包收入']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates
        },
        yAxis: {
          type: 'value',
          name: '收入金额'
        },
        series: [
          {
            name: '总收入',
            type: 'line',
            smooth: true,
            data: totalIncomes,
            itemStyle: {
              color: '#409EFF'
            }
          },
          {
            name: '会员订阅收入',
            type: 'line',
            smooth: true,
            data: subscriptionIncomes,
            itemStyle: {
              color: '#67C23A'
            }
          },
          {
            name: '补充包收入',
            type: 'line',
            smooth: true,
            data: supplementIncomes,
            itemStyle: {
              color: '#E6A23C'
            }
          }
        ]
      })
    }
  }
}
</script>
