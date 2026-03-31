<template>
  <div class="income-dashboard">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <svg class="header-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 13v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
          </svg>
          <h1>收入统计分析</h1>
        </div>
        <div class="header-actions">
          <el-button 
            class="refresh-btn" 
            icon="el-icon-refresh" 
            circle 
            @click="refreshAllDataWithLoading"
          />
        </div>
      </div>
    </div>

    <!-- 顶部核心指标卡片 -->
    <div class="kpi-section">
      <div class="kpi-grid">
        <div 
          v-for="(card, index) in indicatorCards" 
          :key="card.type"
          class="kpi-card"
          :class="[`kpi-card--${card.type}`, { 'kpi-card--loading': card.loading }]"
          @click="handleCardClick(card)"
        >
          <div class="kpi-card__icon">
            <svg v-if="card.type === 'yesterday'" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z" fill="currentColor"/>
            </svg>
            <svg v-else-if="card.type === 'month'" viewBox="0 0 24 24" fill="none">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z" fill="currentColor"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none">
              <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" fill="currentColor"/>
            </svg>
          </div>
          <div class="kpi-card__content">
            <span class="kpi-card__label">{{ card.label }}</span>
            <div class="kpi-card__value">
              <template v-if="card.loading">
                <span class="loading-placeholder"></span>
              </template>
              <template v-else>
                {{ formatAmount(card.value, globalCurrencyConfig.targetCurrency) }}
              </template>
            </div>
          </div>
          <div class="kpi-card__trend" v-if="!card.loading">
            <svg class="trend-icon" viewBox="0 0 24 24" fill="none">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选控制面板 -->
    <div class="filter-panel">
      <div class="filter-panel__section">
        <div class="filter-group">
          <span class="filter-group__label">
            <svg class="filter-icon" viewBox="0 0 24 24" fill="none">
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor"/>
            </svg>
            币种设置
          </span>
          <el-button 
            class="config-btn" 
            size="small" 
            @click="openCurrencyConfigDialog"
          >
            <span>{{ globalCurrencyConfig.targetCurrency }}</span>
            <i class="el-icon-setting"></i>
          </el-button>
        </div>
        
        <div class="filter-group">
          <span class="filter-group__label">
            <svg class="filter-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
            </svg>
            国家筛选
          </span>
          <el-select
            v-model="selectedCountries"
            multiple
            collapse-tags
            placeholder="全部国家"
            size="small"
            class="country-select"
            @change="handleCountryChange"
          >
            <el-option
              v-for="country in countryList"
              :key="country"
              :label="country"
              :value="country"
            />
          </el-select>
        </div>
      </div>
      
      <div class="filter-panel__section filter-panel__section--date">
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
          <el-button type="primary" size="small" class="apply-btn" @click="applyCustomDateRange">应用</el-button>
        </div>
        <div class="current-range-display" v-if="dateRange[0] && dateRange[1]">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" fill="currentColor"/>
          </svg>
          <span>{{ dateRange[0] }} ~ {{ dateRange[1] }}</span>
        </div>
      </div>
    </div>

    <!-- 汇率配置弹窗 -->
    <el-dialog
      title="汇率配置"
      :visible.sync="currencyConfigDialog.visible"
      width="600px"
      append-to-body
      custom-class="currency-dialog"
    >
      <div class="currency-config-content">
        <div class="currency-selector-row">
          <span class="currency-label">目标货币</span>
          <el-radio-group v-model="currencyConfigDialog.targetCurrency" size="small" @change="handleDialogCurrencyChange">
            <el-radio-button label="CNY">
              <span class="currency-option">
                <span class="currency-symbol">¥</span> CNY
              </span>
            </el-radio-button>
            <el-radio-button label="USD">
              <span class="currency-option">
                <span class="currency-symbol">$</span> USD
              </span>
            </el-radio-button>
            <el-radio-button label="ORIGINAL">原始货币</el-radio-button>
          </el-radio-group>
          <div class="currency-hint">所有收入金额将统一换算为目标货币显示</div>
        </div>
        <div v-if="currencyConfigDialog.targetCurrency !== 'ORIGINAL'" class="exchange-rates-config">
          <div class="rates-title">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12.89 11.1c-1.78-.59-2.64-1.23-2.64-2.16 0-1.09.93-1.85 2.64-1.85 1.18 0 1.68.45 1.99 1.4l1.48-.59c-.46-1.43-1.53-2.13-2.61-2.37V4h-2v1.5c-1.56.28-2.82 1.21-2.82 2.84 0 1.8 1.49 2.74 3.55 3.24 1.86.45 2.23 1.1 2.23 1.88 0 .54-.38 1.43-2.02 1.43-1.4 0-2.05-.55-2.27-1.51l-1.53.46c.34 1.42 1.37 2.33 2.86 2.62V18h2v-1.5c1.61-.27 2.82-1.13 2.82-2.95 0-2.29-1.91-3.11-3.68-3.45zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
            </svg>
            汇率配置
          </div>
          <div class="rates-hint">配置各货币兑换为 {{ currencyConfigDialog.targetCurrency }} 的汇率。例如：1 USD = 7.2 CNY，则 USD 填 7.2</div>
          <div class="rates-list">
            <div v-for="currency in globalCurrencyConfig.currencyList" :key="currency" class="rate-item" v-if="currency !== currencyConfigDialog.targetCurrency">
              <span class="rate-label">1 {{ currency }} =</span>
              <el-input-number
                v-model="currencyConfigDialog.exchangeRates[currency]"
                :precision="4"
                :step="0.0001"
                :min="0"
                size="small"
                controls-position="right"
              />
              <span class="rate-unit">{{ currencyConfigDialog.targetCurrency }}</span>
              <span class="rate-reference" v-if="!currencyConfigDialog.referenceLoading && currencyConfigDialog.referenceRates[currency]">
                (参考: {{ currencyConfigDialog.referenceRates[currency].toFixed(4) }})
              </span>
              <span class="rate-reference rate-reference--loading" v-else-if="currencyConfigDialog.referenceLoading">
                <i class="el-icon-loading"></i>
              </span>
            </div>
          </div>
          <div class="rates-footer">
            <div class="rates-date" v-if="currencyConfigDialog.referenceDate && !currencyConfigDialog.referenceLoading">
              <i class="el-icon-time"></i> 参考汇率更新日期: {{ currencyConfigDialog.referenceDate }}
            </div>
            <div class="rates-error" v-if="currencyConfigDialog.referenceError">
              <i class="el-icon-warning"></i> 获取参考汇率失败，请手动输入
            </div>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="currencyConfigDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="applyCurrencyConfig">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
          </svg>
          确认应用
        </el-button>
      </div>
    </el-dialog>

    <!-- 核心趋势与分布图表区 -->
    <div class="charts-section">
      <!-- 第一行图表 -->
      <div class="chart-grid chart-grid--2col">
        <div 
          v-for="chart in charts.slice(0, 2)" 
          :key="chart.id"
          class="chart-card"
          :class="{ 'chart-card--clickable': chart.clickable }"
          @click="chart.clickable && handleChartClick(chart, $event)"
        >
          <div class="chart-card__header" @click.stop>
            <h3 class="chart-card__title">{{ chart.title }}</h3>
            <div class="chart-card__controls" v-if="chart.periodSwitch" @click.stop>
              <button 
                class="period-btn" 
                :class="{ 'period-btn--active': chart.periodType === 'day' }"
                @click.stop="chart.periodType = 'day'; handlePeriodTypeChange(chart)"
              >日</button>
              <button 
                class="period-btn" 
                :class="{ 'period-btn--active': chart.periodType === 'month' }"
                @click.stop="chart.periodType = 'month'; handlePeriodTypeChange(chart)"
              >月</button>
            </div>
          </div>
          <div class="chart-card__body">
            <component
              :is="chart.component"
              :chart-data="chart.data"
              :period-type="chart.periodType"
              :currency-code="globalCurrencyConfig.targetCurrency"
              height="280px"
            />
          </div>
        </div>
      </div>

      <!-- 第二行图表 -->
      <div class="chart-grid chart-grid--2col">
        <div 
          v-for="chart in charts.slice(2, 4)" 
          :key="chart.id"
          class="chart-card"
          :class="{ 'chart-card--clickable': chart.clickable }"
          @click="chart.clickable && handleChartClick(chart, $event)"
        >
          <div class="chart-card__header" @click.stop>
            <h3 class="chart-card__title">{{ chart.title }}</h3>
            <div class="chart-card__controls" v-if="chart.periodSwitch" @click.stop>
              <button 
                class="period-btn" 
                :class="{ 'period-btn--active': chart.periodType === 'day' }"
                @click.stop="chart.periodType = 'day'; handlePeriodTypeChange(chart)"
              >日</button>
              <button 
                class="period-btn" 
                :class="{ 'period-btn--active': chart.periodType === 'month' }"
                @click.stop="chart.periodType = 'month'; handlePeriodTypeChange(chart)"
              >月</button>
            </div>
          </div>
          <div class="chart-card__body">
            <component
              :is="chart.component"
              :chart-data="chart.data"
              :period-type="chart.periodType"
              :currency-code="globalCurrencyConfig.targetCurrency"
              height="280px"
            />
          </div>
        </div>
      </div>

      <!-- 第三行图表 -->
      <div class="chart-grid chart-grid--2col">
        <div 
          v-for="chart in charts.slice(4, 6)" 
          :key="chart.id"
          class="chart-card"
          :class="{ 'chart-card--clickable': chart.clickable }"
          @click="chart.clickable && handleChartClick(chart, $event)"
        >
          <div class="chart-card__header" @click.stop>
            <h3 class="chart-card__title">{{ chart.title }}</h3>
            <div class="chart-card__controls" v-if="chart.periodSwitch" @click.stop>
              <button 
                class="period-btn" 
                :class="{ 'period-btn--active': chart.periodType === 'day' }"
                @click.stop="chart.periodType = 'day'; handlePeriodTypeChange(chart)"
              >日</button>
              <button 
                class="period-btn" 
                :class="{ 'period-btn--active': chart.periodType === 'month' }"
                @click.stop="chart.periodType = 'month'; handlePeriodTypeChange(chart)"
              >月</button>
            </div>
          </div>
          <div class="chart-card__body">
            <component
              :is="chart.component"
              :chart-data="chart.data"
              :period-type="chart.periodType"
              :currency-code="globalCurrencyConfig.targetCurrency"
              height="280px"
            />
          </div>
        </div>
      </div>

      <!-- 会员等级收入分布 - 单独一行 -->
      <div class="chart-grid chart-grid--fullwidth">
        <div class="chart-card">
          <div class="chart-card__header" @click.stop>
            <h3 class="chart-card__title">{{ memberLevelChart.title }}</h3>
            <div class="chart-card__controls" v-if="memberLevelChart.periodSwitch" @click.stop>
              <button 
                class="period-btn" 
                :class="{ 'period-btn--active': memberLevelChart.periodType === 'day' }"
                @click.stop="memberLevelChart.periodType = 'day'; handlePeriodTypeChange(memberLevelChart)"
              >日</button>
              <button 
                class="period-btn" 
                :class="{ 'period-btn--active': memberLevelChart.periodType === 'month' }"
                @click.stop="memberLevelChart.periodType = 'month'; handlePeriodTypeChange(memberLevelChart)"
              >月</button>
            </div>
          </div>
          <div class="chart-card__body">
            <component
              :is="memberLevelChart.component"
              :chart-data="memberLevelChart.data"
              :period-type="memberLevelChart.periodType"
              :currency-code="globalCurrencyConfig.targetCurrency"
              height="400px"
            />
          </div>
        </div>
      </div>

      <!-- 收入明细表格 - 单独一行 -->
      <div class="chart-grid chart-grid--fullwidth">
        <div class="data-table-card">
          <div class="data-table-card__header">
            <h3 class="data-table-card__title">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor"/>
              </svg>
              收入明细
            </h3>
            <button 
              class="export-btn"
              @click="handleExportIncomeDetail"
              :disabled="exportLoading"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
              </svg>
              {{ exportLoading ? '导出中...' : '导出' }}
            </button>
          </div>
          <div class="data-table-card__body">
            <el-table
              :data="incomeDetailList"
              v-loading="incomeDetailLoading"
              stripe
              style="width: 100%"
              :default-sort="{prop: 'date', order: 'descending'}"
              :max-height="500"
              class="income-table"
            >
              <el-table-column prop="date" label="日期" min-width="100" align="center" sortable />
              <el-table-column prop="country" label="国家" min-width="80" align="center">
                <template slot-scope="scope">
                  <span class="country-tag">{{ scope.row.country }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="incomeType" label="收入类型" min-width="100" align="center">
                <template slot-scope="scope">
                  <span class="type-badge" :class="scope.row.incomeType === '会员订阅' ? 'type-badge--primary' : 'type-badge--success'">
                    {{ scope.row.incomeType }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="orderCount" label="订单数" min-width="80" align="right" sortable />
              <el-table-column prop="paidUserCount" label="付费用户" min-width="90" align="right" sortable />
              <el-table-column prop="avgOrderPrice" label="客单价" min-width="100" align="right" sortable>
                <template slot-scope="scope">
                  <span class="amount-cell">{{ formatAmount(scope.row.avgOrderPrice, globalCurrencyConfig.targetCurrency) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="totalIncome" label="总收入" min-width="100" align="right" sortable>
                <template slot-scope="scope">
                  <span class="amount-cell amount-cell--primary">{{ formatAmount(scope.row.totalIncome, globalCurrencyConfig.targetCurrency) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="renewalAmount" label="续费/复购" min-width="100" align="right" sortable>
                <template slot-scope="scope">
                  <span class="amount-cell">{{ formatAmount(scope.row.renewalAmount, globalCurrencyConfig.targetCurrency) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="refundAmount" label="退款" min-width="90" align="right" sortable>
                <template slot-scope="scope">
                  <span class="amount-cell amount-cell--danger">{{ formatAmount(scope.row.refundAmount, globalCurrencyConfig.targetCurrency) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="netIncome" label="净收入" min-width="100" align="right" sortable>
                <template slot-scope="scope">
                  <span class="amount-cell amount-cell--success">{{ formatAmount(scope.row.netIncome, globalCurrencyConfig.targetCurrency) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表详情对话框 -->
    <el-dialog
      :title="chartDialogData.title"
      :visible.sync="chartDialogData.visible"
      :width="chartDialogData.chartId === 'totalIncomeTrend' && chartDialogData.chartType === 'line' ? '1600px' : '1400px'"
      append-to-body
      custom-class="chart-detail-dialog"
    >
      <div v-if="chartDialogData.chartId === 'payingUsers'" v-loading="chartDialogData.loading" class="dialog-chart-container">
        <div ref="payingUsersChartDialog" class="dialog-chart"></div>
      </div>
      <div v-else-if="chartDialogData.chartId === 'subscriptionDistribution' && chartDialogData.chartType === 'pie'" v-loading="chartDialogData.loading">
        <div class="dialog-chart-grid dialog-chart-grid--2col">
          <div class="dialog-chart-item">
            <h4 class="dialog-chart-label">专业版收入分布</h4>
            <div ref="subscriptionProfessionalChart" class="dialog-chart dialog-chart--pie"></div>
          </div>
          <div class="dialog-chart-item">
            <h4 class="dialog-chart-label">大师版收入分布</h4>
            <div ref="subscriptionMasterChart" class="dialog-chart dialog-chart--pie"></div>
          </div>
        </div>
      </div>
      <div v-else-if="chartDialogData.chartId === 'supplementDistribution' && chartDialogData.chartType === 'pie'" v-loading="chartDialogData.loading">
        <div class="dialog-chart-grid dialog-chart-grid--2x2">
          <div class="dialog-chart-item">
            <h4 class="dialog-chart-label">120分钟补充包</h4>
            <div ref="supplement120Chart" class="dialog-chart dialog-chart--sm"></div>
          </div>
          <div class="dialog-chart-item">
            <h4 class="dialog-chart-label">600分钟补充包</h4>
            <div ref="supplement600Chart" class="dialog-chart dialog-chart--sm"></div>
          </div>
          <div class="dialog-chart-item">
            <h4 class="dialog-chart-label">3000分钟补充包</h4>
            <div ref="supplement3000Chart" class="dialog-chart dialog-chart--sm"></div>
          </div>
          <div class="dialog-chart-item">
            <h4 class="dialog-chart-label">6000分钟补充包</h4>
            <div ref="supplement6000Chart" class="dialog-chart dialog-chart--sm"></div>
          </div>
        </div>
      </div>
      <div v-else-if="chartDialogData.chartId === 'totalIncomeTrend' && chartDialogData.chartType === 'line'" v-loading="chartDialogData.loading">
        <div class="dialog-chart-grid dialog-chart-grid--3col">
          <div class="dialog-chart-item">
            <h4 class="dialog-chart-label">合计收入趋势</h4>
            <div ref="totalIncomeTrendTotalChart" class="dialog-chart dialog-chart--trend"></div>
          </div>
          <div class="dialog-chart-item">
            <h4 class="dialog-chart-label">会员订阅收入趋势</h4>
            <div ref="totalIncomeTrendSubscriptionChart" class="dialog-chart dialog-chart--trend"></div>
          </div>
          <div class="dialog-chart-item">
            <h4 class="dialog-chart-label">补充包收入趋势</h4>
            <div ref="totalIncomeTrendSupplementChart" class="dialog-chart dialog-chart--trend"></div>
          </div>
        </div>
      </div>
      <el-table
        v-else
        :data="chartDialogData.tableData"
        v-loading="chartDialogData.loading"
        stripe
        class="dialog-table"
      >
        <el-table-column
          v-for="column in chartDialogData.columns"
          :key="column.prop"
          :label="column.label"
          :prop="column.prop"
          align="center"
        >
          <template v-if="column.prop === 'amount'" slot-scope="scope">
            <span class="amount-cell amount-cell--primary">{{ formatAmount(scope.row[column.prop], globalCurrencyConfig.targetCurrency) }}</span>
          </template>
          <template v-else>
            {{ scope.row[column.prop] }}
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="chartDialogData.visible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 收入明细对话框 -->
    <el-dialog
      :title="dialogData.title"
      :visible.sync="dialogData.visible"
      width="800px"
      append-to-body
      custom-class="income-detail-dialog"
    >
      <el-table
        :data="dialogData.tableData"
        v-loading="dialogData.loading"
        stripe
        class="dialog-table"
      >
        <el-table-column label="排名" prop="rank" width="80" align="center">
          <template slot-scope="scope">
            <span class="rank-badge" :class="{ 'rank-badge--top': scope.row.rank <= 3 }">
              {{ scope.row.rank }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="国家" prop="country" align="center">
          <template slot-scope="scope">
            <span class="country-tag">{{ scope.row.country }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="dialogData.incomeLabel" prop="income" align="right">
          <template slot-scope="scope">
            <span class="amount-cell amount-cell--primary">{{ formatAmount(scope.row.income, globalCurrencyConfig.targetCurrency) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="占比" prop="proportion" align="center" width="120">
          <template slot-scope="scope">
            <div class="proportion-cell">
              <div class="proportion-bar">
                <div class="proportion-bar__fill" :style="{ width: scope.row.proportion + '%' }"></div>
              </div>
              <span class="proportion-value">{{ scope.row.proportion }}%</span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleCloseDialog">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getYesterdayIncome,
  getMonthIncome,
  getTotalIncome,
  getIncomeByCountry,
  getAllCurrencies,
  getIncomeByCountryWithRates,
  getIncomeComposition,
  getPayingUserCountByDate,
  getPayingUserCountByCountry,
  getPayingUserCountByDateAndCountry,
  getSubscriptionIncomeDistribution,
  getSubscriptionIncomeDistributionByCountry,
  getSupplementPackageIncomeDistribution,
  getSupplementPackageIncomeDistributionByCountry,
  getTotalIncomeTrend,
  getTotalIncomeTrendByCountry,
  getNewOldUserIncomeContribution,
  getMemberLevelIncomeDistribution,
  getIncomeDetailList,
  exportIncomeDetailList,
  getAllCountries
} from "@/api/statistics/income";
import IncomeCompositionChart from './components/IncomeCompositionChart.vue'
import PayingUserCountChart from './components/PayingUserCountChart.vue'
import SubscriptionDistributionChart from './components/SubscriptionDistributionChart.vue'
import SupplementDistributionChart from './components/SupplementDistributionChart.vue'
import TotalIncomeTrendChart from './components/TotalIncomeTrendChart.vue'
import NewOldUserContributionChart from './components/NewOldUserContributionChart.vue'
import MemberLevelDistributionChart from './components/MemberLevelDistributionChart.vue'
import * as echarts from 'echarts'

export default {
  name: "Income",
  components: {
    IncomeCompositionChart,
    PayingUserCountChart,
    SubscriptionDistributionChart,
    SupplementDistributionChart,
    TotalIncomeTrendChart,
    NewOldUserContributionChart,
    MemberLevelDistributionChart
  },
  data() {
    // 格式化日期函数
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // 初始化日期范围（本月至今）
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    return {
      // 日期快捷选项
      dateOptions: [
        { value: 'monthToDate', label: '本月至今' },
        { value: 'today', label: '今日' },
        { value: 'last7Days', label: '近7天' },
        { value: 'last30Days', label: '近30天' },
        { value: 'custom', label: '自定义' }
      ],
      // 日期范围类型：monthToDate, today, last7Days, last30Days, custom
      dateRangeType: 'monthToDate',
      // 日期范围（实际应用的）
      dateRange: [formatDate(monthStart), formatDate(today)],
      // 临时日期范围（用于自定义选择）
      tempDateRange: [formatDate(monthStart), formatDate(today)],
      // 国家筛选
      countryList: [], // 所有可选国家
      selectedCountries: [], // 已选中的国家（空数组表示全部）
      // 全局汇率配置（实际应用的）
      globalCurrencyConfig: {
        targetCurrency: 'CNY',
        currencyList: [],
        exchangeRates: {},
        ratesByTarget: {}  // 按目标货币分别存储的汇率配置缓存
      },
      // 汇率配置弹窗数据（临时编辑）
      currencyConfigDialog: {
        visible: false,
        targetCurrency: 'CNY',
        exchangeRates: {},
        referenceRates: {},      // 参考汇率数据
        referenceLoading: false, // 加载状态
        referenceError: false,   // 错误状态
        referenceDate: ''        // 汇率更新日期
      },
      // 指标卡片数据
      indicatorCards: [
        {
          type: 'yesterday',
          label: '昨日总收入',
          value: 0,
          loading: true
        },
        {
          type: 'month',
          label: '当月累计收入',
          value: 0,
          loading: true
        },
        {
          type: 'total',
          label: '总收入',
          value: 0,
          loading: true
        }
      ],
      // 对话框数据
      dialogData: {
        visible: false,
        title: '',
        type: '',
        loading: false,
        tableData: [],
        incomeLabel: '昨日总收入'
      },
      // 图表数据
      charts: [
        {
          id: 'composition',
          title: '收入构成比',
          component: 'IncomeCompositionChart',
          data: [],
          clickable: false,
          periodSwitch: false
        },
        {
          id: 'payingUsers',
          title: '付费用户数',
          component: 'PayingUserCountChart',
          data: [],
          clickable: true,
          periodSwitch: true,
          periodType: 'day'
        },
        {
          id: 'subscriptionDistribution',
          title: '会员订阅收入分布',
          component: 'SubscriptionDistributionChart',
          data: [],
          clickable: true,
          periodSwitch: false
        },
        {
          id: 'supplementDistribution',
          title: '转写补充包收入分布',
          component: 'SupplementDistributionChart',
          data: [],
          clickable: true,
          periodSwitch: false
        },
        {
          id: 'totalIncomeTrend',
          title: '总收入趋势图',
          component: 'TotalIncomeTrendChart',
          data: [],
          clickable: true,
          periodSwitch: false
        },
        {
          id: 'newOldUserContribution',
          title: '新老付费用户收入贡献',
          component: 'NewOldUserContributionChart',
          data: [],
          clickable: false,
          periodSwitch: false
        },
        {
          id: 'memberLevelDistribution',
          title: '会员等级收入分布',
          component: 'MemberLevelDistributionChart',
          data: [],
          clickable: false,
          periodSwitch: true,
          periodType: 'day'
        }
      ],
      // 图表详情对话框数据
      chartDialogData: {
        visible: false,
        title: '',
        chartId: '',
        loading: false,
        tableData: [],
        columns: [],
        chartType: null, // 'groupedBar' 或 'pie'
        chartData: null
      },
      // 付费用户数弹窗图表实例
      payingUsersChartDialogInstance: null,
      // 会员订阅收入分布饼状图实例
      subscriptionDistributionChartInstances: {
        professional: null,
        master: null
      },
      // 转写补充包收入分布饼状图实例
      supplementDistributionChartInstances: {
        minutes120: null,
        minutes600: null,
        minutes3000: null,
        minutes6000: null
      },
      // 总收入趋势图折线图实例
      totalIncomeTrendChartInstances: {
        total: null,
        subscription: null,
        supplement: null
      },
      // 收入明细列表
      incomeDetailList: [],
      incomeDetailLoading: false,
      exportLoading: false
    };
  },
  computed: {
    // 会员等级收入分布图表
    memberLevelChart() {
      return this.charts.find(c => c.id === 'memberLevelDistribution') || this.charts[6]
    }
  },
  async created() {
    // 先加载货币列表和国家列表
    await Promise.all([
      this.loadCurrencyList(),
      this.loadCountryList()
    ]);
    // 配置加载完成后再加载数据
    this.fetchIndicatorData();
    this.fetchChartData();
    this.fetchIncomeDetailList();
  },
  methods: {
    /** 获取指标数据 */
    async fetchIndicatorData() {
      try {
        const targetCurrency = this.globalCurrencyConfig.targetCurrency
        const exchangeRates = this.globalCurrencyConfig.targetCurrency === 'ORIGINAL' ? null : this.globalCurrencyConfig.exchangeRates
        const [yesterdayRes, monthRes, totalRes] = await Promise.all([
          getYesterdayIncome(targetCurrency, exchangeRates),
          getMonthIncome(targetCurrency, exchangeRates),
          getTotalIncome(targetCurrency, exchangeRates)
        ]);

        // 更新昨日总收入
        if (yesterdayRes.code === 200) {
          const card = this.indicatorCards.find(c => c.type === 'yesterday');
          if (card) {
            card.value = yesterdayRes.data || 0;
            card.loading = false;
          }
        }

        // 更新当月累计收入
        if (monthRes.code === 200) {
          const card = this.indicatorCards.find(c => c.type === 'month');
          if (card) {
            card.value = monthRes.data || 0;
            card.loading = false;
          }
        }

        // 更新总收入
        if (totalRes.code === 200) {
          const card = this.indicatorCards.find(c => c.type === 'total');
          if (card) {
            card.value = totalRes.data || 0;
            card.loading = false;
          }
        }
      } catch (error) {
        console.error("获取指标数据失败:", error);
        this.$message.error("获取统计数据失败，请稍后重试");
        // 设置所有卡片加载失败
        this.indicatorCards.forEach(card => {
          card.loading = false;
          card.value = 0;
        });
      }
    },

    /** 处理卡片点击事件 */
    async handleCardClick(card) {
      this.dialogData.type = card.type;
      this.dialogData.title = card.label;
      this.dialogData.visible = true;

      // 设置收入列标题
      const incomeLabelMap = {
        'yesterday': '昨日总收入',
        'month': '本月累计收入',
        'total': '总收入'
      };
      this.dialogData.incomeLabel = incomeLabelMap[card.type] || '收入';

      // 加载国家收入明细
      this.loadCountryData();
    },

    /** 加载货币列表 */
    async loadCurrencyList() {
      try {
        const response = await getAllCurrencies();
        if (response.code === 200) {
          // 统一转换为大写格式，保持与缓存一致
          const rawList = response.data || [];
          this.globalCurrencyConfig.currencyList = rawList.map(currency =>
            String(currency).toUpperCase()
          );
          console.log('加载货币列表（统一大写）:', this.globalCurrencyConfig.currencyList);

          // 从浏览器缓存读取汇率配置
          const hasCachedConfig = this.loadCurrencyConfigFromCache();

          // 如果缓存中没有配置，才初始化默认汇率配置
          if (!hasCachedConfig) {
            this.initGlobalExchangeRates();
          } else {
            // 如果有缓存配置，需要确保所有货币都有汇率配置（补充缺失的）
            this.completeExchangeRates();
          }
        } else {
          this.$message.error(response.msg || '获取货币列表失败');
          this.globalCurrencyConfig.currencyList = [];
        }
      } catch (error) {
        console.error("获取货币列表失败:", error);
        this.$message.error("获取货币列表失败，请稍后重试");
        this.globalCurrencyConfig.currencyList = [];
      }
    },

    /** 加载国家列表 */
    async loadCountryList() {
      try {
        const response = await getAllCountries();
        if (response.code === 200) {
          this.countryList = response.data || [];
        } else {
          this.countryList = [];
        }
      } catch (error) {
        console.error("获取国家列表失败:", error);
        this.countryList = [];
      }
    },

    /** 处理国家选择变化 */
    handleCountryChange() {
      this.refreshAllDataWithLoading();
    },

    /** 从浏览器缓存加载汇率配置 */
    loadCurrencyConfigFromCache() {
      try {
        const savedConfig = localStorage.getItem('income_statistics_currency_config');
        console.log('尝试从缓存加载配置，缓存内容:', savedConfig);

        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          console.log('解析后的配置:', config);

          // 创建货币列表的大小写映射（支持大小写不敏感匹配）
          const currencyMap = {};
          this.globalCurrencyConfig.currencyList.forEach(currency => {
            currencyMap[currency.toUpperCase()] = currency;
          });

          // 兼容新旧格式
          let targetCurrencyUpper = 'ORIGINAL';
          let ratesForTarget = {};

          if (config.ratesByTarget) {
            // 新格式：按目标货币分别存储
            targetCurrencyUpper = String(config.targetCurrency || 'ORIGINAL').toUpperCase();
            ratesForTarget = config.ratesByTarget[targetCurrencyUpper] || {};
            // 同时保存完整的 ratesByTarget 到全局配置，供切换时使用
            this.globalCurrencyConfig.ratesByTarget = config.ratesByTarget;
          } else if (config.targetCurrency !== undefined && config.targetCurrency !== null) {
            // 旧格式：单一汇率配置
            targetCurrencyUpper = String(config.targetCurrency).toUpperCase();
            ratesForTarget = config.exchangeRates || {};
            // 迁移旧格式到新结构
            this.globalCurrencyConfig.ratesByTarget = {};
            if (targetCurrencyUpper !== 'ORIGINAL') {
              this.globalCurrencyConfig.ratesByTarget[targetCurrencyUpper] = ratesForTarget;
            }
          } else {
            console.warn('缓存配置格式无效');
            return false;
          }

          // 检查目标货币是否在当前货币列表中（大小写不敏感）
          if (currencyMap[targetCurrencyUpper] || targetCurrencyUpper === 'ORIGINAL') {
            this.globalCurrencyConfig.targetCurrency = targetCurrencyUpper;

            // 只保留当前货币列表中存在的汇率配置
            const validRates = {};
            if (ratesForTarget && typeof ratesForTarget === 'object') {
              Object.keys(ratesForTarget).forEach(currencyKey => {
                const currencyUpper = currencyKey.toUpperCase();
                if (currencyMap[currencyUpper]) {
                  validRates[currencyUpper] = ratesForTarget[currencyKey];
                }
              });
            }
            this.globalCurrencyConfig.exchangeRates = validRates;
            console.log('已从缓存加载汇率配置:', {
              targetCurrency: this.globalCurrencyConfig.targetCurrency,
              exchangeRates: this.globalCurrencyConfig.exchangeRates
            });
            return true;
          } else {
            console.warn('缓存中的目标货币不在当前货币列表中:', targetCurrencyUpper);
          }
        } else {
          console.log('缓存中没有找到汇率配置');
        }
      } catch (error) {
        console.error('从缓存加载汇率配置失败:', error);
        try {
          localStorage.removeItem('income_statistics_currency_config');
          console.log('已清除损坏的缓存');
        } catch (e) {
          console.warn('清除损坏的缓存失败:', e);
        }
      }
      return false;
    },

    /** 补充缺失的汇率配置 */
    completeExchangeRates() {
      if (this.globalCurrencyConfig.targetCurrency === 'ORIGINAL') {
        this.globalCurrencyConfig.exchangeRates = {};
        return;
      }

      // 将已有的汇率配置转换为大写格式（支持大小写不敏感匹配）
      const rates = {};
      if (this.globalCurrencyConfig.exchangeRates && typeof this.globalCurrencyConfig.exchangeRates === 'object') {
        Object.keys(this.globalCurrencyConfig.exchangeRates).forEach(currencyKey => {
          const currencyUpper = currencyKey.toUpperCase();
          // 如果该货币在货币列表中，保留其汇率配置
          if (this.globalCurrencyConfig.currencyList.includes(currencyUpper)) {
            rates[currencyUpper] = this.globalCurrencyConfig.exchangeRates[currencyKey];
          }
        });
      }

      // 为所有货币设置汇率配置
      this.globalCurrencyConfig.currencyList.forEach(currency => {
        if (currency === this.globalCurrencyConfig.targetCurrency) {
          rates[currency] = 1;
        } else if (rates[currency] === undefined) {
          // 如果某个货币没有汇率配置，设置默认值
          if (currency === 'USD' && this.globalCurrencyConfig.targetCurrency === 'CNY') {
            rates[currency] = 7.2;
          } else if (currency === 'CNY' && this.globalCurrencyConfig.targetCurrency === 'USD') {
            rates[currency] = 1 / 7.2;
          } else {
            rates[currency] = 1;
          }
        }
      });
      this.globalCurrencyConfig.exchangeRates = rates;
      console.log('补充汇率配置后:', {
        targetCurrency: this.globalCurrencyConfig.targetCurrency,
        exchangeRates: this.globalCurrencyConfig.exchangeRates
      });
    },

    /** 加载国家收入明细 */
    async loadCountryData() {
      this.dialogData.loading = true;
      try {
        let response;
        if (this.globalCurrencyConfig.targetCurrency === 'ORIGINAL') {
          // 原始货币，使用旧接口
          response = await getIncomeByCountry(this.dialogData.type, 'ORIGINAL');
        } else {
          // 使用动态汇率接口
          response = await getIncomeByCountryWithRates(
            this.dialogData.type,
            this.globalCurrencyConfig.targetCurrency,
            this.globalCurrencyConfig.exchangeRates
          );
        }

        if (response.code === 200) {
          // 处理数据，添加排名和占比
          const data = response.data || [];
          const total = data.reduce((sum, item) => sum + (parseFloat(item.income) || 0), 0);

          this.dialogData.tableData = data.map((item, index) => {
            const income = parseFloat(item.income) || 0;
            const proportion = total > 0 ? ((income / total) * 100).toFixed(0) : 0;
            return {
              rank: index + 1,
              country: item.country || '-',
              income: income,
              proportion: proportion
            };
          });
        } else {
          this.$message.error(response.msg || '获取数据失败');
          this.dialogData.tableData = [];
        }
      } catch (error) {
        console.error("获取国家收入明细失败:", error);
        this.$message.error("获取数据失败，请稍后重试");
        this.dialogData.tableData = [];
      } finally {
        this.dialogData.loading = false;
      }
    },

    /** 打开汇率配置弹窗 */
    openCurrencyConfigDialog() {
      // 复制当前配置到弹窗
      this.currencyConfigDialog.targetCurrency = this.globalCurrencyConfig.targetCurrency;
      this.currencyConfigDialog.exchangeRates = JSON.parse(JSON.stringify(this.globalCurrencyConfig.exchangeRates));
      // 记录打开弹窗时的目标货币，用于切换时保存配置
      this._lastDialogTargetCurrency = this.globalCurrencyConfig.targetCurrency;
      console.log('打开弹窗，复制配置:', {
        targetCurrency: this.currencyConfigDialog.targetCurrency,
        exchangeRates: this.currencyConfigDialog.exchangeRates
      });
      // 初始化弹窗中的汇率配置（补充缺失的，保留已有的）
      this.initDialogExchangeRates();
      console.log('初始化后，弹窗配置:', {
        targetCurrency: this.currencyConfigDialog.targetCurrency,
        exchangeRates: this.currencyConfigDialog.exchangeRates
      });
      this.currencyConfigDialog.visible = true;

      // 获取参考汇率
      this.fetchReferenceRates();
    },

    /** 处理弹窗中货币切换 */
    handleDialogCurrencyChange() {
      const newTargetCurrency = this.currencyConfigDialog.targetCurrency;
      const oldTargetCurrency = this._lastDialogTargetCurrency || this.globalCurrencyConfig.targetCurrency;
      
      // 先保存当前（旧的）目标货币的汇率配置到 ratesByTarget
      if (oldTargetCurrency && oldTargetCurrency !== 'ORIGINAL' && oldTargetCurrency !== newTargetCurrency) {
        if (!this.globalCurrencyConfig.ratesByTarget) {
          this.globalCurrencyConfig.ratesByTarget = {};
        }
        // 保存旧目标货币的汇率配置
        const oldRates = {};
        Object.keys(this.currencyConfigDialog.exchangeRates).forEach(currency => {
          oldRates[currency] = this.currencyConfigDialog.exchangeRates[currency];
        });
        this.globalCurrencyConfig.ratesByTarget[oldTargetCurrency] = oldRates;
        console.log('保存旧目标货币的汇率配置:', oldTargetCurrency, oldRates);
      }
      
      // 记录当前弹窗的目标货币，用于下次切换时保存
      this._lastDialogTargetCurrency = newTargetCurrency;
      
      // 如果是 ORIGINAL，清空汇率配置
      if (newTargetCurrency === 'ORIGINAL') {
        this.currencyConfigDialog.exchangeRates = {};
        return;
      }

      // 尝试从缓存的 ratesByTarget 中获取该目标货币对应的汇率配置
      let cachedRates = null;
      if (this.globalCurrencyConfig.ratesByTarget && this.globalCurrencyConfig.ratesByTarget[newTargetCurrency]) {
        cachedRates = this.globalCurrencyConfig.ratesByTarget[newTargetCurrency];
        console.log('从缓存找到目标货币对应的汇率配置:', newTargetCurrency, cachedRates);
      }

      // 如果有缓存的汇率配置，使用缓存的；否则初始化默认值
      if (cachedRates) {
        // 使用缓存的汇率配置，但需要确保目标货币自身为1
        const rates = {};
        this.globalCurrencyConfig.currencyList.forEach(currency => {
          if (currency === newTargetCurrency) {
            rates[currency] = 1;
          } else if (cachedRates[currency] !== undefined) {
            rates[currency] = cachedRates[currency];
          } else {
            // 缓存中没有的货币，设置默认值
            rates[currency] = 1;
          }
        });
        this.currencyConfigDialog.exchangeRates = rates;
      } else {
        // 没有缓存，重新初始化
        this.initDialogExchangeRates();
      }

      // 重新获取参考汇率
      this.fetchReferenceRates();
    },

    /** 获取参考汇率 */
    async fetchReferenceRates() {
      const targetCurrency = this.currencyConfigDialog.targetCurrency;
      if (targetCurrency === 'ORIGINAL') {
        this.currencyConfigDialog.referenceRates = {};
        this.currencyConfigDialog.referenceDate = '';
        return;
      }

      this.currencyConfigDialog.referenceLoading = true;
      this.currencyConfigDialog.referenceError = false;

      const baseCurrency = targetCurrency.toLowerCase();
      const primaryUrl = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${baseCurrency}.json`;
      const fallbackUrl = `https://latest.currency-api.pages.dev/v1/currencies/${baseCurrency}.json`;

      try {
        let response = await fetch(primaryUrl);
        if (!response.ok) {
          response = await fetch(fallbackUrl);
        }
        if (!response.ok) {
          throw new Error('获取汇率失败');
        }

        const data = await response.json();
        const rates = data[baseCurrency] || {};

        // 转换为 "1 外币 = X 目标货币" 的格式
        // API 返回的是 1 目标货币 = X 外币，需要取倒数
        const referenceRates = {};
        this.globalCurrencyConfig.currencyList.forEach(currency => {
          if (currency !== targetCurrency) {
            const currencyLower = currency.toLowerCase();
            if (rates[currencyLower]) {
              referenceRates[currency] = 1 / rates[currencyLower];
            }
          }
        });

        this.currencyConfigDialog.referenceRates = referenceRates;
        this.currencyConfigDialog.referenceDate = data.date || '';
      } catch (error) {
        console.error('获取参考汇率失败:', error);
        this.currencyConfigDialog.referenceError = true;
        this.currencyConfigDialog.referenceRates = {};
      } finally {
        this.currencyConfigDialog.referenceLoading = false;
      }
    },

    /** 初始化弹窗中的汇率配置 */
    initDialogExchangeRates() {
      // 如果目标货币是 ORIGINAL，不需要汇率配置
      if (this.currencyConfigDialog.targetCurrency === 'ORIGINAL') {
        this.currencyConfigDialog.exchangeRates = {};
        return;
      }

      // 先保留已有的汇率配置（支持大小写不敏感匹配，统一转换为大写）
      const existingRates = {};
      if (this.currencyConfigDialog.exchangeRates && typeof this.currencyConfigDialog.exchangeRates === 'object') {
        Object.keys(this.currencyConfigDialog.exchangeRates).forEach(currencyKey => {
          const currencyUpper = currencyKey.toUpperCase();
          // 如果该货币在货币列表中，保留其汇率配置
          if (this.globalCurrencyConfig.currencyList.includes(currencyUpper)) {
            existingRates[currencyUpper] = this.currencyConfigDialog.exchangeRates[currencyKey];
          }
        });
      }

      // 为所有货币设置汇率配置
      const rates = {};
      this.globalCurrencyConfig.currencyList.forEach(currency => {
        if (currency === this.currencyConfigDialog.targetCurrency) {
          rates[currency] = 1;
        } else {
          // 如果已有汇率配置，保留；否则设置默认值
          if (existingRates[currency] !== undefined) {
            rates[currency] = existingRates[currency];
          } else {
            // 默认汇率，可以根据实际情况设置
            if (currency === 'USD' && this.currencyConfigDialog.targetCurrency === 'CNY') {
              rates[currency] = 7.2;
            } else if (currency === 'CNY' && this.currencyConfigDialog.targetCurrency === 'USD') {
              rates[currency] = 1 / 7.2;
            } else {
              rates[currency] = 1;
            }
          }
        }
      });
      this.currencyConfigDialog.exchangeRates = rates;
    },

    /** 应用汇率配置 */
    applyCurrencyConfig() {
      // 应用配置到全局
      this.globalCurrencyConfig.targetCurrency = this.currencyConfigDialog.targetCurrency;
      this.globalCurrencyConfig.exchangeRates = JSON.parse(JSON.stringify(this.currencyConfigDialog.exchangeRates));

      // 保存到浏览器缓存（按目标货币分别存储汇率配置）
      try {
        // 先读取现有缓存
        let existingConfig = { targetCurrency: 'ORIGINAL', ratesByTarget: {} };
        const savedConfig = localStorage.getItem('income_statistics_currency_config');
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          // 兼容旧格式：如果有 ratesByTarget 则使用新格式，否则迁移旧格式
          if (parsed.ratesByTarget) {
            existingConfig = parsed;
          } else if (parsed.targetCurrency && parsed.exchangeRates) {
            // 迁移旧格式数据
            existingConfig.ratesByTarget[parsed.targetCurrency.toUpperCase()] = parsed.exchangeRates;
          }
        }

        const targetCurrencyUpper = this.globalCurrencyConfig.targetCurrency.toUpperCase();
        
        // 更新当前目标货币
        existingConfig.targetCurrency = targetCurrencyUpper;

        // 如果目标货币不是 ORIGINAL，保存该目标货币对应的汇率配置
        if (targetCurrencyUpper !== 'ORIGINAL') {
          const ratesToSave = {};
          Object.keys(this.globalCurrencyConfig.exchangeRates).forEach(currency => {
            ratesToSave[currency.toUpperCase()] = this.globalCurrencyConfig.exchangeRates[currency];
          });
          existingConfig.ratesByTarget[targetCurrencyUpper] = ratesToSave;
        }

        const configString = JSON.stringify(existingConfig);
        localStorage.setItem('income_statistics_currency_config', configString);
        console.log('汇率配置已保存到缓存:', existingConfig);
      } catch (error) {
        console.error('保存汇率配置到缓存失败:', error);
        this.$message.warning('保存汇率配置到缓存失败，但配置已应用');
      }

      // 关闭弹窗
      this.currencyConfigDialog.visible = false;
      // 刷新所有数据（带加载提示）
      this.refreshAllDataWithLoading();
      this.$message.success('汇率配置已应用并保存');
    },

    /** 格式化日期 */
    formatDateStr(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    /** 处理日期范围类型变化 */
    handleDateRangeTypeChange(type) {
      // 更新日期范围类型（用于UI状态显示）
      this.dateRangeType = type
      
      const today = new Date()
      let startDate, endDate
      
      switch (type) {
        case 'monthToDate':
          // 本月至今
          startDate = new Date(today.getFullYear(), today.getMonth(), 1)
          endDate = today
          break
        case 'today':
          // 今日
          startDate = today
          endDate = today
          break
        case 'last7Days':
          // 近7天
          startDate = new Date(today)
          startDate.setDate(today.getDate() - 6)
          endDate = today
          break
        case 'last30Days':
          // 近30天
          startDate = new Date(today)
          startDate.setDate(today.getDate() - 29)
          endDate = today
          break
        case 'custom':
          // 自定义区间，不自动应用，等待用户选择后点击确认
          // 只更新类型，不更新日期范围
          return
        default:
          return
      }
      
      // 应用日期范围
      this.dateRange = [this.formatDateStr(startDate), this.formatDateStr(endDate)]
      this.tempDateRange = [...this.dateRange]
      // 显示加载提示并刷新数据
      this.refreshAllDataWithLoading()
    },

    /** 应用自定义日期范围 */
    applyCustomDateRange() {
      if (!this.tempDateRange || this.tempDateRange.length !== 2) {
        this.$message.warning('请选择有效的日期范围')
        return
      }
      // 应用日期范围
      this.dateRange = [...this.tempDateRange]
      // 显示加载提示并刷新所有数据
      this.refreshAllDataWithLoading()
    },

    /** 初始化全局汇率配置 */
    initGlobalExchangeRates() {
      const rates = {};
      // 如果目标货币是原始货币，不需要汇率配置
      if (this.globalCurrencyConfig.targetCurrency === 'ORIGINAL') {
        this.globalCurrencyConfig.exchangeRates = {};
        return;
      }

      this.globalCurrencyConfig.currencyList.forEach(currency => {
        if (currency === this.globalCurrencyConfig.targetCurrency) {
          rates[currency] = 1;
        } else {
          // 如果已有汇率配置，保留；否则设置默认值
          if (this.globalCurrencyConfig.exchangeRates &&
              this.globalCurrencyConfig.exchangeRates[currency] !== undefined) {
            rates[currency] = this.globalCurrencyConfig.exchangeRates[currency];
          } else {
            // 默认汇率，可以根据实际情况设置
            if (currency === 'USD' && this.globalCurrencyConfig.targetCurrency === 'CNY') {
              rates[currency] = 7.2;
            } else if (currency === 'CNY' && this.globalCurrencyConfig.targetCurrency === 'USD') {
              rates[currency] = 1 / 7.2;
            } else {
              rates[currency] = 1;
            }
          }
        }
      });
      this.globalCurrencyConfig.exchangeRates = rates;
    },

    /** 刷新所有数据 */
    refreshAllData() {
      this.fetchIndicatorData();
      this.fetchChartData();
      this.fetchIncomeDetailList();
      // 如果对话框已打开，也刷新对话框数据
      if (this.dialogData.visible) {
        this.loadCountryData();
      }
      // 如果图表详情对话框已打开，也刷新
      if (this.chartDialogData.visible && this.chartDialogData.chartId) {
        const chart = this.charts.find(c => c.id === this.chartDialogData.chartId);
        if (chart) {
          this.loadChartDialogData(chart);
        }
      }
    },

    /** 刷新所有数据（带全屏加载提示） */
    refreshAllDataWithLoading() {
      const loading = this.$loading({
        lock: true,
        text: '正在加载数据...',
        spinner: 'el-icon-loading',
        background: 'rgba(255, 255, 255, 0.7)'
      })
      
      // 设置所有图表为加载状态
      this.indicatorCards.forEach(card => {
        card.loading = true
      })
      
      // 刷新数据
      Promise.all([
        this.fetchIndicatorData(),
        this.fetchChartData(),
        this.fetchIncomeDetailList()
      ]).then(() => {
        loading.close()
        this.$message.success('数据刷新完成')
      }).catch(() => {
        loading.close()
        this.$message.error('数据刷新失败')
      })
      
      // 如果对话框已打开，也刷新对话框数据
      if (this.dialogData.visible) {
        this.loadCountryData();
      }
      // 如果图表详情对话框已打开，也刷新
      if (this.chartDialogData.visible && this.chartDialogData.chartId) {
        const chart = this.charts.find(c => c.id === this.chartDialogData.chartId);
        if (chart) {
          this.loadChartDialogData(chart);
        }
      }
    },

    /** 关闭对话框 */
    handleCloseDialog() {
      this.dialogData.visible = false;
    },

    /** 处理日/月切换 */
    handlePeriodTypeChange(chart) {
      if (chart.id === 'payingUsers') {
        this.fetchPayingUserCountData();
      } else if (chart.id === 'memberLevelDistribution') {
        this.fetchMemberLevelDistributionData();
      }
    },

    /** 获取所有图表数据 */
    async fetchChartData() {
      const [startDate, endDate] = this.dateRange || []
      if (!startDate || !endDate) {
        return
      }

      await Promise.all([
        this.fetchIncomeCompositionData(),
        this.fetchPayingUserCountData(),
        this.fetchSubscriptionDistributionData(),
        this.fetchSupplementDistributionData(),
        this.fetchTotalIncomeTrendData(),
        this.fetchNewOldUserContributionData(),
        this.fetchMemberLevelDistributionData()
      ])
    },

    /** 获取收入构成比数据 */
    async fetchIncomeCompositionData() {
      try {
        const [startDate, endDate] = this.dateRange || []
        if (!startDate || !endDate) return

        const targetCurrency = this.globalCurrencyConfig.targetCurrency
        const exchangeRates = this.globalCurrencyConfig.targetCurrency === 'ORIGINAL' ? null : this.globalCurrencyConfig.exchangeRates
        const countries = this.selectedCountries.length > 0 ? this.selectedCountries : null
        const response = await getIncomeComposition(startDate, endDate, targetCurrency, exchangeRates, countries)
        if (response.code === 200) {
          const chart = this.charts.find(c => c.id === 'composition')
          if (chart) {
            chart.data = response.data || []
          }
        }
      } catch (error) {
        console.error('获取收入构成比数据失败:', error)
      }
    },

    /** 获取付费用户数数据 */
    async fetchPayingUserCountData() {
      try {
        const [startDate, endDate] = this.dateRange || []
        if (!startDate || !endDate) return

        const chart = this.charts.find(c => c.id === 'payingUsers')
        const periodType = chart ? chart.periodType : 'day'
        const countries = this.selectedCountries.length > 0 ? this.selectedCountries : null

        const response = await getPayingUserCountByDate(startDate, endDate, periodType, countries)
        if (response.code === 200) {
          if (chart) {
            chart.data = response.data || []
          }
        }
      } catch (error) {
        console.error('获取付费用户数数据失败:', error)
      }
    },

    /** 获取会员订阅收入分布数据 */
    async fetchSubscriptionDistributionData() {
      try {
        const [startDate, endDate] = this.dateRange || []
        if (!startDate || !endDate) return

        const targetCurrency = this.globalCurrencyConfig.targetCurrency
        const exchangeRates = this.globalCurrencyConfig.targetCurrency === 'ORIGINAL' ? null : this.globalCurrencyConfig.exchangeRates
        const countries = this.selectedCountries.length > 0 ? this.selectedCountries : null
        const response = await getSubscriptionIncomeDistributionByCountry(startDate, endDate, targetCurrency, exchangeRates, countries)
        if (response.code === 200) {
          const chart = this.charts.find(c => c.id === 'subscriptionDistribution')
          if (chart) {
            chart.data = response.data || []
          }
        }
      } catch (error) {
        console.error('获取会员订阅收入分布数据失败:', error)
      }
    },

    /** 获取转写补充包收入分布数据 */
    async fetchSupplementDistributionData() {
      try {
        const [startDate, endDate] = this.dateRange || []
        if (!startDate || !endDate) return

        const targetCurrency = this.globalCurrencyConfig.targetCurrency
        const exchangeRates = this.globalCurrencyConfig.targetCurrency === 'ORIGINAL' ? null : this.globalCurrencyConfig.exchangeRates
        const countries = this.selectedCountries.length > 0 ? this.selectedCountries : null
        const response = await getSupplementPackageIncomeDistributionByCountry(startDate, endDate, targetCurrency, exchangeRates, countries)
        if (response.code === 200) {
          const chart = this.charts.find(c => c.id === 'supplementDistribution')
          if (chart) {
            chart.data = response.data || []
          }
        }
      } catch (error) {
        console.error('获取转写补充包收入分布数据失败:', error)
      }
    },

    /** 获取总收入趋势数据 */
    async fetchTotalIncomeTrendData() {
      try {
        const [startDate, endDate] = this.dateRange || []
        if (!startDate || !endDate) return

        const targetCurrency = this.globalCurrencyConfig.targetCurrency
        const exchangeRates = this.globalCurrencyConfig.targetCurrency === 'ORIGINAL' ? null : this.globalCurrencyConfig.exchangeRates
        const countries = this.selectedCountries.length > 0 ? this.selectedCountries : null
        const response = await getTotalIncomeTrend(startDate, endDate, targetCurrency, exchangeRates, countries)
        if (response.code === 200) {
          const chart = this.charts.find(c => c.id === 'totalIncomeTrend')
          if (chart) {
            chart.data = response.data || []
          }
        }
      } catch (error) {
        console.error('获取总收入趋势数据失败:', error)
      }
    },

    /** 获取新老付费用户收入贡献数据 */
    async fetchNewOldUserContributionData() {
      try {
        const [startDate, endDate] = this.dateRange || []
        if (!startDate || !endDate) return

        const targetCurrency = this.globalCurrencyConfig.targetCurrency
        const exchangeRates = this.globalCurrencyConfig.targetCurrency === 'ORIGINAL' ? null : this.globalCurrencyConfig.exchangeRates
        const countries = this.selectedCountries.length > 0 ? this.selectedCountries : null
        const response = await getNewOldUserIncomeContribution(startDate, endDate, targetCurrency, exchangeRates, countries)
        if (response.code === 200) {
          const chart = this.charts.find(c => c.id === 'newOldUserContribution')
          if (chart) {
            chart.data = response.data || []
          }
        }
      } catch (error) {
        console.error('获取新老付费用户收入贡献数据失败:', error)
      }
    },

    /** 获取会员等级收入分布数据 */
    async fetchMemberLevelDistributionData() {
      try {
        const [startDate, endDate] = this.dateRange || []
        if (!startDate || !endDate) return

        const chart = this.charts.find(c => c.id === 'memberLevelDistribution')
        const periodType = chart ? chart.periodType : 'day'

        const targetCurrency = this.globalCurrencyConfig.targetCurrency
        const exchangeRates = this.globalCurrencyConfig.targetCurrency === 'ORIGINAL' ? null : this.globalCurrencyConfig.exchangeRates
        const countries = this.selectedCountries.length > 0 ? this.selectedCountries : null
        const response = await getMemberLevelIncomeDistribution(startDate, endDate, periodType, targetCurrency, exchangeRates, countries)
        if (response.code === 200) {
          if (chart) {
            chart.data = response.data || []
          }
        }
      } catch (error) {
        console.error('获取会员等级收入分布数据失败:', error)
      }
    },

    /** 处理图表点击 */
    async handleChartClick(chart, event) {
      // 如果点击的是切换按钮或header区域，不执行弹窗逻辑
      if (event && (event.target.closest('.el-radio-group') || event.target.closest('.el-radio-button') || event.target.closest('.chart-header'))) {
        return
      }

      const [startDate, endDate] = this.dateRange || []
      if (!startDate || !endDate) {
        this.$message.warning('请先选择日期范围')
        return
      }

      this.chartDialogData.visible = true
      this.chartDialogData.title = chart.title
      this.chartDialogData.chartId = chart.id

      // 调用统一的加载方法
      await this.loadChartDialogData(chart)
    },

    /** 加载图表详情对话框数据 */
    async loadChartDialogData(chart) {
      if (!chart) {
        chart = this.charts.find(c => c.id === this.chartDialogData.chartId);
      }
      if (!chart) return;

      const [startDate, endDate] = this.dateRange || []
      if (!startDate || !endDate) {
        return
      }

      this.chartDialogData.loading = true
      this.chartDialogData.tableData = []
      this.chartDialogData.columns = []

      try {
        let response
        if (chart.id === 'payingUsers') {
          // 获取当前图表的 periodType
          const periodType = chart.periodType || 'day'
          const countries = this.selectedCountries.length > 0 ? this.selectedCountries : null
          response = await getPayingUserCountByDateAndCountry(startDate, endDate, periodType, countries)
          if (response.code === 200) {
            const data = response.data || []
            // 渲染分组柱状图
            this.$nextTick(() => {
              this.renderPayingUsersChartDialog(data, periodType)
            })
          }
        } else if (chart.id === 'subscriptionDistribution') {
          const targetCurrency = this.globalCurrencyConfig.targetCurrency
          const exchangeRates = this.globalCurrencyConfig.targetCurrency === 'ORIGINAL' ? null : this.globalCurrencyConfig.exchangeRates
          const countries = this.selectedCountries.length > 0 ? this.selectedCountries : null
          response = await getSubscriptionIncomeDistributionByCountry(startDate, endDate, targetCurrency, exchangeRates, countries)
          if (response.code === 200) {
            const data = response.data || []
            // 按类型和国家分组
            const professionalData = []
            const masterData = []
            data.forEach(item => {
              const country = item.country || '未知'
              const type = item.type || '其他'
              const amount = item.amount || 0
              if (type === '专业版') {
                professionalData.push({ name: country, value: amount })
              } else if (type === '大师版') {
                masterData.push({ name: country, value: amount })
              }
            })
            // 设置图表类型和数据
            this.chartDialogData.chartType = 'pie'
            this.chartDialogData.chartData = {
              professional: professionalData,
              master: masterData
            }
            // 渲染饼状图
            this.$nextTick(() => {
              this.renderSubscriptionDistributionCharts()
            })
          }
        } else if (chart.id === 'supplementDistribution') {
          const targetCurrency = this.globalCurrencyConfig.targetCurrency
          const exchangeRates = this.globalCurrencyConfig.targetCurrency === 'ORIGINAL' ? null : this.globalCurrencyConfig.exchangeRates
          const countries = this.selectedCountries.length > 0 ? this.selectedCountries : null
          response = await getSupplementPackageIncomeDistributionByCountry(startDate, endDate, targetCurrency, exchangeRates, countries)
          if (response.code === 200) {
            const data = response.data || []
            // 按类型和国家分组
            const minutes120Data = []
            const minutes600Data = []
            const minutes3000Data = []
            const minutes6000Data = []
            data.forEach(item => {
              const country = item.country || '未知'
              const type = item.type || '其他'
              const amount = item.amount || 0
              if (type === '120分钟转写时长') {
                minutes120Data.push({ name: country, value: amount })
              } else if (type === '600分钟转写时长') {
                minutes600Data.push({ name: country, value: amount })
              } else if (type === '3000分钟转写时长') {
                minutes3000Data.push({ name: country, value: amount })
              } else if (type === '6000分钟转写时长') {
                minutes6000Data.push({ name: country, value: amount })
              }
            })
            // 设置图表类型和数据
            this.chartDialogData.chartType = 'pie'
            this.chartDialogData.chartData = {
              minutes120: minutes120Data,
              minutes600: minutes600Data,
              minutes3000: minutes3000Data,
              minutes6000: minutes6000Data
            }
            // 渲染饼状图
            this.$nextTick(() => {
              this.renderSupplementDistributionCharts()
            })
          }
        } else if (chart.id === 'totalIncomeTrend') {
          const targetCurrency = this.globalCurrencyConfig.targetCurrency
          const exchangeRates = this.globalCurrencyConfig.targetCurrency === 'ORIGINAL' ? null : this.globalCurrencyConfig.exchangeRates
          const countries = this.selectedCountries.length > 0 ? this.selectedCountries : null
          response = await getTotalIncomeTrendByCountry(startDate, endDate, targetCurrency, exchangeRates, countries)
          if (response.code === 200) {
            const data = response.data || []
            // 按国家和日期分组数据
            const countryDateMap = {}
            const countrySet = new Set()
            const dateSet = new Set()

            data.forEach(item => {
              const date = item.date || ''
              const country = item.country || '未知'
              countrySet.add(country)
              dateSet.add(date)

              if (!countryDateMap[country]) {
                countryDateMap[country] = {}
              }
              if (!countryDateMap[country][date]) {
                countryDateMap[country][date] = {
                  totalIncome: 0,
                  subscriptionIncome: 0,
                  supplementIncome: 0
                }
              }
              countryDateMap[country][date].totalIncome += item.totalIncome || 0
              countryDateMap[country][date].subscriptionIncome += item.subscriptionIncome || 0
              countryDateMap[country][date].supplementIncome += item.supplementIncome || 0
            })

            // 设置图表类型和数据
            this.chartDialogData.chartType = 'line'
            this.chartDialogData.chartData = {
              countryDateMap: countryDateMap,
              countries: Array.from(countrySet).sort(),
              dates: Array.from(dateSet).sort()
            }
            // 渲染折线图
            this.$nextTick(() => {
              this.renderTotalIncomeTrendChartDialog()
            })
          }
        } else if (chart.id === 'composition') {
          const targetCurrency = this.globalCurrencyConfig.targetCurrency
          const exchangeRates = this.globalCurrencyConfig.targetCurrency === 'ORIGINAL' ? null : this.globalCurrencyConfig.exchangeRates
          const countries = this.selectedCountries.length > 0 ? this.selectedCountries : null
          response = await getIncomeComposition(startDate, endDate, targetCurrency, exchangeRates, countries)
          if (response.code === 200) {
            const data = response.data || []
            this.chartDialogData.tableData = data.map(item => ({
              type: item.type || '未知',
              amount: item.amount || 0
            }))
            this.chartDialogData.columns = [
              { prop: 'type', label: '类型' },
              { prop: 'amount', label: '收入金额' }
            ]
          }
        }
      } catch (error) {
        console.error('获取图表详情数据失败:', error)
        this.$message.error('获取数据失败，请稍后重试')
      } finally {
        this.chartDialogData.loading = false
      }
    },

    /** 货币转换（前端转换，用于不支持动态汇率的接口） */
    convertCurrency(amount, fromCurrency) {
      if (!amount || amount === 0) return 0
      if (this.globalCurrencyConfig.targetCurrency === 'ORIGINAL') {
        return amount
      }
      if (fromCurrency === this.globalCurrencyConfig.targetCurrency) {
        return amount
      }
      const rate = this.globalCurrencyConfig.exchangeRates[fromCurrency] || 1
      return amount * rate
    },

    /** 格式化金额 */
    formatAmount(amount, currency) {
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

      if (amount === null || amount === undefined || amount === '') {
        if (currency === 'ORIGINAL') {
          return '0.00';
        }
        const symbol = currencySymbolMap[currency];
        return symbol ? `${symbol}0.00` : `${currency} 0.00`;
      }
      const num = parseFloat(amount);
      if (isNaN(num)) {
        if (currency === 'ORIGINAL') {
          return '0.00';
        }
        const symbol = currencySymbolMap[currency];
        return symbol ? `${symbol}0.00` : `${currency} 0.00`;
      }

      // 格式化数字，添加千分位
      const formatted = num.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      // 原始货币不显示货币代码
      if (currency === 'ORIGINAL') {
        return formatted;
      }

      // 优先使用符号，无符号则使用缩写
      const symbol = currencySymbolMap[currency];
      return symbol ? `${symbol}${formatted}` : `${currency} ${formatted}`;
    },

    /** 渲染付费用户数弹窗图表 */
    renderPayingUsersChartDialog(data, periodType) {
      if (!this.$refs.payingUsersChartDialog) {
        return
      }

      // 销毁之前的图表实例
      if (this.payingUsersChartDialogInstance) {
        this.payingUsersChartDialogInstance.dispose()
        this.payingUsersChartDialogInstance = null
      }

      // 处理数据：按日期和国家分组
      const dateMap = {}
      const countrySet = new Set()

      data.forEach(item => {
        const date = item.date || ''
        const country = item.country || '未知'
        const userCount = item.userCount || 0

        countrySet.add(country)

        if (!dateMap[date]) {
          dateMap[date] = {}
        }
        dateMap[date][country] = userCount
      })

      // 获取所有日期和国家
      const dates = Object.keys(dateMap).sort()
      const countries = Array.from(countrySet).sort()

      // 格式化日期显示
      const formattedDates = dates.map(date => {
        if (periodType === 'month') {
          // 月份格式：YYYY-MM，显示为 YYYY年MM月
          if (date && date.length >= 7) {
            const [year, month] = date.split('-')
            return `${year}年${month}月`
          }
          return date
        } else {
          // 日期格式：YYYY-MM-DD，显示为 MM/DD
          if (date && date.length >= 10) {
            const parts = date.split('-')
            if (parts.length >= 3) {
              return `${parts[1]}/${parts[2]}`
            }
          }
          return date
        }
      })

      // 构建系列数据
      const series = countries.map(country => {
        const data = dates.map(date => dateMap[date][country] || 0)
        return {
          name: country,
          type: 'bar',
          data: data
        }
      })

      // 定义颜色数组
      const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']

      // 创建图表实例
      this.payingUsersChartDialogInstance = echarts.init(this.$refs.payingUsersChartDialog)

      // 设置图表配置
      this.payingUsersChartDialogInstance.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: countries,
          top: 10
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
          data: formattedDates,
          axisTick: {
            alignWithLabel: true
          }
        },
        yAxis: {
          type: 'value',
          name: '用户数'
        },
        series: series.map((item, index) => ({
          ...item,
          itemStyle: {
            color: colors[index % colors.length]
          }
        }))
      })

      this.chartDialogData.loading = false
    },

    renderSubscriptionDistributionCharts() {
      if (!this.$refs.subscriptionProfessionalChart || !this.$refs.subscriptionMasterChart) {
        return
      }

      const { professional, master } = this.chartDialogData.chartData || {}
      const targetCurrency = this.globalCurrencyConfig.targetCurrency

      // 销毁之前的图表实例
      if (this.subscriptionDistributionChartInstances.professional) {
        this.subscriptionDistributionChartInstances.professional.dispose()
        this.subscriptionDistributionChartInstances.professional = null
      }
      if (this.subscriptionDistributionChartInstances.master) {
        this.subscriptionDistributionChartInstances.master.dispose()
        this.subscriptionDistributionChartInstances.master = null
      }

      // 渲染专业版饼状图
      if (professional && professional.length > 0) {
        this.subscriptionDistributionChartInstances.professional = echarts.init(this.$refs.subscriptionProfessionalChart)
        this.subscriptionDistributionChartInstances.professional.setOption({
          tooltip: {
            trigger: 'item',
            formatter: (params) => {
              const formattedValue = this.formatAmount(params.value, targetCurrency)
              return `${params.name}<br/>${params.seriesName}: ${formattedValue}<br/>占比: ${params.percent}%`
            }
          },
          legend: {
            type: 'scroll',
            orient: 'vertical',
            left: 'left',
            top: 'middle',
            itemWidth: 14,
            itemHeight: 14,
            itemGap: 10,
            textStyle: {
              fontSize: 12
            },
            pageButtonItemGap: 5,
            pageButtonPosition: 'end',
            pageIconSize: 12,
            pageTextStyle: {
              fontSize: 12
            }
          },
          series: [
            {
              name: '专业版收入',
              type: 'pie',
              radius: ['40%', '70%'],
              center: ['60%', '50%'],
              data: professional,
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

      // 渲染大师版饼状图
      if (master && master.length > 0) {
        this.subscriptionDistributionChartInstances.master = echarts.init(this.$refs.subscriptionMasterChart)
        this.subscriptionDistributionChartInstances.master.setOption({
          tooltip: {
            trigger: 'item',
            formatter: (params) => {
              const formattedValue = this.formatAmount(params.value, targetCurrency)
              return `${params.name}<br/>${params.seriesName}: ${formattedValue}<br/>占比: ${params.percent}%`
            }
          },
          legend: {
            type: 'scroll',
            orient: 'vertical',
            left: 'left',
            top: 'middle',
            itemWidth: 14,
            itemHeight: 14,
            itemGap: 10,
            textStyle: {
              fontSize: 12
            },
            pageButtonItemGap: 5,
            pageButtonPosition: 'end',
            pageIconSize: 12,
            pageTextStyle: {
              fontSize: 12
            }
          },
          series: [
            {
              name: '大师版收入',
              type: 'pie',
              radius: ['40%', '70%'],
              center: ['60%', '50%'],
              data: master,
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

      this.chartDialogData.loading = false
    },

    renderSupplementDistributionCharts() {
      if (!this.$refs.supplement120Chart || !this.$refs.supplement600Chart ||
          !this.$refs.supplement3000Chart || !this.$refs.supplement6000Chart) {
        return
      }

      const { minutes120, minutes600, minutes3000, minutes6000 } = this.chartDialogData.chartData || {}
      const targetCurrency = this.globalCurrencyConfig.targetCurrency

      // 销毁之前的图表实例
      if (this.supplementDistributionChartInstances.minutes120) {
        this.supplementDistributionChartInstances.minutes120.dispose()
        this.supplementDistributionChartInstances.minutes120 = null
      }
      if (this.supplementDistributionChartInstances.minutes600) {
        this.supplementDistributionChartInstances.minutes600.dispose()
        this.supplementDistributionChartInstances.minutes600 = null
      }
      if (this.supplementDistributionChartInstances.minutes3000) {
        this.supplementDistributionChartInstances.minutes3000.dispose()
        this.supplementDistributionChartInstances.minutes3000 = null
      }
      if (this.supplementDistributionChartInstances.minutes6000) {
        this.supplementDistributionChartInstances.minutes6000.dispose()
        this.supplementDistributionChartInstances.minutes6000 = null
      }

      // 渲染120分钟补充包饼状图
      if (minutes120 && minutes120.length > 0) {
        this.supplementDistributionChartInstances.minutes120 = echarts.init(this.$refs.supplement120Chart)
        this.supplementDistributionChartInstances.minutes120.setOption({
          tooltip: {
            trigger: 'item',
            formatter: (params) => {
              const formattedValue = this.formatAmount(params.value, targetCurrency)
              return `${params.name}<br/>${params.seriesName}: ${formattedValue}<br/>占比: ${params.percent}%`
            }
          },
          legend: {
            type: 'scroll',
            orient: 'vertical',
            left: 'left',
            top: 'middle',
            itemWidth: 14,
            itemHeight: 14,
            itemGap: 10,
            textStyle: {
              fontSize: 12
            },
            pageButtonItemGap: 5,
            pageButtonPosition: 'end',
            pageIconSize: 12,
            pageTextStyle: {
              fontSize: 12
            }
          },
          series: [
            {
              name: '120分钟补充包收入',
              type: 'pie',
              radius: ['40%', '70%'],
              center: ['60%', '50%'],
              data: minutes120,
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

      // 渲染600分钟补充包饼状图
      if (minutes600 && minutes600.length > 0) {
        this.supplementDistributionChartInstances.minutes600 = echarts.init(this.$refs.supplement600Chart)
        this.supplementDistributionChartInstances.minutes600.setOption({
          tooltip: {
            trigger: 'item',
            formatter: (params) => {
              const formattedValue = this.formatAmount(params.value, targetCurrency)
              return `${params.name}<br/>${params.seriesName}: ${formattedValue}<br/>占比: ${params.percent}%`
            }
          },
          legend: {
            type: 'scroll',
            orient: 'vertical',
            left: 'left',
            top: 'middle',
            itemWidth: 14,
            itemHeight: 14,
            itemGap: 10,
            textStyle: {
              fontSize: 12
            },
            pageButtonItemGap: 5,
            pageButtonPosition: 'end',
            pageIconSize: 12,
            pageTextStyle: {
              fontSize: 12
            }
          },
          series: [
            {
              name: '600分钟补充包收入',
              type: 'pie',
              radius: ['40%', '70%'],
              center: ['60%', '50%'],
              data: minutes600,
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

      // 渲染3000分钟补充包饼状图
      if (minutes3000 && minutes3000.length > 0) {
        this.supplementDistributionChartInstances.minutes3000 = echarts.init(this.$refs.supplement3000Chart)
        this.supplementDistributionChartInstances.minutes3000.setOption({
          tooltip: {
            trigger: 'item',
            formatter: (params) => {
              const formattedValue = this.formatAmount(params.value, targetCurrency)
              return `${params.name}<br/>${params.seriesName}: ${formattedValue}<br/>占比: ${params.percent}%`
            }
          },
          legend: {
            type: 'scroll',
            orient: 'vertical',
            left: 'left',
            top: 'middle',
            itemWidth: 14,
            itemHeight: 14,
            itemGap: 10,
            textStyle: {
              fontSize: 12
            },
            pageButtonItemGap: 5,
            pageButtonPosition: 'end',
            pageIconSize: 12,
            pageTextStyle: {
              fontSize: 12
            }
          },
          series: [
            {
              name: '3000分钟补充包收入',
              type: 'pie',
              radius: ['40%', '70%'],
              center: ['60%', '50%'],
              data: minutes3000,
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

      // 渲染6000分钟补充包饼状图
      if (minutes6000 && minutes6000.length > 0) {
        this.supplementDistributionChartInstances.minutes6000 = echarts.init(this.$refs.supplement6000Chart)
        this.supplementDistributionChartInstances.minutes6000.setOption({
          tooltip: {
            trigger: 'item',
            formatter: (params) => {
              const formattedValue = this.formatAmount(params.value, targetCurrency)
              return `${params.name}<br/>${params.seriesName}: ${formattedValue}<br/>占比: ${params.percent}%`
            }
          },
          legend: {
            type: 'scroll',
            orient: 'vertical',
            left: 'left',
            top: 'middle',
            itemWidth: 14,
            itemHeight: 14,
            itemGap: 10,
            textStyle: {
              fontSize: 12
            },
            pageButtonItemGap: 5,
            pageButtonPosition: 'end',
            pageIconSize: 12,
            pageTextStyle: {
              fontSize: 12
            }
          },
          series: [
            {
              name: '6000分钟补充包收入',
              type: 'pie',
              radius: ['40%', '70%'],
              center: ['60%', '50%'],
              data: minutes6000,
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

      this.chartDialogData.loading = false
    },

    renderTotalIncomeTrendChartDialog() {
      if (!this.$refs.totalIncomeTrendTotalChart || !this.$refs.totalIncomeTrendSubscriptionChart || !this.$refs.totalIncomeTrendSupplementChart) {
        return
      }

      // 销毁之前的图表实例
      if (this.totalIncomeTrendChartInstances.total) {
        this.totalIncomeTrendChartInstances.total.dispose()
        this.totalIncomeTrendChartInstances.total = null
      }
      if (this.totalIncomeTrendChartInstances.subscription) {
        this.totalIncomeTrendChartInstances.subscription.dispose()
        this.totalIncomeTrendChartInstances.subscription = null
      }
      if (this.totalIncomeTrendChartInstances.supplement) {
        this.totalIncomeTrendChartInstances.supplement.dispose()
        this.totalIncomeTrendChartInstances.supplement = null
      }

      const { countryDateMap, countries, dates } = this.chartDialogData.chartData || {}
      const targetCurrency = this.globalCurrencyConfig.targetCurrency

      if (!countryDateMap || !countries || !dates) {
        this.chartDialogData.loading = false
        return
      }

      // 格式化日期显示（MM-DD）
      const formattedDates = dates.map(date => {
        if (date && date.length >= 10) {
          const parts = date.split('-')
          if (parts.length >= 3) {
            return `${parts[1]}/${parts[2]}`
          }
        }
        return date
      })

      // 定义颜色数组
      const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']

      // 渲染合计收入折线图
      const totalSeries = countries.map((country, index) => {
        const data = dates.map(date => {
          return countryDateMap[country] && countryDateMap[country][date] ? (countryDateMap[country][date].totalIncome || 0) : 0
        })
        return {
          name: country,
          type: 'line',
          data: data,
          smooth: true,
          itemStyle: {
            color: colors[index % colors.length]
          }
        }
      })

      this.totalIncomeTrendChartInstances.total = echarts.init(this.$refs.totalIncomeTrendTotalChart)
      this.totalIncomeTrendChartInstances.total.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: (params) => {
            let result = `${params[0].axisValue}<br/>`
            params.forEach(param => {
              const formattedValue = this.formatAmount(param.value, targetCurrency)
              result += `${param.seriesName}: ${formattedValue}<br/>`
            })
            return result
          }
        },
        legend: {
          data: countries,
          top: 10
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
          data: formattedDates,
          axisTick: {
            alignWithLabel: true
          }
        },
        yAxis: {
          type: 'value',
          name: '订单金额',
          axisLabel: {
            formatter: (value) => {
              return this.formatAmount(value, targetCurrency)
            }
          }
        },
        series: totalSeries
      })

      // 渲染会员订阅收入折线图
      const subscriptionSeries = countries.map((country, index) => {
        const data = dates.map(date => {
          return countryDateMap[country] && countryDateMap[country][date] ? (countryDateMap[country][date].subscriptionIncome || 0) : 0
        })
        return {
          name: country,
          type: 'line',
          data: data,
          smooth: true,
          itemStyle: {
            color: colors[index % colors.length]
          }
        }
      })

      this.totalIncomeTrendChartInstances.subscription = echarts.init(this.$refs.totalIncomeTrendSubscriptionChart)
      this.totalIncomeTrendChartInstances.subscription.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: (params) => {
            let result = `${params[0].axisValue}<br/>`
            params.forEach(param => {
              const formattedValue = this.formatAmount(param.value, targetCurrency)
              result += `${param.seriesName}: ${formattedValue}<br/>`
            })
            return result
          }
        },
        legend: {
          data: countries,
          top: 10
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
          data: formattedDates,
          axisTick: {
            alignWithLabel: true
          }
        },
        yAxis: {
          type: 'value',
          name: '订单金额',
          axisLabel: {
            formatter: (value) => {
              return this.formatAmount(value, targetCurrency)
            }
          }
        },
        series: subscriptionSeries
      })

      // 渲染补充包收入折线图
      const supplementSeries = countries.map((country, index) => {
        const data = dates.map(date => {
          return countryDateMap[country] && countryDateMap[country][date] ? (countryDateMap[country][date].supplementIncome || 0) : 0
        })
        return {
          name: country,
          type: 'line',
          data: data,
          smooth: true,
          itemStyle: {
            color: colors[index % colors.length]
          }
        }
      })

      this.totalIncomeTrendChartInstances.supplement = echarts.init(this.$refs.totalIncomeTrendSupplementChart)
      this.totalIncomeTrendChartInstances.supplement.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: (params) => {
            let result = `${params[0].axisValue}<br/>`
            params.forEach(param => {
              const formattedValue = this.formatAmount(param.value, targetCurrency)
              result += `${param.seriesName}: ${formattedValue}<br/>`
            })
            return result
          }
        },
        legend: {
          data: countries,
          top: 10
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
          data: formattedDates,
          axisTick: {
            alignWithLabel: true
          }
        },
        yAxis: {
          type: 'value',
          name: '订单金额',
          axisLabel: {
            formatter: (value) => {
              return this.formatAmount(value, targetCurrency)
            }
          }
        },
        series: supplementSeries
      })

      this.chartDialogData.loading = false
    },

    /** 获取收入明细列表 */
    async fetchIncomeDetailList() {
      this.incomeDetailLoading = true
      try {
        const startDate = this.dateRange[0]
        const endDate = this.dateRange[1]
        const targetCurrency = this.globalCurrencyConfig.targetCurrency
        const exchangeRates = this.globalCurrencyConfig.targetCurrency === 'ORIGINAL' ? null : this.globalCurrencyConfig.exchangeRates
        const countries = this.selectedCountries.length > 0 ? this.selectedCountries : null

        const response = await getIncomeDetailList(startDate, endDate, targetCurrency, exchangeRates, countries)
        if (response.code === 200) {
          this.incomeDetailList = response.data || []
        } else {
          this.$message.error(response.msg || '获取收入明细失败')
          this.incomeDetailList = []
        }
      } catch (error) {
        console.error('获取收入明细失败:', error)
        this.$message.error('获取收入明细失败，请稍后重试')
        this.incomeDetailList = []
      } finally {
        this.incomeDetailLoading = false
      }
    },

    /** 导出收入明细 */
    async handleExportIncomeDetail() {
      this.exportLoading = true
      try {
        const startDate = this.dateRange[0]
        const endDate = this.dateRange[1]
        const targetCurrency = this.globalCurrencyConfig.targetCurrency
        const exchangeRates = this.globalCurrencyConfig.targetCurrency === 'ORIGINAL' ? null : this.globalCurrencyConfig.exchangeRates
        const countries = this.selectedCountries.length > 0 ? this.selectedCountries : null

        const response = await exportIncomeDetailList(startDate, endDate, targetCurrency, exchangeRates, countries)
        // 处理 blob 响应
        const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `收入明细_${startDate}_${endDate}_${new Date().getTime()}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        this.$message.success('导出成功')
      } catch (error) {
        console.error('导出收入明细失败:', error)
        this.$message.error('导出失败，请稍后重试')
      } finally {
        this.exportLoading = false
      }
    }
  },
  beforeDestroy() {
    // 销毁图表实例
    if (this.payingUsersChartDialogInstance) {
      this.payingUsersChartDialogInstance.dispose()
      this.payingUsersChartDialogInstance = null
    }
    if (this.subscriptionDistributionChartInstances.professional) {
      this.subscriptionDistributionChartInstances.professional.dispose()
      this.subscriptionDistributionChartInstances.professional = null
    }
    if (this.subscriptionDistributionChartInstances.master) {
      this.subscriptionDistributionChartInstances.master.dispose()
      this.subscriptionDistributionChartInstances.master = null
    }
    if (this.supplementDistributionChartInstances.minutes120) {
      this.supplementDistributionChartInstances.minutes120.dispose()
      this.supplementDistributionChartInstances.minutes120 = null
    }
    if (this.supplementDistributionChartInstances.minutes600) {
      this.supplementDistributionChartInstances.minutes600.dispose()
      this.supplementDistributionChartInstances.minutes600 = null
    }
    if (this.supplementDistributionChartInstances.minutes3000) {
      this.supplementDistributionChartInstances.minutes3000.dispose()
      this.supplementDistributionChartInstances.minutes3000 = null
    }
    if (this.supplementDistributionChartInstances.minutes6000) {
      this.supplementDistributionChartInstances.minutes6000.dispose()
      this.supplementDistributionChartInstances.minutes6000 = null
    }
    if (this.totalIncomeTrendChartInstances.total) {
      this.totalIncomeTrendChartInstances.total.dispose()
      this.totalIncomeTrendChartInstances.total = null
    }
    if (this.totalIncomeTrendChartInstances.subscription) {
      this.totalIncomeTrendChartInstances.subscription.dispose()
      this.totalIncomeTrendChartInstances.subscription = null
    }
    if (this.totalIncomeTrendChartInstances.supplement) {
      this.totalIncomeTrendChartInstances.supplement.dispose()
      this.totalIncomeTrendChartInstances.supplement = null
    }
  }
};
</script>

<style scoped lang="scss">
// ============================================
// Design System Variables
// ============================================
$primary: #3B82F6;
$primary-dark: #2563EB;
$primary-light: #60A5FA;
$success: #10B981;
$success-light: #D1FAE5;
$warning: #F59E0B;
$warning-light: #FEF3C7;
$danger: #EF4444;
$danger-light: #FEE2E2;
$text-primary: #1E293B;
$text-secondary: #64748B;
$text-muted: #94A3B8;
$bg-page: #F1F5F9;
$bg-card: #FFFFFF;
$bg-elevated: #F8FAFC;
$border-color: #E2E8F0;
$border-radius-sm: 6px;
$border-radius: 12px;
$border-radius-lg: 16px;
$shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
$shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
$transition: all 0.2s ease-out;

// ============================================
// Dashboard Container
// ============================================
.income-dashboard {
  min-height: 100vh;
  background: $bg-page;
  padding: 0 24px 40px;
}

// ============================================
// Page Header
// ============================================
.page-header {
  padding: 20px 0;
  margin-bottom: 8px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: $text-primary;
    margin: 0;
    letter-spacing: -0.5px;
  }
}

.header-icon {
  width: 32px;
  height: 32px;
  color: $primary;
}

.refresh-btn {
  background: $bg-card;
  border: 1px solid $border-color;
  color: $text-secondary;
  transition: $transition;

  &:hover {
    background: $primary;
    border-color: $primary;
    color: white;
    transform: rotate(90deg);
  }
}

// ============================================
// KPI Section
// ============================================
.kpi-section {
  margin-bottom: 24px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.kpi-card {
  position: relative;
  background: $bg-card;
  border-radius: $border-radius;
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  cursor: pointer;
  transition: $transition;
  box-shadow: $shadow-sm;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-lg;
  }

  &--yesterday {
    &::before { background: linear-gradient(90deg, $primary, $primary-light); }
    .kpi-card__icon { background: linear-gradient(135deg, rgba($primary, 0.1), rgba($primary-light, 0.1)); color: $primary; }
  }

  &--month {
    &::before { background: linear-gradient(90deg, $success, #34D399); }
    .kpi-card__icon { background: linear-gradient(135deg, rgba($success, 0.1), rgba(#34D399, 0.1)); color: $success; }
  }

  &--total {
    &::before { background: linear-gradient(90deg, $warning, #FBBF24); }
    .kpi-card__icon { background: linear-gradient(135deg, rgba($warning, 0.1), rgba(#FBBF24, 0.1)); color: $warning; }
  }

  &--loading {
    .loading-placeholder {
      display: inline-block;
      width: 120px;
      height: 32px;
      background: linear-gradient(90deg, $bg-elevated 25%, $border-color 50%, $bg-elevated 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
    }
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.kpi-card__icon {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: $border-radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 28px;
    height: 28px;
  }
}

.kpi-card__content {
  flex: 1;
  min-width: 0;
}

.kpi-card__label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: $text-secondary;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-card__value {
  font-size: 26px;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.kpi-card__trend {
  position: absolute;
  top: 20px;
  right: 20px;

  .trend-icon {
    width: 20px;
    height: 20px;
    color: $success;
  }
}

// ============================================
// Filter Panel
// ============================================
.filter-panel {
  background: $bg-card;
  border-radius: $border-radius;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: $shadow-sm;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
}

.filter-panel__section {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;

  &--date {
    flex: 1;
    justify-content: flex-end;
  }
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-group__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: $text-secondary;
  white-space: nowrap;
}

.filter-icon {
  width: 18px;
  height: 18px;
  color: $text-muted;
}

.config-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: $bg-elevated;
  border: 1px solid $border-color;
  border-radius: $border-radius-sm;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  color: $text-primary;
  cursor: pointer;
  transition: $transition;

  i {
    font-size: 14px;
    color: $text-muted;
  }

  &:hover {
    background: $primary;
    border-color: $primary;
    color: white;

    i { color: white; }
  }
}

.country-select {
  min-width: 180px;

  ::v-deep .el-input__inner {
    border-radius: $border-radius-sm;
    border-color: $border-color;
    
    &:focus {
      border-color: $primary;
    }
  }
}

.date-quick-filters {
  display: flex;
  gap: 8px;
}

.date-chip {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid $border-color;
  background: $bg-elevated;
  color: $text-secondary;
  cursor: pointer;
  transition: $transition;
  white-space: nowrap;

  &:hover {
    border-color: $primary-light;
    color: $primary;
  }

  &--active {
    background: $primary;
    border-color: $primary;
    color: white;

    &:hover {
      background: $primary-dark;
      border-color: $primary-dark;
      color: white;
    }
  }
}

.custom-date-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-picker {
  ::v-deep .el-range-input {
    font-size: 13px;
  }
}

.apply-btn {
  border-radius: $border-radius-sm;
}

.current-range-display {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba($primary, 0.08);
  border-radius: $border-radius-sm;
  font-size: 12px;
  font-weight: 500;
  color: $primary;

  svg {
    width: 14px;
    height: 14px;
  }
}

// ============================================
// Charts Section
// ============================================
.charts-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-grid {
  display: grid;
  gap: 20px;

  &--2col {
    grid-template-columns: repeat(2, 1fr);

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  &--3col {
    grid-template-columns: repeat(3, 1fr);

    @media (max-width: 1200px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  &--sidebar {
    grid-template-columns: 400px 1fr;

    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
    }
  }

  &--fullwidth {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: $bg-card;
  border-radius: $border-radius;
  box-shadow: $shadow-sm;
  overflow: hidden;
  transition: $transition;

  &--clickable {
    cursor: pointer;

    &:hover {
      box-shadow: $shadow;
      transform: translateY(-2px);
    }
  }

  &--sidebar-left {
    @media (max-width: 1200px) {
      order: 2;
    }
  }
}

.chart-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid $border-color;
  background: $bg-elevated;
}

.chart-card__title {
  font-size: 15px;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.chart-card__controls {
  display: flex;
  background: $bg-card;
  border-radius: 6px;
  padding: 2px;
  border: 1px solid $border-color;
}

.period-btn {
  padding: 6px 14px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: $text-secondary;
  cursor: pointer;
  border-radius: 4px;
  transition: $transition;

  &:hover {
    color: $primary;
  }

  &--active {
    background: $primary;
    color: white;

    &:hover {
      color: white;
    }
  }
}

.chart-card__body {
  padding: 16px;
}

// ============================================
// Data Table Card
// ============================================
.data-table-card {
  background: $bg-card;
  border-radius: $border-radius;
  box-shadow: $shadow-sm;
  overflow: hidden;

  @media (max-width: 1200px) {
    order: 1;
  }
}

.data-table-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid $border-color;
  background: $bg-elevated;
}

.data-table-card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: $text-primary;
  margin: 0;

  svg {
    width: 20px;
    height: 20px;
    color: $primary;
  }
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid $border-color;
  border-radius: $border-radius-sm;
  background: $bg-card;
  font-size: 13px;
  font-weight: 500;
  color: $text-secondary;
  cursor: pointer;
  transition: $transition;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover:not(:disabled) {
    background: $success;
    border-color: $success;
    color: white;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.data-table-card__body {
  padding: 0;
}

// ============================================
// Table Styles
// ============================================
.income-table {
  ::v-deep {
    .el-table__header th {
      background: $bg-elevated !important;
      font-weight: 600;
      font-size: 12px;
      color: $text-secondary;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .el-table__row {
      transition: $transition;

      &:hover > td {
        background: rgba($primary, 0.04) !important;
      }
    }

    td {
      padding: 12px 0;
      font-size: 13px;
    }
  }
}

.country-tag {
  display: inline-block;
  padding: 4px 10px;
  background: $bg-elevated;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: $text-primary;
}

.type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &--primary {
    background: rgba($primary, 0.1);
    color: $primary;
  }

  &--success {
    background: rgba($success, 0.1);
    color: $success;
  }
}

.amount-cell {
  font-weight: 600;
  font-variant-numeric: tabular-nums;

  &--primary {
    color: $primary;
  }

  &--success {
    color: $success;
  }

  &--danger {
    color: $danger;
  }
}

// ============================================
// Dialog Styles
// ============================================
::v-deep .currency-dialog,
::v-deep .chart-detail-dialog,
::v-deep .income-detail-dialog {
  border-radius: $border-radius-lg;

  .el-dialog__header {
    padding: 20px 24px;
    border-bottom: 1px solid $border-color;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .el-dialog__body {
    padding: 24px;
    max-height: calc(90vh - 120px);
    overflow-y: auto;
  }

  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid $border-color;
  }
}

.currency-config-content {
  padding: 0;
}

.currency-selector-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 24px;

  .currency-label {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    min-width: 80px;
  }

  .currency-hint {
    width: 100%;
    font-size: 12px;
    color: $text-muted;
    margin-top: -12px;
    padding-left: 100px;
  }
}

.currency-option {
  display: flex;
  align-items: center;
  gap: 4px;
}

.currency-symbol {
  font-weight: 700;
}

.exchange-rates-config {
  background: $bg-elevated;
  border-radius: $border-radius-sm;
  padding: 20px;

  .rates-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 8px;

    svg {
      width: 20px;
      height: 20px;
      color: $primary;
    }
  }

  .rates-hint {
    font-size: 12px;
    color: $text-muted;
    margin-bottom: 16px;
    line-height: 1.5;
  }

  .rates-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .rate-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .rate-label {
      font-size: 13px;
      font-weight: 500;
      color: $text-secondary;
      min-width: 70px;
      white-space: nowrap;
    }

    .rate-unit {
      font-size: 13px;
      font-weight: 600;
      color: $text-primary;
      min-width: 40px;
    }

    .rate-reference {
      margin-left: 4px;
      color: #909399;
      font-size: 12px;
      white-space: nowrap;
    }

    .rate-reference--loading {
      color: #409EFF;
    }
  }

  .rates-footer {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px dashed #EBEEF5;
  }

  .rates-date {
    color: #909399;
    font-size: 12px;

    i {
      margin-right: 4px;
    }
  }

  .rates-error {
    margin-top: 8px;
    color: #F56C6C;
    font-size: 12px;

    i {
      margin-right: 4px;
    }
  }
}

.btn-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
}

.dialog-footer {
  text-align: right;
}

// Dialog Charts
.dialog-chart-container {
  padding: 16px 0;
}

.dialog-chart {
  width: 100%;
  height: 400px;

  &--pie { height: 450px; }
  &--sm { height: 380px; }
  &--trend { height: 380px; }
}

.dialog-chart-grid {
  display: grid;
  gap: 24px;

  &--2col {
    grid-template-columns: repeat(2, 1fr);
  }

  &--2x2 {
    grid-template-columns: repeat(2, 1fr);
  }

  &--3col {
    grid-template-columns: repeat(3, 1fr);
  }
}

.dialog-chart-item {
  background: $bg-elevated;
  border-radius: $border-radius-sm;
  padding: 16px;
}

.dialog-chart-label {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  text-align: center;
  margin: 0 0 12px;
}

.dialog-table {
  ::v-deep {
    .el-table__header th {
      background: $bg-elevated !important;
      font-weight: 600;
      font-size: 13px;
      color: $text-secondary;
    }
  }
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  background: $bg-elevated;
  color: $text-secondary;

  &--top {
    background: linear-gradient(135deg, $warning, #FBBF24);
    color: white;
  }
}

.proportion-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.proportion-bar {
  flex: 1;
  height: 6px;
  background: $border-color;
  border-radius: 3px;
  overflow: hidden;
}

.proportion-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, $primary, $primary-light);
  border-radius: 3px;
  transition: width 0.3s ease-out;
}

.proportion-value {
  font-size: 12px;
  font-weight: 600;
  color: $text-secondary;
  min-width: 42px;
  text-align: right;
}
</style>
