<template>
  <div class="admin-page-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="90px" class="admin-search-form compact">
      <el-form-item label="用户ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="账号" prop="userAccount">
        <el-input
          v-model="queryParams.userAccount"
          placeholder="请输入手机号或邮箱"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="昵称" prop="nickName">
        <el-input
          v-model="queryParams.nickName"
          placeholder="请输入用户昵称"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="账户状态" prop="delFlag">
        <el-select
          v-model="queryParams.delFlag"
          placeholder="请选择账户状态"
          clearable
          size="small"
          style="width: 150px"
        >
          <el-option label="全部" value="" />
          <el-option label="正常" value="0" />
          <el-option label="已注销" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="会员状态" prop="memberType">
        <el-select
          v-model="queryParams.memberType"
          placeholder="请选择会员状态"
          clearable
          size="small"
          style="width: 150px"
        >
          <el-option label="全部" value="" />
          <el-option label="普通用户" value="不是会员" />
          <el-option label="体验会员" value="体验会员" />
          <el-option label="专业版包月会员" value="专业版包月会员" />
          <el-option label="专业版包年会员" value="专业版包年会员" />
          <el-option label="大师版包月会员" value="大师版包月会员" />
          <el-option label="大师版包年会员" value="大师版包年会员" />
        </el-select>
      </el-form-item>
      <el-form-item label="平台" prop="registerPlatform">
        <el-select
          v-model="queryParams.registerPlatform"
          placeholder="请选择平台"
          clearable
          size="small"
          style="width: 150px"
        >
          <el-option label="全部" value="" />
          <el-option label="iOS" value="ios" />
          <el-option label="Android" value="app" />
          <el-option label="Web" value="web" />
        </el-select>
      </el-form-item>
      <el-form-item label="注册时间" prop="createTimeRange">
        <el-date-picker
          v-model="createTimeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          size="small"
          style="width: 240px"
          @change="handleCreateTimeRangeChange"
        />
      </el-form-item>
      <el-form-item label="更新时间" prop="updateTimeRange">
        <el-date-picker
          v-model="updateTimeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          size="small"
          style="width: 240px"
          @change="handleUpdateTimeRangeChange"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="admin-toolbar">
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:vappuser:export']"
          class="action-btn"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <div class="admin-table-wrapper">
      <el-table
        v-loading="loading"
        :data="vappuserList"
        @selection-change="handleSelectionChange"
        @cell-dblclick="handleCellDblClick"
        stripe
        class="admin-table"
        :max-height="tableMaxHeight"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="头像" align="center" prop="avatar" width="60">
          <template slot-scope="scope">
            <el-avatar v-if="scope.row.avatar" :src="scope.row.avatar" :size="32" />
            <el-avatar v-else icon="el-icon-user-solid" :size="32" />
          </template>
        </el-table-column>
        <el-table-column label="用户ID" align="center" prop="userId" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="clickable-cell" @click="handleUpdate(scope.row)" @dblclick.stop="handleCellDblClick(scope.row, {property: 'userId'}, null, $event)">
              {{ scope.row.userId }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="用户昵称" align="center" prop="nickName" width="130" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="clickable-cell" @click="handleUpdate(scope.row)" @dblclick.stop="handleCellDblClick(scope.row, {property: 'nickName'}, null, $event)">
              {{ scope.row.nickName || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="用户账号" align="center" prop="phonenumber" width="180" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="clickable-cell" @click="handleUpdate(scope.row)" @dblclick.stop="handleCellDblClick(scope.row, {property: scope.row.phonenumber ? 'phonenumber' : 'email'}, null, $event)">
              {{ scope.row.phonenumber || scope.row.email || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="会员类型" align="center" prop="memberType" width="130">
          <template slot-scope="scope">
            <el-tag v-if="isMember(scope.row.memberType)" size="mini" type="primary">
              {{ getMemberTypeName(scope.row.memberType) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="订阅平台" align="center" prop="subscripeServePlat" width="110">
          <template slot-scope="scope">
            <!-- 仅会员订阅显示订阅平台 -->
            <template v-if="isSubscriptionMember(scope.row.memberType)">
              <el-tag v-if="scope.row.subscripeServePlat" size="mini" type="warning">
                {{ getPlatformName(scope.row.subscripeServePlat) }}
              </el-tag>
              <span v-else>-</span>
            </template>
            <!-- 体验会员显示"设备绑定" -->
            <el-tag v-else-if="isExperienceMember(scope.row.memberType)" size="mini" type="info">设备绑定</el-tag>
            <!-- 其他显示 - -->
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="订阅产品" align="center" prop="subscripeProductId" width="140">
          <template slot-scope="scope">
            <!-- 仅会员订阅显示订阅产品 -->
            <template v-if="isSubscriptionMember(scope.row.memberType)">
              <el-tag v-if="scope.row.subscripeProductId" size="mini" type="success">
                {{ getProductName(scope.row.subscripeProductId) }}
              </el-tag>
              <span v-else>-</span>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="自动续费" align="center" prop="isContinueSubscripeFlag" width="85">
          <template slot-scope="scope">
            <!-- 仅会员订阅显示自动续费 -->
            <template v-if="isSubscriptionMember(scope.row.memberType)">
              <el-tag v-if="scope.row.isContinueSubscripeFlag === '是'" size="mini" type="success">
                <i class="el-icon-check"></i> 是
              </el-tag>
              <el-tag v-else size="mini" type="info">
                <i class="el-icon-close"></i> 否
              </el-tag>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="会员转写到期" align="center" prop="memberEffictiveEndTimeRecord" width="160">
          <template slot-scope="scope">
            <!-- 会员订阅显示到期时间 -->
            <span v-if="isSubscriptionMember(scope.row.memberType) && scope.row.memberEffictiveEndTimeRecord" class="time-text time-badge">
            <i class="el-icon-time"></i>
            {{ parseTime(scope.row.memberEffictiveEndTimeRecord, '{y}-{m}-{d} {h}:{i}') }}
          </span>
            <!-- 体验会员显示永不过期 -->
            <el-tag v-else-if="isExperienceMember(scope.row.memberType)" size="mini" type="success">永不过期</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="会员转写时长" align="center" prop="memberRecordRead" width="110">
          <template slot-scope="scope">
            <template v-if="isMasterMember(scope.row.memberType)">
              <el-tag type="success" size="mini" effect="plain">
                <i class="el-icon-infinity"></i> 无限制
              </el-tag>
            </template>
            <span v-else-if="isMember(scope.row.memberType) && scope.row.memberRecordRead && scope.row.memberRecordRead !== '0' && parseInt(scope.row.memberRecordRead) > 0">
            {{ scope.row.memberRecordRead }} 分钟
          </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" align="center" prop="createTime" width="160">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" align="center" prop="updateTime" width="160">
          <template slot-scope="scope">
            <span v-if="scope.row.updateTime">{{ parseTime(scope.row.updateTime, '{y}-{m}-{d} {h}:{i}') }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="最近登录" align="center" prop="lastLoginTime" width="160">
          <template slot-scope="scope">
            <span v-if="scope.row.lastLoginTime">{{ parseTime(scope.row.lastLoginTime, '{y}-{m}-{d} {h}:{i}') }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="账户状态" align="center" prop="delFlag" width="100">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.delFlag === '2'" type="danger" size="mini">已注销</el-tag>
            <el-tag v-else type="success" size="mini">正常</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="国家" align="center" prop="country" width="130" show-overflow-tooltip />
        <el-table-column label="注册ip" align="center" prop="registerIp" width="130" show-overflow-tooltip />
        <el-table-column label="app版本" align="center" prop="appVersion" width="130" show-overflow-tooltip />
        <el-table-column label="注册设备" align="center" prop="deviceModel" width="130" show-overflow-tooltip />
        <el-table-column label="注册平台" align="center" prop="registerPlatform" width="130" show-overflow-tooltip />
        <el-table-column label="服务器" align="center" prop="registerServer" width="130" show-overflow-tooltip />
        <el-table-column label="注册方式" align="center" prop="registerMethod" width="130" show-overflow-tooltip />


        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-view"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['system:vappuser:query']"
            >详细</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-money"
              @click="handlePay(scope.row)"
              v-hasPermi="['system:vappuser:payTest']"
            >支付</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-remove"
              @click="handleLogOff(scope.row)"
              v-hasPermi="['system:vappuser:logoff']"
              :disabled="scope.row.delFlag === '2'"
            >注销</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-circle-close"
              @click="handleCancelSubscription(scope.row)"
              v-hasPermi="['system:vappuser:cancelSubscription']"
              v-if="isStripeSubscriptionMember(scope.row)"
            >取消订阅</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="admin-pagination-wrapper">
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <!-- 用户详情对话框 -->
    <el-dialog
      :title="title"
      :visible.sync="open"
      width="1200px"
      append-to-body
      :close-on-click-modal="false"
      custom-class="user-detail-dialog"
    >
      <div v-if="form.userId" class="user-detail-container">
        <el-tabs v-model="activeTab" @tab-click="handleTabClick">
          <!-- 基本信息标签页 -->
          <el-tab-pane label="基本信息" name="basic" v-if="checkPermi(['system:vappuser:tab:basic'])">
            <el-card class="info-card" shadow="hover">
              <div slot="header" class="info-header">
                <i class="el-icon-user-solid"></i>
                <span class="info-title">基本信息</span>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-user"></i>
                    <span>用户ID</span>
                  </div>
                  <div class="info-value" @dblclick="handleCellDblClick({userId: form.userId}, {property: 'userId'}, null, $event)">
                    {{ form.userId || '-' }}
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-edit-outline"></i>
                    <span>用户昵称</span>
                  </div>
                  <div class="info-value" @dblclick="handleCellDblClick({nickName: form.nickName}, {property: 'nickName'}, null, $event)">
                    {{ form.nickName || '-' }}
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-message"></i>
                    <span>用户邮箱</span>
                  </div>
                  <div class="info-value" @dblclick="handleCellDblClick({email: form.email}, {property: 'email'}, null, $event)">
                    {{ form.email || '-' }}
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-phone"></i>
                    <span>手机号码</span>
                  </div>
                  <div class="info-value" @dblclick="handleCellDblClick({phonenumber: form.phonenumber}, {property: 'phonenumber'}, null, $event)">
                    {{ form.phonenumber || '-' }}
                  </div>
                </div>

                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-camera"></i>
                    <span>国家</span>
                  </div>
                  <div class="info-value" @dblclick="handleCellDblClick({country: form.country}, {property: 'country'}, null, $event)">
                    {{ form.country || '-' }}
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-ice-tea"></i>
                    <span>注册ip</span>
                  </div>
                  <div class="info-value" @dblclick="handleCellDblClick({registerIp: form.registerIp}, {property: 'registerIp'}, null, $event)">
                    {{ form.registerIp || '-' }}
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-pie-chart"></i>
                    <span>app版本</span>
                  </div>
                  <div class="info-value" @dblclick="handleCellDblClick({phonenumber: form.appVersion}, {property: 'appVersion'}, null, $event)">
                    {{ form.appVersion || '-' }}
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-place"></i>
                    <span>注册设备</span>
                  </div>
                  <div class="info-value" @dblclick="handleCellDblClick({deviceModel: form.deviceModel}, {property: 'deviceModel'}, null, $event)">
                    {{ form.deviceModel || '-' }}
                  </div>
                </div>

                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-attract"></i>
                    <span>手机品牌</span>
                  </div>
                  <div class="info-value" @dblclick="handleCellDblClick({deviceBrand: form.deviceBrand}, {property: 'deviceBrand'}, null, $event)">
                    {{ form.deviceBrand || '-' }}
                  </div>
                </div>

                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-baseball"></i>
                    <span>系统版本</span>
                  </div>
                  <div class="info-value" @dblclick="handleCellDblClick({deviceSystemVersion: form.deviceSystemVersion}, {property: 'deviceSystemVersion'}, null, $event)">
                    {{ form.deviceSystemVersion || '-' }}
                  </div>
                </div>


                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-s-claim"></i>
                    <span>注册平台</span>
                  </div>
                  <div class="info-value" @dblclick="handleCellDblClick({registerPlatform: form.registerPlatform}, {property: 'registerPlatform'}, null, $event)">
                    {{ form.registerPlatform || '-' }}
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-s-fold"></i>
                    <span>注册服务器</span>
                  </div>
                  <div class="info-value" @dblclick="handleCellDblClick({registerServer: form.registerServer}, {property: 'registerServer'}, null, $event)">
                    {{ form.registerServer || '-' }}
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-video-pause"></i>
                    <span>注册方式</span>
                  </div>
                  <div class="info-value" @dblclick="handleCellDblClick({registerMethod: form.registerMethod}, {property: 'registerMethod'}, null, $event)">
                    {{ form.registerMethod || '-' }}
                  </div>
                </div>

                <div class="info-item" v-if="form.avatar">
                  <div class="info-label">
                    <i class="el-icon-picture"></i>
                    <span>头像地址</span>
                  </div>
                  <div class="info-value avatar-link" @dblclick="handleCellDblClick({avatar: form.avatar}, {property: 'avatar'}, null, $event)">
                    {{ form.avatar }}
                  </div>
                </div>
                <div class="info-item" v-if="form.wechatId || form.googleId || form.appleId">
                  <div class="info-label">
                    <i class="el-icon-connection"></i>
                    <span>绑定账号</span>
                  </div>
                  <div class="info-value">
                    <el-tag v-if="form.wechatId" size="small" type="success" class="bind-tag">微信</el-tag>
                    <el-tag v-if="form.googleId" size="small" type="warning" class="bind-tag">谷歌</el-tag>
                    <el-tag v-if="form.appleId" size="small" type="info" class="bind-tag">苹果</el-tag>
                  </div>
                </div>
                <!-- 会员状态 -->
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-medal"></i>
                    <span>会员状态</span>
                  </div>
                  <div class="info-value">
                    <el-tag v-if="isMember(form.memberType)" size="small" type="primary">
                      {{ getMemberTypeName(form.memberType) }}
                    </el-tag>
                    <span v-else>普通用户</span>
                  </div>
                </div>
                <!-- 更新时间 -->
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-refresh"></i>
                    <span>更新时间</span>
                  </div>
                  <div class="info-value">
                    {{ form.updateTime ? parseTime(form.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') : '-' }}
                  </div>
                </div>
                <!-- 最近登录时间 -->
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-time"></i>
                    <span>注册时间</span>
                  </div>
                  <div class="info-value">
                    {{ form.createTime ? parseTime(form.createTime, '{y}-{m}-{d} {h}:{i}:{s}') : '-' }}
                  </div>
                </div>
                <!-- 最近登录时间 -->
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-alarm-clock"></i>
                    <span>最近登录</span>
                  </div>
                  <div class="info-value">
                    {{ form.lastLoginTime ? parseTime(form.lastLoginTime, '{y}-{m}-{d} {h}:{i}:{s}') : '-' }}
                  </div>
                </div>
              </div>
            </el-card>
          </el-tab-pane>

          <!-- 权益列表标签页 -->
          <el-tab-pane label="权益列表" name="interests" v-if="checkPermi(['system:vappuser:tab:interests'])">
            <el-card class="interests-card" shadow="hover">
              <div slot="header" class="interests-header">
                <i class="el-icon-coin"></i>
                <span class="interests-title">权益列表</span>
                <span class="interests-count" v-if="userInterests.length > 0">(共 {{ userInterests.length }} 项)</span>
              </div>
              <el-table
                v-loading="interestsLoading"
                :data="userInterests"
                size="small"
                border
                stripe
                class="interests-table"
                :max-height="dialogTableMaxHeight"
                :header-cell-style="{background: '#f5f7fa', color: '#606266', fontWeight: '600'}"
                :row-style="{height: '50px'}"
                @cell-dblclick="handleCellDblClick"
              >
                <template slot="empty">
                  <div class="empty-interests">
                    <i class="el-icon-box"></i>
                    <p>暂无权益数据</p>
                  </div>
                </template>
                <el-table-column label="会员等级" width="110" align="center" fixed="left">
                  <template slot-scope="scope">
                    <el-tag v-if="scope.row.productType === PRODUCT_TYPE.PROFESSIONAL" :type="PRODUCT_TYPE_TAG_TYPE_MAP[PRODUCT_TYPE.PROFESSIONAL]" size="small" effect="dark">
                      <i class="el-icon-vip-card"></i> {{ PRODUCT_TYPE_NAME_MAP[PRODUCT_TYPE.PROFESSIONAL] }}
                    </el-tag>
                    <el-tag v-else-if="scope.row.productType === PRODUCT_TYPE.EXPERIENCE" :type="PRODUCT_TYPE_TAG_TYPE_MAP[PRODUCT_TYPE.EXPERIENCE]" size="small" effect="dark">
                      <i class="el-icon-star-on"></i> {{ PRODUCT_TYPE_NAME_MAP[PRODUCT_TYPE.EXPERIENCE] }}
                    </el-tag>
                    <el-tag v-else-if="scope.row.productType === PRODUCT_TYPE.MASTER" :type="PRODUCT_TYPE_TAG_TYPE_MAP[PRODUCT_TYPE.MASTER]" size="small" effect="dark">
                      <i class="el-icon-trophy"></i> {{ PRODUCT_TYPE_NAME_MAP[PRODUCT_TYPE.MASTER] }}
                    </el-tag>
                    <el-tag v-else :type="PRODUCT_TYPE_TAG_TYPE_MAP[PRODUCT_TYPE.SUPPLEMENT]" size="small" effect="dark">
                      <i class="el-icon-box"></i> {{ PRODUCT_TYPE_NAME_MAP[PRODUCT_TYPE.SUPPLEMENT] }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="权益类别" width="100" align="center">
                  <template slot-scope="scope">
                    <el-tag :type="scope.row.interestCategory === 0 ? 'primary' : 'info'" size="small" plain>
                      {{ scope.row.interestCategory === 0 ? '转写时长' : '存储空间' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="额度" width="120" align="right">
                  <template slot-scope="scope">
                    <template v-if="scope.row.limitType === 0 || scope.row.limitValue === null">
                      <el-tag type="success" size="small" effect="plain">
                        <i class="el-icon-infinity"></i> 无限制
                      </el-tag>
                    </template>
                    <template v-else>
                      <span class="number-value">{{ formatMinutes(scope.row.limitValue) }}</span>
                    </template>
                  </template>
                </el-table-column>
                <el-table-column label="已用" width="120" align="right">
                  <template slot-scope="scope">
                    <span class="number-value used-value">{{ formatMinutes(scope.row.usedValue) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="剩余" width="120" align="right">
                  <template slot-scope="scope">
                    <template v-if="scope.row.limitType === 0">
                      <el-tag type="success" size="small" effect="plain">
                        <i class="el-icon-infinity"></i> 无限制
                      </el-tag>
                    </template>
                    <template v-else>
                      <span class="number-value remaining-value">{{ formatMinutes(scope.row.limitValue - scope.row.usedValue) }}</span>
                    </template>
                  </template>
                </el-table-column>
                <el-table-column label="自动续费" width="100" align="center">
                  <template slot-scope="scope">
                    <template v-if="scope.row.productType === PRODUCT_TYPE.PROFESSIONAL || scope.row.productType === PRODUCT_TYPE.EXPERIENCE || scope.row.productType === PRODUCT_TYPE.MASTER">
                      <el-tag v-if="scope.row.isAutoRenew === 1" type="success" size="small" effect="plain">
                        <i class="el-icon-check"></i> 是
                      </el-tag>
                      <el-tag v-else type="info" size="small" effect="plain">
                        <i class="el-icon-close"></i> 否
                      </el-tag>
                    </template>
                    <span v-else class="empty-text">-</span>
                  </template>
                </el-table-column>
                <el-table-column label="订阅平台" width="130" align="center">
                  <template slot-scope="scope">
                    <template v-if="scope.row.productType === PRODUCT_TYPE.PROFESSIONAL || scope.row.productType === PRODUCT_TYPE.MASTER">
                      <el-tag v-if="scope.row.subscribePlatform !== null && scope.row.subscribePlatform !== undefined" type="warning" size="small" effect="plain">
                        {{ getPlatformNameFromCode(scope.row.subscribePlatform) }}
                      </el-tag>
                      <span v-else class="empty-text">-</span>
                    </template>
                    <template v-else-if="scope.row.productType === PRODUCT_TYPE.EXPERIENCE">
                      <el-tag type="info" size="small" effect="plain">
                        <i class="el-icon-mobile-phone"></i> 设备绑定
                      </el-tag>
                    </template>
                    <span v-else class="empty-text">-</span>
                  </template>
                </el-table-column>
                <el-table-column label="订阅产品" width="200" align="left" show-overflow-tooltip>
                  <template slot-scope="scope">
                    <template v-if="scope.row.productType === PRODUCT_TYPE.PROFESSIONAL || scope.row.productType === PRODUCT_TYPE.EXPERIENCE || scope.row.productType === PRODUCT_TYPE.MASTER">
                      <el-tag v-if="scope.row.subscribeProductId" type="primary" size="small" effect="plain">
                        {{ getProductName(scope.row.subscribeProductId) }}
                      </el-tag>
                      <span v-else class="empty-text">-</span>
                    </template>
                    <span v-else class="empty-text">-</span>
                  </template>
                </el-table-column>
                <el-table-column label="过期时间" width="160" align="center">
                  <template slot-scope="scope">
                    <!-- 体验会员：永不过期 -->
                    <template v-if="scope.row.productType === PRODUCT_TYPE.EXPERIENCE">
                      <el-tag type="success" size="small" effect="plain">
                        <i class="el-icon-time"></i> 永不过期
                      </el-tag>
                    </template>
                    <!-- 专业版/大师版会员：显示具体过期时间 -->
                    <template v-else-if="scope.row.productType === PRODUCT_TYPE.PROFESSIONAL || scope.row.productType === PRODUCT_TYPE.MASTER">
                      <span v-if="scope.row.expireTime" class="time-value">
                        <i class="el-icon-calendar"></i>
                        {{ parseTime(scope.row.expireTime, '{y}-{m}-{d} {h}:{i}') }}
                      </span>
                      <span v-else class="empty-text">-</span>
                    </template>
                    <!-- 补充包：显示过期时间 -->
                    <template v-else>
                      <span v-if="scope.row.expireTime" class="time-value">
                        <i class="el-icon-calendar"></i>
                        {{ parseTime(scope.row.expireTime, '{y}-{m}-{d} {h}:{i}') }}
                      </span>
                      <span v-else class="empty-text">-</span>
                    </template>
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="90" align="center">
                  <template slot-scope="scope">
                    <el-tag v-if="scope.row.status === 0" type="success" size="small" effect="dark">
                      <i class="el-icon-check"></i> 有效
                    </el-tag>
                    <el-tag v-else-if="scope.row.status === 1" type="info" size="small" effect="dark">
                      <i class="el-icon-time"></i> 过期
                    </el-tag>
                    <el-tag v-else type="danger" size="small" effect="dark">
                      <i class="el-icon-close"></i> 已收回
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="下次重置" width="140" align="center">
                  <template slot-scope="scope">
                    <span v-if="scope.row.nextResetTime" class="time-value">
                      <i class="el-icon-refresh"></i>
                      {{ parseTime(scope.row.nextResetTime, '{y}-{m}-{d}') }}
                    </span>
                    <span v-else class="empty-text">-</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>

          <!-- 绑定的设备标签页 -->
          <el-tab-pane label="绑定的设备" name="devices" v-if="checkPermi(['system:vappuser:tab:devices'])">
            <el-form :model="deviceQueryParams" ref="deviceQueryForm" size="small" :inline="true" style="margin-bottom: 15px;">
              <el-form-item label="设备序列号" prop="productSn">
                <el-input
                  v-model="deviceQueryParams.productSn"
                  placeholder="请输入设备序列号"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleDeviceQuery"
                />
              </el-form-item>
              <el-form-item label="设备名称" prop="productName">
                <el-input
                  v-model="deviceQueryParams.productName"
                  placeholder="请输入设备名称"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleDeviceQuery"
                />
              </el-form-item>
              <el-form-item label="MAC地址" prop="macAddress">
                <el-input
                  v-model="deviceQueryParams.macAddress"
                  placeholder="请输入MAC地址"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleDeviceQuery"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="mini" @click="handleDeviceQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="mini" @click="resetDeviceQuery">重置</el-button>
              </el-form-item>
            </el-form>
            <el-table
              v-loading="deviceLoading"
              :data="deviceList"
              size="small"
              border
              stripe
              :max-height="dialogTableMaxHeight"
              :header-cell-style="{background: '#f5f7fa', color: '#606266', fontWeight: '600'}"
              @cell-dblclick="handleCellDblClick"
            >
              <el-table-column label="设备序列号" prop="productSn" width="180" show-overflow-tooltip />
              <el-table-column label="设备名称" prop="productName" width="150" show-overflow-tooltip />
              <el-table-column label="MAC地址" prop="macAddress" width="150" show-overflow-tooltip />
              <el-table-column label="绑定时间" prop="bindTime" width="160" align="center">
                <template slot-scope="scope">
                  <span v-if="scope.row.bindTime">{{ parseTime(scope.row.bindTime, '{y}-{m}-{d} {h}:{i}') }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="解绑时间" prop="unbindTime" width="160" align="center">
                <template slot-scope="scope">
                  <span v-if="scope.row.unbindTime">{{ parseTime(scope.row.unbindTime, '{y}-{m}-{d} {h}:{i}') }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="绑定状态" prop="status" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.status === '1'" type="success" size="small">已绑定</el-tag>
                  <el-tag v-else type="info" size="small">已解绑</el-tag>
                </template>
              </el-table-column>
              <!-- 自定义空数据显示 -->
              <template slot="empty">
                <div v-if="!deviceLoading" class="empty-data">
                  <i class="el-icon-box"></i>
                  <p>暂无设备数据</p>
                </div>
              </template>
            </el-table>
            <pagination
              v-show="deviceTotal > 0"
              :total="deviceTotal"
              :page.sync="deviceQueryParams.pageNum"
              :limit.sync="deviceQueryParams.pageSize"
              @pagination="loadUserDevices"
            />
          </el-tab-pane>

          <!-- 会员订阅订单标签页 -->
          <el-tab-pane label="会员订阅订单" name="subscribeOrders" v-if="checkPermi(['system:vappuser:tab:subscribeOrders'])">
            <el-form :model="subscribeOrderQueryParams" ref="subscribeOrderQueryForm" size="small" :inline="true" style="margin-bottom: 15px;">
              <el-form-item label="订单号" prop="orderNo">
                <el-input
                  v-model="subscribeOrderQueryParams.orderNo"
                  placeholder="请输入订单号"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleSubscribeOrderQuery"
                />
              </el-form-item>
              <el-form-item label="产品名称" prop="productName">
                <el-input
                  v-model="subscribeOrderQueryParams.productName"
                  placeholder="请输入产品名称"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleSubscribeOrderQuery"
                />
              </el-form-item>
              <el-form-item label="订单状态" prop="orderStatus">
                <el-select v-model="subscribeOrderQueryParams.orderStatus" placeholder="全部" clearable style="width: 150px">
                  <el-option label="全部" value="" />
                  <el-option label="支付成功" value="成功" />
                  <el-option label="待支付" value="待支付" />
                  <el-option label="已退款" value="已退款" />
                  <el-option label="已关闭" value="已取消" />
                  <el-option label="支付失败" value="支付失败" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="mini" @click="handleSubscribeOrderQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="mini" @click="resetSubscribeOrderQuery">重置</el-button>
              </el-form-item>
            </el-form>
            <el-table
              v-loading="subscribeOrderLoading"
              :data="subscribeOrderList"
              size="small"
              border
              stripe
              :max-height="dialogTableMaxHeight"
              :header-cell-style="{background: '#f5f7fa', color: '#606266', fontWeight: '600'}"
              @cell-dblclick="handleCellDblClick"
            >
              <el-table-column label="订单号" prop="orderNo" width="180" show-overflow-tooltip />
              <el-table-column label="产品名称" prop="productName" width="150" show-overflow-tooltip />
              <el-table-column label="支付渠道" prop="buyServerPlatform" width="120" align="center">
                <template slot-scope="scope">
                  <el-tag :type="getPayChannelType(scope.row.buyServerPlatform)" size="small">
                    {{ formatPayChannel(scope.row.buyServerPlatform) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="客户端" prop="platform" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag :type="getPlatformType(scope.row.platform)" size="small" effect="plain">
                    {{ formatPlatform(scope.row.platform) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="应付金额" prop="payAmount" width="120" align="right" />
              <el-table-column label="实付金额" prop="amtPaid" width="120" align="right" />
              <el-table-column label="币种" prop="currency" width="80" align="center" />
              <el-table-column label="订单状态" prop="orderStatus" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag :type="getOrderStatusType(scope.row.orderStatus)" size="small">
                    {{ formatOrderStatus(scope.row.orderStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="权限发放" prop="permissionSendFlag" width="100" align="center" />
              <el-table-column label="购买时间" prop="buyDate" width="160" align="center">
                <template slot-scope="scope">
                  <span v-if="scope.row.buyDate">{{ parseTime(scope.row.buyDate, '{y}-{m}-{d} {h}:{i}') }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <!-- 自定义空数据显示 -->
              <template slot="empty">
                <div v-if="!subscribeOrderLoading" class="empty-data">
                  <i class="el-icon-box"></i>
                  <p>暂无会员订阅订单数据</p>
                </div>
              </template>
            </el-table>
            <pagination
              v-show="subscribeOrderTotal > 0"
              :total="subscribeOrderTotal"
              :page.sync="subscribeOrderQueryParams.pageNum"
              :limit.sync="subscribeOrderQueryParams.pageSize"
              @pagination="loadUserSubscribeOrders"
            />
          </el-tab-pane>

          <!-- 补充包订单标签页 -->
          <el-tab-pane label="补充包订单" name="bills" v-if="checkPermi(['system:vappuser:tab:bills'])">
            <el-form :model="billQueryParams" ref="billQueryForm" size="small" :inline="true" style="margin-bottom: 15px;">
              <el-form-item label="订单号" prop="orderNo">
                <el-input
                  v-model="billQueryParams.orderNo"
                  placeholder="请输入订单号"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleBillQuery"
                />
              </el-form-item>
              <el-form-item label="商品名称" prop="productName">
                <el-input
                  v-model="billQueryParams.productName"
                  placeholder="请输入商品名称"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleBillQuery"
                />
              </el-form-item>
              <el-form-item label="订单状态" prop="orderStatus">
                <el-input
                  v-model="billQueryParams.orderStatus"
                  placeholder="请输入订单状态"
                  clearable
                  style="width: 150px"
                  @keyup.enter.native="handleBillQuery"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="mini" @click="handleBillQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="mini" @click="resetBillQuery">重置</el-button>
              </el-form-item>
            </el-form>
            <el-table
              v-loading="billLoading"
              :data="billList"
              size="small"
              border
              stripe
              :max-height="dialogTableMaxHeight"
              :header-cell-style="{background: '#f5f7fa', color: '#606266', fontWeight: '600'}"
              @cell-dblclick="handleCellDblClick"
            >
              <el-table-column label="订单号" prop="orderNo" width="180" show-overflow-tooltip />
              <el-table-column label="商品名称" prop="productName" width="150" show-overflow-tooltip />
              <el-table-column label="支付渠道" prop="buyServerPlatform" width="120" align="center">
                <template slot-scope="scope">
                  <el-tag :type="getPayChannelType(scope.row.buyServerPlatform)" size="small">
                    {{ formatPayChannel(scope.row.buyServerPlatform) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="客户端" prop="platform" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag :type="getPlatformType(scope.row.platform)" size="small" effect="plain">
                    {{ formatPlatform(scope.row.platform) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="应付金额" prop="payAmount" width="120" align="right" />
              <el-table-column label="实付金额" prop="amtPaid" width="120" align="right" />
              <el-table-column label="退款金额" prop="amtRefunded" width="120" align="right" />
              <el-table-column label="币种" prop="currency" width="80" align="center" />
              <el-table-column label="订单状态" prop="orderStatus" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag :type="getOrderStatusType(scope.row.orderStatus)" size="small">
                    {{ formatOrderStatus(scope.row.orderStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="权限发放" prop="permissionSendFlag" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.permissionSendFlag === '已下发权限'" type="success" size="small">已下发权限</el-tag>
                  <el-tag v-else type="info" size="small">{{ scope.row.permissionSendFlag || '-' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="购买时间" prop="buyDate" width="160" align="center">
                <template slot-scope="scope">
                  <span v-if="scope.row.buyDate">{{ parseTime(scope.row.buyDate, '{y}-{m}-{d} {h}:{i}') }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <!-- 自定义空数据显示 -->
              <template slot="empty">
                <div v-if="!billLoading" class="empty-data">
                  <i class="el-icon-box"></i>
                  <p>暂无补充包订单数据</p>
                </div>
              </template>
            </el-table>
            <pagination
              v-show="billTotal > 0"
              :total="billTotal"
              :page.sync="billQueryParams.pageNum"
              :limit.sync="billQueryParams.pageSize"
              @pagination="loadUserBills"
            />
          </el-tab-pane>

          <!-- 录音文件标签页 -->
          <el-tab-pane label="录音文件" name="audioFiles" v-if="checkPermi(['system:vappuser:tab:audioFiles'])">
            <el-form :model="audioFileQueryParams" ref="audioFileQueryForm" size="small" :inline="true" style="margin-bottom: 15px;">
              <el-form-item label="文件名称" prop="fileName">
                <el-input
                  v-model="audioFileQueryParams.fileName"
                  placeholder="请输入文件名称"
                  clearable
                  style="width: 300px"
                  @keyup.enter.native="handleAudioFileQuery"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="mini" @click="handleAudioFileQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="mini" @click="resetAudioFileQuery">重置</el-button>
              </el-form-item>
            </el-form>
            <el-table
              v-loading="audioFileLoading"
              :data="audioFileList"
              size="small"
              border
              stripe
              :max-height="dialogTableMaxHeight"
              :header-cell-style="{background: '#f5f7fa', color: '#606266', fontWeight: '600'}"
              @cell-dblclick="handleCellDblClick"
            >
              <el-table-column label="文件ID" prop="uploadId" width="200" show-overflow-tooltip />
              <el-table-column label="文件名称" prop="fileName" width="200" show-overflow-tooltip />
              <el-table-column label="文件大小" prop="fileSize" width="120" align="right">
                <template slot-scope="scope">
                  <span v-if="scope.row.fileSize">{{ formatFileSize(scope.row.fileSize) }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="文件类型" prop="extension" width="100" align="center">
                <template slot-scope="scope">
                  <span v-if="scope.row.extension">{{ scope.row.extension.toUpperCase() }}</span>
                  <span v-else class="empty-text">未知类型</span>
                </template>
              </el-table-column>
              <el-table-column label="上传时间" prop="createTime" width="160" align="center">
                <template slot-scope="scope">
                  <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="录音时长" prop="duration" width="100" align="center">
                <template slot-scope="scope">
                  <span v-if="scope.row.duration !== null && scope.row.duration !== undefined">
                    {{ formatDuration(scope.row.duration) }}
                  </span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="转写状态" prop="recordStatus" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.recordStatus === '1'" type="success" size="small">已转写</el-tag>
                  <el-tag v-else type="info" size="small">未转写</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="总结状态" prop="SummaryStatus" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.SummaryStatus === '1'" type="success" size="small">已总结</el-tag>
                  <el-tag v-else type="info" size="small">未总结</el-tag>
                </template>
              </el-table-column>
              <!-- 自定义空数据显示 -->
              <template slot="empty">
                <div v-if="!audioFileLoading" class="empty-data">
                  <i class="el-icon-box"></i>
                  <p>暂无录音文件数据</p>
                </div>
              </template>
            </el-table>
            <pagination
              v-show="audioFileTotal > 0"
              :total="audioFileTotal"
              :page.sync="audioFileQueryParams.pageNum"
              :limit.sync="audioFileQueryParams.pageSize"
              @pagination="loadUserAudioFiles"
            />
          </el-tab-pane>

          <!-- 转写明细记录标签页 -->
          <el-tab-pane label="转写明细记录" name="transcriptions" v-if="checkPermi(['system:vappuser:tab:transcriptions'])">
            <el-form :model="transcriptionQueryParams" ref="transcriptionQueryForm" size="small" :inline="true" style="margin-bottom: 15px;">
              <el-form-item label="任务ID" prop="taskId">
                <el-input
                  v-model="transcriptionQueryParams.taskId"
                  placeholder="请输入任务ID"
                  clearable
                  style="width: 200px"
                  @keyup.enter.native="handleTranscriptionQuery"
                />
              </el-form-item>
              <el-form-item label="识别平台" prop="platform">
                <el-input
                  v-model="transcriptionQueryParams.platform"
                  placeholder="请输入识别平台"
                  clearable
                  style="width: 150px"
                  @keyup.enter.native="handleTranscriptionQuery"
                />
              </el-form-item>
              <el-form-item label="状态" prop="status">
                <el-select v-model="transcriptionQueryParams.status" placeholder="请选择状态" clearable style="width: 120px">
                  <el-option label="成功" value="success" />
                  <el-option label="失败" value="failed" />
                  <el-option label="处理中" value="processing" />
                  <el-option label="待处理" value="pending" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="mini" @click="handleTranscriptionQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="mini" @click="resetTranscriptionQuery">重置</el-button>
              </el-form-item>
            </el-form>
            <el-table
              v-loading="transcriptionLoading"
              :data="transcriptionList"
              size="small"
              border
              stripe
              :max-height="dialogTableMaxHeight"
              :header-cell-style="{background: '#f5f7fa', color: '#606266', fontWeight: '600'}"
              @cell-dblclick="handleCellDblClick"
            >
              <el-table-column label="任务ID" prop="taskId" width="200" show-overflow-tooltip />
              <el-table-column label="识别平台" prop="platform" width="120" align="center" />
              <el-table-column label="音频文件地址" prop="fileUrl" width="250" show-overflow-tooltip />
              <el-table-column label="AI模型" prop="model" width="120" align="center" />
              <el-table-column label="识别语种" prop="language" width="120" align="center" />
              <el-table-column label="音频时长" prop="durationSec" width="120" align="center">
                <template slot-scope="scope">
                  <span v-if="scope.row.durationSec !== null && scope.row.durationSec !== undefined">
                    {{ formatMinutes(scope.row.durationSec) }}
                  </span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" prop="status" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag v-if="getTranscriptionStatusType(scope.row.status) === 'success'" type="success" size="small">成功</el-tag>
                  <el-tag v-else-if="getTranscriptionStatusType(scope.row.status) === 'failed'" type="danger" size="small">失败</el-tag>
                  <el-tag v-else-if="getTranscriptionStatusType(scope.row.status) === 'processing'" type="warning" size="small">处理中</el-tag>
                  <el-tag v-else type="info" size="small">待处理</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="创建时间" prop="createdAt" width="160" align="center">
                <template slot-scope="scope">
                  <span v-if="scope.row.createdAt">{{ parseTime(scope.row.createdAt, '{y}-{m}-{d} {h}:{i}') }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <!-- 自定义空数据显示 -->
              <template slot="empty">
                <div v-if="!transcriptionLoading" class="empty-data">
                  <i class="el-icon-box"></i>
                  <p>暂无转写明细记录数据</p>
                </div>
              </template>
            </el-table>
            <pagination
              v-show="transcriptionTotal > 0"
              :total="transcriptionTotal"
              :page.sync="transcriptionQueryParams.pageNum"
              :limit.sync="transcriptionQueryParams.pageSize"
              @pagination="loadUserTranscriptions"
            />
          </el-tab-pane>

          <!-- 用户反馈数据标签页 -->
          <el-tab-pane label="用户反馈数据" name="feedbacks" v-if="checkPermi(['system:vappuser:tab:feedbacks'])">
            <el-form :model="feedbackQueryParams" ref="feedbackQueryForm" size="small" :inline="true" style="margin-bottom: 15px;">
              <el-form-item label="反馈内容" prop="suggestionContent">
                <el-input
                  v-model="feedbackQueryParams.suggestionContent"
                  placeholder="请输入反馈内容"
                  clearable
                  style="width: 300px"
                  @keyup.enter.native="handleFeedbackQuery"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="mini" @click="handleFeedbackQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="mini" @click="resetFeedbackQuery">重置</el-button>
              </el-form-item>
            </el-form>
            <el-table
              v-loading="feedbackLoading"
              :data="feedbackList"
              size="small"
              border
              stripe
              :max-height="dialogTableMaxHeight"
              :header-cell-style="{background: '#f5f7fa', color: '#606266', fontWeight: '600'}"
              @cell-dblclick="handleCellDblClick"
            >
              <el-table-column label="反馈内容" prop="suggestionContent" min-width="300" show-overflow-tooltip />
              <el-table-column label="反馈图片" prop="suggestionImglist" width="200" show-overflow-tooltip>
                <template slot-scope="scope">
                  <div v-if="scope.row.suggestionImglist" class="feedback-images">
                    <el-image
                      v-for="(img, index) in scope.row.suggestionImglist.split(',')"
                      :key="index"
                      :src="img"
                      :preview-src-list="scope.row.suggestionImglist.split(',')"
                      fit="cover"
                      style="width: 50px; height: 50px; margin-right: 5px; cursor: pointer;"
                    />
                  </div>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="创建时间" prop="createTime" width="160" align="center">
                <template slot-scope="scope">
                  <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <!-- 自定义空数据显示 -->
              <template slot="empty">
                <div v-if="!feedbackLoading" class="empty-data">
                  <i class="el-icon-box"></i>
                  <p>暂无用户反馈数据</p>
                </div>
              </template>
            </el-table>
            <pagination
              v-show="feedbackTotal > 0"
              :total="feedbackTotal"
              :page.sync="feedbackQueryParams.pageNum"
              :limit.sync="feedbackQueryParams.pageSize"
              @pagination="loadUserFeedbacks"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel" size="small">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- Stripe支付对话框 -->
    <el-dialog title="Stripe支付" :visible.sync="payDialog.open" width="800px" append-to-body>
      <el-form :model="payDialog.form" label-width="100px">
        <el-form-item label="用户ID">
          <el-input v-model="payDialog.form.userId" disabled />
        </el-form-item>
<!--        <el-form-item label="支付类型" required>-->
<!--          <el-radio-group v-model="payDialog.form.paymentType" @change="handlePaymentTypeChange">-->
<!--            <el-radio label="one-time">一次性支付</el-radio>-->
<!--            <el-radio label="subscription">订阅支付</el-radio>-->
<!--          </el-radio-group>-->
<!--        </el-form-item>-->
        <el-form-item label="产品" required>
          <el-select v-model="payDialog.form.productId" placeholder="请选择产品" style="width: 100%" :loading="payDialog.loading">
            <el-option
              v-for="product in payDialog.productList"
              :key="product.productId"
              :label="product.productName + ' - ¥' + product.productPrice"
              :value="product.productId">
            </el-option>
          </el-select>
        </el-form-item>
<!--        <el-form-item label="所在地区" required>-->
<!--          <el-radio-group v-model="payDialog.form.isAboardFlag">-->
<!--            <el-radio :label="false">国内</el-radio>-->
<!--            <el-radio :label="true">国外</el-radio>-->
<!--          </el-radio-group>-->
<!--        </el-form-item>-->
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="payDialog.open = false">取 消</el-button>
        <el-button type="primary" @click="handlePayConfirm">确认支付</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listVappuser, getVappuser, delVappuser, addVappuser, updateVappuser, getUserInterests, logOffVappuser, getUserDevices, getUserSubscribeOrders, getUserBills, getUserAudioFiles, getUserTranscriptions, getUserFeedbacks, cancelStripeSubscription } from "@/api/system/vappuser";
import { getSubscripeProductList, getServiceBagList } from "@/api/app/product";
import { PRODUCT_TYPE, PRODUCT_TYPE_NAME_MAP, PRODUCT_TYPE_TAG_TYPE_MAP } from "@/utils/payConstants";
import { addDateRange } from "@/utils/ruoyi";
import { checkPermi as checkPermission } from "@/utils/permission";

export default {
  name: "Vappuser",
  data() {
    return {
      // 常量暴露给模板使用
      PRODUCT_TYPE: PRODUCT_TYPE,
      PRODUCT_TYPE_NAME_MAP: PRODUCT_TYPE_NAME_MAP,
      PRODUCT_TYPE_TAG_TYPE_MAP: PRODUCT_TYPE_TAG_TYPE_MAP,
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // VIEW表格数据
      vappuserList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: null,
        userAccount: null, // 账号（手机号或邮箱）
        nickName: null,
        email: null,
        phonenumber: null,
        avatar: null,
        wechatId: null,
        googleId: null,
        appleId: null,
        delFlag: "0", // 账户状态：默认正常(0)，全部("")、正常(0)、已注销(2)
        memberType: "", // 会员状态：全部、普通用户、XX会员
        registerPlatform: "", // 平台：全部、iOS(ios)、Android(app)、Web(web)
        memberRecordRead: null,
        memberEffictiveEndTimeRecord: null,
        memberUsedRecordRead: null,
        servicebagRecordRead: null,
        servicebagRecordReadEndTime: null,
        servicebagUsedRecordRead: null,
        isContinueSubscripeFlag: null,
        subscripeServePlat: null,
        subscripeProductId: null,
        resetPermissionTime: null,
        password: null
      },
      // 时间范围选择器
      createTimeRange: [], // 注册时间范围
      updateTimeRange: [], // 更新时间范围
      // 表单参数
      form: {},
      // 用户权益列表
      userInterests: [],
      // 权益加载状态
      interestsLoading: false,
      // 当前激活的标签页
      activeTab: "basic",
      // 标签页加载状态记录
      tabLoaded: {
        basic: false,
        interests: false,
        devices: false,
        subscribeOrders: false,
        bills: false,
        audioFiles: false,
        transcriptions: false,
        feedbacks: false
      },
      // 绑定的设备
      deviceList: [],
      deviceTotal: 0,
      deviceLoading: false,
      deviceQueryParams: {
        pageNum: 1,
        pageSize: 10,
        productSn: null,
        productName: null,
        macAddress: null
      },
      // 会员订阅订单
      subscribeOrderList: [],
      subscribeOrderTotal: 0,
      subscribeOrderLoading: false,
      subscribeOrderQueryParams: {
        pageNum: 1,
        pageSize: 10,
        orderNo: null,
        productName: null,
        orderStatus: null
      },
      // 补充包订单
      billList: [],
      billTotal: 0,
      billLoading: false,
      billQueryParams: {
        pageNum: 1,
        pageSize: 10,
        orderNo: null,
        productName: null,
        orderStatus: null
      },
      // 录音文件
      audioFileList: [],
      audioFileTotal: 0,
      audioFileLoading: false,
      audioFileQueryParams: {
        pageNum: 1,
        pageSize: 10,
        fileName: null
      },
      // 转写明细记录
      transcriptionList: [],
      transcriptionTotal: 0,
      transcriptionLoading: false,
      transcriptionQueryParams: {
        pageNum: 1,
        pageSize: 10,
        taskId: null,
        platform: null,
        status: null
      },
      // 用户反馈数据
      feedbackList: [],
      feedbackTotal: 0,
      feedbackLoading: false,
      feedbackQueryParams: {
        pageNum: 1,
        pageSize: 10,
        suggestionContent: null
      },
      // 表单校验
      rules: {
        userId: [
          { required: true, message: "用户ID不能为空", trigger: "blur" }
        ],
      },
      // 支付对话框参数
      payDialog: {
        open: false,
        loading: false,
        form: {
          userId: null,
          paymentType: "subscription",
          productId: null,
          isAboardFlag: false // true=国外，false=国内
        },
        productList: []
      },
      // 表格最大高度
      tableMaxHeight: 600,
      // 对话框内表格最大高度
      dialogTableMaxHeight: 400
    };
  },
  computed: {
    // 动态计算表格高度
    calculatedTableHeight() {
      // 基础高度：视口高度减去其他元素高度
      // 搜索表单：约 70px（展开时）或 0（收起时）
      // 工具栏：约 40px
      // 分页：约 80px（包括 padding 和 margin）
      // 页面 padding：40px（上下各20px）
      // 表格与分页间距：12px
      // 其他边距：约 20px
      const searchHeight = this.showSearch ? 70 : 0;
      const toolbarHeight = 40;
      const paginationHeight = 60; // 分页高度预留
      const padding = 40;
      const tablePaginationGap = 12; // 统一的表格与分页间距
      const margins = 20;
      const tableBottomPadding = 8; // 表格底部 padding，确保最后一行完整显示
      const tableWrapperMargin = 12; // 统一的表格容器 margin-bottom
      const reserved = searchHeight + toolbarHeight + paginationHeight + padding + tablePaginationGap + margins + tableBottomPadding + tableWrapperMargin;

      // 视口高度 - 保留空间，最小 300px，最大不限制（但不超过视口）
      const viewportHeight = window.innerHeight || 800;
      const calculated = viewportHeight - reserved - 94; // 84px 是顶部导航栏高度
      return Math.max(300, calculated); // 移除最大高度限制，确保表格不会遮挡分页
    },
    // 对话框内表格高度
    calculatedDialogTableHeight() {
      // 对话框高度约 80vh，减去标签页头部、卡片头部、搜索表单、分页等
      const viewportHeight = window.innerHeight || 800;
      const dialogHeight = viewportHeight * 0.8; // 对话框高度
      const reserved = 200; // 标签页头部、卡片头部、搜索表单、分页等
      const calculated = dialogHeight - reserved;
      return Math.max(250, Math.min(500, calculated));
    }
  },
  mounted() {
    // 计算表格高度
    this.updateTableHeight();
    // 监听窗口大小变化
    window.addEventListener('resize', this.updateTableHeight);
  },
  beforeDestroy() {
    // 移除事件监听
    window.removeEventListener('resize', this.updateTableHeight);
  },
  watch: {
    // 监听搜索表单显示状态变化
    showSearch() {
      this.$nextTick(() => {
        this.updateTableHeight();
      });
    }
  },
  created() {
    this.getList();
  },
  methods: {
    /** 权限检查方法 */
    checkPermi(permissions) {
      return checkPermission(permissions);
    },
    /** 更新表格高度 */
    updateTableHeight() {
      this.$nextTick(() => {
        // 使用计算属性计算高度
        const height = this.calculatedTableHeight;
        this.tableMaxHeight = height;
        // 同时更新对话框内表格高度
        const dialogHeight = this.calculatedDialogTableHeight;
        this.dialogTableMaxHeight = dialogHeight;
      });
    },
    /** 查询VIEW列表 */
    getList() {
      this.loading = true;
      listVappuser(this.queryParams).then(response => {
        this.vappuserList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
      this.resetTabData();
    },
    // 表单重置
    reset() {
      this.form = {
        userId: null,
        nickName: null,
        email: null,
        phonenumber: null,
        avatar: null,
        createTime: null,
        wechatId: null,
        googleId: null,
        appleId: null,
        memberType: null,
        memberRecordRead: null,
        memberEffictiveEndTimeRecord: null,
        memberUsedRecordRead: null,
        servicebagRecordRead: null,
        servicebagRecordReadEndTime: null,
        servicebagUsedRecordRead: null,
        isContinueSubscripeFlag: null,
        subscripeServePlat: null,
        subscripeProductId: null,
        resetPermissionTime: null,
        password: null
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      // 处理时间范围参数
      this.addDateRange(this.queryParams, this.createTimeRange, 'Time');
      this.addDateRange(this.queryParams, this.updateTimeRange, 'UpdateTime');
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      // 重置所有查询参数
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        userId: null,
        userAccount: null,
        nickName: null,
        email: null,
        phonenumber: null,
        avatar: null,
        wechatId: null,
        googleId: null,
        appleId: null,
        delFlag: "0", // 默认筛选正常用户
        memberType: "",
        registerPlatform: "",
        memberRecordRead: null,
        memberEffictiveEndTimeRecord: null,
        memberUsedRecordRead: null,
        servicebagRecordRead: null,
        servicebagRecordReadEndTime: null,
        servicebagUsedRecordRead: null,
        isContinueSubscripeFlag: null,
        subscripeServePlat: null,
        subscripeProductId: null,
        resetPermissionTime: null,
        password: null
      };
      this.createTimeRange = [];
      this.updateTimeRange = [];
      this.handleQuery();
    },
    /** 注册时间范围变化 */
    handleCreateTimeRangeChange(val) {
      this.createTimeRange = val || [];
    },
    /** 更新时间范围变化 */
    handleUpdateTimeRangeChange(val) {
      this.updateTimeRange = val || [];
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.userId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加VIEW";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      this.resetTabData();
      const userId = row.userId || this.ids;
      getVappuser(userId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "用户详情";
        this.activeTab = "basic";
        // 基本信息标签页默认已加载
        this.tabLoaded.basic = true;
      });
    },
    /** 重置标签页数据 */
    resetTabData() {
      this.activeTab = "basic";
      this.tabLoaded = {
        basic: false,
        interests: false,
        devices: false,
        subscribeOrders: false,
        bills: false,
        audioFiles: false,
        transcriptions: false,
        feedbacks: false
      };
      this.userInterests = [];
      this.deviceList = [];
      this.deviceTotal = 0;
      this.deviceQueryParams = { pageNum: 1, pageSize: 10, productSn: null, productName: null, macAddress: null };
      this.subscribeOrderList = [];
      this.subscribeOrderTotal = 0;
      this.subscribeOrderQueryParams = { pageNum: 1, pageSize: 10, orderNo: null, productName: null, orderStatus: null };
      this.billList = [];
      this.billTotal = 0;
      this.billQueryParams = { pageNum: 1, pageSize: 10, orderNo: null, productName: null, orderStatus: null };
      this.audioFileList = [];
      this.audioFileTotal = 0;
      this.audioFileQueryParams = { pageNum: 1, pageSize: 10, fileName: null };
      this.transcriptionList = [];
      this.transcriptionTotal = 0;
      this.transcriptionQueryParams = { pageNum: 1, pageSize: 10, taskId: null, platform: null, status: null };
      this.feedbackList = [];
      this.feedbackTotal = 0;
      this.feedbackQueryParams = { pageNum: 1, pageSize: 10, suggestionContent: null };
    },
    /** 标签页切换事件 */
    handleTabClick(tab) {
      const tabName = tab.name;
      // 只有首次点击时才加载数据（懒加载）
      if (!this.tabLoaded[tabName] && this.form.userId) {
        switch (tabName) {
          case "interests":
            this.loadUserInterests(this.form.userId);
            break;
          case "devices":
            this.loadUserDevices();
            break;
          case "subscribeOrders":
            this.loadUserSubscribeOrders();
            break;
          case "bills":
            this.loadUserBills();
            break;
          case "audioFiles":
            this.loadUserAudioFiles();
            break;
          case "transcriptions":
            this.loadUserTranscriptions();
            break;
          case "feedbacks":
            this.loadUserFeedbacks();
            break;
        }
      }
    },
    /** 加载用户权益列表 */
    loadUserInterests(userId) {
      if (this.tabLoaded.interests) return;
      this.interestsLoading = true;
      getUserInterests(userId).then(response => {
        this.userInterests = response.data || [];
        this.interestsLoading = false;
        this.tabLoaded.interests = true;
      }).catch(() => {
        this.interestsLoading = false;
      });
    },
    /** 加载用户绑定的设备列表 */
    loadUserDevices() {
      this.deviceLoading = true;
      getUserDevices(this.form.userId, this.deviceQueryParams).then(response => {
        this.deviceList = response.rows || [];
        this.deviceTotal = response.total || 0;
        this.deviceLoading = false;
        this.tabLoaded.devices = true;
      }).catch(() => {
        this.deviceLoading = false;
      });
    },
    /** 加载用户会员订阅订单列表 */
    loadUserSubscribeOrders() {
      this.subscribeOrderLoading = true;
      getUserSubscribeOrders(this.form.userId, this.subscribeOrderQueryParams).then(response => {
        this.subscribeOrderList = response.rows || [];
        this.subscribeOrderTotal = response.total || 0;
        this.subscribeOrderLoading = false;
        this.tabLoaded.subscribeOrders = true;
      }).catch(() => {
        this.subscribeOrderLoading = false;
      });
    },
    /** 加载用户补充包订单列表 */
    loadUserBills() {
      this.billLoading = true;
      getUserBills(this.form.userId, this.billQueryParams).then(response => {
        this.billList = response.rows || [];
        this.billTotal = response.total || 0;
        this.billLoading = false;
        this.tabLoaded.bills = true;
      }).catch(() => {
        this.billLoading = false;
      });
    },
    /** 加载用户录音文件列表 */
    loadUserAudioFiles() {
      this.audioFileLoading = true;
      getUserAudioFiles(this.form.userId, this.audioFileQueryParams).then(response => {
        this.audioFileList = response.rows || [];
        this.audioFileTotal = response.total || 0;
        this.audioFileLoading = false;
        this.tabLoaded.audioFiles = true;
      }).catch(() => {
        this.audioFileLoading = false;
      });
    },
    /** 加载用户转写明细记录列表 */
    loadUserTranscriptions() {
      this.transcriptionLoading = true;
      getUserTranscriptions(this.form.userId, this.transcriptionQueryParams).then(response => {
        this.transcriptionList = response.rows || [];
        this.transcriptionTotal = response.total || 0;
        this.transcriptionLoading = false;
        this.tabLoaded.transcriptions = true;
      }).catch(() => {
        this.transcriptionLoading = false;
      });
    },
    /** 加载用户反馈数据列表 */
    loadUserFeedbacks() {
      this.feedbackLoading = true;
      getUserFeedbacks(this.form.userId, this.feedbackQueryParams).then(response => {
        this.feedbackList = response.rows || [];
        this.feedbackTotal = response.total || 0;
        this.feedbackLoading = false;
        this.tabLoaded.feedbacks = true;
      }).catch(() => {
        this.feedbackLoading = false;
      });
    },
    /** 格式化文件大小 */
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    /** 设备搜索 */
    handleDeviceQuery() {
      this.deviceQueryParams.pageNum = 1;
      this.loadUserDevices();
    },
    /** 设备重置 */
    resetDeviceQuery() {
      this.deviceQueryParams = {
        pageNum: 1,
        pageSize: 10,
        productSn: null,
        productName: null,
        macAddress: null
      };
      this.loadUserDevices();
    },
    /** 会员订阅订单搜索 */
    handleSubscribeOrderQuery() {
      this.subscribeOrderQueryParams.pageNum = 1;
      this.loadUserSubscribeOrders();
    },
    /** 会员订阅订单重置 */
    resetSubscribeOrderQuery() {
      this.subscribeOrderQueryParams = {
        pageNum: 1,
        pageSize: 10,
        orderNo: null,
        productName: null,
        orderStatus: null
      };
      this.loadUserSubscribeOrders();
    },
    /** 补充包订单搜索 */
    handleBillQuery() {
      this.billQueryParams.pageNum = 1;
      this.loadUserBills();
    },
    /** 补充包订单重置 */
    resetBillQuery() {
      this.billQueryParams = {
        pageNum: 1,
        pageSize: 10,
        orderNo: null,
        productName: null,
        orderStatus: null
      };
      this.loadUserBills();
    },
    /** 录音文件搜索 */
    handleAudioFileQuery() {
      this.audioFileQueryParams.pageNum = 1;
      this.loadUserAudioFiles();
    },
    /** 录音文件重置 */
    resetAudioFileQuery() {
      this.audioFileQueryParams = {
        pageNum: 1,
        pageSize: 10,
        fileName: null
      };
      this.loadUserAudioFiles();
    },
    /** 转写记录搜索 */
    handleTranscriptionQuery() {
      this.transcriptionQueryParams.pageNum = 1;
      this.loadUserTranscriptions();
    },
    /** 转写记录重置 */
    resetTranscriptionQuery() {
      this.transcriptionQueryParams = {
        pageNum: 1,
        pageSize: 10,
        taskId: null,
        platform: null,
        status: null
      };
      this.loadUserTranscriptions();
    },
    /** 反馈搜索 */
    handleFeedbackQuery() {
      this.feedbackQueryParams.pageNum = 1;
      this.loadUserFeedbacks();
    },
    /** 反馈重置 */
    resetFeedbackQuery() {
      this.feedbackQueryParams = {
        pageNum: 1,
        pageSize: 10,
        suggestionContent: null
      };
      this.loadUserFeedbacks();
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.userId != null) {
            updateVappuser(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addVappuser(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const userIds = row.userId || this.ids;
      this.$modal.confirm('是否确认删除VIEW编号为"' + userIds + '"的数据项？').then(function() {
        return delVappuser(userIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/vappuser/export', {
        ...this.queryParams
      }, `vappuser_${new Date().getTime()}.xlsx`)
    },
    /** 支付按钮操作 */
    handlePay(row) {
      this.payDialog.form.userId = row.userId;
      this.payDialog.form.paymentType = "subscription";
      this.payDialog.form.productId = null;
      this.payDialog.form.isAboardFlag = false; // 默认为国内
      this.payDialog.open = true;
      // 加载产品列表
      this.loadProductList();
    },
    /** 支付类型改变 */
    handlePaymentTypeChange() {
      this.payDialog.form.productId = null;
      this.loadProductList();
    },
    /** 加载产品列表 */
    loadProductList() {
      this.payDialog.loading = true;
      // 使用默认的 productBuyPlatform，可以根据实际情况调整
      const requestData = {
        productBuyPlatform: "stripe", // 默认使用 stripe，可根据实际情况调整
        appVersion: "1.0.0",
        isAboardFlag: false // 产品列表加载时不需要传地区参数
      };

      if (this.payDialog.form.paymentType === "subscription") {
        // 订阅产品
        getSubscripeProductList(requestData).then(response => {
          this.payDialog.productList = response.data || [];
          this.payDialog.loading = false;
        }).catch(() => {
          this.payDialog.productList = [];
          this.payDialog.loading = false;
        });
      } else {
        // 一次性支付 - 获取服务包产品（包含云存储和录音转写）
        getServiceBagList(requestData).then(response => {
          const data = response.data || {};
          // 合并云存储和录音转写服务包
          const storageBag = data.storageBag || [];
          const recordBag = data.recordBag || [];
          this.payDialog.productList = [...storageBag, ...recordBag];
          this.payDialog.loading = false;
        }).catch(() => {
          this.payDialog.productList = [];
          this.payDialog.loading = false;
        });
      }
    },
    /** 确认支付 */
    handlePayConfirm() {
      if (!this.payDialog.form.productId) {
        this.$modal.msgWarning("请选择产品");
        return;
      }
      // 跳转到支付页面（只传 isAboardFlag，后端根据它判断是否为订阅）
      const params = {
        userId: this.payDialog.form.userId,
        productId: this.payDialog.form.productId,
        isAboardFlag: this.payDialog.form.isAboardFlag
      };
      const query = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
      var url = `/pay/stripe/checkout?${query}`;
      console.log('跳转到支付页面:', url);
      this.payDialog.open = false;
      // 使用 window.location.href 跳转，因为 checkout 页面会自动调用接口并跳转
      window.location.href = url;
    },
    /** 取消Stripe订阅 */
    handleCancelSubscription(row) {
      const userId = row.userId;
      const memberType = row.memberType || '会员';
      const message = `
        <div style="line-height: 1.8;">
          <p style="margin: 0 0 15px 0; font-size: 14px;">
            确认取消用户 <strong style="color: #409EFF;">"${userId}"</strong> 的Stripe订阅吗？
          </p>
          <div style="background-color: #FDF6EC; border-left: 4px solid #E6A23C; padding: 12px 15px; margin: 15px 0; border-radius: 4px;">
            <p style="margin: 0; color: #E6A23C; font-weight: bold; font-size: 14px;">
              ⚠️ 当前会员类型：${memberType}
            </p>
          </div>
          <div style="margin-top: 15px; padding-left: 5px;">
            <p style="margin: 8px 0; color: #606266; font-size: 13px;">
              <span style="display: inline-block; width: 6px; height: 6px; background-color: #67C23A; border-radius: 50%; margin-right: 8px; vertical-align: middle;"></span>
              订阅将在当前周期结束时取消
            </p>
            <p style="margin: 8px 0; color: #606266; font-size: 13px;">
              <span style="display: inline-block; width: 6px; height: 6px; background-color: #67C23A; border-radius: 50%; margin-right: 8px; vertical-align: middle;"></span>
              用户可继续使用到当前周期结束
            </p>
            <p style="margin: 8px 0; color: #606266; font-size: 13px;">
              <span style="display: inline-block; width: 6px; height: 6px; background-color: #909399; border-radius: 50%; margin-right: 8px; vertical-align: middle;"></span>
              Stripe会发送webhook通知，系统将自动处理权益
            </p>
          </div>
        </div>
      `;
      this.$msgbox.confirm(message, '取消Stripe订阅', {
        confirmButtonText: '确认取消订阅',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }).then(() => {
        return cancelStripeSubscription(userId); // 固定为到期取消
      }).then((response) => {
        if (response.code === 200) {
          const data = response.data || {};
          if (data.status === 'scheduled') {
            this.$modal.msgSuccess(`订阅将在 ${data.cancelAt ? new Date(data.cancelAt).toLocaleString() : '当前周期结束'} 时取消`);
          } else {
            this.$modal.msgSuccess("订阅已取消");
          }
          this.getList();
        } else {
          this.$modal.msgError(response.msg || "取消订阅失败");
        }
      }).catch(() => {});
    },
    /** 注销用户 */
    handleLogOff(row) {
      const userId = row.userId;
      const message = `
        <div style="line-height: 1.8;">
          <p style="margin: 0 0 15px 0; font-size: 14px;">
            确认注销用户 <strong style="color: #409EFF;">"${userId}"</strong> 吗？
          </p>
          <div style="background-color: #FFF7E6; border-left: 4px solid #E6A23C; padding: 12px 15px; margin: 15px 0; border-radius: 4px;">
            <p style="margin: 0; color: #E6A23C; font-weight: bold; font-size: 14px;">
              ⚠️ 警告：一旦注销账户将无法找回，此操作不可逆！
            </p>
          </div>
          <div style="margin-top: 15px; padding-left: 5px;">
            <p style="margin: 8px 0; color: #606266; font-size: 13px;">
              <span style="display: inline-block; width: 6px; height: 6px; background-color: #909399; border-radius: 50%; margin-right: 8px; vertical-align: middle;"></span>
              清除所有设备登录会话
            </p>
            <p style="margin: 8px 0; color: #606266; font-size: 13px;">
              <span style="display: inline-block; width: 6px; height: 6px; background-color: #909399; border-radius: 50%; margin-right: 8px; vertical-align: middle;"></span>
              用户无法再次登录
            </p>
            <p style="margin: 8px 0; color: #606266; font-size: 13px;">
              <span style="display: inline-block; width: 6px; height: 6px; background-color: #909399; border-radius: 50%; margin-right: 8px; vertical-align: middle;"></span>
              账户数据将被标记为已注销
            </p>
          </div>
        </div>
      `;
      this.$msgbox.confirm(message, '注销用户', {
        confirmButtonText: '确认注销',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }).then(() => {
        return logOffVappuser(userId);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("用户注销成功");
      }).catch(() => {});
    },
    /** 判断是否是会员 */
    isMember(memberType) {
      if (!memberType) return false;
      // 如果是"0"或"不是会员"，则不是会员
      if (memberType === '0' || memberType === '不是会员') {
        return false;
      }
      return true;
    },
    /** 判断是否为订阅会员（包月/包年） */
    isSubscriptionMember(memberType) {
      if (!memberType) return false;
      return memberType.includes('包月') || memberType.includes('包年');
    },
    /** 判断是否为Stripe订阅会员（可以取消订阅） */
    isStripeSubscriptionMember(row) {
      if (!row) return false;
      // 必须是订阅会员（包月/包年）
      if (!this.isSubscriptionMember(row.memberType)) return false;
      // 订阅平台必须是stripe
      const platform = row.subscripeServePlat;
      if (!platform) return false;
      return platform.toLowerCase().includes('stripe');
    },
    /** 判断是否为体验会员 */
    isExperienceMember(memberType) {
      return memberType === '体验会员';
    },
    /** 判断是否为大师版会员 */
    isMasterMember(memberType) {
      if (!memberType) return false;
      return memberType.includes('大师版会员');
    },
    /** 获取会员类型名称 */
    getMemberTypeName(memberType) {
      if (!memberType) return '-';
      const memberTypeMap = {
        '0': '不是会员',
        '1': '体验会员',
        '2': '专业版包月会员',
        '3': '专业版包年会员',
        '4': '大师版包月会员',
        '5': '大师版包年会员'
      };
      return memberTypeMap[memberType] || memberType;
    },
    /** 获取订阅平台名称 */
    getPlatformName(platform) {
      if (!platform) return '-';
      // stripe开头的都显示为stripe
      if (platform.toLowerCase().startsWith('stripe')) {
        return 'Stripe';
      }
      const platformMap = {
        'alipay': '支付宝',
        'wechat': '微信支付',
        'stripe': 'Stripe',
        'apple': '苹果',
        'google': '谷歌'
      };
      return platformMap[platform.toLowerCase()] || platform;
    },
    /** 从平台代码获取平台名称 */
    getPlatformNameFromCode(platformCode) {
      if (platformCode === null || platformCode === undefined) return '-';
      const platformMap = {
        0: '微信支付',
        1: '支付宝',
        2: '苹果',
        3: '谷歌',
        4: 'Stripe'
      };
      return platformMap[platformCode] || '其他';
    },
    /** 获取订阅产品名称 */
    getProductName(productId) {
      if (!productId) return '-';
      const productMap = {
        'wm_year_pro': '专业版（每年订阅）',
        'wm_month_pro': '专业版（每月订阅）',
        'wm_month_ultimate': '大师版（每月订阅）',
        'wm_year_ultimate': '大师版（每年订阅）'
      };
      return productMap[productId] || productId;
    },
    /** 格式化秒为分钟和秒（X分钟Y秒） */
    formatMinutes(seconds) {
      if (seconds === null || seconds === undefined || seconds === 0) return '0分钟0秒';
      const totalSeconds = Math.floor(Number(seconds));
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
    /** 格式化录音时长（自动判断单位：如果值>=60可能是秒，需要转换；否则可能是分钟） */
    formatDuration(duration) {
      if (duration === null || duration === undefined || duration === 0) return '0分钟';
      const value = Number(duration);
      if (isNaN(value)) return '-';
      // 如果值大于等于60，可能是秒，转换为分钟和秒
      if (value >= 60) {
        return this.formatMinutes(value);
      } else {
        // 如果值小于60，可能是分钟，直接显示
        return `${Math.floor(value)}分钟`;
      }
    },
    /** 格式化支付渠道 */
    formatPayChannel(channel) {
      const map = {
        'stripe': 'Stripe',
        'apple': 'Apple',
        'google': 'Google',
        'wechatpay': '微信支付',
        'alipay': '支付宝'
      };
      return map[channel] || channel || '-';
    },
    /** 获取支付渠道标签类型 */
    getPayChannelType(channel) {
      const map = {
        'stripe': 'primary',
        'apple': '',
        'google': 'success',
        'wechatpay': 'success',
        'alipay': 'primary'
      };
      return map[channel] || 'info';
    },
    /** 格式化客户端平台 */
    formatPlatform(platform) {
      const map = {
        0: 'iOS',
        1: 'Android',
        2: 'Web',
        3: '小程序',
        4: '其他'
      };
      return map[platform] !== undefined ? map[platform] : '-';
    },
    /** 获取平台标签类型 */
    getPlatformType(platform) {
      const map = {
        0: '',
        1: 'success',
        2: 'primary',
        3: 'warning',
        4: 'info'
      };
      return map[platform] || 'info';
    },
    /** 格式化订单状态显示 */
    formatOrderStatus(status) {
      if (!status) return '-';
      const map = {
        '成功': '支付成功',
        '待支付': '待支付',
        '已退款': '已退款',
        '已取消': '已关闭',
        '支付失败': '支付失败',
        '退款中': '退款中',
        '已撤销': '已撤销'
      };
      return map[status] || status;
    },
    /** 获取订单状态标签类型 */
    getOrderStatusType(status) {
      if (!status) return 'info';
      if (status === '成功') return 'success';
      if (status === '待支付') return 'warning';
      if (status === '支付失败') return 'danger';
      if (status === '退款中') return 'warning';
      if (status === '已退款') return 'info';
      if (status === '已取消') return 'info';
      if (status === '已撤销') return 'info';
      return 'info';
    },
    /** 获取转写状态类型（统一处理大小写） */
    getTranscriptionStatusType(status) {
      if (!status) return 'pending';
      const statusLower = String(status).toLowerCase();
      // 处理 success 和 succeeded
      if (statusLower === 'success' || statusLower === 'succeeded') {
        return 'success';
      }
      // 处理 failed
      if (statusLower === 'failed' || statusLower === 'fail') {
        return 'failed';
      }
      // 处理 processing
      if (statusLower === 'processing' || statusLower === 'process') {
        return 'processing';
      }
      // 处理 pending
      if (statusLower === 'pending' || statusLower === 'wait') {
        return 'pending';
      }
      // 默认返回 pending
      return 'pending';
    },
    /** 双击单元格复制内容 */
    handleCellDblClick(row, column, cell, event) {
      // 优先获取单元格显示的文本内容（适用于有模板的列）
      let text = '';
      if (cell) {
        // 获取单元格内的文本内容，排除按钮等操作元素
        const cellElement = cell.querySelector('.cell') || cell;
        text = cellElement.innerText || cellElement.textContent || '';
      }

      // 如果单元格文本为空，尝试从 row 数据中获取
      if (!text || text.trim() === '' || text.trim() === '-') {
        const prop = column.property;
        if (prop && row && row[prop] !== null && row[prop] !== undefined) {
          text = String(row[prop]);
        }
      }

      text = text.trim();

      // 过滤掉一些不需要复制的内容
      if (!text || text === '-' || text === '暂无数据' || text === '暂无') {
        return;
      }

      // 限制复制文本长度，避免过长
      const maxLength = 500;
      const displayText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

      // 执行复制
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.$message.success('已复制: ' + displayText);
        }).catch(() => {
          this.fallbackCopy(text, displayText);
        });
      } else {
        this.fallbackCopy(text, displayText);
      }
    },
    /** 兼容复制方法 */
    fallbackCopy(text, displayText) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.$message.success('已复制: ' + (displayText || text));
      } catch (err) {
        this.$message.error('复制失败');
      }
      document.body.removeChild(textarea);
    }
  }
};
</script>

<style scoped lang="scss">
// ============================================
// 页面特定样式变量（仅用于此页面特定样式）
// ============================================
@import '@/assets/styles/admin-variables.scss';

// 使用通用样式变量
$primary: $admin-primary;
$success: $admin-success;
$warning: $admin-warning;
$danger: $admin-danger;
$info: $admin-info;
$text-primary: $admin-text-primary;
$text-secondary: $admin-text-secondary;
$text-tertiary: $admin-text-tertiary;
$border-color: $admin-border-color;
$bg-base: $admin-bg-base;
$bg-elevated: $admin-bg-elevated;
$bg-hover: $admin-bg-hover;
$shadow-sm: $admin-shadow-sm;
$shadow-md: $admin-shadow-md;
$shadow-lg: $admin-shadow-lg;
$radius-sm: $admin-radius-sm;
$radius-md: $admin-radius-md;
$radius-lg: $admin-radius-lg;

// ============================================
// 详情对话框样式（页面特定）
// ============================================
.user-detail-container {
  padding: 10px 0;
}

.detail-card {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 基本信息卡片 */
.info-card {
  border-radius: 8px;
  overflow: hidden;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
}

.info-header i {
  font-size: 18px;
  color: #409EFF;
}

.info-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  padding: 10px 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  background: $bg-base;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background: rgba($primary, 0.04);
    border-color: rgba($primary, 0.3);
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }
}

.info-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: $text-tertiary;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  i {
    font-size: 16px;
    color: $primary;
    width: 18px;
    text-align: center;
  }
}

.info-value {
  font-size: 14px;
  color: $text-primary;
  font-weight: 500;
  word-break: break-all;
  cursor: pointer;
  padding: 6px 0;
  transition: all 0.2s ease;
  line-height: 1.5;

  &:hover {
    color: $primary;
    padding-left: 4px;
  }
}

.avatar-link {
  color: #409EFF;
  word-break: break-all;
  max-width: 100%;
  display: inline-block;
}

.bind-tag {
  margin-right: 6px;
}

/* 权益列表卡片 */
.interests-card {
  border-radius: 8px;
  overflow: hidden;
}

.interests-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
}

.interests-header i {
  font-size: 18px;
  color: #67C23A;
}

.interests-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.interests-count {
  font-size: 13px;
  color: #909399;
  font-weight: normal;
  margin-left: 4px;
}

.interests-table {
  margin-top: 10px;
}

.interests-table ::v-deep .el-table__header {
  background-color: #f5f7fa;
}

.interests-table ::v-deep .el-table__row {
  transition: all 0.3s;
}

.interests-table ::v-deep .el-table__row:hover {
  background-color: rgba($primary, 0.04) !important;
  transform: scale(1.001);
}

.interests-table ::v-deep .el-table__row:hover td {
  background-color: transparent !important;
}

.number-value {
  font-size: 15px;
  font-weight: 600;
  color: $text-primary;
  font-variant-numeric: tabular-nums;
}

.used-value {
  color: $warning;
  font-weight: 600;
}

.remaining-value {
  color: $success;
  font-weight: 600;
}

.unit-text {
  font-size: 12px;
  color: $text-tertiary;
  margin-left: 4px;
  font-weight: 400;
}

.time-value,
.time-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: $text-secondary;
  font-size: 13px;
  font-weight: 500;
  padding: 4px 8px;
  background: rgba($info, 0.05);
  border-radius: $radius-sm;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($info, 0.1);
  }

  i {
    color: $text-tertiary;
    font-size: 12px;
  }

  &.time-badge {
    background: rgba($warning, 0.1);
    color: $warning;
    font-weight: 600;

    &:hover {
      background: rgba($warning, 0.15);
    }

    i {
      color: $warning;
    }
  }
}

.empty-text {
  color: $text-tertiary;
  font-size: 13px;
  font-style: italic;
}

.empty-interests {
  text-align: center;
  color: $text-tertiary;
  padding: 60px 20px;
  background: $bg-base;
  border-radius: $radius-md;
  border: 2px dashed $border-color;
  transition: all 0.3s ease;

  &:hover {
    border-color: $success;
    background: rgba($success, 0.02);
  }

  i {
    font-size: 64px;
    color: #DCDFE6;
    margin-bottom: 16px;
    display: block;
    opacity: 0.6;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: $text-secondary;
    font-weight: 500;
  }
}

.empty-data {
  text-align: center;
  color: $text-tertiary;
  padding: 60px 20px;
  background: $bg-base;
  border-radius: $radius-md;
  border: 2px dashed $border-color;
  transition: all 0.3s ease;

  &:hover {
    border-color: $primary;
    background: rgba($primary, 0.02);
  }

  i {
    font-size: 64px;
    color: #DCDFE6;
    margin-bottom: 16px;
    display: block;
    opacity: 0.6;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: $text-secondary;
    font-weight: 500;
  }
}

.feedback-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  img {
    border-radius: $radius-sm;
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
      transform: scale(1.05);
      box-shadow: $shadow-md;
    }
  }
}

// ============================================
// 用户详情对话框特殊样式（页面特定）
// ============================================
::v-deep .user-detail-dialog {
  .el-dialog__body {
    padding: 20px;
    max-height: calc(90vh - 100px);
  }
}

// ============================================
// 响应式优化（页面特定）
// ============================================
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

// ============================================
// 可点击单元格样式
// ============================================
.clickable-cell {
  color: $primary;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    text-decoration: underline;
    color: darken($primary, 10%);
  }
}
</style>
