<template>
  <div class="user-statistics-container">
    <!-- 筛选条件面板 -->
    <div class="filter-panel">
      <div class="filter-row">
        <!-- 国家筛选 -->
        <div class="filter-group">
          <span class="filter-group__label">国家</span>
          <el-select
            v-model="selectedCountries"
            multiple
            collapse-tags
            placeholder="全部"
            size="small"
            class="filter-select"
            @change="handleFilterChange"
          >
            <el-option
              v-for="item in countryOptions"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
          </el-select>
        </div>

        <!-- 时间筛选 -->
        <div class="filter-group filter-group--right">
          <span class="filter-group__label">时间</span>
          <div class="date-quick-filters">
            <button
              v-for="option in dateOptions"
              :key="option.value"
              class="date-chip"
              :class="{ 'date-chip--active': dateRangeType === option.value }"
              @click="handleDateRangeTypeChange(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
          <div v-if="dateRangeType === 'custom'" class="custom-date-range">
            <el-date-picker
              v-model="tempDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              size="small"
              class="date-picker"
            />
            <el-button
              type="primary"
              size="small"
              class="apply-btn"
              @click="applyCustomDateRange"
              :disabled="!tempDateRange || tempDateRange.length !== 2"
            >
              应用
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <div class="stat-cards-top">
      <!-- 累计用户数 -->
      <div class="stat-card" @click="handleTopCardClick('total')">
        <div class="stat-card__header">
          <span class="stat-card__title">累计用户数</span>
        </div>
        <div class="stat-card__content">
          <div class="stat-card__number">{{ totalUsers }}</div>
        </div>
      </div>

      <!-- 本月用户数 -->
      <div class="stat-card" @click="handleTopCardClick('month')">
        <div class="stat-card__header">
          <span class="stat-card__title">本月用户数</span>
        </div>
        <div class="stat-card__content">
          <div class="stat-card__number">{{ monthUsers }}</div>
        </div>
      </div>

      <!-- 昨日新增用户数 -->
      <div class="stat-card" @click="handleTopCardClick('yesterday')">
        <div class="stat-card__header">
          <span class="stat-card__title">昨日新增用户数</span>
        </div>
        <div class="stat-card__content">
          <div class="stat-card__number">{{ yesterdayUsers }}</div>
        </div>
      </div>
    </div>

    <!-- 中间图表区域 -->
    <div class="stat-cards-middle">
      <!-- 会员订阅用户占比 -->
      <div class="stat-card-large stat-card-large--clickable">
        <div class="stat-card-large__header" @click="handleChartCardClick('member')">
          <span class="stat-card-large__title">会员订阅用户占比</span>
        </div>
        <div class="stat-card-large__content">
          <div class="chart-wrapper" @click="handleChartCardClick('member')">
            <pie-chart v-if="memberData.length > 0" :chart-data="memberData" label-type="用户数" height="280px" />
            <div v-else class="no-data">暂无数据</div>
          </div>
        </div>
      </div>

      <!-- 付费用户占比 -->
      <div class="stat-card-large stat-card-large--clickable">
        <div class="stat-card-large__header" @click="handleChartCardClick('paid')">
          <span class="stat-card-large__title">付费用户占比</span>
        </div>
        <div class="stat-card-large__content">
          <div class="chart-wrapper" @click="handleChartCardClick('paid')">
            <pie-chart v-if="paidData.length > 0" :chart-data="paidData" label-type="用户数" height="280px" />
            <div v-else class="no-data">暂无数据</div>
          </div>
        </div>
      </div>

      <!-- 注册国家/地区分布 -->
      <div class="stat-card-large stat-card-large--no-click">
        <div class="stat-card-large__header">
          <span class="stat-card-large__title">注册国家/地区分布</span>
        </div>
        <div class="stat-card-large__content">
          <pie-chart v-if="countryData.length > 0" :chart-data="countryData" label-type="用户数" height="280px" />
          <div v-else class="no-data">暂无数据</div>
        </div>
      </div>

      <!-- 手机品牌分布 -->
      <div class="stat-card-large stat-card-large--no-click">
        <div class="stat-card-large__header">
          <span class="stat-card-large__title">手机品牌分布</span>
        </div>
        <div class="stat-card-large__content">
          <pie-chart v-if="brandData.length > 0" :chart-data="brandData" label-type="用户数" height="280px" />
          <div v-else class="no-data">暂无数据</div>
        </div>
      </div>

      <!-- 注册平台分布 -->
      <div class="stat-card-large stat-card-large--no-click">
        <div class="stat-card-large__header">
          <span class="stat-card-large__title">注册平台分布</span>
        </div>
        <div class="stat-card-large__content">
          <pie-chart v-if="platformData.length > 0" :chart-data="platformData" label-type="用户数" height="280px" />
          <div v-else class="no-data">暂无数据</div>
        </div>
      </div>
    </div>

    <!-- 用户增长趋势图 -->
    <div class="stat-card-full stat-card-full--no-hover">
      <div class="stat-card-full__header">
        <span class="stat-card-full__title">用户增长趋势图</span>
      </div>
      <div class="stat-card-full__content">
        <line-chart v-if="growthData.length > 0" :chart-data="growthData" height="400px" />
        <div v-else class="no-data">暂无数据</div>
      </div>
    </div>

    <!-- 顶部卡片详情弹窗 -->
    <el-dialog
      :title="topCardDialogTitle"
      :visible.sync="topCardDialogVisible"
      width="600px"
      append-to-body
      @close="handleTopCardDialogClose"
    >
      <div class="detail-content">
        <el-table
          :data="topCardDetailData"
          style="width: 100%"
          max-height="400"
        >
          <el-table-column
            prop="country"
            label="国家/地区"
            width="200"
          >
            <template slot-scope="scope">
              {{ getCountryName(scope.row.country) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="userCount"
            :label="userCountLabel"
            width="150"
            align="right"
          />
          <el-table-column
            prop="percentage"
            label="占比"
            align="right"
          >
            <template slot-scope="scope">
              {{ scope.row.percentage }}%
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="topCardDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 图表详情弹窗 -->
    <el-dialog
      :title="chartDialogTitle"
      :visible.sync="chartDialogVisible"
      width="800px"
      append-to-body
      @close="handleChartDialogClose"
    >
      <div class="chart-detail-content">
        <div v-for="(detail, index) in chartDetailData" :key="index" class="chart-detail-group">
          <h4>{{ detail.name }}</h4>
          <el-table
            :data="detail.countries"
            style="width: 100%"
          >
            <el-table-column
              prop="country"
              label="国家/地区"
              width="200"
            >
              <template slot-scope="scope">
                {{ getCountryName(scope.row.country) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="userCount"
              label="用户数"
              width="150"
              align="right"
            />
            <el-table-column
              prop="percentage"
              label="占比"
              align="right"
            >
              <template slot-scope="scope">
                {{ scope.row.percentage }}%
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="chartDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import PieChart from './components/PieChart.vue';
import LineChart from './components/LineChart.vue';
import {
  getOverview,
  getUserCountryDistribution,
  getChartData,
  getChartDetail
} from '@/api/statistics/userStatistics';
import { getDicts } from '@/api/system/dict/data';

export default {
  name: 'UserStatistics',
  components: {
    PieChart,
    LineChart
  },
  data() {
    return {
      // 顶部卡片数据（不受筛选影响）
      totalUsers: 0,
      monthUsers: 0,
      yesterdayUsers: 0,

      // 图表数据（受筛选影响）
      memberData: [],
      paidData: [],
      countryData: [],
      brandData: [],
      platformData: [],
      growthData: [],

      // 顶部卡片详情弹窗
      topCardDialogVisible: false,
      topCardDialogTitle: '',
      topCardDetailData: [],
      currentTopCardType: '',

      // 图表详情弹窗
      chartDialogVisible: false,
      chartDialogTitle: '',
      chartDetailData: [],

      // 国家字典
      countryOptions: [],

      // 筛选条件
      dateRangeType: 'month', // 默认本月至今
      dateRange: [],
      tempDateRange: [],
      dateOptions: [
        { value: 'month', label: '本月至今' },
        { value: 'today', label: '今日' },
        { value: 'last7days', label: '近7天' },
        { value: 'last30days', label: '近30天' },
        { value: 'custom', label: '自定义区间' }
      ],
      selectedCountries: [] // 空数组表示全部
    };
  },
  computed: {
    userCountLabel() {
      if (this.currentTopCardType === 'total') {
        return '累计用户数';
      } else if (this.currentTopCardType === 'month') {
        return '本月用户数';
      } else if (this.currentTopCardType === 'yesterday') {
        return '昨日新增用户数';
      }
      return '用户数';
    }
  },
  created() {
    this.loadData();
    this.loadCountryDict();
  },
  computed: {
    // 计算当前日期范围
    computedDateRange() {
      const today = new Date();
      const todayStr = this.formatDate(today);

      switch (this.dateRangeType) {
        case 'today':
          return [todayStr, todayStr];
        case 'last7days': {
          const start = new Date(today);
          start.setDate(start.getDate() - 6);
          return [this.formatDate(start), todayStr];
        }
        case 'last30days': {
          const start = new Date(today);
          start.setDate(start.getDate() - 29);
          return [this.formatDate(start), todayStr];
        }
        case 'month': {
          const start = new Date(today.getFullYear(), today.getMonth(), 1);
          return [this.formatDate(start), todayStr];
        }
        case 'custom':
          return this.dateRange;
        default:
          return [];
      }
    }
  },
  methods: {
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    // 处理日期范围类型变化
    handleDateRangeTypeChange(type) {
      this.dateRangeType = type;
      if (type !== 'custom') {
        this.tempDateRange = [];
        this.handleFilterChange();
      }
    },

    // 应用自定义日期范围
    applyCustomDateRange() {
      if (this.tempDateRange && this.tempDateRange.length === 2) {
        this.dateRange = this.tempDateRange;
        this.handleFilterChange();
      }
    },

    // 处理筛选条件变化
    handleFilterChange() {
      this.loadChartData();
    },

    // 构建筛选参数
    buildFilterParams() {
      const params = {};

      // 日期范围
      const range = this.computedDateRange;
      if (range && range.length === 2) {
        params.startDate = range[0];
        params.endDate = range[1];
      }

      // 国家筛选
      if (this.selectedCountries.length > 0) {
        params.countries = this.selectedCountries;
      }

      return params;
    },

    async loadData() {
      try {
        // 加载顶部卡片数据（不受筛选影响）
        const overviewRes = await getOverview();
        const overviewData = overviewRes.data || {};

        this.totalUsers = overviewData.totalUsers || 0;
        this.monthUsers = overviewData.monthUsers || 0;
        this.yesterdayUsers = overviewData.yesterdayUsers || 0;

        // 加载图表数据（受筛选影响）
        this.loadChartData();
      } catch (error) {
        console.error('加载数据失败:', error);
        this.$message.error('加载数据失败');
      }
    },

    async loadChartData() {
      try {
        // 构建筛选参数
        const filterParams = this.buildFilterParams();

        const chartRes = await getChartData(filterParams);
        const chartData = chartRes.data || {};

        this.memberData = chartData.memberData || [];
        this.paidData = chartData.paidData || [];
        this.countryData = chartData.countryData || [];
        this.brandData = chartData.brandData || [];
        this.platformData = chartData.platformData || [];
        this.growthData = chartData.trendData || [];
      } catch (error) {
        console.error('加载图表数据失败:', error);
        this.$message.error('加载图表数据失败');
      }
    },

    async loadCountryDict() {
      try {
        const res = await getDicts('sys_country');
        this.countryOptions = res.data || [];
      } catch (error) {
        console.error('加载国家字典失败:', error);
      }
    },

    getCountryName(countryCode) {
      if (!countryCode || countryCode === 'unknown') {
        return '未知';
      }
      const country = this.countryOptions.find(item => item.dictValue === countryCode);
      return country ? country.dictLabel : countryCode;
    },

    async handleTopCardClick(type) {
      try {
        this.currentTopCardType = type;
        const res = await getUserCountryDistribution(type);
        this.topCardDetailData = res.data || [];

        // 设置弹窗标题
        if (type === 'total') {
          this.topCardDialogTitle = '累计用户数 - 国家分布';
        } else if (type === 'month') {
          this.topCardDialogTitle = '本月用户数 - 国家分布';
        } else if (type === 'yesterday') {
          this.topCardDialogTitle = '昨日新增用户数 - 国家分布';
        }

        this.topCardDialogVisible = true;
      } catch (error) {
        console.error('加载国家分布数据失败:', error);
        this.$message.error('加载国家分布数据失败');
      }
    },

    async handleChartCardClick(chartType) {
      try {
        let title = '';

        if (chartType === 'member') {
          title = '会员订阅用户占比 - 国家对比';
        } else if (chartType === 'paid') {
          title = '付费用户占比 - 国家分布';
        }

        // 调用后端接口获取详情
        const res = await getChartDetail(chartType);
        const detailList = res.data || [];

        // 转换数据格式
        const detailData = detailList.map(item => ({
          name: item.typeName,
          countries: item.countryList || []
        }));

        this.chartDialogTitle = title;
        this.chartDetailData = detailData;
        this.chartDialogVisible = true;
      } catch (error) {
        console.error('加载图表详情失败:', error);
        this.$message.error('加载图表详情失败');
      }
    },

    handleTopCardDialogClose() {
      this.topCardDetailData = [];
      this.currentTopCardType = '';
    },

    handleChartDialogClose() {
      this.chartDetailData = [];
    }
  }
};
</script>

<style lang="scss" scoped>
.user-statistics-container {
  padding: 24px;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
  min-height: calc(100vh - 84px);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 200px;
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.03) 0%, rgba(103, 194, 58, 0.03) 100%);
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

/* 筛选条件面板 */
.filter-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  margin-bottom: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06);
  }
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  width: 100%;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group--right {
  margin-left: auto;
}

.filter-group__label {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

.filter-select {
  width: 160px;
}

.date-quick-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.date-chip {
  padding: 8px 18px;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  background: #ffffff;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;

  &:hover {
    border-color: #409eff;
    color: #409eff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  }
}

.date-chip--active {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border-color: #409eff;
  color: #fff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  transform: translateY(-2px);
}

.custom-date-range {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-left: 8px;

  .apply-btn {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    }
  }
}

.date-picker {
  width: 280px;
}

.stat-cards-top {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #409eff, #66b1ff);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);
    border-color: rgba(64, 158, 255, 0.3);

    &::before {
      opacity: 1;
    }
  }
}

.stat-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stat-card__title {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.stat-card__content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}

.stat-card__number {
  font-size: 36px;
  font-weight: 700;
  color: #1e293b;
  text-align: right;
  letter-spacing: -0.5px;
}

.stat-cards-middle {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.stat-card-large {
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #409eff, #66b1ff);
    opacity: 0;
    transition: opacity 0.3s;
  }
}

.stat-card-large--clickable {
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);
    border-color: rgba(64, 158, 255, 0.3);

    &::before {
      opacity: 1;
    }
  }
}

.stat-card-large--no-click {
  cursor: default;

  &:hover {
    transform: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
    border-color: rgba(255, 255, 255, 0.8);

    &::before {
      opacity: 0;
    }
  }
}

.stat-card-large__header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-card-large--clickable .stat-card-large__header {
  cursor: pointer;
}

.stat-card-large__title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.3px;
}

.stat-card-large__content {
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.stat-card-full {
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #409eff, #66b1ff);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);
    border-color: rgba(64, 158, 255, 0.3);

    &::before {
      opacity: 1;
    }
  }
}

.stat-card-full--no-hover {
  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
    border-color: rgba(255, 255, 255, 0.8);

    &::before {
      opacity: 0;
    }
  }
}

.stat-card-full__header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-card-full__title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.3px;
}

.stat-card-full__content {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.no-data {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  font-weight: 500;
}

.detail-content {
  ::v-deep .el-table {
    th {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
      color: #475569 !important;
      font-weight: 600 !important;
      font-size: 13px !important;
      padding: 12px 0 !important;
      border: none;
    }

    td {
      padding: 10px 0 !important;
      border: none;
    }

    tr {
      transition: all 0.2s;

      &:hover {
        background: linear-gradient(135deg, rgba(64, 158, 255, 0.03) 0%, rgba(64, 158, 255, 0.01) 100%) !important;
      }
    }

    .el-table__body-wrapper {
      overflow-x: hidden !important;
    }
  }
}

.chart-detail-content {
  max-height: 600px;
  overflow-y: auto;

  h4 {
    margin-bottom: 12px;
    color: #1e293b;
    font-size: 15px;
    font-weight: 700;
    padding-left: 12px;
    border-left: 3px solid #409eff;
    letter-spacing: -0.3px;
  }
}

.chart-detail-group {
  margin-bottom: 30px;

  &:last-child {
    margin-bottom: 0;
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
}
</style>
