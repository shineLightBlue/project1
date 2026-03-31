<template>
  <div class="admin-page-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px" class="admin-search-form">
      <el-form-item label="用户ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>

<!--      <el-form-item label="用户电话" prop="phonenumber">
        <el-input
          v-model="queryParams.phonenumber"
          placeholder="用户电话"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input
          v-model="queryParams.email"
          placeholder="邮箱"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>-->
      <el-form-item label="账号" prop="userAccount">
        <el-input
          v-model="queryParams.userAccount"
          placeholder="请输入手机号或邮箱"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="平台" prop="platForm">
        <el-select
          v-model="queryParams.platForm"
          placeholder="请选择平台"
          style="width: 180px"
          @change="handleQuery"
        >
          <el-option label="全部" :value="''" />
          <el-option label="ios" value="ios" />
          <el-option label="android" value="android" />
          <el-option label="web" value="web" />
        </el-select>
      </el-form-item>

      <el-form-item label="描述内容" prop="suggestionContent">
        <el-input
          v-model="queryParams.suggestionContent"
          placeholder="输入描述内容"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>


      <el-form-item label="反馈时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          clearable
          @keyup.enter.native="handleQuery">
        </el-date-picker>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="admin-toolbar">
      <!--      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['system:suggestion:add']"
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
          v-hasPermi="['system:suggestion:edit']"
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
          v-hasPermi="['system:suggestion:remove']"
        >删除</el-button>
      </el-col>-->
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:suggestion:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <div class="admin-table-wrapper">
      <el-table
        v-loading="loading"
        :data="suggestionList"
        @selection-change="handleSelectionChange"
        class="admin-table"
        :max-height="tableMaxHeight"
        stripe
        border
      >
      <el-table-column type="selection" width="5" align="center" />
      <el-table-column label="id" align="center" prop="id" />
      <el-table-column label="用户ID" align="center" prop="userId" />
<!--      <el-table-column label="用户电话" align="center" prop="phonenumber" />
      <el-table-column label="用户邮箱" align="center" prop="email" />-->
      <el-table-column label="用户账号" align="center" prop="phonenumber" width="180" show-overflow-tooltip>
        <template slot-scope="scope">
          <span class="clickable-cell"  @dblclick.stop="handleCellDblClick(scope.row, {property: scope.row.phonenumber ? 'phonenumber' : 'email'}, null, $event)">
            {{ scope.row.phonenumber || scope.row.email || '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="平台" align="center" prop="platForm" />
<!--      <el-table-column label="建议内容描述" align="center" prop="suggestionContent" :show-overflow-tooltip="true" />-->
      <el-table-column
        label="建议内容描述"
        align="center"
        prop="suggestionContent"
        :show-overflow-tooltip="true"
        @dblclick.native="copySuggestionContent(scope.row.suggestionContent)"
      >
        <template slot-scope="scope">
          <div @dblclick.stop="copySuggestionContent(scope.row.suggestionContent)">
            {{ scope.row.suggestionContent }}
          </div>
        </template>
      </el-table-column>

        <!-- 修改建议图片列 -->
      <el-table-column label="建议图片" align="center" prop="suggestionImglist">
        <template slot-scope="scope">
          <div class="image-preview-container" v-if="scope.row.suggestionImglist">
            <!-- 单张图片显示 -->
            <div
              v-if="getImageList(scope.row.suggestionImglist).length === 1"
              class="single-image"
              @click="previewImage(scope.row.suggestionImglist)"
            >
              <el-image
                :src="getImageList(scope.row.suggestionImglist)[0]"
                fit="cover"
                class="preview-image"
                :preview-src-list="[]"
              >
                <div slot="error" class="image-slot">
                  <i class="el-icon-picture-outline"></i>
                </div>
              </el-image>
            </div>

            <!-- 多张图片显示 -->
            <div v-else-if="getImageList(scope.row.suggestionImglist).length > 1">
              <el-popover
                placement="top"
                width="auto"
                trigger="hover"
                popper-class="image-popover"
              >
                <!-- 小图展示 -->
                <div class="multiple-images">
                  <el-image
                    v-for="(img, index) in getImageList(scope.row.suggestionImglist).slice(0, 3)"
                    :key="index"
                    :src="img"
                    fit="cover"
                    class="small-image"
                    @click="previewImage(scope.row.suggestionImglist, index)"
                  >
                    <div slot="error" class="image-slot">
                      <i class="el-icon-picture-outline"></i>
                    </div>
                  </el-image>

                  <!-- 更多图片提示 -->
                  <div
                    v-if="getImageList(scope.row.suggestionImglist).length > 3"
                    class="more-images"
                    @click="previewImage(scope.row.suggestionImglist, 3)"
                  >
                    <span>+{{ getImageList(scope.row.suggestionImglist).length - 3 }}</span>
                  </div>
                </div>

                <!-- 表格单元格内容 -->
                <div slot="reference" class="image-count">
                  <i class="el-icon-picture"></i>
                  <span>{{ getImageList(scope.row.suggestionImglist).length }}张图片</span>
                </div>
              </el-popover>
            </div>

            <!-- 无图片 -->
            <span v-else class="no-image">无图片</span>
          </div>
          <span v-else class="no-image">无图片</span>
        </template>
      </el-table-column>

      <el-table-column label="反馈时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <!--          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:suggestion:edit']"
          >修改</el-button>-->
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:suggestion:remove']"
          >删除</el-button>
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

    <!-- 添加或修改用户意见收集对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body custom-class="admin-dialog">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="form.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="建议内容描述">
          <editor v-model="form.suggestionContent" :min-height="192"/>
        </el-form-item>

        <!-- 添加图片上传组件 -->
        <el-form-item label="建议图片" prop="suggestionImglist">
          <el-upload
            action="#"
            list-type="picture-card"
            :file-list="fileList"
            :on-preview="handlePictureCardPreview"
            :on-remove="handleRemove"
            :on-change="handleUploadChange"
            :auto-upload="false"
            :multiple="true"
            :limit="6"
            accept="image/*"
          >
            <i class="el-icon-plus"></i>
          </el-upload>
          <el-dialog :visible.sync="dialogVisible" append-to-body custom-class="admin-dialog">
            <img width="100%" :src="dialogImageUrl" alt="">
          </el-dialog>
          <div class="upload-tip">支持上传最多6张图片，单个文件不超过2MB</div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog
      :visible.sync="previewDialogVisible"
      append-to-body
      :width="dialogWidth"
      custom-class="admin-dialog image-preview-dialog"
      :style="dialogStyle"
      @close="previewDialogVisible = false"
      class="image-preview-dialog"
    >
      <div style="text-align: right; margin-bottom: 10px;" v-if="previewImageList.length > 0">
        <el-button
          size="mini"
          type="text"
          @click="toggleOriginalSize"
          class="original-size-btn"
        >
<!--          {{ showOriginalSize ? '适应屏幕' : '原始尺寸' }}-->
        </el-button>
      </div>

      <div v-if="previewImageList.length > 0" class="carousel-wrapper" :style="{ height: carouselHeight }">
        <el-carousel
          :autoplay="false"
          :initial-index="previewIndex"
          indicator-position="outside"
          @change="handleCarouselChange"
          class="custom-carousel"
          ref="carousel"
        >
          <el-carousel-item
            v-for="(item, index) in previewImageList"
            :key="index"
            :class="{ 'original-size': showOriginalSize }"
          >
            <div class="carousel-image-container">
              <img
                :src="item"
                class="carousel-image"
                :class="{ 'original-size': showOriginalSize }"
                :alt="'预览图片 ' + (index + 1)"
                @load="handleImageLoad"
                ref="previewImages"
              />
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>
      <div slot="title" class="preview-title">
        图片预览 ({{ previewIndex + 1 }}/{{ previewImageList.length }})
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listSuggestion, getSuggestion, delSuggestion, addSuggestion, updateSuggestion } from "@/api/system/suggestion";

export default {
  name: "Suggestion",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 表格最大高度
      tableMaxHeight: 600,
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
      // 用户意见收集表格数据
      suggestionList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: null,
        userAccount: null,
        platForm: '',
        suggestionContent: null,
        // 修改为时间段范围
        createTimeStart: null,
        createTimeEnd: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        userId: [
          { required: true, message: "用户ID不能为空", trigger: "blur" }
        ],
      },
      // 图片上传相关
      fileList: [],
      dialogImageUrl: '',
      dialogVisible: false,
      // 图片预览相关
      previewDialogVisible: false,
      previewImageList: [],
      previewIndex: 0,
      // 新增：原始尺寸查看状态
      showOriginalSize: false,
      // 新增：对话框宽度
      dialogWidth: '80%',
      // 新增：对话框样式
      dialogStyle: {},
      // 新增：轮播图高度
      carouselHeight: 'auto',
      // 新增：图片尺寸信息
      imageDimensions: {}
    };
  },
  computed: {
    // 动态计算表格高度
    calculatedTableHeight() {
      const searchHeight = this.showSearch ? 70 : 0;
      const toolbarHeight = 40;
      const paginationHeight = 80; // 增加分页高度预留
      const padding = 40;
      const tablePaginationGap = 12; // 表格与分页的间距
      const margins = 20;
      const reserved = searchHeight + toolbarHeight + paginationHeight + padding + tablePaginationGap + margins;
      const viewportHeight = window.innerHeight || 800;
      const calculated = viewportHeight - reserved - 84;
      return Math.max(300, calculated); // 移除最大高度限制
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
    this.getList();
  },
  methods: {
    /** 更新表格高度 */
    updateTableHeight() {
      this.$nextTick(() => {
        this.tableMaxHeight = this.calculatedTableHeight;
      });
    },
    /** 将图片字符串转换为数组 */
    getImageList(imgStr) {
      if (!imgStr) return [];
      // 处理逗号分隔的字符串
      return imgStr.split(',').filter(item => item.trim()).map(item => item.trim());
    },

    /** 预览图片 */
    previewImage(imgStr, index = 0) {
      this.previewImageList = this.getImageList(imgStr);
      this.previewIndex = index;
      this.previewDialogVisible = true;
      // 重置为适应屏幕模式
      this.showOriginalSize = false;
      // 重置图片尺寸信息
      this.imageDimensions = {};
      // 设置默认对话框尺寸
      this.dialogWidth = '80%';
      this.carouselHeight = 'auto';
      this.dialogStyle = {
        top: '5vh'
      };

      // 预加载图片获取尺寸
      this.preloadImages();
    },

    /** 预加载图片获取尺寸 */
    preloadImages() {
      this.previewImageList.forEach((imgSrc, index) => {
        const img = new Image();
        img.onload = () => {
          this.$set(this.imageDimensions, index, {
            width: img.width,
            height: img.height,
            aspectRatio: img.width / img.height
          });
          // 如果是当前显示的图片，调整对话框大小
          if (index === this.previewIndex) {
            this.adjustDialogSize(img.width, img.height);
          }
        };
        img.src = imgSrc;
      });
    },

    /** 调整对话框大小 */
    adjustDialogSize(imgWidth, imgHeight) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const maxDialogWidth = windowWidth * 0.9;
      const maxDialogHeight = windowHeight * 0.9;
      const headerHeight = 60; // 对话框标题栏高度
      const padding = 40; // 内边距

      // 计算适应窗口的图片尺寸
      let targetWidth = imgWidth;
      let targetHeight = imgHeight;

      // 如果图片宽度超过最大宽度
      if (targetWidth > maxDialogWidth) {
        const ratio = maxDialogWidth / targetWidth;
        targetWidth = maxDialogWidth;
        targetHeight = targetHeight * ratio;
      }

      // 如果图片高度超过最大高度
      if (targetHeight > (maxDialogHeight - headerHeight - padding)) {
        const ratio = (maxDialogHeight - headerHeight - padding) / targetHeight;
        targetHeight = maxDialogHeight - headerHeight - padding;
        targetWidth = targetWidth * ratio;
      }

      // 设置对话框宽度
      this.dialogWidth = `${Math.min(targetWidth + padding, maxDialogWidth)}px`;

      // 设置轮播图容器高度
      this.carouselHeight = `${targetHeight}px`;

      // 设置对话框位置
      const dialogTop = Math.max((windowHeight - (targetHeight + headerHeight + padding)) / 2, 20);
      this.dialogStyle = {
        top: `${dialogTop}px`
      };
    },

    /** 处理图片加载完成事件 */
    handleImageLoad(event) {
      const img = event.target;
      const index = Array.from(this.$refs.previewImages || []).indexOf(img);

      // 获取图片实际尺寸
      const imgWidth = img.naturalWidth || img.width;
      const imgHeight = img.naturalHeight || img.height;

      // 保存图片尺寸
      if (index >= 0) {
        this.$set(this.imageDimensions, index, {
          width: imgWidth,
          height: imgHeight,
          aspectRatio: imgWidth / imgHeight
        });

        // 如果是当前显示的图片，调整对话框大小
        if (index === this.previewIndex) {
          this.adjustDialogSize(imgWidth, imgHeight);
        }
      }

      // 图片加载完成后，可以根据需要调整父容器
      const container = img.closest('.carousel-image-container');
      if (container && !this.showOriginalSize) {
        // 在适应屏幕模式下，可以根据需要调整样式
        container.style.height = 'auto';
      }
    },

    /** 切换原始尺寸查看 */
    toggleOriginalSize() {
      this.showOriginalSize = !this.showOriginalSize;

      if (this.showOriginalSize) {
        // 原始尺寸模式
        const currentImg = this.imageDimensions[this.previewIndex];
        if (currentImg) {
          this.adjustDialogSize(currentImg.width, currentImg.height);
        }
      } else {
        // 适应屏幕模式
        this.adjustDialogSizeToWindow();
      }
    },

    /** 调整对话框大小适应窗口 */
    adjustDialogSizeToWindow() {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      this.dialogWidth = '80%';
      this.carouselHeight = 'auto';
      this.dialogStyle = {
        top: '5vh'
      };
    },

    /** 处理轮播图切换事件 */
    handleCarouselChange(currentIndex) {
      console.log('轮播图切换到索引:', currentIndex);
      this.previewIndex = currentIndex;

      // 如果切换到原始尺寸模式，调整对话框大小
      if (this.showOriginalSize) {
        const currentImg = this.imageDimensions[currentIndex];
        if (currentImg) {
          setTimeout(() => {
            this.adjustDialogSize(currentImg.width, currentImg.height);
          }, 100);
        }
      }
    },

    /** 查询用户意见收集列表 */
    getList() {
      this.loading = true;
      listSuggestion({
        'createTimeStart':this.queryParams.createTimeStart,
        'createTimeEnd':this.queryParams.createTimeEnd,
        'pageNum':this.queryParams.pageNum,
        'suggestionContent':this.queryParams.suggestionContent,
        'userAccount':this.queryParams.userAccount,
        'platForm':this.queryParams.platForm,
        'userId':this.queryParams.userId,
        'pageSize':this.queryParams.pageSize

      }).then(response => {
        this.suggestionList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },

    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
      this.fileList = [];
    },

    // 表单重置
    reset() {
      this.form = {
        id: null,
        userId: null,
        suggestionContent: null,
        suggestionImglist: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.resetForm("form");
      this.fileList = [];
    },

    // 处理图片上传变化
    handleUploadChange(file, fileList) {
      this.fileList = fileList;
      // 将图片文件转换为base64或URL
      const imgUrls = fileList.map(file => {
        if (file.url) return file.url;
        if (file.response) return file.response.url;
        return URL.createObjectURL(file.raw);
      });
      this.form.suggestionImglist = imgUrls.join(',');
    },

    // 图片预览
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url;
      this.dialogVisible = true;
    },

    // 移除图片
    handleRemove(file, fileList) {
      this.fileList = fileList;
      const imgUrls = fileList.map(file => {
        if (file.url) return file.url;
        if (file.response) return file.response.url;
        return URL.createObjectURL(file.raw);
      });
      this.form.suggestionImglist = imgUrls.join(',');
    },

    /** 搜索按钮操作 */
    handleQuery() {
      // 处理时间段选择
      if (this.queryParams.createTime && this.queryParams.createTime.length === 2) {
        this.queryParams.createTimeStart = this.queryParams.createTime[0];
        this.queryParams.createTimeEnd = this.queryParams.createTime[1];
      } else {
        this.queryParams.createTimeStart = null;
        this.queryParams.createTimeEnd = null;
      }
      this.queryParams.pageNum = 1;
      this.getList();
    },

    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      // 重置时间段
      this.queryParams.createTimeStart = null;
      this.queryParams.createTimeEnd = null;
      // 平台重置为“全部”（绑定值为空字符串）
      this.queryParams.platForm = '';
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
      this.title = "添加用户意见收集";
    },

    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids;
      getSuggestion(id).then(response => {
        this.form = response.data;

        // 将图片字符串转换为上传文件列表
        if (this.form.suggestionImglist) {
          const imgUrls = this.getImageList(this.form.suggestionImglist);
          this.fileList = imgUrls.map((url, index) => ({
            name: `image_${index + 1}.jpg`,
            url: url
          }));
        }

        this.open = true;
        this.title = "修改用户意见收集";
      });
    },

    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateSuggestion(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addSuggestion(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除用户意见收集编号为"' + ids + '"的数据项？').then(function() {
        return delSuggestion(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },

    /** 导出按钮操作 */
    handleExport() {
      this.download('system/suggestion/export', {
        ...this.queryParams
      }, `suggestion_${new Date().getTime()}.xlsx`)
    },

    /**
     * 双击复制建议内容
     * @param {string} content - 要复制的内容
     */
    copySuggestionContent(content) {
      console.log(content);
      if (!content) {
        this.$message.warning('内容为空，无法复制');
        return;
      }

      // 执行复制
      if (navigator.clipboard) {
        navigator.clipboard.writeText(content).then(() => {
          this.$message.success('已复制: ' + content);
        }).catch(() => {
          this.fallbackCopy("content", content);
        });
      } else {
        this.fallbackCopy("content", content);
      }

      // 使用 Clipboard API（现代浏览器）
      // if (navigator.clipboard && window.isSecureContext) {
      //   navigator.clipboard.writeText(content.toString()).then(() => {
      //     this.$message.success('内容已复制到剪贴板:'+content.toString());
      //   }).catch(err => {
      //     console.error('复制失败:', err);
      //     // 降级方案
      //     this.fallbackCopyTextToClipboard(content.toString());
      //   });
      // } else {
      //   // 降级方案：使用 document.execCommand
      //   this.fallbackCopyTextToClipboard(content.toString());
      // }
    },

    /**
     * 降级复制方案
     * @param {string} text - 要复制的文本
     */
    fallbackCopyTextToClipboard(text) {
      const textArea = document.createElement("textarea");
      textArea.value = text;

      // 避免滚动到底部
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          this.$message.success('内容已复制到剪贴板');
        } else {
          this.$message.error('复制失败');
        }
      } catch (err) {
        console.error('复制操作不被支持:', err);
        this.$message.error('复制功能不可用');
      }

      document.body.removeChild(textArea);
    }



  }
};
</script>

<style scoped>
/* 图片预览容器样式 */
.image-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60px;
}

.single-image {
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ebeef5;
}

.single-image:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 80px;
  height: 60px;
  object-fit: cover;
}

.multiple-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 300px;
  padding: 10px;
}

.small-image {
  width: 60px;
  height: 60px;
  cursor: pointer;
  border-radius: 4px;
  object-fit: cover;
  transition: all 0.3s;
  border: 1px solid #ebeef5;
}

.small-image:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.15);
}

.more-images {
  width: 60px;
  height: 60px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px dashed #c0c4cc;
  color: #909399;
  font-weight: bold;
  transition: all 0.3s;
}

.more-images:hover {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.image-count {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: #409eff;
  padding: 5px 10px;
  border-radius: 4px;
  transition: all 0.3s;
}

.image-count:hover {
  background-color: #ecf5ff;
}

.image-count i {
  font-size: 16px;
}

.no-image {
  color: #909399;
  font-style: italic;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 20px;
}

/* 轮播图样式 */
.carousel-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.carousel-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 10px;
  background: #f5f7fa;
}

.carousel-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 原始尺寸样式 */
.carousel-image.original-size {
  max-width: none;
  max-height: none;
  object-fit: none;
  border-radius: 0;
  box-shadow: none;
}

.original-size-btn {
  color: #409eff;
  padding: 5px 10px;
  font-size: 12px;
  margin-right: 10px;
}

.original-size-btn:hover {
  background-color: #ecf5ff;
  border-radius: 4px;
}

.preview-title {
  text-align: center;
  font-weight: bold;
  color: #333;
  padding-bottom: 10px;
}

/* 上传提示 */
.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .carousel-image-container {
    padding: 5px;
  }
}
</style>

<style>
/* 全局样式 */
.image-popover {
  min-width: 200px !important;
  padding: 10px !important;
}

/* 图片预览对话框样式 */
.image-preview-dialog .el-dialog__body {
  padding: 10px 20px !important;
  overflow: hidden;
}

/* 自定义轮播图样式 */
.custom-carousel {
  width: 100%;
  height: 100%;
}

.custom-carousel .el-carousel__container {
  height: 100% !important;
}

.custom-carousel .el-carousel__item {
  height: 100% !important;
  background-color: #f5f7fa !important;
  padding-bottom: 40px !important; /* 给指示器留出空间 */
}

.custom-carousel .el-carousel__indicators {
  position: absolute !important;
  bottom: 10px !important;
  left: 0 !important;
  right: 0 !important;
}

.custom-carousel .el-carousel__item.original-size {
  background-color: #000 !important;
  padding-bottom: 0 !important;
}

.custom-carousel .el-carousel__item.original-size .carousel-image-container {
  background-color: #000 !important;
  padding: 0 !important;
}

/* 鼠标悬停时显示缩放效果 */
.carousel-image:hover {
  cursor: zoom-in;
  transform: scale(1.01);
  transition: transform 0.3s ease;
}

.copyable-content {
  cursor: pointer;
  position: relative;
}

.copyable-content:hover {
  background-color: #f5f7fa;
  border-radius: 4px;
}

/* 在表格单元格中显示可复制提示 */
.copyable-content::after {
  content: "双击复制";
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  color: #909399;
  opacity: 0;
  transition: opacity 0.3s;
}

.copyable-content:hover::after {
  opacity: 1;
}

</style>
