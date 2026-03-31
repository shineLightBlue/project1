<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="产品名称" prop="productName">
        <el-select
          v-model="queryParams.productName"
          placeholder="请选择产品名称"
          filterable
          clearable
        >
          <el-option
            v-for="item in productList"
            :key="item.id"
            :label="item.name"
            :value="item.name"
          ></el-option>
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
          v-hasPermi="['firmware:firmware:add']"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['firmware:firmware:edit']"
        >修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['firmware:firmware:remove']"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['firmware:firmware:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="firmwareList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <!--      <el-table-column label="主键id" align="center" prop="id"/>-->
      <el-table-column
        label="产品名称"
        align="center"
        prop="productId"
        :formatter="formatProductName"
      />
      <el-table-column
        label="固件文件名称"
        align="center"
        prop="firmwareFilename"
        show-overflow-tooltip
        min-width="200"
      >
<!--        <template #default="scope">-->
<!--          <el-tooltip class="item" effect="dark" :content="scope.row.firmwareFilename" placement="top">-->
<!--      <span-->
<!--        style="color: green; display: inline-block; max-width: 600px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"-->
<!--      >-->
<!--        {{ scope.row.firmwareFilename }}-->
<!--      </span>-->
<!--          </el-tooltip>-->
<!--        </template>-->
      </el-table-column>
      <!--      <el-table-column label="固件版本号" align="center" prop="firmwareVersionNum"/>-->
      <el-table-column label="固件版本名称" align="center" prop="firmwareVersion"/>
      <!--      <el-table-column label="基础版本号" align="center" prop="upBaseVersionNum"/>-->
      <el-table-column label="强升版本号" align="center" prop="upLowestVersionNum" />
      <el-table-column label="固件描述(中文)" align="center" prop="firmwareDesCn"         show-overflow-tooltip/>
      <!--      <el-table-column label="固件描述(俄语)" align="center" prop="firmwareDesRu"/>-->
      <!--      <el-table-column label="固件描述(英文)" align="center" prop="firmwareDesEn"/>-->
      <!--      <el-table-column label="强升描述(中文)" align="center" prop="forceUpdateDesCn"/>-->
      <!--      <el-table-column label="强升描述(俄语)" align="center" prop="forceUpdateDesRu"/>-->
      <!--      <el-table-column label="强升描述(英文)" align="center" prop="forceUpdateDesEn"/>-->
      <el-table-column label="MD5" align="center" prop="firmwareMd5"         show-overflow-tooltip/>
      <el-table-column label="创建者" align="center" prop="createBy"/>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新者" align="center" prop="updateBy"/>
      <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.updateTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="skipStatus">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.skip_status" :value="scope.row.skipStatus"/>
        </template>
      </el-table-column>      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            @click="toggleSkipStatus(scope.row)"
          >{{ scope.row.skipStatus === '0' ? '停用' : '启用' }}
          </el-button>

          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['firmware:firmware:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['firmware:firmware:remove']"
          >删除
          </el-button>
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

    <!-- 添加或修改firmware对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="1500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="150px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品" prop="productId">
              <el-select v-model="form.productId" placeholder="请选择产品" filterable>
                <el-option
                  v-for="item in productList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="固件文件" prop="fileUpload">
              <file-upload
                v-model="form.fileUpload"
                @input="handleFilePathChange"
                @change="handleFileChange"
                @success="handleUploadSuccess"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="固件地址" prop="filePath">
              <el-input v-model="form.filePath" placeholder="固件url"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="固件文件名称" prop="firmwareFilename">
              <el-input v-model="form.firmwareFilename" placeholder="请输入固件文件名称"/>
            </el-form-item>
          </el-col>
          <!--          <el-col :span="12">-->
          <!--            <el-form-item label="固件版本号" prop="firmwareVersionNum">-->
          <!--              <el-input v-model="form.firmwareVersionNum" placeholder="请输入固件版本号"/>-->
          <!--            </el-form-item>-->
          <!--          </el-col>-->
          <el-col :span="12">
            <el-form-item label="固件版本" prop="firmwareVersion">
              <el-input v-model="form.firmwareVersion" placeholder="请输入固件版本名称"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支持升级的基础版本号" prop="upBaseVersionNum">
              <el-input v-model="form.upBaseVersionNum" placeholder="请输入支持升级的基础版本号"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="强升最低版本号" prop="upLowestVersionNum">
              <el-input v-model="form.upLowestVersionNum" placeholder="请输入强制升级最低版本号"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="固件描述(中文)" prop="firmwareDesCn">
              <el-input v-model="form.firmwareDesCn" type="textarea" placeholder="请输入内容"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="俄语描述" prop="firmwareDesRu">
              <el-input v-model="form.firmwareDesRu" type="textarea" placeholder="请输入内容"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="固件描述(英文)" prop="firmwareDesEn">
              <el-input v-model="form.firmwareDesEn" type="textarea" placeholder="请输入内容"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="强升描述(中文)" prop="forceUpdateDesCn">
              <el-input v-model="form.forceUpdateDesCn" type="textarea" placeholder="请输入内容"/>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="强升描述(俄语)" prop="forceUpdateDesRu">
              <el-input v-model="form.forceUpdateDesRu" type="textarea" placeholder="请输入内容"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="强升描述(英文)" prop="forceUpdateDesEn">
              <el-input v-model="form.forceUpdateDesEn" type="textarea" placeholder="请输入内容"/>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="MD5" prop="firmwareMd5">
              <el-input v-model="form.firmwareMd5" placeholder="自动生成" readonly/>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listFirmware,
  getFirmware,
  delFirmware,
  addFirmware,
  updateFirmware,
  listProduct,
  changeSkipStatus
} from '@/api/firmware/firmware'
import SparkMD5 from 'spark-md5'

export default {
  name: 'Firmware',
  dicts: ['skip_status'],
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
      // firmware表格数据
      firmwareList: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {}
    }
  },
  created() {
    this.getProductList()
    this.getList()
  },
  methods: {
    /** 查询firmware列表 */
    getList() {
      this.loading = true
      listFirmware(this.queryParams).then(response => {
        this.firmwareList = response.rows
        this.total = response.total
        this.loading = false
      }).catch(() => {
        this.loading = false
        this.$message.error('获取固件列表失败')
      })
    },
    getProductList() {
      listProduct().then(res => {
        // 假设返回数据结构为 { data: [{id: 1, name: '产品A'}, ...] }
        this.productList = res.data
        console.log(res.data)
      }).catch(() => {
        this.$message.error('获取产品列表失败')
      })
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    formatProductName(row) {
      const product = this.productList.find(item => item.id === row.productId)
      return product ? product.name : ''
    },
    // toggleSkipStatus(row) {
    //   const targetText = row.skipStatus === "1" ? "启用" : "停用";
    //   this.$modal.confirm(`确定要${targetText}吗？`)
    //     .then(() => {
    //       return changeSkipStatus(row.id);
    //     })
    //     .then(() => {
    //       // 前端本地更新，不需要刷新整个列表数据正在处理，请勿重复提交
    //       row.skipStatus = row.skipStatus === "1" ? "0" : "1";
    //       this.$message.success("状态已更新");
    //     })
    //     .catch(() => {});
    // },

    toggleSkipStatus(row) {
      changeSkipStatus(row.id).then(() => {
        row.skipStatus = row.skipStatus === "1" ? "0" : "1";
        this.$message.success("状态已更新");
      });
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
        firmwareFilename: null,
        firmwareVersionNum: null,
        firmwareVersion: null,
        filePath: null,
        upBaseVersionNum: null,
        upLowestVersionNum: null,
        firmwareDesCn: null,
        firmwareDesRu: null,
        firmwareDesEn: null,
        forceUpdateDesCn: null,
        forceUpdateDesRu: null,
        forceUpdateDesEn: null,
        firmwareMd5: null,
        productId: null,
        skipStatus: null
      }
      this.resetForm('form')
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    handleFilePathChange(newPath) {
      this.form.filePath = newPath
      // 提取文件名（去掉路径）
      if (newPath) {
        const name = newPath.split('/').pop() // 获取最后一段
        this.form.firmwareFilename = name     // 自动填入固件文件名称
      }
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加firmware'
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getFirmware(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改firmware'
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateFirmware(this.form).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addFirmware(this.form).then(response => {
              this.$modal.msgSuccess('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除firmware编号为"' + ids + '"的数据项？').then(function() {
        return delFirmware(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {
      })
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('firmware/firmware/export', {
        ...this.queryParams
      }, `firmware_${new Date().getTime()}.xlsx`)
    },
    // ② 上传成功后触发 → 填充 filePath
    handleUploadSuccess(fileUrl) {
      console.log('上传成功，返回URL：', fileUrl)
      this.form.filePath = fileUrl
    },
    // 上传文件选中时计算 MD5
    handleFileChange(file) {
      if (!file.raw) return
      this.calculateFileMd5(file.raw)
    },
    // // 上传文件选中时计算 MD5 或 上传成功后回填 URL
    // handleFileChange(fileOrUrl) {
    //   // 情况 1️⃣：上传成功返回的 URL
    //   if (typeof fileOrUrl === 'string') {
    //     console.log('上传成功，返回的URL：', fileOrUrl)
    //     this.form.filePath = fileOrUrl  // 自动回填固件地址
    //     return
    //   }
    //
    //   // 情况 2️⃣：文件选中时（包含 raw 对象）
    //   if (fileOrUrl && fileOrUrl.raw) {
    //     this.calculateFileMd5(fileOrUrl.raw)
    //   }
    // },
    // 计算 MD5（支持大文件分片）
    calculateFileMd5(file) {
      const chunkSize = 10 * 1024 * 1024 // 每片10MB
      const chunks = Math.ceil(file.size / chunkSize)
      let currentChunk = 0
      const spark = new SparkMD5.ArrayBuffer()
      const fileReader = new FileReader()

      fileReader.onload = (e) => {
        spark.append(e.target.result)
        currentChunk++

        if (currentChunk < chunks) {
          loadNext()
        } else {
          const md5 = spark.end()
          this.form.firmwareMd5 = md5
          this.$message.success('MD5 计算完成')
        }
      }

      fileReader.onerror = () => {
        this.$message.error('计算 MD5 失败')
      }

      const loadNext = () => {
        const start = currentChunk * chunkSize
        const end = Math.min(start + chunkSize, file.size)
        fileReader.readAsArrayBuffer(file.slice(start, end))
      }
      loadNext()
    }
  }
}
</script>
