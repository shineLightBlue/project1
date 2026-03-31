<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="平台" prop="systemName">
        <el-select v-model="queryParams.systemName" placeholder="请选择平台" clearable>
          <el-option
            v-for="dict in dict.type.platform"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['application:application:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['application:application:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['application:application:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['application:application:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="applicationList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
<!--      <el-table-column label="主键id" align="center" prop="id" />-->
      <el-table-column label="应用名称" align="center" prop="appName" />
      <el-table-column label="平台" align="center" prop="systemName">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.platform" :value="scope.row.systemName"/>
        </template>
      </el-table-column>
<!--      <el-table-column label="应用包名" align="center" prop="appPackage" />-->
      <el-table-column label="应用描述" align="center" prop="appDescribe" />
      <el-table-column label="应用版本" align="center" prop="appVersion" />
<!--      <el-table-column label="是否强制升级版本" align="center" prop="isUpLowestVersion" />-->
      <el-table-column label="apk下载链接" align="center" prop="apkUrl" />
      <el-table-column label="中文升级描述" align="center" prop="upgradeDesCn" />
      <el-table-column label="英文升级描述" align="center" prop="upgradeDesEn" />
<!--      <el-table-column label="所属品牌" align="center" prop="brand" />-->
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['application:application:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['application:application:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改application对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="1000px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="应用名称" prop="appName">
          <el-input v-model="form.appName" placeholder="请输入应用名称" />
        </el-form-item>
        <el-form-item label="平台" prop="systemName">
          <el-select v-model="form.systemName" placeholder="请选择平台">
            <el-option
              v-for="dict in dict.type.platform"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="应用包名" prop="appPackage">
          <el-input v-model="form.appPackage" placeholder="请输入应用包名" />
        </el-form-item>
        <el-form-item label="应用描述" prop="appDescribe">
          <el-input v-model="form.appDescribe" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="应用版本" prop="appVersion">
          <el-input v-model="form.appVersion" placeholder="请输入应用版本" />
        </el-form-item>
<!--        <el-form-item label="是否强制升级版本" prop="isUpLowestVersion">-->
<!--          <el-input v-model="form.isUpLowestVersion" placeholder="请输入是否强制升级版本" />-->
<!--        </el-form-item>-->
        <el-form-item label="apk上传" prop="apkUpload">
          <file-upload
            @success="handleUploadSuccess"
            :file-size="200"/>
        </el-form-item>
        <el-form-item label="apk下载链接" prop="apkUrl">
          <el-input v-model="form.apkUrl" placeholder="自动填充" />
        </el-form-item>
        <el-form-item label="中文升级描述" prop="upgradeDesCn">
          <el-input v-model="form.upgradeDesCn" placeholder="请输入中文升级描述" />
        </el-form-item>
        <el-form-item label="英文升级描述" prop="upgradeDesEn">
          <el-input v-model="form.upgradeDesEn" placeholder="请输入英文升级描述" />
        </el-form-item>
<!--        <el-form-item label="所属品牌" prop="brand">-->
<!--          <el-input v-model="form.brand" placeholder="请输入所属品牌" />-->
<!--        </el-form-item>-->
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listApplication, getApplication, delApplication, addApplication, updateApplication } from "@/api/application/application";

export default {
  name: "Application",
  dicts: ['platform'],
  data() {
    return {
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
      // application表格数据
      applicationList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        systemName: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询application列表 */
    getList() {
      this.loading = true;
      listApplication(this.queryParams).then(response => {
        this.applicationList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    handleUploadSuccess(fileUrl) {
      console.log('上传成功，返回URL：', fileUrl)
      this.form.apkUrl = fileUrl
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        delFlag: null,
        appName: null,
        systemName: null,
        appPackage: null,
        appDescribe: null,
        appIcon: null,
        company: null,
        appVersion: null,
        downloadCode: null,
        isUpLowestVersion: null,
        apkUrl: null,
        upgradeDesCn: null,
        upgradeDesEn: null,
        brand: null
      };
      this.resetForm("form");
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
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加application";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getApplication(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改application";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateApplication(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addApplication(this.form).then(response => {
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
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除application编号为"' + ids + '"的数据项？').then(function() {
        return delApplication(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('application/application/export', {
        ...this.queryParams
      }, `application_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
