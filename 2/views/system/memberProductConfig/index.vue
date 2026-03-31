<template>
  <div class="admin-page-container">
    <!-- 操作按钮区域 -->
    <el-row :gutter="10" class="admin-toolbar">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-setting"
          size="mini"
          @click="handlePrivilegeConfig"
          v-hasPermi="['system:memberproductconfig:edit']"
        >专属特权配置</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          @click="handlePriceConfig"
          v-hasPermi="['system:memberproductconfig:edit']"
        >多国家价格配置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <div class="admin-table-wrapper">
      <el-table
        v-loading="loading"
        :data="productList"
        stripe
        class="admin-table"
        :max-height="tableMaxHeight"
        border
      >
      <el-table-column label="产品ID" align="center" prop="productId" width="180" show-overflow-tooltip />
      <el-table-column label="产品名称" align="center" prop="productName" width="200" show-overflow-tooltip />
      <el-table-column label="产品类型" align="center" prop="productType" width="120">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.productType === PRODUCT_TYPE.PROFESSIONAL" type="success" size="small">
            {{ PRODUCT_TYPE_NAME_MAP[PRODUCT_TYPE.PROFESSIONAL] }}
          </el-tag>
          <el-tag v-else-if="scope.row.productType === PRODUCT_TYPE.EXPERIENCE" type="primary" size="small">
            {{ PRODUCT_TYPE_NAME_MAP[PRODUCT_TYPE.EXPERIENCE] }}
          </el-tag>
          <el-tag v-else-if="scope.row.productType === PRODUCT_TYPE.MASTER" type="danger" size="small">
            {{ PRODUCT_TYPE_NAME_MAP[PRODUCT_TYPE.MASTER] }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="转写时长总时长" align="center" prop="recordNumber" width="150" show-overflow-tooltip />
      <el-table-column label="有效时长" align="center" prop="recordEffectiveTime" width="150" />
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

    <!-- 专属特权配置对话框 -->
    <el-dialog title="专属特权配置" :visible.sync="privilegeOpen" width="1400px" append-to-body custom-class="admin-dialog">
      <el-form :model="privilegeForm" label-width="120px">
        <el-form-item label="产品类型">
          <el-radio-group v-model="privilegeForm.productType" @change="handleProductTypeChange">
            <el-radio :label="PRODUCT_TYPE.PROFESSIONAL">专业版会员</el-radio>
            <el-radio :label="PRODUCT_TYPE.EXPERIENCE">体验版会员</el-radio>
            <el-radio :label="PRODUCT_TYPE.MASTER">大师版会员</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <el-table
        :data="privilegeList"
        border
        style="margin-top: 20px"
        class="admin-table"
        :max-height="dialogTableMaxHeight"
      >
        <el-table-column label="特权名称" prop="privilegeName" width="180">
          <template slot-scope="scope">
            <el-input :disabled="scope.row.id" v-model="scope.row.privilegeName" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="特权code" prop="privilegeCode" width="200">
          <template slot-scope="scope">
            <el-input :disabled="scope.row.id" v-model="scope.row.privilegeCode" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="显示数值" prop="displayValue" width="150">
          <template slot-scope="scope">
            <el-input v-model="scope.row.displayValue" type="number" size="small" placeholder="如：10" />
          </template>
        </el-table-column>
        <el-table-column label="排序数值" prop="sortOrder" width="120">
          <template slot-scope="scope">
            <el-input-number v-model="scope.row.sortOrder" :min="0" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="是否高亮" prop="isHighlight" width="120">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.isHighlight"
              :active-value="'1'"
              :inactive-value="'0'"
            />
          </template>
        </el-table-column>
        <el-table-column label="区域配置" prop="regionCode" width="150">
          <template slot-scope="scope">
            <el-select v-model="scope.row.regionCode" size="small" placeholder="请选择区域">
              <el-option
                v-for="dict in dict.type.privilege_region"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="可用平台" prop="availablePlatform" width="150">
          <template slot-scope="scope">
            <el-select v-model="scope.row.availablePlatform" size="small" placeholder="请选择平台">
              <el-option label="全部" value="ALL" />
              <el-option label="仅App" value="APP" />
              <el-option label="仅Web" value="WEB" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDeletePrivilege(scope.$index)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 10px;">
        <el-button size="small" type="primary" icon="el-icon-plus" @click="handleAddPrivilege">新增特权</el-button>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="privilegeOpen = false">取 消</el-button>
        <el-button type="primary" @click="submitPrivilege" :loading="submitLoading">保 存</el-button>
      </div>
    </el-dialog>

    <!-- 多国家价格配置对话框 -->
    <el-dialog title="多国家价格配置" :visible.sync="priceOpen" width="95%" append-to-body custom-class="admin-dialog price-config-dialog">
      <div class="price-config-tips">
        <el-alert
          title="提示：价格单位为元，保存时会自动转换为分存储。转写时长单位为分钟。修改后的单元格会以黄色高亮显示。"
          type="info"
          :closable="false"
          show-icon
        />
      </div>

      <div class="price-table-wrapper">
        <el-table
          :data="priceMatrix"
          border
          v-loading="priceLoading"
          class="price-matrix-table"
          :max-height="priceTableMaxHeight"
        >
          <!-- 产品ID列 -->
          <el-table-column label="产品ID" prop="productId" width="180" fixed>
            <template slot-scope="scope">
              <span class="product-id">{{ scope.row.productId }}</span>
            </template>
          </el-table-column>

          <!-- 产品名称列 -->
          <el-table-column label="产品名称" prop="productName" width="150" fixed>
            <template slot-scope="scope">
              <span>{{ scope.row.productName }}</span>
            </template>
          </el-table-column>

          <!-- 各国家价格列 -->
          <el-table-column
            v-for="country in countryList"
            :key="country.value"
            :label="country.label + '/' + getCurrencyByCountry(country.value)"
            width="300"
            align="center"
          >
            <template slot-scope="scope">
              <!-- 有价格数据或体验版产品时显示编辑区 -->
              <div
                class="price-cell"
                :class="{
                  'price-cell-changed': scope.row[country.value] && scope.row[country.value].changed,
                  'price-cell-experience': isExperienceProduct(scope.row.productId)
                }"
                v-if="scope.row[country.value] || isExperienceProduct(scope.row.productId)"
              >
                <!-- 价格输入区（体验版隐藏） -->
                <div class="price-field" v-if="!isExperienceProduct(scope.row.productId) && scope.row[country.value]">
                  <span class="field-label">价格</span>
                  <el-input
                    v-model="scope.row[country.value].priceYuan"
                    size="mini"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    @change="handlePriceChange(scope.row, country.value)"
                  >
                    <template slot="prepend">{{ getCurrencySymbol(scope.row[country.value].currency) }}</template>
                  </el-input>
                </div>

                <!-- 转写时长输入区（大师版隐藏） -->
                <div class="price-field" v-if="!isUltimateProduct(scope.row.productId)">
                  <span class="field-label">时长</span>
                  <el-input
                    v-model="getOrCreatePriceData(scope.row, country.value).recordNumber"
                    size="mini"
                    type="number"
                    min="0"
                    placeholder="0"
                    @change="handlePriceChange(scope.row, country.value)"
                  >
                    <template slot="append">分钟</template>
                  </el-input>
                </div>

                <!-- Stripe价格ID输入区（体验版隐藏） -->
                <div class="price-field stripe-field" v-if="!isExperienceProduct(scope.row.productId) && scope.row[country.value]">
                  <span class="field-label">Stripe</span>
                  <el-input
                    v-model="scope.row[country.value].stripePriceId"
                    size="mini"
                    placeholder="price_xxx"
                    @change="handlePriceChange(scope.row, country.value)"
                  />
                </div>
              </div>
              <span v-else class="no-price">-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="priceOpen = false">取 消</el-button>
        <el-button type="primary" @click="submitPrices" :loading="priceSubmitLoading">保 存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listMemberProductConfig, getPrivilegeByProductType, savePrivileges, getPriceMatrix, batchSavePrices } from "@/api/system/memberProductConfig";
import { PRODUCT_TYPE, PRODUCT_TYPE_NAME_MAP } from "@/utils/payConstants";

export default {
  name: "MemberProductConfig",
  dicts: ['privilege_region', 'product_country', 'product_currency'],
  data() {
    return {
      // 常量暴露给模板使用
      PRODUCT_TYPE: PRODUCT_TYPE,
      PRODUCT_TYPE_NAME_MAP: PRODUCT_TYPE_NAME_MAP,
      // 遮罩层
      loading: true,
      // 表格最大高度
      tableMaxHeight: 600,
      // 对话框内表格最大高度
      dialogTableMaxHeight: 400,
      // 价格表格最大高度
      priceTableMaxHeight: 500,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 产品列表
      productList: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 专属特权配置对话框
      privilegeOpen: false,
      // 专属特权表单
      privilegeForm: {
        productType: PRODUCT_TYPE.PROFESSIONAL
      },
      // 特权列表
      privilegeList: [],
      // 提交加载状态
      submitLoading: false,

      // ===== 多国家价格配置 =====
      priceOpen: false,
      priceLoading: false,
      priceSubmitLoading: false,
      priceMatrix: [],
      // 修改过的价格记录
      changedPrices: [],
      // 国家列表（固定顺序）
      countryList: [
        { value: '中国', label: '中国', currency: 'CNY' },
        { value: '美国', label: '美国', currency: 'USD' },
        { value: '香港', label: '香港', currency: 'HKD' },
        { value: '台湾', label: '台湾', currency: 'TWD' },
        { value: '日本', label: '日本', currency: 'JPY' },
        { value: '英国', label: '英国', currency: 'GBP' },
        { value: '澳大利亚', label: '澳大利亚', currency: 'AUD' },
        { value: '德国', label: '德国', currency: 'EUR' },
        { value: '法国', label: '法国', currency: 'EUR' },
        { value: '意大利', label: '意大利', currency: 'EUR' },
        { value: '西班牙', label: '西班牙', currency: 'EUR' }
      ],
      // 货币符号映射
      currencySymbolMap: {
        'CNY': '¥',
        'USD': '$',
        'HKD': 'HK$',
        'TWD': 'NT$',
        'JPY': '¥',
        'GBP': '£',
        'AUD': 'A$',
        'EUR': '€'
      }
    };
  },
  computed: {
    // 动态计算表格高度
    calculatedTableHeight() {
      const toolbarHeight = 40;
      const paginationHeight = 80;
      const padding = 40;
      const tablePaginationGap = 12;
      const margins = 20;
      const reserved = toolbarHeight + paginationHeight + padding + tablePaginationGap + margins;
      const viewportHeight = window.innerHeight || 800;
      const calculated = viewportHeight - reserved - 84;
      return Math.max(300, calculated);
    },
    // 对话框内表格高度
    calculatedDialogTableHeight() {
      const viewportHeight = window.innerHeight || 800;
      const dialogHeight = viewportHeight * 0.8;
      const reserved = 200;
      const calculated = dialogHeight - reserved;
      return Math.max(250, Math.min(500, calculated));
    },
    // 价格配置表格高度
    calculatedPriceTableHeight() {
      const viewportHeight = window.innerHeight || 800;
      const dialogHeight = viewportHeight * 0.9;
      const reserved = 180;
      const calculated = dialogHeight - reserved;
      return Math.max(300, Math.min(600, calculated));
    }
  },
  mounted() {
    this.updateTableHeight();
    window.addEventListener('resize', this.updateTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateTableHeight);
  },
  created() {
    this.getList();
  },
  methods: {
    /** 更新表格高度 */
    updateTableHeight() {
      this.$nextTick(() => {
        this.tableMaxHeight = this.calculatedTableHeight;
        this.dialogTableMaxHeight = this.calculatedDialogTableHeight;
        this.priceTableMaxHeight = this.calculatedPriceTableHeight;
      });
    },
    /** 查询产品列表 */
    getList() {
      this.loading = true;
      listMemberProductConfig(this.queryParams).then(response => {
        this.productList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 打开专属特权配置 */
    handlePrivilegeConfig() {
      this.privilegeForm.productType = PRODUCT_TYPE.PROFESSIONAL;
      this.handleProductTypeChange();
      this.privilegeOpen = true;
    },
    /** 产品类型改变 */
    handleProductTypeChange() {
      this.loading = true;
      getPrivilegeByProductType(this.privilegeForm.productType).then(response => {
        this.privilegeList = response.data || [];
        this.privilegeList.forEach(item => {
          if (!item.regionCode) {
            this.$set(item, 'regionCode', 'all');
          }
          if (!item.availablePlatform) {
            this.$set(item, 'availablePlatform', 'ALL');
          }
        });
        this.loading = false;
      }).catch(() => {
        this.privilegeList = [];
        this.loading = false;
      });
    },
    /** 新增特权 */
    handleAddPrivilege() {
      this.privilegeList.push({
        privilegeName: '',
        privilegeCode: '',
        displayValue: '',
        sortOrder: this.privilegeList.length + 1,
        isHighlight: '0',
        regionCode: 'all',
        availablePlatform: 'ALL'
      });
    },
    /** 删除特权 */
    handleDeletePrivilege(index) {
      this.$modal.confirm('是否确认删除该特权？').then(() => {
        this.privilegeList.splice(index, 1);
      }).catch(() => {});
    },
    /** 提交特权配置 */
    submitPrivilege() {
      for (let i = 0; i < this.privilegeList.length; i++) {
        const item = this.privilegeList[i];
        if (!item.privilegeName || !item.privilegeCode) {
          this.$modal.msgError('请填写完整的特权名称和特权code');
          return;
        }
      }

      this.submitLoading = true;
      const data = {
        productType: this.privilegeForm.productType,
        privileges: this.privilegeList
      };
      savePrivileges(data).then(response => {
        this.$modal.msgSuccess("保存成功");
        this.privilegeOpen = false;
        this.submitLoading = false;
      }).catch(() => {
        this.submitLoading = false;
      });
    },

    // ===== 多国家价格配置方法 =====

    /** 打开多国家价格配置 */
    handlePriceConfig() {
      this.priceOpen = true;
      this.changedPrices = [];
      this.loadPriceMatrix();
    },

    /** 加载价格矩阵 */
    loadPriceMatrix() {
      this.priceLoading = true;
      getPriceMatrix().then(response => {
        // 处理数据，将分转换为元用于显示
        const matrix = response.data || [];
        matrix.forEach(row => {
          this.countryList.forEach(country => {
            if (row[country.value] && row[country.value].price !== undefined) {
              // 分转元
              row[country.value].priceYuan = (row[country.value].price / 100).toFixed(2);
              // 标记原始值用于比较
              row[country.value].originalPrice = row[country.value].price;
              row[country.value].originalRecordNumber = row[country.value].recordNumber;
            }
          });
        });
        this.priceMatrix = matrix;
        this.priceLoading = false;
      }).catch(() => {
        this.priceMatrix = [];
        this.priceLoading = false;
      });
    },

    /** 获取国家对应的货币代码 */
    getCurrencyByCountry(country) {
      const found = this.countryList.find(c => c.value === country);
      return found ? found.currency : 'USD';
    },

    /** 获取货币符号 */
    getCurrencySymbol(currency) {
      return this.currencySymbolMap[currency] || currency;
    },

    /** 判断是否为大师版商品（不需要配置转写时长） */
    isUltimateProduct(productId) {
      if (!productId) return false;
      const lowerProductId = productId.toLowerCase();
      return lowerProductId.includes('ultimate');
    },

    /** 判断是否为体验版商品（只需要配置转写时长，不需要价格和Stripe ID） */
    isExperienceProduct(productId) {
      if (!productId) return false;
      return productId === 'EXPERIENCE_FREE';
    },

    /** 获取或创建价格数据对象（用于体验版等没有价格记录的产品） */
    getOrCreatePriceData(row, country) {
      if (!row[country]) {
        // 为体验版创建空的价格数据对象
        const countryInfo = this.countryList.find(c => c.value === country);
        this.$set(row, country, {
          id: null,
          currency: countryInfo ? countryInfo.currency : 'CNY',
          price: 0,
          priceYuan: '0.00',
          recordNumber: '',
          stripePriceId: '',
          isNew: true // 标记为新建记录
        });
      }
      return row[country];
    },

    /** 价格变更处理 */
    handlePriceChange(row, country) {
      const priceData = row[country];
      if (!priceData) return;

      // 标记为已修改
      priceData.changed = true;

      // 记录修改
      const existingIndex = this.changedPrices.findIndex(
        p => p.productId === row.productId && p.country === country
      );

      const changeRecord = {
        id: priceData.id,
        productId: row.productId,
        country: country,
        currency: priceData.currency,
        price: Math.round(parseFloat(priceData.priceYuan || 0) * 100), // 元转分
        recordNumber: priceData.recordNumber,
        stripePriceId: priceData.stripePriceId
      };

      if (existingIndex >= 0) {
        this.changedPrices[existingIndex] = changeRecord;
      } else {
        this.changedPrices.push(changeRecord);
      }
    },

    /** 提交价格配置 */
    submitPrices() {
      // 收集所有修改过的价格
      const allChanges = [];
      this.priceMatrix.forEach(row => {
        this.countryList.forEach(country => {
          const priceData = row[country.value];
          if (priceData && priceData.changed) {
            allChanges.push({
              id: priceData.id,
              productId: row.productId,
              country: country.value,
              currency: priceData.currency,
              price: Math.round(parseFloat(priceData.priceYuan || 0) * 100),
              recordNumber: priceData.recordNumber,
              stripePriceId: priceData.stripePriceId
            });
          }
        });
      });

      if (allChanges.length === 0) {
        this.$modal.msgWarning('没有修改任何价格');
        return;
      }

      this.priceSubmitLoading = true;
      batchSavePrices(allChanges).then(response => {
        this.$modal.msgSuccess(`保存成功，共更新 ${allChanges.length} 条价格配置`);
        this.priceOpen = false;
        this.priceSubmitLoading = false;
        this.changedPrices = [];
      }).catch(() => {
        this.priceSubmitLoading = false;
      });
    }
  }
};
</script>

<style scoped lang="scss">
.price-config-tips {
  margin-bottom: 15px;
}

.price-table-wrapper {
  overflow-x: auto;
}

.price-matrix-table {
  .product-id {
    font-weight: 600;
    color: #409EFF;
    font-size: 12px;
  }

  .price-cell {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    border-radius: 6px;
    background: #fafafa;
    transition: all 0.3s ease;

    &:hover {
      background: #f0f7ff;
    }

    &.price-cell-changed {
      background: #fffbe6;
      border: 1px solid #ffe58f;

      &:hover {
        background: #fff7cc;
      }
    }

    &.price-cell-experience {
      background: #f0f9eb;
      border: 1px dashed #b3e19d;

      &:hover {
        background: #e1f3d8;
      }

      &.price-cell-changed {
        background: #fffbe6;
        border: 1px solid #ffe58f;
      }
    }
  }

  .price-field {
    display: flex;
    align-items: center;
    gap: 8px;

    .field-label {
      flex-shrink: 0;
      width: 40px;
      font-size: 12px;
      color: #606266;
      font-weight: 500;
      text-align: right;
    }

    .el-input {
      flex: 1;
    }

    &.stripe-field {
      padding-top: 6px;
      border-top: 1px dashed #e4e7ed;
      margin-top: 2px;

      .field-label {
        color: #909399;
      }
    }
  }

  .no-price {
    color: #C0C4CC;
    font-size: 14px;
  }
}

.price-config-dialog {
  .el-dialog__body {
    padding: 10px 20px;
  }
}

::v-deep .el-input-group__prepend {
  padding: 0 10px;
  min-width: 36px;
  background: #f5f7fa;
  font-weight: 500;
}

::v-deep .el-input-group__append {
  padding: 0 10px;
  background: #f5f7fa;
}

// 数字输入框去除上下箭头
::v-deep input[type="number"] {
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}

// 表格行hover效果
::v-deep .el-table__row {
  &:hover {
    .price-cell {
      background: #e6f7ff;

      &.price-cell-changed {
        background: #fff1b8;
      }
    }
  }
}
</style>
