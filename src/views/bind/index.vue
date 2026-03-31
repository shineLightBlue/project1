<template>
  <div class="admin-page-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="90px" class="admin-search-form">
         <el-form-item label="产品名称" prop="productName">
         <el-select v-model="queryParams.productName" placeholder="请选择产品名称" filterable>
            <el-option :key="''" label="全部" :value="''" />
            <el-option
              v-for="item in productModelOptions"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
          </el-select>
      </el-form-item>
       <el-form-item label="绑定状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择绑定状态" filterable>
            <el-option :key="''" label="全部" :value="''" />
            <el-option
              v-for="item in bindStatusOptions"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
          </el-select>
        </el-form-item>
      <el-form-item label="产品SN" prop="productSn">
        <el-input
          v-model="queryParams.productSn"
          placeholder="请输入产品SN"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="绑定账号" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户账号"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
         <el-form-item label="绑定时间" prop="bindTimeRange">
        <el-date-picker
          v-model="bindTimeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd HH:mm:ss"
          size="small"
          style="width: 350px"
          @change="handleBindTimeRangeChange"
        />
      </el-form-item>
          <el-form-item label="解绑时间" prop="unbindTimeRange">
        <el-date-picker
          v-model="unbindTimeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd HH:mm:ss"
          size="small"
          style="width: 350px"
          @change="handleUnBindTimeRangeChange"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-row :gutter="10" class="admin-toolbar">
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <div class="admin-table-wrapper">
      <el-table 
        v-loading="loading" 
        :data="bindingRecord" 
        stripe 
        @cell-dblclick="handleCellDblClick"
        class="admin-table"
        :max-height="tableMaxHeight"
        border
      >
        <el-table-column label="序号" type="index" width="60" align="center" />
        <el-table-column label="产品名称" align="center" prop="productName" width="200" show-overflow-tooltip />
        <el-table-column label="产品SN" align="center" prop="productSn" width="200" show-overflow-tooltip>
          <template slot-scope="scope">
            <span style="color: #409EFF; cursor: pointer;" @click="handleView(scope.row)">
              {{ scope.row.productSn }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="绑定账号" align="center" prop="userId" width="150" show-overflow-tooltip />
        <el-table-column label="绑定状态" align="center" prop="status" width="160"/>
        <el-table-column label="mac地址" align="center" prop="macAddress" width="120"/>
        <el-table-column label="固件版本" align="center" prop="firmwareVersion" width="160"/>
        <el-table-column label="绑定时间" align="center" prop="bindTime" width="160"/>
        <el-table-column label="解绑时间" align="center" prop="unbindTime" width="120"/>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-if="!scope.row.unbindTime"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUnBindInDialog(scope.row)"
            v-hasPermi="['product:bind:oneclickunbind']"
          >一键解绑</el-button>
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
        <!-- 操作日志详细 -->
    <el-dialog :title="title" :visible.sync="open" width="1500px" append-to-body class="oper-log-dialog" @close="onDialogClose">
        <el-table 
        v-loading="loading" 
        :data="selectedBindingList" 
        stripe 
        @cell-dblclick="handleCellDblClick"
        class="admin-table"
        :max-height="tableMaxHeight"
        border
      >
        <el-table-column label="序号" type="index" width="60" align="center" />
        <el-table-column label="产品名称" align="center" prop="productName" width="200" show-overflow-tooltip />
        <el-table-column label="产品SN" align="center" prop="productSn" width="150" show-overflow-tooltip>
        </el-table-column>
        <el-table-column label="绑定账号" align="center" prop="userId" width="120" show-overflow-tooltip />
        <el-table-column label="绑定状态" align="center" prop="status" width="120"/>
        <el-table-column label="mac地址" align="center" prop="macAddress" width="120"/>
        <el-table-column label="固件版本" align="center" prop="firmwareVersion" width="160"/>
        <el-table-column label="绑定时间" align="center" prop="bindTime" width="120"/>
        <el-table-column label="操作时间" align="center" prop="unbindTime" width="120"/>
        <el-table-column label="操作人" align="center" prop="operator" width="120"/>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-if="!scope.row.unbindTime"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUnBindInDialog(scope.row)"
            v-hasPermi="['product:bind:oneclickunbind']"
          >一键解绑</el-button>
        </template>
      </el-table-column>
      </el-table>
      </el-dialog>
  </div>
</template>

<script>
import { listBindingRecord,unBindDevice,getBindInfo } from "@/api/binding/binding";
import { getDicts } from "@/api/system/dict/data";
import { MessageBox, Message } from 'element-ui'
export default {
  name: "FileManage",
  data() {
    return {
      // 时间范围选择器
      bindTimeRange: [], // 绑定时间范围
      unbindTimeRange: [], // 解绑时间范围
      // 加载状态
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 文件列表
      bindingRecord: [],
      selectedBindingList:[],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        productName: null,
        productSn: null,
        userId: null,
        status: null,
      },
      // 绑定原因选项（从字典获取）
      bindStatusOptions: [],
      productModelOptions:[],
      // 表格最大高度
      tableMaxHeight: 600,
      // 是否显示弹出层
      open: false,
      // 表单参数
      form: {},
      isDetail:false,
      title:'绑定记录-'
    };
  },
  created() {
    this.getList();
    this.loadBindStatusDict()
    this.loadProductModelDict()
    this.updateTableHeight();
    window.addEventListener('resize', this.updateTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateTableHeight);
  },
  computed: {
    calculatedTableHeight() {
      const searchHeight = this.showSearch ? 100 : 0;
      const toolbarHeight = 50;
      const paginationHeight = 60;
      return window.innerHeight - 200 - searchHeight - toolbarHeight - paginationHeight;
    }
  },
  methods: {
    onDialogClose() {
      console.log('close')
      this.isDetail = false
    },

    // 详情弹窗解绑
    handleUnBindInDialog(val){
      MessageBox.confirm(
        '解除将解除账号和设备的绑定关系，请谨慎操作。',
        '是否解绑？',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      .then(() => {
        unBindDevice({
          id: val.id,
          userId:this.$store.state.user.id
        }).then(response => {
          Message.success('解绑成功');
          if(this.isDetail){
            getBindInfo(val.productSn).then(response => {
            this.selectedBindingList = response.rows;
            });
          }
          this.getList();
        });
      })
      .catch(() => {
        // 取消
      });
    },
      /** 详细按钮操作 */
    handleView(row) {
      console.log(row)
      this.title='绑定记录-'+row.productSn
      this.isDetail = true
      getBindInfo(row.productSn).then(response => {
        this.selectedBindingList = response.rows
        this.open = true;
      });
    },
    /** 注册时间范围变化 */
    handleBindTimeRangeChange(val) {
      console.log(val)
      this.bindTimeRange = val || [];
    },
    /** 更新时间范围变化 */
    handleUnBindTimeRangeChange(val) {
      this.unbindTimeRange = val || [];
    },
    /** 更新表格高度 */
    updateTableHeight() {
      this.$nextTick(() => {
        this.tableMaxHeight = this.calculatedTableHeight;
      });
    },
    /** 查询文件列表 */
    getList() {
      this.loading = true;
      // 转换存储状态查询参数
      listBindingRecord(this.queryParams).then(response => {
        console.log(response)
        this.bindingRecord = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 加载绑定状态字典数据 */
    loadBindStatusDict() {
      getDicts('bind_status').then(response => {
        this.bindStatusOptions = response.data || [];
      }).catch(() => {
        this.bindStatusOptions = [];
      });
    },
    loadProductModelDict() {
      getDicts('product_model').then(response => {
        this.productModelOptions = response.data || [];
      }).catch(() => {
        this.productModelOptions = [];
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.beginBindTime = this.bindTimeRange.length > 0 ? this.bindTimeRange[0] : null
      this.endBindTime = this.bindTimeRange.length > 0 ? this.bindTimeRange[1] : null
      this.beginUnbindTime = this.unbindTimeRange.length > 0 ? this.unbindTimeRange[0] : null
      this.endUnbindTime = this.unbindTimeRange.length > 0 ? this.unbindTimeRange[1] : null
      this.queryParams.beginBindTime = this.beginBindTime
      this.queryParams.endBindTime = this.endBindTime
      this.queryParams.beginUnbindTime = this.beginUnbindTime
      this.queryParams.endUnbindTime = this.endUnbindTime
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.bindTimeRange = [];
      this.unbindTimeRange = [];
      this.handleQuery();
    },
    /** 格式化时长 */
    formatDuration(seconds) {
      if (!seconds) return '0';
      return seconds.toString();
    },
    /** 格式化文件大小 */
    formatFileSize(size) {
      if (!size) return '0';
      return size.toFixed(2);
    },
    /** 双击单元格 */
    handleCellDblClick(row, column, cell, event) {
      // 可以在这里添加双击查看详情的逻辑
    },
  }
};
</script>

<style scoped>
.admin-page-container {
  padding: 20px;
}
</style>

