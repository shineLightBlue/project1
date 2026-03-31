<template>
  <div :class="className" :style="{height:height,width:width}" class="distribution-chart-wrapper">
    <div class="chart-container">
      <div ref="chartContainer" class="chart-inner"></div>
    </div>
    <div class="list-container" @click.stop>
      <div class="distribution-list">
        <div class="distribution-list__header" @click.stop>
          <h4 class="distribution-list__title">完整分布</h4>
        </div>
        <div class="distribution-list__body" @click.stop>
          <div 
            v-for="(item, index) in sortedListData" 
            :key="item.name"
            class="distribution-list-item"
            :class="{ 'distribution-list-item--highlighted': highlightedItem && highlightedItem.name === item.name }"
            @click.stop="handleListItemClick(item)"
          >
            <div class="distribution-list-item__info">
              <span class="distribution-list-item__name">{{ item.name }}</span>
              <span class="distribution-list-item__amount">{{ formatAmount(item.value) }}</span>
            </div>
            <div class="distribution-list-item__proportion">
              <div class="proportion-bar">
                <div 
                  class="proportion-bar__fill" 
                  :style="{ width: item.percent + '%' }"
                ></div>
              </div>
              <span class="proportion-value">{{ item.percent.toFixed(1) }}%</span>
            </div>
          </div>
          <div v-if="sortedListData.length === 0" class="distribution-list__empty">
            暂无数据
          </div>
        </div>
      </div>
    </div>
  </div>
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
      chart: null,
      highlightedItem: null
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
  computed: {
    // 所有类别数据（用于列表）
    listData() {
      const data = this.chartData || []
      const total = data.reduce((sum, item) => sum + (item.amount || 0), 0)
      
      return data.map(item => {
        const country = item.country || '未知'
        const type = item.type || '未知'
        const displayName = `${type}(${country})`
        const value = item.amount || 0
        const percent = total > 0 ? (value / total) * 100 : 0
        
        return {
          value: value,
          name: displayName,
          type: type,
          country: country,
          percent: percent
        }
      })
    },
    // 排序后的列表数据（按金额降序）
    sortedListData() {
      if (!this.listData || this.listData.length === 0) {
        return []
      }
      // 按金额降序排序
      return [...this.listData].sort((a, b) => b.value - a.value)
    }
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chartContainer, 'macarons')
      this.setOptions()
      // 添加点击事件监听
      this.chart.on('click', (params) => {
        const item = this.listData.find(d => d.name === params.name)
        if (item) {
          this.highlightedItem = item
        }
      })
    },
    handleListItemClick(item) {
      this.highlightedItem = item
      // 高亮饼图对应扇形
      this.highlightPieSlice(item.name)
    },
    highlightPieSlice(itemName) {
      if (!this.chart) return
      // 使用 dispatchAction 高亮扇形
      this.chart.dispatchAction({
        type: 'highlight',
        name: itemName
      })
      // 1秒后取消高亮
      setTimeout(() => {
        this.chart.dispatchAction({
          type: 'downplay',
          name: itemName
        })
      }, 1000)
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
    // 生成品牌渐变色（从 #2980FA 到 #68D4DE）
    generateBrandColors(count) {
      const colors = []
      const startColor = { r: 41, g: 128, b: 250 } // #2980FA
      const endColor = { r: 104, g: 212, b: 222 } // #68D4DE
      
      for (let i = 0; i < count; i++) {
        const ratio = count > 1 ? i / (count - 1) : 0
        const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio)
        const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio)
        const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio)
        colors.push(`rgb(${r}, ${g}, ${b})`)
      }
      return colors
    },
    setOptions() {
      if (!this.chart) return
      
      const data = this.chartData || []
      const that = this
      
      // 计算总额用于百分比计算
      const total = data.reduce((sum, item) => sum + (item.amount || 0), 0)
      
      const allPieData = data.map(item => {
        const country = item.country || '未知'
        const type = item.type || '未知'
        const displayName = `${type}(${country})`
        const value = item.amount || 0
        const percent = total > 0 ? (value / total) * 100 : 0
        
        return {
          value: value,
          name: displayName,
          type: type,
          country: country,
          percent: percent
        }
      })

      // 按金额排序（降序）
      allPieData.sort((a, b) => b.value - a.value)

      // 取 Top 5-6 用于饼图显示
      const topN = Math.min(6, allPieData.length)
      const pieData = allPieData.slice(0, topN)
      
      // 生成品牌渐变色
      const colors = this.generateBrandColors(pieData.length)
      pieData.forEach((item, index) => {
        item.itemStyle = {
          color: colors[index]
        }
      })

      this.chart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            return params.seriesName + '<br/>' + params.name + ': ' + that.formatAmount(params.value) + ' (' + params.percent.toFixed(2) + '%)'
          }
        },
        series: [
          {
            name: '会员订阅收入分布',
            type: 'pie',
            radius: ['35%', '55%'],
            center: ['35%', '50%'], // 调整位置为左侧
            data: pieData,
            emphasis: {
              itemStyle: {
                shadowBlur: 15,
                shadowOffsetX: 0,
                shadowOffsetY: 0,
                shadowColor: 'rgba(41, 128, 250, 0.5)'
              },
              label: {
                show: true,
                fontSize: 14,
                fontWeight: 'bold'
              }
            },
            label: {
              show: true,
              formatter: function(params) {
                return params.percent.toFixed(1) + '%'
              },
              fontSize: 12,
              fontWeight: 'bold',
              color: '#333'
            },
            labelLine: {
              show: true,
              length: 10,
              length2: 5,
              smooth: true,
              lineStyle: {
                width: 1.5
              }
            }
          }
        ]
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.distribution-chart-wrapper {
  display: flex;
  gap: 20px;
  height: 100%;
  width: 100%;

  @media (max-width: 1200px) {
    flex-direction: column;
  }
}

.chart-container {
  flex: 0 0 50%;
  min-height: 280px;

  @media (max-width: 1200px) {
    flex: 1 1 auto;
    min-height: 300px;
  }
}

.chart-inner {
  width: 100%;
  height: 100%;
  min-height: 280px;
}

.list-container {
  flex: 0 0 50%;
  display: flex;
  flex-direction: column;

  @media (max-width: 1200px) {
    flex: 1 1 auto;
  }
}

.distribution-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.distribution-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #f8fafc;
}

.distribution-list__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.distribution-list__sort {
  display: flex;
  gap: 4px;
}

.sort-btn {
  padding: 4px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #2196F3;
    border-color: #2196F3;
  }

  &--active {
    background: #2196F3;
    border-color: #2196F3;
    color: #fff;

    &:hover {
      color: #fff;
    }
  }
}

.distribution-list__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  max-height: 264px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f7fa;
  }

  &::-webkit-scrollbar-thumb {
    background: #c0c4cc;
    border-radius: 3px;

    &:hover {
      background: #a0a4aa;
    }
  }
}

.distribution-list-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;

  &:hover {
    background: #f5f7fa;
  }

  &--highlighted {
    background: rgba(33, 150, 243, 0.08);
    border-left-color: #2196F3;
  }
}

.distribution-list-item__info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.distribution-list-item__name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  flex: 1;
}

.distribution-list-item__amount {
  font-size: 13px;
  font-weight: 600;
  color: #2196F3;
  margin-left: 12px;
}

.distribution-list-item__proportion {
  display: flex;
  align-items: center;
  gap: 8px;
}

.proportion-bar {
  flex: 1;
  height: 6px;
  background: #ebeef5;
  border-radius: 3px;
  overflow: hidden;
}

.proportion-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #2980FA 0%, #68D4DE 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.proportion-value {
  font-size: 12px;
  color: #909399;
  min-width: 45px;
  text-align: right;
}

.distribution-list__empty {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>
