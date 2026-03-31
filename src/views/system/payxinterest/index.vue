<template>
  <div class="admin-page-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="90px" class="admin-search-form">
      <!-- 第一行：用户相关和权益ID -->
      <el-form-item label="用户ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="用户账号" prop="userAccount">
        <el-input
          v-model="queryParams.userAccount"
          placeholder="请输入用户账号（手机号/邮箱/用户ID）"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="权益ID" prop="interestId">
        <el-input
          v-model="queryParams.interestId"
          placeholder="请输入权益ID"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="订单ID" prop="orderId">
        <el-input
          v-model="queryParams.orderId"
          placeholder="请输入订单ID"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="权益类别" prop="interestCategory">
        <el-select v-model="queryParams.interestCategory" placeholder="请选择权益类别" clearable>
          <el-option
            v-for="item in categoryOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <!-- 第二行：权益属性和时间范围 -->
      <el-form-item label="会员等级" prop="productType">
        <el-select v-model="queryParams.productType" placeholder="请选择会员等级" clearable>
          <el-option
            v-for="item in productTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="权益状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择权益状态" clearable>
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="账户状态" prop="accountStatusQuery">
        <el-select v-model="queryParams.accountStatusQuery" placeholder="请选择账户状态" clearable>
          <el-option
            v-for="item in accountStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="有效期时间" prop="expireTimeRange">
        <el-date-picker
          v-model="queryParams.expireTimeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd HH:mm:ss"
          format="yyyy-MM-dd HH:mm:ss"
          clearable
        />
      </el-form-item>
      <el-form-item label="最近活跃时间" prop="lastActiveTimeRange">
        <el-date-picker
          v-model="queryParams.lastActiveTimeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd HH:mm:ss"
          format="yyyy-MM-dd HH:mm:ss"
          clearable
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮区域 -->
    <el-row :gutter="10" class="admin-toolbar">
      <!-- 暂时隐藏发放权益按钮
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleGrant"
          v-hasPermi="['system:payxinterest:grant']"
        >发放权益</el-button>
      </el-col>
      -->
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:payxinterest:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <div class="admin-table-wrapper">
      <el-table
        v-loading="loading"
        :data="interestList"
        stripe
        @cell-dblclick="handleCellDblClick"
        class="admin-table"
        :max-height="tableMaxHeight"
        border
      >
        <el-table-column label="权益ID" align="center" prop="interestId" width="180" show-overflow-tooltip />
        <el-table-column label="用户ID" align="center" prop="userId" width="180" show-overflow-tooltip />
        <el-table-column label="用户账号" align="center" prop="userAccount" width="150" show-overflow-tooltip />
        <el-table-column label="账户状态" align="center" prop="accountStatus" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.accountStatus === '正常' ? 'success' : 'danger'" size="small">
              {{ scope.row.accountStatus || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="会员等级" align="center" prop="productType" width="100">
          <template slot-scope="scope">
            <el-tag :type="getProductTypeTagType(scope.row.productType)" size="small">
              {{ getProductTypeName(scope.row.productType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权益类别" align="center" prop="interestCategory" width="120">
          <template slot-scope="scope">
            <el-tag :type="getCategoryTagType(scope.row.interestCategory)" size="small">
              {{ getCategoryName(scope.row.interestCategory) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="产品ID" align="center" prop="productId" width="140" show-overflow-tooltip />
        <el-table-column label="限制类型" align="center" prop="limitType" width="100">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.limitType === 0" type="success" size="small">无限制</el-tag>
            <el-tag v-else type="warning" size="small">有限制</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已用/额度" align="center" width="150">
          <template slot-scope="scope">
          <span v-if="scope.row.limitType === 0">
            <span class="used-value">{{ formatValue(scope.row.usedValue, scope.row.interestCategory) }}</span>
            <span> / </span>
            <span class="limit-value">无限制</span>
          </span>
            <span v-else>
            <span class="used-value">{{ formatValue(scope.row.usedValue, scope.row.interestCategory) }}</span>
            <span> / </span>
            <span class="limit-value">{{ formatValue(scope.row.limitValue, scope.row.interestCategory) }}</span>
          </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="90">
          <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row.status)" size="small">
              {{ getStatusName(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="重置周期" align="center" prop="resetCycle" width="100">
          <template slot-scope="scope">
            {{ getResetCycleName(scope.row.resetCycle) }}
          </template>
        </el-table-column>
        <el-table-column label="生效时间" align="center" prop="effectiveTime" width="160">
          <template slot-scope="scope">
            <span v-if="scope.row.effectiveTime" class="time-text">
              {{ parseTime(scope.row.effectiveTime, '{y}-{m}-{d} {h}:{i}') }}
            </span>
            <span v-else>立即生效</span>
          </template>
        </el-table-column>
        <el-table-column label="有效期至" align="center" prop="expireTime" width="160">
          <template slot-scope="scope">
            <span v-if="scope.row.expireType === 0">永不过期</span>
            <span v-else-if="scope.row.expireTime" class="time-text">
            {{ parseTime(scope.row.expireTime, '{y}-{m}-{d} {h}:{i}') }}
          </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="订单ID" align="center" prop="orderId" width="180" show-overflow-tooltip />
        <el-table-column label="下次产品ID" align="center" prop="nextProductId" width="140" show-overflow-tooltip>
          <template slot-scope="scope">
            <span v-if="scope.row.nextProductId">{{ scope.row.nextProductId }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="变更类型" align="center" prop="nextProductSubtype" width="100">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.nextProductSubtype === 'UPGRADE'" type="success" size="small">升级</el-tag>
            <el-tag v-else-if="scope.row.nextProductSubtype === 'DOWNGRADE'" type="warning" size="small">降级</el-tag>
            <el-tag v-else-if="scope.row.nextProductSubtype === 'CROSSGRADE'" type="info" size="small">平级切换</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="预计生效时间" align="center" prop="nextProductEffectiveTime" width="160">
          <template slot-scope="scope">
            <span v-if="scope.row.nextProductEffectiveTime" class="time-text">
              {{ parseTime(scope.row.nextProductEffectiveTime, '{y}-{m}-{d} {h}:{i}') }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最后活跃时间" align="center" prop="lastActiveTime" width="160">
          <template slot-scope="scope">
            <span v-if="scope.row.lastActiveTime">{{ parseTime(scope.row.lastActiveTime, '{y}-{m}-{d} {h}:{i}') }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="80" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-view"
              @click="handleView(scope.row)"
              v-hasPermi="['system:payxinterest:query']"
            >详情</el-button>
            <!-- 暂时隐藏收回按钮
            <el-button
              v-if="scope.row.status === 0"
              size="mini"
              type="text"
              icon="el-icon-close"
              @click="handleRevoke(scope.row)"
              v-hasPermi="['system:payxinterest:revoke']"
            >收回</el-button>
            -->
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="admin-pagination-wrapper">
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <!-- 权益详情对话框 -->
    <el-dialog title="权益详情" :visible.sync="detailOpen" width="1200px" append-to-body custom-class="admin-dialog">
      <el-tabs v-model="detailActiveTab" type="border-card">
        <!-- 基本信息标签页 -->
        <el-tab-pane label="基本信息" name="basic">
          <div style="padding: 20px;">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="用户账号">{{ userDetailData.userAccount || '-' }}</el-descriptions-item>
              <el-descriptions-item label="账户状态">
                <el-tag :type="userDetailData.accountStatus === '正常' ? 'success' : 'danger'" size="small">
                  {{ userDetailData.accountStatus || '-' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="会员等级">{{ userDetailData.memberLevel || '-' }}</el-descriptions-item>
              <el-descriptions-item label="有效期至">
                {{ userDetailData.expireTime ? parseTime(userDetailData.expireTime) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="最近活跃时间" :span="2">
                {{ userDetailData.lastActiveTime ? parseTime(userDetailData.lastActiveTime) : '-' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <!-- 权益消耗统计标签页 -->
        <el-tab-pane label="权益消耗统计" name="consumption">
          <div style="padding: 20px;">
            <!-- 转写时长消耗统计 -->
            <el-card shadow="hover" style="margin-bottom: 20px;" v-loading="transcriptionLoading">
              <div slot="header">
                <span style="font-weight: bold;">转写时长消耗统计</span>
              </div>
              <el-row :gutter="20">
                <el-col :span="12">
                  <div style="text-align: center;">
                    <div style="font-size: 24px; color: #409EFF; font-weight: bold;">
                      {{ formatConsumptionValue(consumptionStats.monthlyTotal) }}
                    </div>
                    <div style="color: #909399; margin-top: 5px;">本月总消耗</div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div style="text-align: center;">
                    <div style="font-size: 24px; color: #67C23A; font-weight: bold;">
                      {{ formatConsumptionValue(consumptionStats.totalConsumption) }}
                    </div>
                    <div style="color: #909399; margin-top: 5px;">至今总消耗</div>
                  </div>
                </el-col>
              </el-row>
              <div style="margin-top: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-weight: bold;">消耗趋势图</span>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <el-date-picker
                      v-model="transcriptionDateRange"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      value-format="yyyy-MM-dd"
                      size="small"
                      style="width: 260px;"
                      @change="handleTranscriptionDateChange"
                    />
                    <el-button
                      type="primary"
                      icon="el-icon-refresh"
                      size="small"
                      circle
                      :loading="transcriptionLoading"
                      @click="handleTranscriptionRefresh"
                      title="刷新"
                    />
                  </div>
                </div>
                <div ref="transcriptionChart" style="width: 100%; height: 300px;"></div>
              </div>
            </el-card>

            <!-- 纪要生成消耗统计 -->
            <el-card shadow="hover" style="margin-bottom: 20px;" v-loading="summaryLoading">
              <div slot="header">
                <span style="font-weight: bold;">纪要生成消耗统计</span>
              </div>
              <el-row :gutter="20">
                <el-col :span="12">
                  <div style="text-align: center;">
                    <div style="font-size: 24px; color: #409EFF; font-weight: bold;">
                      {{ formatSummaryValue(summaryStats.monthlyTotal) }}
                    </div>
                    <div style="color: #909399; margin-top: 5px;">本月总消耗token数</div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div style="text-align: center;">
                    <div style="font-size: 24px; color: #67C23A; font-weight: bold;">
                      {{ formatSummaryValue(summaryStats.totalConsumption) }}
                    </div>
                    <div style="color: #909399; margin-top: 5px;">至今总消耗token数</div>
                  </div>
                </el-col>
              </el-row>
              <div style="margin-top: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-weight: bold;">消耗趋势图</span>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <el-date-picker
                      v-model="summaryDateRange"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      value-format="yyyy-MM-dd"
                      size="small"
                      style="width: 260px;"
                      @change="handleSummaryDateChange"
                    />
                    <el-button
                      type="primary"
                      icon="el-icon-refresh"
                      size="small"
                      circle
                      :loading="summaryLoading"
                      @click="handleSummaryRefresh"
                      title="刷新"
                    />
                  </div>
                </div>
                <div ref="summaryChart" style="width: 100%; height: 300px;"></div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 权益详情标签页 -->
        <el-tab-pane label="权益详情" name="interest">
          <div style="padding: 20px;">
            <el-descriptions :column="2" border v-if="detailForm.interestId">
              <el-descriptions-item label="权益ID" :span="2">{{ detailForm.interestId }}</el-descriptions-item>
              <el-descriptions-item label="用户ID">{{ detailForm.userId }}</el-descriptions-item>
              <el-descriptions-item label="订单ID">{{ detailForm.orderId || '-' }}</el-descriptions-item>
              <el-descriptions-item label="产品ID">{{ detailForm.productId || '-' }}</el-descriptions-item>
              <el-descriptions-item label="会员等级">
                <el-tag v-if="detailForm.productType === PRODUCT_TYPE.SUPPLEMENT" size="small" :type="PRODUCT_TYPE_TAG_TYPE_MAP[PRODUCT_TYPE.SUPPLEMENT]">
                  {{ PRODUCT_TYPE_NAME_MAP[PRODUCT_TYPE.SUPPLEMENT] }}
                </el-tag>
                <el-tag v-else-if="detailForm.productType === PRODUCT_TYPE.PROFESSIONAL" size="small" :type="PRODUCT_TYPE_TAG_TYPE_MAP[PRODUCT_TYPE.PROFESSIONAL]">
                  {{ PRODUCT_TYPE_NAME_MAP[PRODUCT_TYPE.PROFESSIONAL] }}
                </el-tag>
                <el-tag v-else-if="detailForm.productType === PRODUCT_TYPE.EXPERIENCE" size="small" :type="PRODUCT_TYPE_TAG_TYPE_MAP[PRODUCT_TYPE.EXPERIENCE]">
                  {{ PRODUCT_TYPE_NAME_MAP[PRODUCT_TYPE.EXPERIENCE] }}
                </el-tag>
                <el-tag v-else-if="detailForm.productType === PRODUCT_TYPE.MASTER" size="small" :type="PRODUCT_TYPE_TAG_TYPE_MAP[PRODUCT_TYPE.MASTER]">
                  {{ PRODUCT_TYPE_NAME_MAP[PRODUCT_TYPE.MASTER] }}
                </el-tag>
                <span v-else>-</span>
              </el-descriptions-item>
              <el-descriptions-item label="权益类别">
                <el-tag :type="getCategoryTagType(detailForm.interestCategory)" size="small">
                  {{ getCategoryName(detailForm.interestCategory) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="限制类型">
                <el-tag v-if="detailForm.limitType === 0" type="success" size="small">无限制</el-tag>
                <el-tag v-else type="warning" size="small">有限制</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="限制额度">
                {{ detailForm.limitType === 0 ? '无限制' : formatValue(detailForm.limitValue, detailForm.interestCategory) }}
              </el-descriptions-item>
              <el-descriptions-item label="已使用">
                {{ formatValue(detailForm.usedValue, detailForm.interestCategory) }}
              </el-descriptions-item>
              <el-descriptions-item label="权益状态">
                <el-tag :type="getStatusTagType(detailForm.status)" size="small">
                  {{ getStatusName(detailForm.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="重置周期">{{ getResetCycleName(detailForm.resetCycle) }}</el-descriptions-item>
              <el-descriptions-item label="上次重置时间">
                {{ detailForm.lastResetTime ? parseTime(detailForm.lastResetTime) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="下次重置时间">
                {{ detailForm.nextResetTime ? parseTime(detailForm.nextResetTime) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="过期类型">
                {{ detailForm.expireType === 0 ? '永不过期' : '按时间过期' }}
              </el-descriptions-item>
              <el-descriptions-item label="生效时间">
                {{ detailForm.effectiveTime ? parseTime(detailForm.effectiveTime) : '立即生效' }}
              </el-descriptions-item>
              <el-descriptions-item label="有效期至">
                {{ detailForm.expireTime ? parseTime(detailForm.expireTime) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="订阅平台">
                <span v-if="detailForm.productType === PRODUCT_TYPE.EXPERIENCE">设备绑定</span>
                <span v-else>{{ getSubscribePlatformName(detailForm.subscribePlatform) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="订阅产品ID">{{ detailForm.subscribeProductId || '-' }}</el-descriptions-item>
              <el-descriptions-item label="自动续费">
                <el-tag v-if="detailForm.isAutoRenew === 1" type="success" size="small">是</el-tag>
                <el-tag v-else type="info" size="small">否</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ parseTime(detailForm.createTime) }}</el-descriptions-item>
              <el-descriptions-item label="创建人">{{ detailForm.createBy || '-' }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ parseTime(detailForm.updateTime) }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <!-- 权益流水日志标签页 -->
        <el-tab-pane label="权益流水日志" name="records">
          <div style="padding: 20px;">
            <el-table
              v-loading="recordListLoading"
              :data="recordList"
              stripe
              border
              :max-height="400"
            >
              <el-table-column label="权益流水ID" align="center" prop="recordId" width="200" show-overflow-tooltip />
              <el-table-column label="变动类型" align="center" prop="changeType" width="100">
                <template slot-scope="scope">
                  <el-tag :type="getChangeTypeTagType(scope.row.changeType)" size="small">
                    {{ getChangeTypeName(scope.row.changeType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="业务描述" align="left" prop="businessDesc" width="200" show-overflow-tooltip />
              <el-table-column label="订单ID" align="center" prop="orderId" width="180" show-overflow-tooltip />
              <el-table-column label="任务ID" align="center" prop="taskId" width="180" show-overflow-tooltip />
              <el-table-column label="流水状态" align="center" prop="status" width="100">
                <template slot-scope="scope">
                  <el-tag :type="getRecordStatusTagType(scope.row.status)" size="small">
                    {{ getRecordStatusName(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="变动前" align="center" prop="beforeValue" width="150" show-overflow-tooltip />
              <el-table-column label="变动后" align="center" prop="afterValue" width="150" show-overflow-tooltip />
              <el-table-column label="操作时间" align="center" prop="createTime" width="160">
                <template slot-scope="scope">
                  <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" width="100">
                <template slot-scope="scope">
                  <el-button
                    size="mini"
                    type="text"
                    @click="handleViewRecord(scope.row)"
                  >查看完整明细</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div style="margin-top: 20px; text-align: center;">
              <el-button type="primary" @click="handleViewAllRecords">查看完整权益明细</el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailOpen = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 发放权益对话框 -->
    <el-dialog title="发放权益" :visible.sync="grantOpen" width="600px" append-to-body custom-class="admin-dialog">
      <el-form ref="grantForm" :model="grantForm" :rules="grantRules" label-width="100px">
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="grantForm.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="订单ID" prop="orderId">
          <el-input v-model="grantForm.orderId" placeholder="请输入关联订单ID（可选）" />
        </el-form-item>
        <el-form-item label="产品ID" prop="productId">
          <el-input v-model="grantForm.productId" placeholder="请输入产品ID（可选）" />
        </el-form-item>
        <el-form-item label="会员等级" prop="productType">
          <el-radio-group v-model="grantForm.productType">
            <el-radio :label="PRODUCT_TYPE.SUPPLEMENT">补充包</el-radio>
            <el-radio :label="PRODUCT_TYPE.PROFESSIONAL">专业版会员</el-radio>
            <el-radio :label="PRODUCT_TYPE.EXPERIENCE">体验版会员</el-radio>
            <el-radio :label="PRODUCT_TYPE.MASTER">大师版会员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="权益类别" prop="interestCategory">
          <el-select v-model="grantForm.interestCategory" placeholder="请选择权益类别">
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="限制类型" prop="limitType">
          <el-radio-group v-model="grantForm.limitType">
            <el-radio :label="0">无限制</el-radio>
            <el-radio :label="1">有限制</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="grantForm.limitType === 1" label="限制额度" prop="limitValue">
          <el-input-number v-model="grantForm.limitValue" :min="0" :precision="2" />
          <span class="unit-text">{{ getCategoryUnit(grantForm.interestCategory) }}</span>
        </el-form-item>
        <el-form-item label="重置周期" prop="resetCycle">
          <el-select v-model="grantForm.resetCycle" placeholder="请选择重置周期">
            <el-option label="不重置" :value="0" />
            <el-option label="每月重置" :value="1" />
            <el-option label="每年重置" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="过期类型" prop="expireType">
          <el-radio-group v-model="grantForm.expireType">
            <el-radio :label="0">永不过期</el-radio>
            <el-radio :label="1">按时间过期</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="grantForm.expireType === 1" label="有效期至" prop="expireTime">
          <el-date-picker
            v-model="grantForm.expireTime"
            type="datetime"
            placeholder="选择有效期至"
            value-format="yyyy-MM-dd HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="grantOpen = false">取 消</el-button>
        <el-button type="primary" @click="submitGrant">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listPayxinterest, getPayxinterest, revokePayxinterest, grantPayxinterest, getUserInterestDetail } from "@/api/system/payxinterest";
import { listPayxinterestRecord } from "@/api/system/payxinterestRecord";
import { PRODUCT_TYPE, PRODUCT_TYPE_OPTIONS, PRODUCT_TYPE_NAME_MAP, PRODUCT_TYPE_TAG_TYPE_MAP } from "@/utils/payConstants";
import * as echarts from "echarts";

export default {
  name: "Payxinterest",
  data() {
    return {
      // 常量暴露给模板使用
      PRODUCT_TYPE: PRODUCT_TYPE,
      PRODUCT_TYPE_NAME_MAP: PRODUCT_TYPE_NAME_MAP,
      PRODUCT_TYPE_TAG_TYPE_MAP: PRODUCT_TYPE_TAG_TYPE_MAP,
      // 遮罩层
      loading: true,
      // 表格最大高度
      tableMaxHeight: 600,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 权益表格数据
      interestList: [],
      // 详情弹出层
      detailOpen: false,
      // 详情表单
      detailForm: {},
      // 详情标签页
      detailActiveTab: "basic",
      // 用户详情数据
      userDetailData: {},
      // 转写时长消耗统计数据
      consumptionStats: {
        monthlyTotal: 0,
        totalConsumption: 0,
        dailyTrend: []
      },
      // 纪要生成消耗统计数据
      summaryStats: {
        monthlyTotal: 0,
        totalConsumption: 0,
        dailyTrend: []
      },
      // 转写时长趋势图日期范围
      transcriptionDateRange: [],
      // 纪要生成趋势图日期范围
      summaryDateRange: [],
      // 转写时长加载状态
      transcriptionLoading: false,
      // 纪要生成加载状态
      summaryLoading: false,
      // 图表实例
      transcriptionChart: null,
      summaryChart: null,
      // 权益流水列表
      recordList: [],
      recordListLoading: false,
      currentDetailUserId: null,
      // 发放权益弹出层
      grantOpen: false,
      // 发放权益表单
      grantForm: {},
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: null,
        interestId: null,
        orderId: null,
        productType: null,
        interestCategory: null,
        status: null,
        userAccount: null,
        expireTimeRange: null,
        expireTimeStart: null,
        expireTimeEnd: null,
        lastActiveTimeRange: null,
        lastActiveTimeStart: null,
        lastActiveTimeEnd: null,
        accountStatusQuery: null
      },
      // 权益类别选项
      categoryOptions: [
        { value: 0, label: '转写时长' },
        { value: 1, label: '纪要生成次数' },
        { value: 2, label: '云存储空间' }
      ],
      // 会员等级选项
      productTypeOptions: PRODUCT_TYPE_OPTIONS,
      // 权益状态选项
      statusOptions: [
        { value: 0, label: '有效' },
        { value: 1, label: '已过期' },
        { value: 2, label: '已收回' },
        { value: 3, label: '待生效' }
      ],
      // 账户状态选项
      accountStatusOptions: [
        { value: 0, label: '正常' },
        { value: 1, label: '已注销' }
      ],
      // 发放权益表单校验
      grantRules: {
        userId: [
          { required: true, message: "用户ID不能为空", trigger: "blur" }
        ],
        interestCategory: [
          { required: true, message: "请选择权益类别", trigger: "change" }
        ],
        limitType: [
          { required: true, message: "请选择限制类型", trigger: "change" }
        ]
      }
    };
  },
  computed: {
    // 动态计算表格高度（基于 DOM 实际高度）
    calculatedTableHeight() {
      return this.tableMaxHeight;
    }
  },
  mounted() {
    this.updateTableHeight();
    window.addEventListener('resize', this.updateTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateTableHeight);
    // 销毁图表
    if (this.transcriptionChart) {
      this.transcriptionChart.dispose();
      this.transcriptionChart = null;
    }
    if (this.summaryChart) {
      this.summaryChart.dispose();
      this.summaryChart = null;
    }
  },
  watch: {
    showSearch() {
      this.$nextTick(() => {
        this.updateTableHeight();
      });
    },
    detailOpen(newVal) {
      if (newVal) {
        // 弹窗打开时，等待DOM更新后初始化图表
        this.$nextTick(() => {
          if (this.detailActiveTab === 'consumption') {
            this.initChart();
            this.initSummaryChart();
          }
        });
      } else {
        // 弹窗关闭时，销毁图表
        if (this.transcriptionChart) {
          this.transcriptionChart.dispose();
          this.transcriptionChart = null;
        }
        if (this.summaryChart) {
          this.summaryChart.dispose();
          this.summaryChart = null;
        }
      }
    },
    detailActiveTab(newVal) {
      if (newVal === 'consumption') {
        // 切换到消耗统计标签页时，初始化图表
        this.$nextTick(() => {
          this.initChart();
          this.initSummaryChart();
        });
      }
    }
  },
  created() {
    this.getList();
  },
  methods: {
    /** 更新表格高度 */
    updateTableHeight() {
      this.$nextTick(() => {
        // 获取页面容器
        const container = this.$el;
        if (!container) return;

        // 获取搜索表单实际高度
        const searchForm = container.querySelector('.admin-search-form');
        const searchHeight = this.showSearch && searchForm ? searchForm.offsetHeight : 0;

        // 获取工具栏实际高度
        const toolbar = container.querySelector('.admin-toolbar');
        const toolbarHeight = toolbar ? toolbar.offsetHeight : 40;

        // 分页高度（固定，包含 padding）
        const paginationHeight = 80;

        // 间距：搜索表单 margin-bottom(12) + 工具栏 margin-bottom(12) + 表格容器 margin-bottom(12) + 额外安全边距
        const margins = 50;

        // 页面容器高度是 calc(100vh - 99px)
        const viewportHeight = window.innerHeight || 800;
        const containerHeight = viewportHeight - 99;

        // 计算表格可用高度
        const calculated = containerHeight - searchHeight - toolbarHeight - paginationHeight - margins;
        this.tableMaxHeight = Math.max(300, calculated);
      });
    },
    /** 查询权益列表 */
    getList() {
      this.loading = true;
      listPayxinterest(this.queryParams).then(response => {
        this.interestList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      // 处理日期范围拆分
      if (this.queryParams.expireTimeRange && this.queryParams.expireTimeRange.length === 2) {
        this.queryParams.expireTimeStart = this.queryParams.expireTimeRange[0];
        this.queryParams.expireTimeEnd = this.queryParams.expireTimeRange[1];
      } else {
        this.queryParams.expireTimeStart = null;
        this.queryParams.expireTimeEnd = null;
      }
      if (this.queryParams.lastActiveTimeRange && this.queryParams.lastActiveTimeRange.length === 2) {
        this.queryParams.lastActiveTimeStart = this.queryParams.lastActiveTimeRange[0];
        this.queryParams.lastActiveTimeEnd = this.queryParams.lastActiveTimeRange[1];
      } else {
        this.queryParams.lastActiveTimeStart = null;
        this.queryParams.lastActiveTimeEnd = null;
      }
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      // 重置新增的查询参数
      this.queryParams.userAccount = null;
      this.queryParams.expireTimeRange = null;
      this.queryParams.expireTimeStart = null;
      this.queryParams.expireTimeEnd = null;
      this.queryParams.lastActiveTimeRange = null;
      this.queryParams.lastActiveTimeStart = null;
      this.queryParams.lastActiveTimeEnd = null;
      this.queryParams.accountStatusQuery = null;
      this.handleQuery();
    },
    /** 查看详情 */
    handleView(row) {
      this.detailActiveTab = "basic";
      this.currentDetailUserId = row.userId;

      // 获取权益详情
      getPayxinterest(row.interestId).then(response => {
        this.detailForm = response.data;
      });

      // 初始化日期范围（默认本月1日至今）
      this.initDefaultDateRange();

      // 获取用户详情和消耗统计
      this.loadUserDetail(row.userId, row.interestId);

      this.detailOpen = true;

      // 等待DOM更新后初始化图表和加载数据
      this.$nextTick(() => {
        this.initChart();
        this.initSummaryChart();
        this.loadConsumptionStats();
        this.loadRecordList();
      });
    },

    /** 初始化默认日期范围（本月1日至今） */
    initDefaultDateRange() {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const startDate = this.formatDate(firstDay);
      const endDate = this.formatDate(now);
      this.transcriptionDateRange = [startDate, endDate];
      this.summaryDateRange = [startDate, endDate];
    },

    /** 格式化日期为 yyyy-MM-dd */
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    /** 加载用户详情 */
    loadUserDetail(userId, interestId) {
      const params = {
        interestId: interestId,
        transcriptionStartDate: this.transcriptionDateRange && this.transcriptionDateRange[0] ? this.transcriptionDateRange[0] : null,
        transcriptionEndDate: this.transcriptionDateRange && this.transcriptionDateRange[1] ? this.transcriptionDateRange[1] : null,
        summaryStartDate: this.summaryDateRange && this.summaryDateRange[0] ? this.summaryDateRange[0] : null,
        summaryEndDate: this.summaryDateRange && this.summaryDateRange[1] ? this.summaryDateRange[1] : null
      };
      getUserInterestDetail(userId, params).then(response => {
        if (response.data) {
          this.userDetailData = response.data;
          if (response.data.transcriptionStats) {
            this.consumptionStats = response.data.transcriptionStats;
          }
          if (response.data.summaryStats) {
            this.summaryStats = response.data.summaryStats;
          }
        }
      });
    },

    /** 加载消耗统计 */
    loadConsumptionStats(loadType = 'all') {
      if (!this.currentDetailUserId) return;

      // 设置加载状态
      if (loadType === 'all' || loadType === 'transcription') {
        this.transcriptionLoading = true;
      }
      if (loadType === 'all' || loadType === 'summary') {
        this.summaryLoading = true;
      }

      const params = {
        interestId: this.detailForm.interestId,
        transcriptionStartDate: this.transcriptionDateRange && this.transcriptionDateRange[0] ? this.transcriptionDateRange[0] : null,
        transcriptionEndDate: this.transcriptionDateRange && this.transcriptionDateRange[1] ? this.transcriptionDateRange[1] : null,
        summaryStartDate: this.summaryDateRange && this.summaryDateRange[0] ? this.summaryDateRange[0] : null,
        summaryEndDate: this.summaryDateRange && this.summaryDateRange[1] ? this.summaryDateRange[1] : null
      };
      getUserInterestDetail(this.currentDetailUserId, params).then(response => {
        if (response.data) {
          if (response.data.transcriptionStats) {
            this.consumptionStats = response.data.transcriptionStats;
            this.updateChart();
          }
          if (response.data.summaryStats) {
            this.summaryStats = response.data.summaryStats;
            this.updateSummaryChart();
          }
        }
      }).finally(() => {
        this.transcriptionLoading = false;
        this.summaryLoading = false;
      });
    },

    /** 转写时长日期范围改变 */
    handleTranscriptionDateChange() {
      this.loadConsumptionStats('transcription');
    },

    /** 纪要生成日期范围改变 */
    handleSummaryDateChange() {
      this.loadConsumptionStats('summary');
    },

    /** 转写时长刷新 */
    handleTranscriptionRefresh() {
      this.loadConsumptionStats('transcription');
    },

    /** 纪要生成刷新 */
    handleSummaryRefresh() {
      this.loadConsumptionStats('summary');
    },

    /** 初始化图表 */
    initChart() {
      if (!this.$refs.transcriptionChart) return;

      if (this.transcriptionChart) {
        this.transcriptionChart.dispose();
      }

      this.transcriptionChart = echarts.init(this.$refs.transcriptionChart);
      this.updateChart();
    },

    /** 更新图表 */
    updateChart() {
      if (!this.transcriptionChart) return;

      const dailyTrend = this.consumptionStats.dailyTrend || [];
      const dates = dailyTrend.map(item => item.date);
      const values = dailyTrend.map(item => {
        // 将秒转换为分钟
        return Math.round(parseFloat(item.value || 0) / 60);
      });

      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            const param = params[0];
            return `日期：${param.name}<br/>消耗转写时长：${param.value}分钟`;
          }
        },
        xAxis: {
          type: 'category',
          data: dates,
          name: '日期'
        },
        yAxis: {
          type: 'value',
          name: '转写时长（分钟）'
        },
        series: [{
          data: values,
          type: 'line',
          smooth: true,
          itemStyle: {
            color: '#409EFF'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: 'rgba(64, 158, 255, 0.3)'
              }, {
                offset: 1, color: 'rgba(64, 158, 255, 0.1)'
              }]
            }
          }
        }]
      };

      this.transcriptionChart.setOption(option);
    },

    /** 初始化纪要生成图表 */
    initSummaryChart() {
      if (!this.$refs.summaryChart) return;

      if (this.summaryChart) {
        this.summaryChart.dispose();
      }

      this.summaryChart = echarts.init(this.$refs.summaryChart);
      this.updateSummaryChart();
    },

    /** 更新纪要生成图表 */
    updateSummaryChart() {
      if (!this.summaryChart) return;

      const dailyTrend = this.summaryStats.dailyTrend || [];
      const dates = dailyTrend.map(item => item.date);
      const values = dailyTrend.map(item => {
        return parseInt(item.value || 0);
      });

      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            const param = params[0];
            return `日期：${param.name}<br/>消耗token数：${param.value}`;
          }
        },
        xAxis: {
          type: 'category',
          data: dates,
          name: '日期'
        },
        yAxis: {
          type: 'value',
          name: '消耗token数'
        },
        series: [{
          data: values,
          type: 'line',
          smooth: true,
          itemStyle: {
            color: '#67C23A'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: 'rgba(103, 194, 58, 0.3)'
              }, {
                offset: 1, color: 'rgba(103, 194, 58, 0.1)'
              }]
            }
          }
        }]
      };

      this.summaryChart.setOption(option);
    },

    /** 格式化消耗值（秒转分钟） */
    formatConsumptionValue(seconds) {
      if (!seconds || seconds === 0) return '0分钟';
      const totalSeconds = parseInt(seconds);
      const minutes = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      if (minutes === 0) {
        return `${secs}秒`;
      } else if (secs === 0) {
        return `${minutes}分钟`;
      } else {
        return `${minutes}分钟${secs}秒`;
      }
    },

    /** 格式化纪要生成消耗值（token数） */
    formatSummaryValue(tokens) {
      if (!tokens || tokens === 0) return '0';
      return parseInt(tokens).toLocaleString();
    },

    /** 加载权益流水列表 */
    loadRecordList() {
      if (!this.currentDetailUserId) return;

      this.recordListLoading = true;
      const queryParams = {
        userId: this.currentDetailUserId,
        pageNum: 1,
        pageSize: 50
      };
      listPayxinterestRecord(queryParams).then(response => {
        this.recordList = response.rows || [];
        this.recordListLoading = false;
      }).catch(() => {
        this.recordListLoading = false;
      });
    },

    /** 获取变动类型名称 */
    getChangeTypeName(changeType) {
      const map = { 0: '发放', 1: '消耗', 2: '收回', 3: '过期', 4: '变更' };
      return map[changeType] || '-';
    },

    /** 获取变动类型标签类型 */
    getChangeTypeTagType(changeType) {
      const map = { 0: 'success', 1: 'warning', 2: 'danger', 3: 'info', 4: 'primary' };
      return map[changeType] || 'info';
    },

    /** 获取流水状态名称 */
    getRecordStatusName(status) {
      const map = { 0: '未执行', 1: '执行成功', 2: '执行失败', 3: '已冲正' };
      return map[status] || '-';
    },

    /** 获取流水状态标签类型 */
    getRecordStatusTagType(status) {
      const map = { 0: 'info', 1: 'success', 2: 'danger', 3: 'warning' };
      return map[status] || 'info';
    },

    /** 查看流水记录详情 */
    handleViewRecord(row) {
      // 跳转到权益流水日志页面，并自动筛选该用户
      this.$router.push({
        path: '/payxinterest/payxinterestRecord',
        query: {
          userId: row.userId
        }
      });
    },

    /** 查看完整权益明细 */
    handleViewAllRecords() {
      if (!this.currentDetailUserId) return;
      // 跳转到权益流水日志页面，并自动筛选该用户
      this.$router.push({
        path: '/payxinterest/payxinterestRecord',
        query: {
          userId: this.currentDetailUserId
        }
      });
    },
    /** 收回权益 */
    handleRevoke(row) {
      this.$modal.confirm('是否确认收回权益"' + row.interestId + '"？').then(() => {
        return revokePayxinterest(row.interestId);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("收回成功");
      }).catch(() => {});
    },
    /** 发放权益按钮 */
    handleGrant() {
      this.resetGrantForm();
      this.grantOpen = true;
    },
    /** 重置发放表单 */
    resetGrantForm() {
      this.grantForm = {
        userId: null,
        orderId: null,
        productId: null,
        productType: PRODUCT_TYPE.SUPPLEMENT,
        interestCategory: null,
        limitType: 1,
        limitValue: null,
        resetCycle: 0,
        expireType: 0,
        expireTime: null
      };
      if (this.$refs.grantForm) {
        this.$refs.grantForm.resetFields();
      }
    },
    /** 提交发放权益 */
    submitGrant() {
      this.$refs["grantForm"].validate(valid => {
        if (valid) {
          grantPayxinterest(this.grantForm).then(response => {
            this.$modal.msgSuccess("发放成功");
            this.grantOpen = false;
            this.getList();
          });
        }
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/payxinterest/export', {
        ...this.queryParams
      }, `payxinterest_${new Date().getTime()}.xlsx`);
    },
    /** 获取权益类别名称 */
    getCategoryName(category) {
      const map = { 0: '转写时长', 1: '纪要生成次数', 2: '云存储空间' };
      return map[category] || '-';
    },
    /** 获取权益类别单位 */
    getCategoryUnit(category) {
      const map = { 0: '秒', 1: '次', 2: 'KB' };
      return map[category] || '';
    },
    /** 获取权益类别标签类型 */
    getCategoryTagType(category) {
      const map = { 0: 'primary', 1: 'success', 2: 'warning' };
      return map[category] || 'info';
    },
    /** 获取会员等级名称 */
    getProductTypeName(productType) {
      return PRODUCT_TYPE_NAME_MAP[productType] || '-';
    },
    /** 获取会员等级标签类型 */
    getProductTypeTagType(productType) {
      return PRODUCT_TYPE_TAG_TYPE_MAP[productType] || 'info';
    },
    /** 获取状态名称 */
    getStatusName(status) {
      const map = { 0: '有效', 1: '已过期', 2: '已收回', 3: '待生效' };
      return map[status] || '-';
    },
    /** 获取状态标签类型 */
    getStatusTagType(status) {
      const map = { 0: 'success', 1: 'info', 2: 'danger', 3: 'warning' };
      return map[status] || 'info';
    },
    /** 获取重置周期名称 */
    getResetCycleName(resetCycle) {
      const map = { 0: '不重置', 1: '每月重置', 2: '每年重置' };
      return map[resetCycle] || '-';
    },
    /** 获取订阅平台名称 */
    getSubscribePlatformName(platform) {
      const map = { 0: '微信', 1: '支付宝', 2: '苹果', 3: '谷歌', 4: 'Stripe', 5: '其他' };
      return map[platform] || '-';
    },
    /** 格式化数值显示 */
    formatValue(value, category) {
      if (value === null || value === undefined) return '-';
      const num = parseFloat(value);
      if (isNaN(num)) return '-';
      // 转写时长转换为"X分钟Y秒"格式
      if (category === 0) {
        if (num === 0) return '0分钟0秒';
        const totalSeconds = Math.floor(num);
        const minutes = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        if (minutes === 0) {
          return `${secs}秒`;
        } else if (secs === 0) {
          return `${minutes}分钟`;
        } else {
          return `${minutes}分钟${secs}秒`;
        }
      }
      // 云存储转换为MB显示
      if (category === 2) {
        return (num / 1024).toFixed(2) + ' MB';
      }
      return num + ' 次';
    },
    /** 双击单元格复制内容 */
    handleCellDblClick(row, column, cell, event) {
      // 获取单元格文本内容
      let text = '';
      const prop = column.property;
      if (prop && row[prop] !== null && row[prop] !== undefined) {
        text = String(row[prop]);
      } else {
        // 从单元格 DOM 获取文本
        text = cell.innerText || cell.textContent || '';
      }
      text = text.trim();
      if (!text || text === '-') {
        return;
      }
      // 复制到剪贴板
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.$message.success('已复制: ' + text);
        }).catch(() => {
          this.fallbackCopy(text);
        });
      } else {
        this.fallbackCopy(text);
      }
    },
    /** 兼容复制方法 */
    fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.$message.success('已复制: ' + text);
      } catch (err) {
        this.$message.error('复制失败');
      }
      document.body.removeChild(textarea);
    }
  }
};
</script>

<style scoped lang="scss">
.used-value {
  color: #E6A23C;
  font-weight: 500;
}

.limit-value {
  color: #409EFF;
  font-weight: 500;
}

.time-text {
  color: #606266;
}

.unit-text {
  margin-left: 10px;
  color: #909399;
}
</style>
