<template>
  <div class="admin-page-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="110px" class="admin-search-form">
      <el-form-item label="权益流水ID" prop="recordId">
        <el-input
          v-model="queryParams.recordId"
          placeholder="请输入权益流水ID"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="用户ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="用户账号" prop="userAccount">
        <el-input
          v-model="queryParams.userAccount"
          placeholder="请输入手机号或邮箱"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="权益名称" prop="interestName">
        <el-select v-model="queryParams.interestName" placeholder="全部" clearable style="width: 120px">
          <el-option
            v-for="item in interestNameOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="权益类型" prop="interestType">
        <el-select v-model="queryParams.interestType" placeholder="全部" clearable style="width: 100px">
          <el-option label="会员" :value="0" />
          <el-option label="资源" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="变动类型" prop="changeType">
        <el-select v-model="queryParams.changeType" placeholder="全部" clearable style="width: 100px">
          <el-option
            v-for="item in changeTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="流水状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 110px">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="关联业务单" prop="businessId">
        <el-input
          v-model="queryParams.businessId"
          placeholder="订单ID/任务ID"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="关联冲正流水" prop="reverseRecordId">
        <el-input
          v-model="queryParams.reverseRecordId"
          placeholder="请输入关联冲正流水ID"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="操作时间" prop="createTimeRange">
        <el-date-picker
          v-model="queryParams.createTimeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="yyyy-MM-dd HH:mm:ss"
          style="width: 340px"
        />
      </el-form-item>
      <el-form-item label="更新时间" prop="updateTimeRange">
        <el-date-picker
          v-model="queryParams.updateTimeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="yyyy-MM-dd HH:mm:ss"
          style="width: 340px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮区域 -->
    <el-row :gutter="10" class="admin-toolbar">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-edit"
          size="mini"
          @click="handleManualAdjust"
          v-hasPermi="['system:payxinterestRecord:manualAdjust']"
        >手动权益调整</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:payxinterestRecord:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <div class="admin-table-wrapper">
      <el-table
        v-loading="loading"
        :data="recordList"
        stripe
        @cell-dblclick="handleCellDblClick"
        class="admin-table"
        :max-height="tableMaxHeight"
        border
      >
      <el-table-column label="权益流水ID" align="center" prop="recordId" width="200" show-overflow-tooltip />
      <el-table-column label="用户ID" align="center" prop="userId" width="180" show-overflow-tooltip />
      <el-table-column label="用户账号" align="center" prop="userAccount" width="150" show-overflow-tooltip />
      <el-table-column label="权益ID" align="center" prop="interestId" width="180" show-overflow-tooltip />
      <el-table-column label="权益名称" align="center" prop="interestName" width="120" show-overflow-tooltip />
      <el-table-column label="权益类型" align="center" prop="interestType" width="120">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.interestType === 0 && scope.row.productType !== null && scope.row.productType !== undefined"
                  :type="getProductTypeTagType(scope.row.productType)" size="small">
            {{ getProductTypeName(scope.row.productType) }}
          </el-tag>
          <el-tag v-else-if="scope.row.interestType === 0" type="success" size="small">
            会员
          </el-tag>
          <el-tag v-else type="primary" size="small">
            资源
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="变动类型" align="center" prop="changeType" width="100">
        <template slot-scope="scope">
          <el-tag :type="getChangeTypeTagType(scope.row.changeType)" size="small">
            {{ getChangeTypeName(scope.row.changeType) }}
          </el-tag>
        </template>
      </el-table-column>
<!--      <el-table-column label="变动内容" align="left" prop="interestContent" width="200" show-overflow-tooltip>-->
<!--        <template slot-scope="scope">-->
<!--          {{ formatInterestContent(scope.row.interestContent) }}-->
<!--        </template>-->
<!--      </el-table-column>-->
      <el-table-column label="业务描述" align="left" prop="businessDesc" width="200" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ formatInterestContent(scope.row.businessDesc) }}
        </template>
      </el-table-column>
<!--      <el-table-column label="变动值(秒)" align="right" prop="changeValue" width="120">-->
<!--        <template slot-scope="scope">-->
<!--          <span v-if="scope.row.changeValue !== null && scope.row.changeValue !== undefined">-->
<!--            {{ formatChangeValue(scope.row.changeValue, scope.row.changeType) }}-->
<!--          </span>-->
<!--          <span v-else>-</span>-->
<!--        </template>-->
<!--      </el-table-column>-->
      <el-table-column label="订单ID" align="center" prop="orderId" width="180" show-overflow-tooltip />
      <el-table-column label="任务ID" align="center" prop="taskId" width="180" show-overflow-tooltip />
      <el-table-column label="流水状态" align="center" prop="status" width="100">
        <template slot-scope="scope">
          <el-tag :type="getStatusTagType(scope.row.status)" size="small">
            {{ getStatusName(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="失败原因" align="center" prop="errorMsg" width="150" show-overflow-tooltip />
      <el-table-column label="关联冲正流水" align="center" prop="reverseRecordId" width="200" show-overflow-tooltip />
      <el-table-column label="变动前" align="center" prop="beforeValue" width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ formatBeforeAfterValue(scope.row.beforeValue) }}
        </template>
      </el-table-column>
      <el-table-column label="变动后" align="center" prop="afterValue" width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ formatBeforeAfterValue(scope.row.afterValue) }}
        </template>
      </el-table-column>
      <el-table-column label="备注" align="left" prop="remark" width="150" show-overflow-tooltip />
      <el-table-column label="更新人" align="center" prop="updateBy" width="120" show-overflow-tooltip />
      <el-table-column label="更新时间" align="center" prop="updateTime" width="160">
        <template slot-scope="scope">
          <span v-if="scope.row.updateTime">{{ parseTime(scope.row.updateTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column><el-table-column label="操作人" align="center" prop="operator" width="120" show-overflow-tooltip />
      <el-table-column label="操作时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
            v-hasPermi="['system:payxinterestRecord:query']"
          >详情</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleEditRemark(scope.row)"
            v-hasPermi="['system:payxinterestRecord:edit']"
          >修改备注</el-button>
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

    <!-- 流水详情对话框 -->
    <el-dialog title="权益流水详情" :visible.sync="detailOpen" width="850px" append-to-body custom-class="admin-dialog">
      <el-descriptions :column="2" border v-if="detailForm.recordId">
        <el-descriptions-item label="权益流水ID" :span="2" show-overflow-tooltip>{{ detailForm.recordId }}</el-descriptions-item>
        <el-descriptions-item label="用户ID" :span="2" show-overflow-tooltip>{{ detailForm.userId }}</el-descriptions-item>
        <el-descriptions-item label="权益ID" show-overflow-tooltip>{{ detailForm.interestId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="产品ID">{{ detailForm.productId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="权益名称">{{ detailForm.interestName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="权益类型">
          <el-tag v-if="detailForm.interestType === 0 && detailForm.productType !== null && detailForm.productType !== undefined"
                  :type="getProductTypeTagType(detailForm.productType)" size="small">
            {{ getProductTypeName(detailForm.productType) }}
          </el-tag>
          <el-tag v-else-if="detailForm.interestType === 0" type="success" size="small">
            会员
          </el-tag>
          <el-tag v-else type="primary" size="small">
            资源
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="变动类型">
          <el-tag :type="getChangeTypeTagType(detailForm.changeType)" size="small">
            {{ getChangeTypeName(detailForm.changeType) }}
          </el-tag>
        </el-descriptions-item>
<!--        <el-descriptions-item label="变动内容" show-overflow-tooltip>{{ formatInterestContent(detailForm.interestContent) || '-' }}</el-descriptions-item>-->
<!--        <el-descriptions-item label="变动值(秒)">-->
<!--          {{ detailForm.changeValue !== null && detailForm.changeValue !== undefined ? formatChangeValue(detailForm.changeValue, detailForm.changeType) : '-' }}-->
<!--        </el-descriptions-item>-->
        <el-descriptions-item label="订单ID" show-overflow-tooltip>{{ detailForm.orderId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="任务ID" :span="2" show-overflow-tooltip>{{ detailForm.taskId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="流水状态">
          <el-tag :type="getStatusTagType(detailForm.status)" size="small">
            {{ getStatusName(detailForm.status) }}
          </el-tag>
        </el-descriptions-item>
<!--        <el-descriptions-item label="操作人" show-overflow-tooltip>{{ detailForm.operator || '-' }}</el-descriptions-item>-->
<!--        <el-descriptions-item label="完成时间" :span="2">-->
<!--          {{ detailForm.completedAt ? parseTime(detailForm.completedAt) : '-' }}-->
<!--        </el-descriptions-item>-->
        <el-descriptions-item label="业务描述" :span="2" show-overflow-tooltip>{{ formatInterestContent(detailForm.businessDesc) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="变动前" :span="2" show-overflow-tooltip>{{ formatBeforeAfterValue(detailForm.beforeValue) }}</el-descriptions-item>
        <el-descriptions-item label="变动后" :span="2" show-overflow-tooltip>{{ formatBeforeAfterValue(detailForm.afterValue) }}</el-descriptions-item>
        <el-descriptions-item label="失败原因" v-if="detailForm.errorMsg" :span="2" show-overflow-tooltip>
          <el-tag type="danger" size="small">{{ detailForm.errorMsg }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2" show-overflow-tooltip>{{ detailForm.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注人">{{ detailForm.updateBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注时间">{{ detailForm.updateTime ? parseTime(detailForm.updateTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="关联凭证" :span="2" v-if="detailForm.attachmentUrls">
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <div v-for="(url, index) in getAttachmentUrls(detailForm.attachmentUrls)" :key="index" style="margin-bottom: 10px;">
              <el-image
                v-if="isImage(url)"
                :src="url"
                :preview-src-list="getAttachmentUrls(detailForm.attachmentUrls).filter(u => isImage(u))"
                style="width: 100px; height: 100px; cursor: pointer;"
                fit="cover"
              />
              <div v-else style="display: flex; align-items: center; gap: 5px;">
                <i class="el-icon-document" style="font-size: 24px; color: #409EFF;"></i>
                <a :href="url" target="_blank" style="color: #409EFF; text-decoration: none;">查看文件</a>
              </div>
            </div>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="关联凭证" :span="2" v-else>-</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ parseTime(detailForm.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="操作人" show-overflow-tooltip>{{ detailForm.createBy || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailOpen = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 修改备注对话框 -->
    <el-dialog title="修改备注" :visible.sync="remarkOpen" width="600px" append-to-body custom-class="admin-dialog">
      <el-form ref="remarkForm" :model="remarkForm" label-width="100px">
        <el-form-item label="原备注">
          <el-input
            v-model="remarkForm.originalRemark"
            type="textarea"
            :rows="3"
            readonly
            style="background-color: #f5f7fa;"
          />
        </el-form-item>
        <el-form-item label="新备注" prop="remark">
          <el-input
            v-model="remarkForm.remark"
            type="textarea"
            :rows="5"
            placeholder="请输入新备注（最多1000字）"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="remarkOpen = false">取 消</el-button>
        <el-button type="primary" @click="submitRemark">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 手动权益调整对话框 -->
    <el-dialog title="手动权益调整" :visible.sync="adjustOpen" width="800px" append-to-body custom-class="admin-dialog">
      <el-form ref="adjustForm" :model="adjustForm" :rules="adjustRules" label-width="120px">
        <el-form-item label="目标用户" prop="userAccount">
          <el-input
            v-model="adjustForm.userAccount"
            placeholder="请输入用户账号（手机号/邮箱/用户ID）"
            clearable
            @blur="handleUserAccountBlur"
          />
        </el-form-item>
        <el-form-item label="冲正" prop="isReverse">
          <el-radio-group v-model="adjustForm.isReverse" @change="handleIsReverseChange">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <!-- 可冲正流水选择区域 -->
        <el-form-item
          v-if="adjustForm.isReverse"
          label="选择原流水"
          prop="reverseRecordId"
        >
          <!-- 已选择的流水信息展示 -->
          <div v-if="selectedReversibleRecord" style="margin-bottom: 10px; padding: 10px; background-color: #f0f9eb; border-radius: 4px; border: 1px solid #e1f3d8;">
            <span style="color: #67c23a; font-weight: bold;">已选择：</span>
            <span>{{ selectedReversibleRecord.recordId }}</span>
            <span style="margin-left: 10px; color: #606266;">{{ selectedReversibleRecord.interestName }}</span>
            <span style="margin-left: 10px; color: #909399;">{{ selectedReversibleRecord.businessDesc }}</span>
            <el-button type="text" size="mini" style="margin-left: 10px; color: #f56c6c;" @click="clearSelectedReversible">清除选择</el-button>
          </div>
          <!-- 内嵌表格 -->
          <div style="border: 1px solid #ebeef5; border-radius: 4px; padding: 10px;">
            <el-table
              v-loading="reversibleLoading"
              :data="reversibleTableData"
              size="mini"
              max-height="250"
              @selection-change="handleReversibleSelectionChange"
              ref="reversibleTable"
              highlight-current-row
            >
              <el-table-column type="selection" width="50" align="center" />
              <el-table-column label="流水ID" prop="recordId" width="180" show-overflow-tooltip />
              <el-table-column label="权益名称" prop="interestName" width="100" />
              <el-table-column label="变动类型" prop="changeType" width="80">
                <template slot-scope="scope">
                  <el-tag :type="getChangeTypeTagType(scope.row.changeType)" size="mini">
                    {{ getChangeTypeName(scope.row.changeType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="业务描述" prop="businessDesc" min-width="150" show-overflow-tooltip />
              <el-table-column label="操作时间" prop="createTime" width="150">
                <template slot-scope="scope">
                  {{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}
                </template>
              </el-table-column>
            </el-table>
            <!-- 分页和确认按钮 -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
              <el-pagination
                small
                layout="total, prev, pager, next"
                :total="reversibleTotal"
                :page-size="reversiblePageSize"
                :current-page.sync="reversiblePageNum"
                @current-change="handleReversiblePageChange"
              />
              <el-button type="primary" size="mini" @click="handleConfirmSelectReversible" :disabled="!tempSelectedReversible">确认选择</el-button>
            </div>
            <div v-if="reversibleTableData.length === 0 && !reversibleLoading" style="text-align: center; color: #909399; padding: 20px 0;">
              {{ adjustForm.userAccount ? '暂无可冲正的权益流水' : '请先输入用户账号' }}
            </div>
          </div>
        </el-form-item>
        <el-form-item label="权益类型" prop="interestType">
          <el-select v-model="adjustForm.interestType" placeholder="请选择权益类型" @change="handleInterestTypeChange">
            <el-option label="会员身份" :value="0" />
            <el-option label="资源数量" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="调整类型" prop="adjustType">
          <el-select v-model="adjustForm.adjustType" placeholder="请选择调整类型" @change="handleAdjustTypeChange">
            <el-option
              v-if="adjustForm.interestType === 0"
              v-for="item in memberAdjustTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
            <el-option
              v-if="adjustForm.interestType === 1"
              v-for="item in resourceAdjustTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="adjustForm.interestType === 1"
          label="调整数量"
          prop="adjustQuantity"
        >
          <div style="display: flex; align-items: center; width: 100%">
            <el-input-number
              v-model="adjustForm.adjustQuantity"
              :min="1"
              :precision="0"
              :step="1"
              controls-position="right"
              style="flex: 1"
            />
            <span style="margin-left: 10px; color: #606266; font-size: 14px; white-space: nowrap">分钟</span>
          </div>
          <div style="color: #909399; font-size: 12px; margin-top: 5px">请输入转写时长（分钟）</div>
        </el-form-item>
        <el-form-item
          v-if="(adjustForm.interestType === 0 && adjustForm.adjustType !== -1) || (adjustForm.interestType === 1 && adjustForm.adjustType === 0)"
          label="有效期至"
          prop="expireTime"
        >
          <el-date-picker
            v-model="adjustForm.expireTime"
            type="datetime"
            placeholder="选择有效期至"
            value-format="yyyy-MM-dd HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="调整原因" prop="adjustReason">
          <el-select v-model="adjustForm.adjustReason" placeholder="请选择调整原因" filterable>
            <el-option
              v-for="item in adjustReasonOptions"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="详情描述" prop="businessDesc">
          <el-input
            v-model="adjustForm.businessDesc"
            type="textarea"
            :rows="4"
            placeholder="请输入详情描述（最多1000字）"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="关联凭证" prop="attachmentUrls">
          <el-upload
            ref="upload"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :file-list="fileList"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :before-upload="beforeUpload"
            :limit="3"
            list-type="picture-card"
          >
            <i class="el-icon-plus"></i>
          </el-upload>
          <div style="color: #999; font-size: 12px; margin-top: 5px">
            最多上传3张，支持jpg、png、pdf格式
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="adjustForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注（选填，最多1000字）"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="adjustOpen = false">取 消</el-button>
        <el-button type="primary" @click="handlePreviewConfirm">确认</el-button>
      </div>
    </el-dialog>

    <!-- 预览确认对话框 -->
    <el-dialog title="确认信息" :visible.sync="previewOpen" width="600px" append-to-body custom-class="admin-dialog">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="目标用户">{{ adjustForm.userAccount }}</el-descriptions-item>
        <el-descriptions-item label="冲正">{{ adjustForm.isReverse ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item v-if="adjustForm.isReverse" label="原权益流水">
          <span>{{ adjustForm.reverseRecordId }}</span>
          <span v-if="selectedReversibleRecord" style="margin-left: 10px; color: #909399;">
            ({{ selectedReversibleRecord.interestName }} - {{ selectedReversibleRecord.businessDesc }})
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="权益类型">{{ adjustForm.interestType === 0 ? '会员身份' : '资源数量' }}</el-descriptions-item>
        <el-descriptions-item label="调整类型">{{ getAdjustTypeName(adjustForm.adjustType) }}</el-descriptions-item>
        <el-descriptions-item v-if="adjustForm.interestType === 1" label="调整数量">{{ adjustForm.adjustQuantity }}分钟</el-descriptions-item>
        <el-descriptions-item v-if="(adjustForm.interestType === 0 && adjustForm.adjustType !== -1) || (adjustForm.interestType === 1 && adjustForm.adjustType === 0)" label="有效期至">{{ adjustForm.expireTime }}</el-descriptions-item>
        <el-descriptions-item label="调整原因">{{ getAdjustReasonName(adjustForm.adjustReason) }}</el-descriptions-item>
        <el-descriptions-item label="详情描述">{{ adjustForm.businessDesc }}</el-descriptions-item>
        <el-descriptions-item label="关联凭证">{{ fileList.length }}个文件</el-descriptions-item>
        <el-descriptions-item v-if="adjustForm.remark" label="备注">{{ adjustForm.remark }}</el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 20px">
        <el-checkbox v-model="confirmChecked">我已确认上述信息准确，并知晓此操作将产生不可逆的审计记录。</el-checkbox>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="previewOpen = false">取 消</el-button>
        <el-button type="primary" :disabled="!confirmChecked" :loading="submitLoading" @click="handleSubmit">提交</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listPayxinterestRecord, getPayxinterestRecord, manualAdjustInterest, getReversibleRecords, getReversibleRecordsByAccount, updateRemark } from "@/api/system/payxinterestRecord";
import { getToken } from "@/utils/auth";
import { PRODUCT_TYPE, PRODUCT_TYPE_NAME_MAP, PRODUCT_TYPE_TAG_TYPE_MAP } from "@/utils/payConstants";
import { getDicts } from "@/api/system/dict/data";

export default {
  name: "PayxinterestRecord",
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
      // 流水表格数据
      recordList: [],
      // 详情弹出层
      detailOpen: false,
      // 详情表单
      detailForm: {},
      // 修改备注相关
      remarkOpen: false,
      remarkForm: {
        id: null,
        recordId: null,
        originalRemark: '',
        remark: ''
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        recordId: null,
        userId: null,
        userAccount: null,
        interestName: null,
        interestType: null,
        changeType: null,
        status: null,
        businessId: null,
        reverseRecordId: null,
        createTimeRange: null,
        updateTimeRange: null
      },
      // 权益名称选项
      interestNameOptions: ['转写'],
      // 变动类型选项
      changeTypeOptions: [
        { value: 0, label: '发放' },
        { value: 1, label: '消耗' },
        { value: 2, label: '收回' },
        { value: 3, label: '过期' },
        { value: 4, label: '变更' }
      ],
      // 状态选项
      statusOptions: [
        { value: 0, label: '未执行' },
        { value: 1, label: '执行成功' },
        { value: 2, label: '执行失败' },
        { value: 3, label: '已冲正' }
      ],
      // 手动权益调整相关
      adjustOpen: false,
      previewOpen: false,
      submitLoading: false,
      confirmChecked: false,
      adjustForm: {
        userAccount: null,
        isReverse: false,
        reverseRecordId: null,
        interestType: null,
        adjustType: null,
        adjustQuantity: null,
        expireTime: null,
        adjustReason: null,
        businessDesc: null,
        attachmentUrls: [],
        remark: null
      },
      adjustRules: {
        userAccount: [{ required: true, message: '目标用户不能为空', trigger: 'blur' }],
        isReverse: [{ required: true, message: '是否冲正不能为空', trigger: 'change' }],
        reverseRecordId: [
          {
            validator: (rule, value, callback) => {
              if (this.adjustForm.isReverse && !value) {
                callback(new Error('冲正时原权益流水ID不能为空'));
              } else {
                callback();
              }
            },
            trigger: 'change'
          }
        ],
        interestType: [{ required: true, message: '权益类型不能为空', trigger: 'change' }],
        adjustType: [{ required: true, message: '调整类型不能为空', trigger: 'change' }],
        adjustQuantity: [
          {
            validator: (rule, value, callback) => {
              if (this.adjustForm.interestType === 1 && (!value || value < 1)) {
                callback(new Error('资源数量调整时，调整数量不能为空且必须大于等于1分钟'));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ],
        expireTime: [
          {
            validator: (rule, value, callback) => {
              // 会员身份调整：普通用户（adjustType=-1）不需要过期时间，其他会员类型需要
              if (this.adjustForm.interestType === 0 && this.adjustForm.adjustType !== -1 && !value) {
                callback(new Error('会员身份调整时，有效期至不能为空'));
              } else if (this.adjustForm.interestType === 1 && this.adjustForm.adjustType === 0 && !value) {
                callback(new Error('资源数量增加时，有效期至不能为空'));
              } else {
                callback();
              }
            },
            trigger: 'change'
          }
        ],
        adjustReason: [{ required: true, message: '调整原因不能为空', trigger: 'change' }],
        businessDesc: [
          { required: true, message: '详情描述不能为空', trigger: 'blur' },
          { max: 1000, message: '详情描述不能超过1000字', trigger: 'blur' }
        ],
        attachmentUrls: [{ required: true, message: '关联凭证不能为空', trigger: 'change' }]
      },
      // 会员调整类型选项（不支持体验版会员）
      memberAdjustTypeOptions: [
        { value: -1, label: '普通用户' },
        { value: 1, label: '专业版会员' },
        { value: 2, label: '大师版会员' }
      ],
      // 资源调整类型选项（增加/减少）
      resourceAdjustTypeOptions: [
        { value: 0, label: '增加' },
        { value: 1, label: '减少' }
      ],
      // 调整原因选项（从字典获取）
      adjustReasonOptions: [],
      // 可冲正的权益流水列表（旧的，保留兼容）
      reversibleRecords: [],
      // 可冲正流水分页相关
      reversibleTableData: [],
      reversibleTotal: 0,
      reversiblePageNum: 1,
      reversiblePageSize: 5,
      reversibleLoading: false,
      selectedReversibleRecord: null,
      tempSelectedReversible: null,
      // 文件上传相关
      fileList: [],
      uploadUrl: process.env.VUE_APP_BASE_API + '/common/upload',
      uploadHeaders: {
        Authorization: 'Bearer ' + getToken()
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
  },
  watch: {
    showSearch() {
      this.$nextTick(() => {
        this.updateTableHeight();
      });
    }
  },
  created() {
    // 从路由查询参数中获取userAccount，自动筛选
    if (this.$route.query.userId) {
      this.queryParams.userAccount = this.$route.query.userId;
    }
    this.getList();
    // 加载调整原因字典数据
    this.loadAdjustReasonDict();
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
    /** 查询流水列表 */
    getList() {
      this.loading = true;
      // 构建查询参数，处理时间区间
      const params = { ...this.queryParams };
      // 处理操作时间（创建时间）区间
      if (params.createTimeRange && params.createTimeRange.length === 2) {
        params.createTimeStart = params.createTimeRange[0];
        params.createTimeEnd = params.createTimeRange[1];
      }
      delete params.createTimeRange;
      // 处理更新时间区间
      if (params.updateTimeRange && params.updateTimeRange.length === 2) {
        params.updateTimeStart = params.updateTimeRange[0];
        params.updateTimeEnd = params.updateTimeRange[1];
      }
      delete params.updateTimeRange;

      listPayxinterestRecord(params).then(response => {
        this.recordList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 查看详情 */
    handleView(row) {
      getPayxinterestRecord(row.recordId).then(response => {
        this.detailForm = response.data;
        this.detailOpen = true;
      });
    },
    /** 修改备注 */
    handleEditRemark(row) {
      this.remarkForm = {
        id: row.id,
        recordId: row.recordId,
        originalRemark: row.remark || '',
        remark: row.remark || ''
      };
      this.remarkOpen = true;
    },
    /** 提交备注修改 */
    submitRemark() {
      if (!this.remarkForm.id && !this.remarkForm.recordId) {
        this.$message.error('流水ID不能为空');
        return;
      }
      const data = {
        id: this.remarkForm.id,
        recordId: this.remarkForm.recordId,
        remark: this.remarkForm.remark
      };
      updateRemark(data).then(response => {
        this.$message.success('备注更新成功');
        this.remarkOpen = false;
        this.getList();
      }).catch(error => {
        this.$message.error(error.msg || '备注更新失败');
      });
    },
    /** 获取凭证文件URL列表 */
    getAttachmentUrls(attachmentUrls) {
      if (!attachmentUrls) return [];
      if (typeof attachmentUrls === 'string') {
        return attachmentUrls.split(',').filter(url => url.trim());
      }
      return [];
    },
    /** 判断是否为图片 */
    isImage(url) {
      if (!url) return false;
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      const lowerUrl = url.toLowerCase();
      return imageExtensions.some(ext => lowerUrl.includes(ext));
    },
    /** 导出按钮操作 */
    handleExport() {
      // 构建导出参数，处理时间区间（与getList保持一致）
      const params = { ...this.queryParams };
      // 处理操作时间（创建时间）区间
      if (params.createTimeRange && params.createTimeRange.length === 2) {
        params.createTimeStart = params.createTimeRange[0];
        params.createTimeEnd = params.createTimeRange[1];
      }
      delete params.createTimeRange;
      // 处理更新时间区间
      if (params.updateTimeRange && params.updateTimeRange.length === 2) {
        params.updateTimeStart = params.updateTimeRange[0];
        params.updateTimeEnd = params.updateTimeRange[1];
      }
      delete params.updateTimeRange;

      this.download('system/payxinterestRecord/export', params, `payxinterestRecord_${new Date().getTime()}.xlsx`);
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
    /** 获取状态名称 */
    getStatusName(status) {
      const map = { 0: '未执行', 1: '执行成功', 2: '执行失败', 3: '已冲正' };
      return map[status] || '-';
    },
    /** 获取状态标签类型 */
    getStatusTagType(status) {
      const map = { 0: 'info', 1: 'success', 2: 'danger', 3: 'warning' };
      return map[status] || 'info';
    },
    /** 获取产品类型名称 */
    getProductTypeName(productType) {
      return PRODUCT_TYPE_NAME_MAP[productType] || '会员';
    },
    /** 获取产品类型标签类型 */
    getProductTypeTagType(productType) {
      return PRODUCT_TYPE_TAG_TYPE_MAP[productType] || 'success';
    },
    /** 加载调整原因字典数据 */
    loadAdjustReasonDict() {
      getDicts('adjust_reason').then(response => {
        this.adjustReasonOptions = response.data || [];
      }).catch(() => {
        this.adjustReasonOptions = [];
      });
    },
    /** 格式化变动值 */
    formatChangeValue(value, changeType) {
      if (value === null || value === undefined) return '-';
      const num = parseFloat(value);
      if (isNaN(num)) return '-';
      // 先取绝对值，然后根据变动类型添加符号
      const absNum = Math.abs(num);
      // 发放显示正号，消耗和收回显示负号
      if (changeType === 0) {
        return '+' + absNum;
      } else if (changeType === 1 || changeType === 2) {
        return '-' + absNum;
      }
      // 其他类型（过期、变更）直接显示数值（保持原符号）
      return num.toString();
    },
    /** 格式化权益内容中的秒数 */
    formatInterestContent(content) {
      if (!content) return content || '';
      // 使用正则表达式匹配秒数并格式化
      // 匹配模式：数字+秒，如 "300秒"、"+300秒"、"-300秒"
      return content.replace(/([+-]?)(\d+)秒/g, (match, sign, seconds) => {
        const totalSeconds = parseInt(seconds);
        if (totalSeconds < 60) {
          return sign + totalSeconds + '秒';
        } else if (totalSeconds < 3600) {
          const minutes = Math.floor(totalSeconds / 60);
          const remainingSeconds = totalSeconds % 60;
          if (remainingSeconds === 0) {
            return sign + minutes + '分钟';
          } else {
            return sign + minutes + '分钟' + remainingSeconds + '秒';
          }
        } else {
          const hours = Math.floor(totalSeconds / 3600);
          const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
          const remainingSeconds = totalSeconds % 60;
          if (remainingMinutes === 0 && remainingSeconds === 0) {
            return sign + hours + '小时';
          } else if (remainingSeconds === 0) {
            return sign + hours + '小时' + remainingMinutes + '分钟';
          } else {
            return sign + hours + '小时' + remainingMinutes + '分钟' + remainingSeconds + '秒';
          }
        }
      });
    },
    /** 格式化变动前后值（beforeValue/afterValue） */
    formatBeforeAfterValue(value) {
      if (!value || value === '-') return '-';
      // 如果是"无限制"或会员类型名称（如"普通用户"、"专业版会员"等），直接返回
      if (value === '无限制' ||
          value === '普通用户' ||
          value.includes('会员') ||
          value.includes('用户')) {
        return value;
      }
      // 如果已经是"X分钟Y秒"格式（包含"分钟"和"秒"），直接返回
      if (value.includes('分钟') && value.includes('秒')) {
        return value;
      }
      // 如果只是"X秒"格式，直接返回
      if (value.includes('秒') && !value.includes('分钟')) {
        return value;
      }
      // 如果只是"X分钟"格式（没有秒），直接返回
      if (value.includes('分钟') && !value.includes('秒')) {
        return value;
      }
      // 如果是旧的"X.XX分钟"格式（向后兼容），解析为秒数后格式化为"X分钟Y秒"
      const minuteMatch = value.match(/([+-]?)(\d+\.?\d*)分钟/);
      if (minuteMatch) {
        const minutes = parseFloat(minuteMatch[2]);
        const totalSeconds = Math.floor(minutes * 60);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        if (mins === 0) {
          return `${secs}秒`;
        } else if (secs === 0) {
          return `${mins}分钟`;
        } else {
          return `${mins}分钟${secs}秒`;
        }
      }
      // 如果都不匹配，直接返回原值
      return value;
    },
    /** 双击单元格复制内容 */
    handleCellDblClick(row, column, cell, event) {
      let text = '';
      const prop = column.property;
      if (prop && row[prop] !== null && row[prop] !== undefined) {
        text = String(row[prop]);
      } else {
        text = cell.innerText || cell.textContent || '';
      }
      text = text.trim();
      if (!text || text === '-') {
        return;
      }
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
    },
    /** 打开手动权益调整对话框 */
    handleManualAdjust() {
      this.resetAdjustForm();
      this.adjustOpen = true;
    },
    /** 重置调整表单 */
    resetAdjustForm() {
      this.adjustForm = {
        userAccount: null,
        isReverse: false,
        reverseRecordId: null,
        interestType: null,
        adjustType: null,
        adjustQuantity: null,
        expireTime: null,
        adjustReason: null,
        businessDesc: null,
        attachmentUrls: [],
        remark: null
      };
      this.fileList = [];
      this.reversibleRecords = [];
      // 重置冲正流水分页相关
      this.reversibleTableData = [];
      this.reversibleTotal = 0;
      this.reversiblePageNum = 1;
      this.selectedReversibleRecord = null;
      this.tempSelectedReversible = null;
      this.confirmChecked = false;
      if (this.$refs.adjustForm) {
        this.$refs.adjustForm.resetFields();
      }
    },
    /** 权益类型改变 */
    handleInterestTypeChange() {
      this.adjustForm.adjustType = null;
      this.adjustForm.adjustQuantity = null;
      this.adjustForm.expireTime = null;
    },
    /** 调整类型改变 */
    handleAdjustTypeChange() {
      // 如果调整为普通用户，清空过期时间（普通用户不需要过期时间）
      if (this.adjustForm.interestType === 0 && this.adjustForm.adjustType === -1) {
        this.adjustForm.expireTime = null;
      }
    },
    /** 用户账号失焦事件 */
    handleUserAccountBlur() {
      if (this.adjustForm.userAccount && this.adjustForm.isReverse) {
        // 加载可冲正的流水列表
        this.loadReversibleRecords();
      }
    },
    /** 冲正选项变化事件 */
    handleIsReverseChange(val) {
      if (val && this.adjustForm.userAccount) {
        // 选择冲正=是，且已输入用户账号，加载可冲正流水
        this.loadReversibleRecords();
      } else if (!val) {
        // 选择冲正=否，清空相关数据
        this.reversibleTableData = [];
        this.reversibleTotal = 0;
        this.reversiblePageNum = 1;
        this.selectedReversibleRecord = null;
        this.tempSelectedReversible = null;
        this.adjustForm.reverseRecordId = null;
      }
    },
    /** 加载可冲正的权益流水（分页） */
    loadReversibleRecords() {
      if (!this.adjustForm.userAccount) {
        return;
      }
      this.reversibleLoading = true;
      getReversibleRecordsByAccount({
        userAccount: this.adjustForm.userAccount,
        pageNum: this.reversiblePageNum,
        pageSize: this.reversiblePageSize
      }).then(response => {
        this.reversibleTableData = response.rows || [];
        this.reversibleTotal = response.total || 0;
        this.reversibleLoading = false;
      }).catch(() => {
        this.reversibleTableData = [];
        this.reversibleTotal = 0;
        this.reversibleLoading = false;
      });
    },
    /** 可冲正流水分页切换 */
    handleReversiblePageChange(pageNum) {
      this.reversiblePageNum = pageNum;
      this.loadReversibleRecords();
    },
    /** 可冲正流水选择变化（单选模式） */
    handleReversibleSelectionChange(selection) {
      // 只保留最后一个选中的
      if (selection.length > 1) {
        const lastSelected = selection[selection.length - 1];
        this.$refs.reversibleTable.clearSelection();
        this.$refs.reversibleTable.toggleRowSelection(lastSelected, true);
        this.tempSelectedReversible = lastSelected;
      } else if (selection.length === 1) {
        this.tempSelectedReversible = selection[0];
      } else {
        this.tempSelectedReversible = null;
      }
    },
    /** 确认选择可冲正流水 */
    handleConfirmSelectReversible() {
      if (!this.tempSelectedReversible) {
        this.$message.warning('请先选择一条权益流水');
        return;
      }
      this.selectedReversibleRecord = this.tempSelectedReversible;
      this.adjustForm.reverseRecordId = this.tempSelectedReversible.recordId;
      this.$message.success('已选择流水：' + this.tempSelectedReversible.recordId);
    },
    /** 清除已选择的冲正流水 */
    clearSelectedReversible() {
      this.selectedReversibleRecord = null;
      this.tempSelectedReversible = null;
      this.adjustForm.reverseRecordId = null;
      if (this.$refs.reversibleTable) {
        this.$refs.reversibleTable.clearSelection();
      }
    },
    /** 文件上传成功 */
    handleUploadSuccess(response, file, fileList) {
      if (response.code === 200) {
        this.fileList = fileList;
        this.adjustForm.attachmentUrls = fileList.map(item => item.response ? item.response.url : item.url);
        this.$message.success('文件上传成功');
      } else {
        this.$message.error(response.msg || '文件上传失败');
      }
    },
    /** 文件移除 */
    handleRemove(file, fileList) {
      this.fileList = fileList;
      this.adjustForm.attachmentUrls = fileList.map(item => item.response ? item.response.url : item.url);
    },
    /** 文件上传前验证 */
    beforeUpload(file) {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png';
      const isPdf = file.type === 'application/pdf';
      const isValidType = isImage || isPdf;
      const isLt10M = file.size / 1024 / 1024 < 10;

      if (!isValidType) {
        this.$message.error('上传文件只能是 JPG/PNG/PDF 格式!');
        return false;
      }
      if (!isLt10M) {
        this.$message.error('上传文件大小不能超过 10MB!');
        return false;
      }
      return true;
    },
    /** 获取调整类型名称 */
    getAdjustTypeName(adjustType) {
      if (this.adjustForm.interestType === 0) {
        const option = this.memberAdjustTypeOptions.find(item => item.value === adjustType);
        return option ? option.label : '';
      } else {
        const option = this.resourceAdjustTypeOptions.find(item => item.value === adjustType);
        return option ? option.label : '';
      }
    },
    /** 获取调整原因名称 */
    getAdjustReasonName(adjustReason) {
      if (!adjustReason) return '';
      const option = this.adjustReasonOptions.find(item => item.dictValue === adjustReason);
      return option ? option.dictLabel : adjustReason;
    },
    /** 预览确认 */
    handlePreviewConfirm() {
      this.$refs.adjustForm.validate(valid => {
        if (valid) {
          // 验证关联凭证
          if (!this.adjustForm.attachmentUrls || this.adjustForm.attachmentUrls.length === 0) {
            this.$message.error('请上传关联凭证');
            return;
          }
          // 如果是冲正，验证原流水ID
          if (this.adjustForm.isReverse && !this.adjustForm.reverseRecordId) {
            this.$message.error('冲正时请选择原权益流水ID');
            return;
          }
          // 如果是资源数量调整，验证调整数量
          if (this.adjustForm.interestType === 1 && !this.adjustForm.adjustQuantity) {
            this.$message.error('资源数量调整时，调整数量不能为空');
            return;
          }
          this.previewOpen = true;
        }
      });
    },
    /** 提交 */
    handleSubmit() {
      if (!this.confirmChecked) {
        this.$message.warning('请确认信息准确');
        return;
      }
      this.submitLoading = true;
      const data = {
        ...this.adjustForm,
        attachmentUrls: this.adjustForm.attachmentUrls
      };
      // 资源数量调整时，将分钟转换为秒
      if (data.interestType === 1 && data.adjustQuantity != null) {
        data.adjustQuantity = data.adjustQuantity * 60; // 分钟转秒
      }
      manualAdjustInterest(data).then(response => {
        if (response.code === 200) {
          this.$message.success('手动权益调整成功');
          this.adjustOpen = false;
          this.previewOpen = false;
          this.resetAdjustForm();
          this.getList();
        } else {
          this.$message.error(response.msg || '手动权益调整失败');
        }
        this.submitLoading = false;
      }).catch(error => {
        // 显示错误信息
        const errorMsg = error.response?.data?.msg || error.message || '手动权益调整失败，请稍后重试';
        this.$message.error(errorMsg);
        this.submitLoading = false;
      });
    }
  }
};
</script>

<style scoped lang="scss">
</style>
