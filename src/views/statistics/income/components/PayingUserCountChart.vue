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
      // 根据 periodType 格式化日期显示
      const dates = data.map(item => {
        const dateStr = item.date || ''
        if (this.periodType === 'month') {
          // 月份格式：YYYY-MM，显示为 YYYY年MM月
          if (dateStr && dateStr.length >= 7) {
            const [year, month] = dateStr.split('-')
            return `${year}年${month}月`
          }
          return dateStr
        } else {
          // 日期格式：YYYY-MM-DD，显示为 MM-DD
          if (dateStr && dateStr.length >= 10) {
            const parts = dateStr.split('-')
            if (parts.length >= 3) {
              return `${parts[1]}-${parts[2]}`
            }
          }
          return dateStr
        }
      })
      const userCounts = data.map(item => item.userCount || 0)

      this.chart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params) => {
            if (params && params.length > 0) {
              const param = params[0]
              const originalDate = data[param.dataIndex]?.date || ''
              const dateLabel = this.periodType === 'month' 
                ? (originalDate ? originalDate.replace('-', '年').replace('-', '月') : '')
                : originalDate
              return `${dateLabel}<br/>${param.seriesName}: ${param.value}`
            }
            return ''
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisTick: {
            alignWithLabel: true
          }
        },
        yAxis: {
          type: 'value',
          name: '用户数'
        },
        series: [
          {
            name: '付费用户数',
            type: 'bar',
            barWidth: '60%',
            data: userCounts,
            itemStyle: {
              color: '#409EFF'
            }
          }
        ]
      })
    }
  }
}
</script>
