<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import * as echarts from 'echarts'
require('echarts/theme/macarons')
import resize from '@/views/dashboard/mixins/resize'

export default {
  name: 'LineChart',
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
      default: '400px'
    },
    chartData: {
      type: [Array, Object],
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

      let dates, series, legendData

      // 判断数据格式：如果是对象且包含 xAxis 和 series，则使用新格式
      if (data.xAxis && data.series) {
        dates = data.xAxis
        series = data.series.map((item, index) => ({
          name: item.name,
          type: 'line',
          smooth: true,
          data: item.data || [],
          itemStyle: {
            color: this.getSeriesColor(item.name, index)
          },
          lineStyle: {
            color: this.getSeriesColor(item.name, index),
            width: 2
          },
          areaStyle: item.name === '合计' ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ])
          } : null
        }))
        legendData = series.map(s => s.name)
      } else {
        // 旧格式：DeviceTrendVO 数组
        dates = [...new Set(data.map(item => item.date))].sort()

        const productNames = new Set()
        data.forEach(item => {
          if (item.productCounts) {
            Object.keys(item.productCounts).forEach(name => {
              productNames.add(name)
            })
          }
        })
        const productList = Array.from(productNames)

        series = []

        // 合计系列
        const totalData = dates.map(date => {
          const item = data.find(d => d.date === date)
          return item ? (item.totalCount || 0) : 0
        })
        series.push({
          name: '合计',
          type: 'line',
          smooth: true,
          data: totalData,
          itemStyle: {
            color: '#409EFF'
          },
          lineStyle: {
            color: '#409EFF',
            width: 2
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ])
          }
        })

        // 各产品型号系列
        const productColors = ['#67C23A', '#E6A23C', '#F56C6C', '#909399', '#00BFFF']
        productList.forEach((productName, index) => {
          const productData = dates.map(date => {
            const item = data.find(d => d.date === date)
            if (item && item.productCounts) {
              return item.productCounts[productName] || 0
            }
            return 0
          })
          series.push({
            name: productName,
            type: 'line',
            smooth: true,
            data: productData,
            itemStyle: {
              color: productColors[index % productColors.length]
            },
            lineStyle: {
              color: productColors[index % productColors.length],
              width: 2
            }
          })
        })
        legendData = ['合计', ...productList]
      }

      this.chart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
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
          data: legendData,
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
          boundaryGap: false,
          data: dates,
          axisTick: {
            show: false
          },
          axisLabel: {
            rotate: 45,
            fontSize: 10
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
        series: series
      })
    },
    getSeriesColor(name, index) {
      if (name === '合计') {
        return '#409EFF'
      }
      const countryColors = ['#67C23A', '#E6A23C', '#F56C6C', '#909399', '#00BFFF', '#FF69B4', '#32CD32']
      return countryColors[index % countryColors.length]
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
