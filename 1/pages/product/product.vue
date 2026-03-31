<template>
	<view class="product-page">
		<!-- 状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 自定义导航栏（只占左侧，右侧留给微信胶囊） -->
		<view class="top-nav" :style="{ height: navBarHeight + 'px' }">
			<text class="nav-title">BOYA Notra</text>
		</view>

		<!-- 商品轮播图 -->
		<view class="hero-wrap">
			<swiper
				class="banner-swiper"
				:indicator-dots="bannerList.length > 1"
				indicator-color="rgba(255,255,255,0.5)"
				indicator-active-color="#ffffff"
				:autoplay="bannerList.length > 1"
				:interval="3500"
				:circular="true"
			>
				<swiper-item v-for="(item, idx) in bannerList" :key="idx">
					<video
						v-if="item.fileType === 2"
						:src="item.url"
						class="banner-media"
						:controls="true"
						:show-play-btn="true"
						object-fit="cover"
					/>
					<image
						v-else
						:src="item.url"
						mode="aspectFill"
						class="banner-media"
					/>
				</swiper-item>
			</swiper>
			<view v-if="product && product.isNewProduct === 1" class="tag-new">新品</view>
		</view>

		<!-- 商品信息卡片 -->
		<view class="product-info-card">
			<text class="product-title">{{ product ? product.productName : '加载中...' }}</text>
			<text v-if="product && product.productDesc" class="product-desc">{{ product.productDesc }}</text>
			<view v-if="!isVerified" class="price-placeholder">
				<text class="price-placeholder-text">请先输入邀请码后查看价格</text>
			</view>
			<view v-else-if="product && product.hasSku && selectedItems.length === 0" class="price-placeholder">
				<text class="price-placeholder-text">请先选择规格</text>
			</view>
			<view v-else-if="unitPrice" class="price-display">
				<text class="price-symbol">¥</text>
				<text class="price-value">{{ unitPrice }}</text>
				<text class="price-unit">{{ isMultiSkuOrder && orderPreview ? '/件(均价)' : '/件' }}</text>
			</view>
			<view v-else class="price-placeholder">
				<text class="price-placeholder-text">价格计算中</text>
			</view>
		</view>

		<!-- 模式2：规格选择入口（点击打开弹窗；已有选项时不显示入口，改用底部"继续添加"按钮） -->
		<view v-if="product && product.hasSku && selectedItems.length === 0" class="section-card sku-entry-card" @tap="openSkuSelector">
			<view class="sku-entry-row">
				<text class="section-title">规格选择</text>
				<view class="sku-entry-right">
					<text class="sku-entry-hint">请选择规格 &gt;</text>
				</view>
			</view>
		</view>

		<!-- 购买数量 + 阶梯价格
			 模式1：始终显示；模式2：SKU模式下隐藏（数量由 selectedItems 各行管理） -->
		<view v-if="!product || !product.hasSku" class="section-card">
			<view class="qty-row">
				<text class="section-title">购买数量</text>
				<view class="quantity-selector">
					<view class="qty-btn" :class="{ disabled: quantity <= (inviteCodeMinQty || 1) }" @tap="changeQty(-1)">
						<view class="icon-minus"></view>
					</view>
					<input
						class="qty-value"
						type="number"
						:value="quantity"
						@input="onQtyInput"
						@blur="onQtyBlur"
					/>
					<view class="qty-btn" @tap="changeQty(1)">
						<view class="icon-plus"></view>
					</view>
				</view>
			</view>
			<view v-if="inviteCodeMinQty && inviteCodeMinQty > 1" class="qty-limit-tip">
				<text>最低购买 {{ inviteCodeMinQty }} 件</text>
			</view>

			<!-- 邀请码阶梯价（方案三 ladder，优先显示；非SKU模式） -->
			<view v-if="isVerified && inviteCodeLadderTiers && inviteCodeLadderTiers.length > 0 && (!product || !product.hasSku)">
				<view class="tier-wrap">
					<view class="tier-label">
						<text class="section-hint">阶梯价格</text>
						<text class="tier-hint-right">买得多更优惠</text>
					</view>
					<view class="tier-list">
						<view
							v-for="(tier, idx) in inviteCodeLadderTiers"
							:key="idx"
							class="tier-chip"
							:class="{ active: isActiveTier(tier) }"
						>
							<text class="tier-chip-range">{{ tierRangeLabel(tier) }}件</text>
							<text class="tier-chip-price">¥{{ parseFloat(tier.unitPrice).toFixed(2) }}</text>
						</view>
					</view>
				</view>
			</view>

		</view>

		<!-- SKU 选择器底部弹窗 -->
		<sku-selector
			v-if="product && product.hasSku"
			:visible="showSkuSelector"
			:dimensions="skuDimensions"
			:skus="skuList"
			:product-img="productImg"
			:initial-quantity="inviteCodeMinQty || 1"
			:initial-selected-map="skuSelectedMap"
			:invite-code-price="inviteCodeHasPrice ? inviteCodeResolvedPrice : null"
			:invite-code-ladder-tiers="inviteCodeLadderTiers"
			:min-quantity="inviteCodeMinQty || 1"
			:max-quantity="skuSelectorMaxQty"
			:existing-quantity="mergedQty"
			mode="multi"
			@add-to-cart="onAddToCart"
			@confirm="onSkuConfirm"
			@close="showSkuSelector = false"
		/>

		<!-- 已选规格列表（多SKU购物车） -->
		<view v-if="product && product.hasSku && selectedItems.length > 0" class="section-card">
			<view class="section-header">
				<text class="section-title">已选规格</text>
				<text v-if="selectedItems.length > 1" class="section-hint">{{ orderPreview ? orderPreview.tierScene : '计算中…' }}</text>
			</view>
			<view v-for="(item, idx) in selectedItems" :key="item.skuId" class="selected-item-row">
				<text class="selected-item-name">{{ item.skuName }}</text>
				<view class="selected-item-qty">
					<view class="qty-btn-sm" :class="{ disabled: item.quantity <= 1 }" @tap="decreaseItem(idx)">
						<view class="icon-minus-sm"></view>
					</view>
					<input
						class="qty-value-sm"
						type="number"
						:value="item.quantity"
						@input="onSelectedItemQtyInput(idx, $event)"
						@blur="onSelectedItemQtyBlur(idx, $event)"
					/>
					<view class="qty-btn-sm" @tap="increaseItem(idx)">
						<view class="icon-plus-sm"></view>
					</view>
				</view>
				<text class="selected-item-price">¥{{ getItemSubTotal(item, idx) }}</text>
				<text class="selected-item-del" @tap="removeItem(idx)">✕</text>
			</view>
			<view class="selected-add-btn" @tap="openSkuSelector">
				<text>+ 继续添加规格</text>
			</view>
		</view>

		<!-- 员工邀请码 -->
		<view class="section-card">
			<view class="section-header">
				<text class="section-title">员工邀请码</text>
				<text class="section-hint">6位数字</text>
			</view>
			<view class="invite-row">
				<input
					class="invite-input"
					:class="{ verified: isVerified }"
					type="number"
					maxlength="6"
					v-model="inviteCode"
					placeholder="请输入邀请码"
					:disabled="isVerified"
				/>
				<view class="verify-btn" :class="{ verified: isVerified }" @tap="verifyCode">
					<view v-if="isVerified" class="icon-check-sm"></view>
					<text>{{ isVerified ? '已验证' : '验证' }}</text>
				</view>
			</view>
			<view v-if="isVerified" class="verify-success">
				<view class="icon-check-circle"></view>
				<view class="verify-info">
					<text class="verify-name">{{ distributorName }}</text>
					<text v-if="distributorDept" class="verify-dept">{{ distributorDept }}</text>
					<view v-if="inviteCodeHasPrice || (inviteCodeLadderTiers && inviteCodeLadderTiers.length > 0) || inviteCodeMinQty" class="invite-code-price-hint">
						<text v-if="inviteCodeHasPrice" class="ic-price-label">专属单价：￥{{ parseFloat(inviteCodeResolvedPrice).toFixed(2) }}</text>
						<text v-if="inviteCodeMinQty" class="ic-price-min">（最低购买 {{ inviteCodeMinQty }} 件）</text>
					</view>
				</view>
				<text class="invite-reset-btn" @tap="resetInviteCode">重新输入</text>
			</view>
		</view>


		<!-- 订单汇总 -->
		<view class="section-card summary-card">
			<view class="summary-row">
				<text class="summary-label">商品总价</text>
				<text class="summary-value" :class="{ 'summary-placeholder-value': shouldSelectSkuFirst }">
					{{ !isVerified ? '请先输入邀请码' : shouldSelectSkuFirst ? '请选择规格' : totalPrice ? ('¥' + totalPrice) : '价格计算中' }}
				</text>
			</view>
			<view class="summary-row">
				<text class="summary-label">邀请码</text>
				<view class="status-badge" :class="{ ok: isVerified }">
					<text>{{ isVerified ? '已验证' : '待验证' }}</text>
				</view>
			</view>
			<view class="summary-divider"></view>
			<view class="summary-row total-row">
				<text class="total-label">应付金额</text>
				<view class="total-amount">
					<template v-if="!isVerified">
						<text class="total-value total-placeholder-value">请先输入邀请码</text>
					</template>
					<template v-else-if="shouldSelectSkuFirst">
						<text class="total-value total-placeholder-value">请选择规格</text>
					</template>
					<template v-else-if="!totalPrice">
						<text class="total-value total-placeholder-value">价格计算中</text>
					</template>
					<template v-else>
						<text class="total-symbol">¥</text>
						<text class="total-value">{{ totalPrice }}</text>
					</template>
				</view>
			</view>
		</view>


		<!-- 支付方式选择 -->
		<view v-if="false" class="section-card payment-card">
			<text class="section-title" style="display:block;margin-bottom:20rpx;">支付方式</text>
			<view class="payment-options">
				<view
					class="payment-option"
					:class="{ active: paymentType === 1 }"
					@tap="paymentType = 1"
				>
					<view class="payment-radio"><view v-if="paymentType === 1" class="payment-radio-dot"></view></view>
					<text>微信支付</text>
				</view>
				<view
					v-if="false"
					class="payment-option"
					:class="{ active: paymentType === 2 }"
					@tap="paymentType = 2"
				>
					<view class="payment-radio"><view v-if="paymentType === 2" class="payment-radio-dot"></view></view>
					<text>线下对公打款</text>
				</view>
			</view>
		</view>

		<!-- 商品详情 -->
		<view class="detail-section" v-if="details && details.length > 0">
			<view class="detail-header">商品详情</view>
			<view v-for="(item, idx) in details" :key="idx" class="detail-item">
				<video
					v-if="item.fileType === 2"
					:src="item.url"
					class="detail-video"
					:controls="true"
					:show-play-btn="true"
					object-fit="contain"
				/>
				<image
					v-else
					:src="item.url"
					mode="widthFix"
					class="detail-image"
					lazy-load
				/>
			</view>
		</view>

		<view class="bottom-spacer"></view>

		<!-- 收货地址弹窗 -->
		<view v-if="showAddrDialog" class="addr-mask" @tap.self="showAddrDialog = false">
			<view class="addr-dialog">
				<view class="addr-dialog-title">收货地址</view>

				<!-- 地址列表模式 -->
				<view v-if="!showAddrForm">
					<view class="addr-list">
						<view
							v-for="(item, idx) in savedAddresses"
							:key="item.id"
							class="addr-item"
							:class="{ selected: selectedAddrIdx === idx }"
							@tap="selectAddress(idx)"
						>
							<view class="addr-item-check">
								<view v-if="selectedAddrIdx === idx" class="addr-check-dot"></view>
							</view>
							<view class="addr-item-content">
								<view class="addr-item-top">
									<text class="addr-item-name">{{ item.receiverName }}</text>
									<text class="addr-item-phone">{{ item.receiverPhone }}</text>
								</view>
								<text class="addr-item-detail">{{ item.receiverProvince }}{{ item.receiverCity }}{{ item.receiverDistrict }} {{ item.receiverAddress }}</text>
							</view>
						</view>
					</view>
					<view class="addr-new-btn" @tap="showNewAddrForm">
						<text class="addr-new-icon">+</text>
						<text>使用新地址</text>
					</view>
					<view class="addr-btns">
						<view class="addr-btn-cancel" @tap="showAddrDialog = false">取消</view>
						<view class="addr-btn-confirm" @tap="confirmAddr">确认并支付</view>
					</view>
				</view>

				<!-- 填写新地址模式 -->
				<view v-else>
					<view class="addr-form">
						<view class="addr-row">
							<text class="addr-label">收货人</text>
							<input class="addr-input" v-model="addr.receiverName" placeholder="请输入收货人姓名" maxlength="30" />
						</view>
						<view class="addr-row">
							<text class="addr-label">手机号</text>
							<input class="addr-input" v-model="addr.receiverPhone" type="number" placeholder="请输入手机号" maxlength="11" />
						</view>
						<view class="addr-row">
							<text class="addr-label">所在地区</text>
							<picker mode="region" :value="regionValue" @change="onRegionChange">
								<view class="addr-picker">
									<text v-if="addr.receiverProvince">{{ addr.receiverProvince }} {{ addr.receiverCity }} {{ addr.receiverDistrict }}</text>
									<text v-else class="addr-placeholder">请选择省 / 市 / 区</text>
								</view>
							</picker>
						</view>
						<view class="addr-row">
							<text class="addr-label">详细地址</text>
							<input class="addr-input" v-model="addr.receiverAddress" placeholder="街道、楼牌号等" maxlength="100" />
						</view>
					</view>
					<view class="addr-btns">
						<view class="addr-btn-cancel" @tap="backToAddrList">{{ savedAddresses.length > 0 ? '返回' : '取消' }}</view>
						<view class="addr-btn-confirm" @tap="confirmAddr">确认并支付</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 固定底部栏：订单入口 + 价格 + 提交按钮 -->
		<view class="pay-bar">
			<view class="pay-bar-inner">
				<view class="pay-bar-order" @tap="goToOrders">
					<view class="pay-bar-order-icon"></view>
					<text class="pay-bar-order-text">我的订单</text>
				</view>
				<button class="pay-bar-cs" open-type="contact">
					<view class="pay-bar-cs-icon"></view>
					<text class="pay-bar-cs-text">客服</text>
				</button>
				<view class="pay-bar-divider"></view>
				<view class="pay-bar-amount">
					<text class="pay-bar-label">应付</text>
				<view class="pay-bar-price">
					<template v-if="!isVerified">
						<text class="pay-bar-value pay-bar-placeholder-value">先验码</text>
					</template>
					<template v-else-if="shouldSelectSkuFirst">
						<text class="pay-bar-value pay-bar-placeholder-value">请选择规格</text>
					</template>
					<template v-else-if="!totalPrice">
						<text class="pay-bar-value pay-bar-placeholder-value">计算中</text>
					</template>
					<template v-else>
						<text class="pay-bar-symbol">¥</text>
						<text class="pay-bar-value">{{ totalPrice }}</text>
						</template>
					</view>
				</view>
				<view class="pay-bar-btn" @tap="handlePay">
					<text>提交订单</text>
				</view>
			</view>
			<!-- 安全区域占位，兼容 iPhone 底部 -->
			<view class="pay-bar-safe" :style="{ height: safeAreaBottom + 'px' }"></view>
		</view>


	</view>
</template>

<script>
	import { get, post } from '@/utils/miniRequest.js';
	import {
		DISTRIBUTION_TOKEN_KEY,
		DISTRIBUTION_OPENID_KEY,
		LEGACY_DISTRIBUTION_TOKEN_KEY,
		LEGACY_DISTRIBUTION_OPENID_KEY
	} from '@/config';
	import SkuSelector from '@/packageOrder/components/SkuSelector.vue';

	export default {
		components: { SkuSelector },
		data() {
			return {
				quantity: 1,
				inviteCode: '',
				isVerified: false,
				distributorName: '',
				distributorDept: '',
				distributorId: '',
				inviteCodeId: '',
				inviteCodeSchemeType: null,   // 新VO：方案类型(1/2/3)
				inviteCodePricingMode: null,   // 新VO："fixed"|"discount"|"ladder"
				inviteCodeMinQty: null,        // 新VO：minQuantity
				inviteCodeMaxQty: null,        // 新VO：maxQuantity（方案一=剩余额度）
				inviteCodeResolvedPrice: null, // 新VO：resolvedUnitPrice（fixed/discount有值，ladder为null）
				inviteCodeLadderTiers: null,   // 新VO：ladderTiers（ladder模式）
				inviteCodeRuleId: null,        // 新VO：ruleId
				product: null,
				productId: '',
				banners: [],
				details: [],
				// SKU 相关
				showSkuSelector: false,
				skuSelectedMap: {},     // { dimId: optId } 上次选择，用于弹窗恢复
				selectedItems: [],      // 多SKU购物车：[{ skuId, skuName, quantity, unitPrice, selectedMap }]
			orderPreview: null,     // 后端整单试算结果（MiniOrderPreviewResponse）
			orderPreviewLoading: false, // 试算请求进行中
			_previewTimer: null,    // 防抖定时器
				// 支付方式：1=微信支付 2=线下打款
				paymentType: 1,
				statusBarHeight: 20,
				navBarHeight: 44,
				safeAreaBottom: 0,
				showAddrDialog: false,
				showAddrForm: false,
				savedAddresses: [],
				selectedAddrIdx: -1,
				regionValue: ['广东省', '深圳市', '南山区'],
				addr: {
					receiverName: '',
					receiverPhone: '',
					receiverProvince: '',
					receiverCity: '',
					receiverDistrict: '',
					receiverAddress: ''
				}
			};
		},

		computed: {
			productImg() {
				return (this.product && this.product.productImg) ? this.product.productImg : '/packageOrder/static/product.jpg';
			},
			bannerList() {
				if (this.banners && this.banners.length > 0) return this.banners;
				return [{ url: this.productImg, fileType: 1 }];
			},
			// 模式2：SKU维度和列表（安全取值，避免模板中复杂表达式）
			skuDimensions() {
				return (this.product && this.product.skuData && this.product.skuData.dimensions) || [];
			},
			skuList() {
				return (this.product && this.product.skuData && this.product.skuData.skus) || [];
			},
			// 方案一剩余额度上限（inviteCodeMaxQty）
			maxQty() {
				if (this.isVerified && this.inviteCodeSchemeType === 1 && this.inviteCodeMaxQty != null) {
					return this.inviteCodeMaxQty;
				}
				return 999;
			},
			skuSelectorMaxQty() {
				if (this.inviteCodeSchemeType !== 1 || this.maxQty >= 999) {
					return this.maxQty;
				}
				return Math.max(0, this.maxQty - this.mergedQty);
			},
			inviteCodeHasPrice() {
				return this.isVerified && this.inviteCodeResolvedPrice != null;
			},
			shouldSelectSkuFirst() {
				return !!(this.product && this.product.hasSku && this.selectedItems.length === 0);
			},
			effectiveQuantity() {
				if (this.product && this.product.hasSku && this.selectedItems.length > 0) {
					return this.mergedQty;
				}
				return this.quantity;
			},
			// 邀请码阶梯价：按当前数量命中档位
			inviteCodeMatchedTier() {
				if (!this.inviteCodeLadderTiers) return null;
				const qty = this.effectiveQuantity;
				return this.inviteCodeLadderTiers.find(t =>
					qty >= t.minQuantity && (t.maxQuantity === null || qty <= t.maxQuantity)
				) || null;
			},
			unitPrice() {
				if (!this.isVerified) {
					return null;
				}
				if (this.product && this.product.hasSku && this.selectedItems.length > 0 && this.orderPreview) {
					const total = parseFloat(this.orderPreview.totalAmount || 0);
					const qty = this.orderPreview.mergedQty || 1;
					return qty > 0 ? (total / qty).toFixed(2) : null;
				}
				if (this.inviteCodeHasPrice) {
					return parseFloat(this.inviteCodeResolvedPrice).toFixed(2);
				}
				if (this.inviteCodeLadderTiers && this.inviteCodeLadderTiers.length > 0) {
					return this.inviteCodeMatchedTier ? parseFloat(this.inviteCodeMatchedTier.unitPrice).toFixed(2) : null;
				}
				return null;
			},
			// 多SKU模式：selectedItems 合并总量
			mergedQty() {
				return this.selectedItems.reduce((s, i) => s + i.quantity, 0);
			},
			isMultiSkuOrder() {
				return this.product && this.product.hasSku && this.selectedItems.length > 1;
			},
			totalPrice() {
				if (!this.isVerified) return null;
				if (this.product && this.product.hasSku) {
					if (this.selectedItems.length === 0) return null;
					if (this.orderPreview && this.orderPreview.totalAmount != null) {
						return parseFloat(this.orderPreview.totalAmount).toFixed(2);
					}
					const fallbackUnitPrice = this.inviteCodeHasPrice
						? parseFloat(this.inviteCodeResolvedPrice)
						: (this.inviteCodeMatchedTier ? parseFloat(this.inviteCodeMatchedTier.unitPrice) : null);
					if (fallbackUnitPrice == null) return null;
					const total = this.selectedItems.reduce((s, i) => {
						return s + fallbackUnitPrice * i.quantity;
					}, 0);
					return total.toFixed(2);
				}
				const price = parseFloat(this.unitPrice);
				if (isNaN(price) || price <= 0) return null;
				return (price * this.quantity).toFixed(2);
			}
		},


	watch: {
		// selectedItems 变化时触发后端整单试算（防抖 300ms，避免快速加减数量时重复请求）
		selectedItems: {
			handler() {
				this.orderPreview = null;
				this._debouncedFetchOrderPreview();
			},
			deep: true
		},
		// 邀请码验证状态变化时重新试算（含清除邀请码）
		isVerified() {
			if (this.product && this.product.hasSku && this.selectedItems.length > 0) {
				this.orderPreview = null;
				this._debouncedFetchOrderPreview();
			}
		}
	},

	async onLoad(options) {
			try {
				const sysInfo = uni.getWindowInfo();
				this.statusBarHeight = sysInfo.statusBarHeight || 20;
				this.navBarHeight = 44;
				if (sysInfo.safeAreaInsets) {
					this.safeAreaBottom = sysInfo.safeAreaInsets.bottom || 0;
				}
			} catch (e) {}

			// 解析参数：优先直接参数，其次从扫码 q 字段解析完整 URL，最后解析 scene
			if (options.productId) this.productId = options.productId;
			if (options.inviteCode) this.inviteCode = options.inviteCode;

			if ((!this.productId || !this.inviteCode) && options.q) {
				try {
					const fullUrl = decodeURIComponent(options.q);
					const qIndex = fullUrl.indexOf('?');
					if (qIndex !== -1) {
						const queryStr = fullUrl.slice(qIndex + 1);
						queryStr.split('&').forEach(part => {
							const [key, val] = part.split('=');
							if (key === 'productId' && !this.productId) this.productId = decodeURIComponent(val || '');
							if (key === 'inviteCode' && !this.inviteCode) this.inviteCode = decodeURIComponent(val || '');
						});
					}
				} catch (e) {}
			}

			if ((!this.productId || !this.inviteCode) && options.scene) {
				try {
					const scene = decodeURIComponent(options.scene);
					const productMatch = scene.match(/(?:^|&)productId=([^&]+)/);
					if (productMatch && !this.productId) this.productId = productMatch[1];
					const inviteMatch = scene.match(/(?:^|&)inviteCode=(\d+)/);
					if (inviteMatch && !this.inviteCode) this.inviteCode = inviteMatch[1];
				} catch (e) {}
			}

			const loggedIn = await this.ensureMiniLogin();
			console.log(loggedIn,'loggedIn')
			if (loggedIn) {
				this.loadProduct();
			}
		},

		methods: {
			goToOrders() {
				uni.navigateTo({ url: '/packageOrder/pages/order/order' });
			},

			async ensureMiniLogin() {
				uni.removeStorageSync(LEGACY_DISTRIBUTION_TOKEN_KEY);
				uni.removeStorageSync(LEGACY_DISTRIBUTION_OPENID_KEY);
				const token = uni.getStorageSync(DISTRIBUTION_TOKEN_KEY);
				console.log(token,'token')
				if (token) return true;
				try {
					const loginRes = await new Promise((resolve, reject) => {
						uni.login({ success: resolve, fail: reject });
					});
					if (!loginRes || !loginRes.code) {
						uni.showToast({ title: '登录失败，请重试', icon: 'none' });
						return false;
					}
					const res = await post('/api/distribution/mini/login', {
						code: loginRes.code,
						nickName: '',
						avatar: ''
					}, { loading: false });
					const data = res.data || {};
					if (data.token) uni.setStorageSync(DISTRIBUTION_TOKEN_KEY, data.token);
					if (data.openid) uni.setStorageSync(DISTRIBUTION_OPENID_KEY, data.openid);
					return true;
				} catch (e) {
					console.error('[ensureMiniLogin]', e);
					uni.showToast({ title: '登录失败，请重试', icon: 'none' });
					return false;
				}
			},

			async loadProduct() {
				try {
					const params = { queryQuantity: this.quantity };
					if (this.productId) params.productId = this.productId;
					const res = await get('/api/distribution/marketing/product', params);
					const data = res.data;
					this.product = data;
					this.banners = (data.banners || []).sort((a, b) => a.sortOrder - b.sortOrder);
					this.details = (data.details || []).sort((a, b) => a.sortOrder - b.sortOrder);
				} catch (e) {
					console.error('[loadProduct]', e);
					uni.showToast({ title: '商品加载失败: ' + (e.errMsg || e.message || JSON.stringify(e)), icon: 'none', duration: 4000 });
				}
			},

			isActiveTier(tier) {
				const qty = this.quantity;
				return qty >= tier.minQuantity && (tier.maxQuantity === null || qty <= tier.maxQuantity);
			},

			tierRangeLabel(tier) {
				return tier.maxQuantity === null
					? tier.minQuantity + '+'
					: tier.minQuantity + '-' + tier.maxQuantity;
			},

			changeQty(delta) {
				const minQty = this.inviteCodeMinQty || 1;
				const next = this.quantity + delta;
				if (next < minQty) {
					if (minQty > 1) uni.showToast({ title: '最低购买 ' + minQty + ' 件', icon: 'none' });
					return;
				}
				if (next <= this.maxQty) {
					this.quantity = next;
				} else if (this.inviteCodeSchemeType === 1) {
					const remainingQty = Math.max(0, this.maxQty - this.quantity);
					uni.showToast({ title: '超出年度内购限额，剩余 ' + remainingQty + ' 件', icon: 'none' });
				} else {
					this.quantity = next;
				}
			},

			onQtyInput(e) {
				const minQty = this.inviteCodeMinQty || 1;
				const val = parseInt(e.detail.value);
				if (!isNaN(val) && val >= minQty) {
					this.quantity = Math.min(val, this.maxQty);
				}
			},

			onQtyBlur(e) {
				const minQty = this.inviteCodeMinQty || 1;
				const val = parseInt(e.detail.value);
				const clamped = (!isNaN(val) && val >= minQty) ? val : minQty;
				this.quantity = Math.min(clamped, this.maxQty);
			},

			resetInviteCode() {
				this.isVerified = false;
				this.inviteCode = '';
				this.inviteCodeId = null;
				this.distributorId = null;
				this.distributorName = '';
				this.distributorDept = '';
				this.inviteCodeSchemeType = null;
				this.inviteCodePricingMode = null;
				this.inviteCodeRuleId = null;
				this.inviteCodeMinQty = null;
				this.inviteCodeMaxQty = null;
				this.inviteCodeResolvedPrice = null;
				this.inviteCodeLadderTiers = null;
				this.orderPreview = null;
			},

		async verifyCode() {
				if (this.isVerified) return;
				if (!/^\d{6}$/.test(this.inviteCode)) {
					uni.showToast({ title: '请输入6位邀请码', icon: 'none' });
					return;
				}
				try {
					const res = await post('/api/distribution/marketing/invite-code/verify', {
						inviteCode: this.inviteCode,
						productId: this.product ? this.product.productId : undefined
					});
					const data = res.data;
					this.inviteCodeId = data.inviteCodeId;
					this.distributorId = data.distributorId;
					this.distributorName = data.distributorName;
					this.distributorDept = data.distributorDepartment;
					// 新 VO 字段
					this.inviteCodeSchemeType = data.schemeType || null;
					this.inviteCodePricingMode = data.pricingMode || null;
					this.inviteCodeRuleId = data.ruleId || null;
					this.inviteCodeMinQty = data.minQuantity || null;
					this.inviteCodeMaxQty = data.maxQuantity != null ? data.maxQuantity : null;
					this.inviteCodeResolvedPrice = data.resolvedUnitPrice != null ? data.resolvedUnitPrice : null;
					this.inviteCodeLadderTiers = data.ladderTiers || null;
					// 自动提升数量至最低要求
					if (data.minQuantity && this.quantity < data.minQuantity) {
						this.quantity = data.minQuantity;
					}
					// 方案一：数量不能超过剩余额度
					if (data.schemeType === 1 && data.maxQuantity != null && this.quantity > data.maxQuantity) {
						this.quantity = data.maxQuantity || 1;
					}
					this.isVerified = true;
					uni.showToast({ title: '验证成功', icon: 'success' });
				} catch (e) {}
			},

			openSkuSelector() {
				if (this.inviteCodeSchemeType === 1 && this.skuSelectorMaxQty <= 0) {
					uni.showToast({ title: '超出年度内购限额，剩余 0 件', icon: 'none' });
					return;
				}
				this.showSkuSelector = true;
			},
			onSkuConfirm({ skuId, skuName, quantity, selectedMap }) {
				this.skuSelectedMap = selectedMap || {};
				this.quantity = quantity;
				this.showSkuSelector = false;
			},

			/** 获取指定行的小计：优先取后端试算结果，否则本地估算 */
		getItemSubTotal(item, idx) {
			if (this.orderPreview && this.orderPreview.items && this.orderPreview.items[idx]) {
				const p = this.orderPreview.items[idx];
				return parseFloat(p.subTotal || 0).toFixed(2);
			}
			const price = this.inviteCodeHasPrice
				? parseFloat(this.inviteCodeResolvedPrice)
				: (item.unitPrice || 0);
			return (price * item.quantity).toFixed(2);
		},

		_debouncedFetchOrderPreview() {
			clearTimeout(this._previewTimer);
			this._previewTimer = setTimeout(() => {
				this.fetchOrderPreview();
			}, 300);
		},

		async fetchOrderPreview() {
			if (!this.product || !this.product.hasSku || this.selectedItems.length === 0) {
				this.orderPreview = null;
				return;
			}
			this.orderPreviewLoading = true;
			try {
				if (!this.isVerified || !this.inviteCodeId) {
					this.orderPreview = null;
					this.orderPreviewLoading = false;
					return;
				}
				const payload = {
					productId: this.product.productId,
					items: this.selectedItems.map(i => ({ skuId: i.skuId, quantity: i.quantity })),
					inviteCodeId: this.inviteCodeId
				};
				const res = await post('/api/distribution/marketing/order/preview', payload);
				this.orderPreview = res.data;
			} catch (e) {
				// 试算失败时清空，页面继续使用本地估算
				this.orderPreview = null;
			} finally {
				this.orderPreviewLoading = false;
			}
		},

		onAddToCart({ skuId, skuName, quantity, unitPrice, selectedMap }) {
				if (this.inviteCodeSchemeType === 1 && this.maxQty < 999) {
					const remainingQty = Math.max(0, this.maxQty - this.mergedQty);
					if (quantity > remainingQty) {
						uni.showToast({ title: '超出年度内购限额，剩余 ' + remainingQty + ' 件', icon: 'none' });
						return;
					}
				}
				const effectivePrice = unitPrice != null ? parseFloat(unitPrice) : null;
				const idx = this.selectedItems.findIndex(i => i.skuId === skuId);
				if (idx >= 0) {
					this.selectedItems[idx].quantity += quantity;
					this.selectedItems[idx].unitPrice = effectivePrice;
				} else {
					this.selectedItems.push({ skuId, skuName, quantity, unitPrice: effectivePrice, selectedMap });
				}
				this.skuSelectedMap = selectedMap || {};
				this.showSkuSelector = false;
				uni.showToast({ title: '已加入订单', icon: 'none', duration: 800 });
			},
			removeItem(idx) {
				this.selectedItems.splice(idx, 1);
			},
			getSelectedItemMaxQty(idx) {
				if (this.inviteCodeSchemeType !== 1 || this.maxQty >= 999) return 999;
				const otherQty = this.selectedItems.reduce((sum, item, itemIdx) => (
					itemIdx === idx ? sum : sum + (parseInt(item.quantity, 10) || 0)
				), 0);
				return Math.max(1, this.maxQty - otherQty);
			},
			updateSelectedItemQty(idx, rawValue, options = {}) {
				const { showLimitToast = false } = options;
				const numericValue = parseInt(rawValue, 10);
				const normalizedValue = Number.isNaN(numericValue) ? 1 : numericValue;
				const clampedValue = Math.max(1, normalizedValue);
				const maxAllowed = this.getSelectedItemMaxQty(idx);
				const finalValue = Math.min(clampedValue, maxAllowed);
				if (showLimitToast && finalValue !== clampedValue && this.inviteCodeSchemeType === 1) {
					const currentQty = parseInt(this.selectedItems[idx].quantity, 10) || 0;
					const remainingQty = Math.max(0, maxAllowed - currentQty);
					uni.showToast({ title: '超出年度内购限额，剩余 ' + remainingQty + ' 件', icon: 'none' });
				}
				this.selectedItems[idx].quantity = finalValue;
			},
			increaseItem(idx) {
				this.updateSelectedItemQty(idx, (parseInt(this.selectedItems[idx].quantity, 10) || 0) + 1, { showLimitToast: true });
			},
			decreaseItem(idx) {
				this.updateSelectedItemQty(idx, (parseInt(this.selectedItems[idx].quantity, 10) || 1) - 1);
			},
			onSelectedItemQtyInput(idx, e) {
				const rawValue = (e.detail.value || '').replace(/[^\d]/g, '');
				if (rawValue === '') return;
				this.updateSelectedItemQty(idx, rawValue);
			},
			onSelectedItemQtyBlur(idx, e) {
				this.updateSelectedItemQty(idx, e.detail.value, { showLimitToast: true });
			},

			async handlePay() {
				if (!this.isVerified) {
					uni.showToast({ title: '请先验证邀请码', icon: 'none' });
					return;
				}
				if (!this.product) {
					uni.showToast({ title: '商品信息未加载', icon: 'none' });
					return;
				}
				if (this.product.hasSku && this.selectedItems.length === 0) {
					uni.showToast({ title: '请先选择商品规格', icon: 'none' });
					this.showSkuSelector = true;
					return;
				}
				const totalQty = (this.product.hasSku && this.selectedItems.length > 0)
					? this.selectedItems.reduce((s, i) => s + (parseInt(i.quantity, 10) || 0), 0)
					: this.quantity;
				if (this.inviteCodeSchemeType === 1 && totalQty > this.maxQty) {
					uni.showToast({ title: '超出年度内购限额，剩余 ' + this.maxQty + ' 件', icon: 'none' });
					return;
				}
				if (this.inviteCodeMinQty && this.inviteCodeMinQty > 1) {
					if (totalQty < this.inviteCodeMinQty) {
						uni.showToast({ title: '最低购买 ' + this.inviteCodeMinQty + ' 件', icon: 'none' });
						return;
					}
				}
				// 加载用户历史地址
				try {
					const res = await get('/api/distribution/marketing/addresses');
					this.savedAddresses = res.data || [];
				} catch (e) {
					this.savedAddresses = [];
				}
				if (this.savedAddresses.length > 0) {
					// 有历史地址：展示列表，默认选中第一条
					this.selectedAddrIdx = 0;
					this.showAddrForm = false;
				} else {
					// 无历史地址：直接进入填写表单
					this.showAddrForm = true;
				}
				this.showAddrDialog = true;
			},

			selectAddress(idx) {
				this.selectedAddrIdx = idx;
			},

			showNewAddrForm() {
				// 清空表单，切换到填写模式
				this.addr = { receiverName: '', receiverPhone: '', receiverProvince: '', receiverCity: '', receiverDistrict: '', receiverAddress: '' };
				this.regionValue = ['广东省', '深圳市', '南山区'];
				this.selectedAddrIdx = -1;
				this.showAddrForm = true;
			},

			backToAddrList() {
				if (this.savedAddresses.length > 0) {
					this.showAddrForm = false;
				} else {
					this.showAddrDialog = false;
				}
			},

			onRegionChange(e) {
				const [province, city, district] = e.detail.value;
				this.addr.receiverProvince = province;
				this.addr.receiverCity = city;
				this.addr.receiverDistrict = district;
				this.regionValue = e.detail.value;
			},

			async confirmAddr() {
				let receiverName, receiverPhone, receiverProvince, receiverCity, receiverDistrict, receiverAddress;

				if (!this.showAddrForm && this.selectedAddrIdx >= 0) {
					// 使用已选地址
					const selected = this.savedAddresses[this.selectedAddrIdx];
					receiverName = selected.receiverName;
					receiverPhone = selected.receiverPhone;
					receiverProvince = selected.receiverProvince;
					receiverCity = selected.receiverCity;
					receiverDistrict = selected.receiverDistrict;
					receiverAddress = selected.receiverAddress;
				} else {
					// 使用填写的新地址
					({ receiverName, receiverPhone, receiverProvince, receiverCity, receiverDistrict, receiverAddress } = this.addr);
					if (!receiverName.trim()) { uni.showToast({ title: '请输入收货人姓名', icon: 'none' }); return; }
					if (!/^1\d{10}$/.test(receiverPhone)) { uni.showToast({ title: '请输入正确的手机号', icon: 'none' }); return; }
					if (!receiverProvince) { uni.showToast({ title: '请选择所在地区', icon: 'none' }); return; }
					if (!receiverAddress.trim()) { uni.showToast({ title: '请输入详细地址', icon: 'none' }); return; }
				}

				this.showAddrDialog = false;
				// 若多SKU试算仍在进行中，阻止下单
				if (this.product && this.product.hasSku && this.selectedItems.length > 1 && this.orderPreviewLoading) {
					uni.showToast({ title: '价格计算中，请稍候再试', icon: 'none' });
					return;
				}
				const openId = uni.getStorageSync(DISTRIBUTION_OPENID_KEY) || '';
				try {
					const isMultiSku = this.product.hasSku && this.selectedItems.length > 1;
					const isSingleSku = this.product.hasSku && this.selectedItems.length === 1;
					const orderPayload = {
						productId: this.product.productId,
						userOpenid: openId,
						receiverName,
						receiverPhone,
						receiverProvince,
						receiverCity,
						receiverDistrict,
						receiverAddress,
						paymentType: this.paymentType,
						inviteCodeId: this.inviteCodeId,
						distributorId: this.distributorId
					};
					if (isMultiSku) {
						orderPayload.items = this.selectedItems.map(i => ({ skuId: i.skuId, quantity: i.quantity }));
					} else if (isSingleSku) {
						orderPayload.skuId = this.selectedItems[0].skuId;
						orderPayload.quantity = this.selectedItems[0].quantity;
					} else {
						orderPayload.quantity = this.quantity;
					}
					const res = await post('/api/distribution/marketing/order/create', orderPayload);
					const order = res.data;

					if (this.paymentType === 2) {
						// 线下打款：存公账信息后跳转公账页
						if (order.bankAccount) {
							uni.setStorageSync('_bankAccount', JSON.stringify(order.bankAccount));
						}
						uni.navigateTo({
							url: `/packageOrder/pages/bankAccount/bankAccount?orderId=${order.orderId}&orderNo=${encodeURIComponent(order.orderNo)}`
						});
					} else if (order.paid) {
						// 0元免费订单：后端已直接支付成功
						uni.redirectTo({ url: `/packageOrder/pages/payResult/payResult?orderId=${order.orderId}` });
					} else {
						// 微信支付
						const payParams = order.paymentParams;
						await new Promise((resolve, reject) => {
							uni.requestPayment({
								timeStamp: payParams.timeStamp,
								nonceStr: payParams.nonceStr,
								package: payParams.packageValue,
								signType: payParams.signType,
								paySign: payParams.paySign,
								success: resolve,
								fail: reject
							});
						});
						uni.redirectTo({ url: `/packageOrder/pages/payResult/payResult?orderId=${order.orderId}` });
					}
				} catch (e) {
					if (e && e.errMsg && e.errMsg.includes('cancel')) {
						uni.showToast({ title: '已取消支付', icon: 'none' });
					}
				}
			}
		}
	};
</script>

<style scoped>
	.product-page {
		min-height: 100vh;
		background: linear-gradient(180deg, #EFF6FF 0%, #F8FAFC 50%, #F1F5F9 100%);
	}

	/* 状态栏 */
	.status-bar {
		background: rgba(255,255,255,0.92);
	}

	/* 导航栏 — 只占左侧，右侧留给微信胶囊 */
	.top-nav {
		background: rgba(255,255,255,0.92);
		backdrop-filter: blur(20rpx);
		display: flex;
		align-items: center;
		padding: 0 28rpx;
		border-bottom: 1rpx solid rgba(59,130,246,0.12);
		/* 右侧约 200rpx 留给微信胶囊，不放任何元素 */
	}
	.nav-title {
		font-size: 34rpx;
		font-weight: 800;
		color: #0F172A;
		letter-spacing: 1rpx;
	}

	/* 商品轮播 */
	.hero-wrap {
		position: relative;
		background: #000;
	}
	.banner-swiper {
		width: 100%;
		height: 750rpx;
	}
	.banner-media {
		width: 100%;
		height: 100%;
		display: block;
	}
	.tag-new {
		position: absolute;
		top: 20rpx;
		left: 20rpx;
		background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
		color: #fff;
		font-size: 22rpx;
		font-weight: 700;
		padding: 8rpx 24rpx;
		border-radius: 24rpx;
		letter-spacing: 2rpx;
		box-shadow: 0 4rpx 16rpx rgba(139,92,246,0.4);
	}

	/* 商品信息卡 */
	.product-info-card {
		background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%);
		margin: 16rpx 20rpx 0;
		border-radius: 20rpx;
		padding: 24rpx 28rpx 24rpx 32rpx;
		box-shadow: 0 4rpx 20rpx rgba(59,130,246,0.09);
		border-left: 4rpx solid #3B82F6;
	}
	.product-title {
		display: block;
		font-size: 34rpx;
		font-weight: 700;
		color: #0F172A;
		line-height: 1.45;
		margin-bottom: 10rpx;
	}
	.product-desc {
		display: block;
		font-size: 26rpx;
		color: #64748B;
		line-height: 1.6;
		margin-bottom: 16rpx;
	}
	.price-display {
		display: flex;
		align-items: baseline;
	}
	.price-symbol {
		font-size: 28rpx;
		font-weight: 700;
		color: #EF4444;
	}
	.price-value {
		font-size: 52rpx;
		font-weight: 700;
		color: #EF4444;
		line-height: 1;
	}
	.price-unit {
		font-size: 24rpx;
		color: #94A3B8;
		margin-left: 4rpx;
	}

	/* 价格占位（SKU模式未选时） */
	.price-placeholder {
		margin-top: 12rpx;
	}
	.price-placeholder-text {
		font-size: 28rpx;
		color: #94A3B8;
	}
	.qty-limit-tip {
		margin-top: 16rpx;
		font-size: 24rpx;
		color: #2563EB;
	}
	/* SKU 规格入口文字 */
	.sku-entry-hint {
		font-size: 28rpx;
		color: #94A3B8;
	}

	/* SKU 入口卡片 */
	.sku-entry-card { cursor: pointer; }
	.sku-entry-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.sku-entry-right { flex: 1; display: flex; justify-content: flex-end; }
	.sku-entry-text {
		font-size: 28rpx;
		color: #3B82F6;
		max-width: 400rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* 通用卡片 */
	.section-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 28rpx;
		margin: 16rpx 20rpx 0;
		box-shadow: 0 4rpx 20rpx rgba(59,130,246,0.07);
		border: 1rpx solid rgba(226,232,240,0.8);
	}
	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20rpx;
	}
	.section-title {
		font-size: 30rpx;
		color: #0F172A;
		font-weight: 600;
	}
	.section-hint {
		font-size: 26rpx;
		color: #94A3B8;
	}

	/* 数量行 */
	.qty-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.quantity-selector {
		display: flex;
		align-items: center;
		background: #F8FAFC;
		border-radius: 14rpx;
		border: 2rpx solid #E2E8F0;
		overflow: hidden;
		width: 240rpx;
	}
	.qty-btn {
		width: 76rpx;
		height: 68rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.qty-btn.disabled { opacity: 0.3; }
	.icon-minus {
		width: 22rpx;
		height: 3rpx;
		background: #475569;
		border-radius: 2rpx;
	}
	.icon-plus {
		width: 22rpx;
		height: 3rpx;
		background: #475569;
		border-radius: 2rpx;
		position: relative;
	}
	.icon-plus::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 3rpx;
		height: 22rpx;
		background: #475569;
		border-radius: 2rpx;
	}
	.qty-value {
		flex: 1;
		text-align: center;
		font-size: 30rpx;
		font-weight: 600;
		color: #1E293B;
		height: 68rpx;
		line-height: 68rpx;
		background: #fff;
		border-left: 2rpx solid #E2E8F0;
		border-right: 2rpx solid #E2E8F0;
	}

	/* 阶梯价格 */
	.tier-wrap {
		margin-top: 24rpx;
		padding-top: 20rpx;
		border-top: 1rpx solid #F1F5F9;
	}
	.tier-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16rpx;
	}
	.tier-hint-right {
		font-size: 22rpx;
		color: #CBD5E1;
	}
	.tier-list {
		display: flex;
		gap: 12rpx;
		flex-wrap: wrap;
	}
	.tier-chip {
		flex: 1;
		min-width: 100rpx;
		text-align: center;
		padding: 16rpx 8rpx;
		border-radius: 20rpx;
		background: #fff;
		border: 1.5rpx solid #E2E8F0;
		box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
	}
	.tier-chip.active {
		background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
		border-color: #3B82F6;
		box-shadow: 0 2rpx 12rpx rgba(59,130,246,0.22);
	}
	.tier-chip-range {
		display: block;
		font-size: 22rpx;
		color: #94A3B8;
		margin-bottom: 6rpx;
	}
	.tier-chip.active .tier-chip-range { color: #3B82F6; }
	.tier-chip-price {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: #1E293B;
	}
	.tier-chip.active .tier-chip-price { color: #1D4ED8; }

	/* 邀请码 */
	.invite-row {
		display: flex;
		align-items: center;
		gap: 14rpx;
	}
	.invite-input {
		flex: 1;
		height: 80rpx;
		border: 2rpx solid #E2E8F0;
		border-radius: 14rpx;
		padding: 0 24rpx;
		font-size: 32rpx;
		font-weight: 500;
		background: #F8FAFC;
		color: #1E293B;
		letter-spacing: 4rpx;
	}
	.invite-input.verified {
		background: #F0FDF4;
		border-color: #BBF7D0;
		color: #15803D;
	}
	.verify-btn {
		height: 80rpx;
		padding: 0 36rpx;
		background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
		color: #fff;
		font-size: 28rpx;
		font-weight: 600;
		border-radius: 14rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6rpx;
		flex-shrink: 0;
	}
	.verify-btn.verified {
		background: #F0FDF4;
		color: #22C55E;
		border: 2rpx solid #BBF7D0;
	}
	.icon-check-sm {
		width: 18rpx;
		height: 11rpx;
		border-left: 3rpx solid #22C55E;
		border-bottom: 3rpx solid #22C55E;
		transform: rotate(-45deg);
		margin-bottom: 3rpx;
	}
	.verify-success {
		display: flex;
		align-items: center;
		gap: 14rpx;
		margin-top: 18rpx;
		padding: 18rpx 20rpx;
		background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
		border-radius: 16rpx;
		border: 1.5rpx solid #BBF7D0;
		box-shadow: 0 2rpx 12rpx rgba(34,197,94,0.12);
	}
	.icon-check-circle {
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		background: #22C55E;
		position: relative;
		flex-shrink: 0;
	}
	.icon-check-circle::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 46%;
		width: 14rpx;
		height: 8rpx;
		border-left: 3rpx solid #fff;
		border-bottom: 3rpx solid #fff;
		transform: translate(-50%, -50%) rotate(-45deg);
	}
	.verify-info {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}
	.verify-name {
		font-size: 28rpx;
		font-weight: 600;
		color: #15803D;
	}
	.verify-dept {
		font-size: 24rpx;
		color: #4ADE80;
	}

	/* 订单汇总 */
	.summary-card { margin-bottom: 0; }
	.summary-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14rpx 0;
	}
	.summary-label {
		font-size: 28rpx;
		color: #64748B;
	}
	.summary-value {
		font-size: 28rpx;
		font-weight: 600;
		color: #1E293B;
	}
	.summary-placeholder-value {
		color: #94A3B8;
		font-weight: 500;
	}
	.summary-discount {
		font-size: 26rpx;
		color: #22C55E;
		font-weight: 500;
	}
	.status-badge {
		padding: 6rpx 18rpx;
		border-radius: 20rpx;
		background: #FEF3C7;
		font-size: 24rpx;
		color: #D97706;
		font-weight: 500;
	}
	.status-badge.ok {
		background: #F0FDF4;
		color: #15803D;
	}
	.summary-divider {
		height: 1rpx;
		background: #F1F5F9;
		margin: 6rpx 0;
	}
	.total-row { padding-top: 16rpx; }
	.total-label {
		font-size: 30rpx;
		font-weight: 600;
		color: #1E293B;
	}
	.total-amount {
		display: flex;
		align-items: baseline;
	}
	.total-symbol {
		font-size: 26rpx;
		font-weight: 700;
		color: #EF4444;
	}
	.total-value {
		font-size: 44rpx;
		font-weight: 700;
		color: #EF4444;
		line-height: 1;
	}
	.total-placeholder-value {
		font-size: 28rpx;
		font-weight: 500;
		color: #94A3B8;
		line-height: 1.4;
	}

	/* 商品详情 */
	.detail-section {
		margin-top: 16rpx;
		background: #fff;
	}
	.detail-header {
		font-size: 30rpx;
		font-weight: 600;
		color: #1E293B;
		padding: 28rpx 28rpx 20rpx;
		border-bottom: 1rpx solid #F1F5F9;
	}
	.detail-item {
		width: 100%;
		display: block;
	}
	.detail-image {
		width: 100%;
		display: block;
	}
	.detail-video {
		width: 100%;
		height: 560rpx;
		display: block;
		background: #000;
	}

	.bottom-spacer { height: 240rpx; }

	/* 固定底部栏 */
	.pay-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: rgba(255,255,255,0.96);
		backdrop-filter: blur(20rpx);
		border-top: 1rpx solid rgba(59,130,246,0.12);
		box-shadow: 0 -8rpx 40rpx rgba(59,130,246,0.12);
		z-index: 100;
	}
	.pay-bar-inner {
		display: flex;
		align-items: center;
		padding: 18rpx 20rpx;
		gap: 0;
	}

	/* 左侧：我的订单 */
	.pay-bar-order {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100rpx;
		flex-shrink: 0;
		gap: 6rpx;
	}
	.pay-bar-order-icon {
		width: 36rpx;
		height: 28rpx;
		border-top: 3rpx solid #64748B;
		border-bottom: 3rpx solid #64748B;
		position: relative;
	}
	.pay-bar-order-icon::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 3rpx;
		background: #64748B;
		transform: translateY(-50%);
	}
	.pay-bar-order-text {
		font-size: 22rpx;
		color: #64748B;
		text-align: center;
		line-height: 1.2;
		white-space: nowrap;
	}
	
	
	/* 客服按钮（与我的订单并列） */
	.pay-bar-cs {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100rpx;
		height: auto;
		padding: 0;
		margin: 0;
		background: transparent;
		border: none;
		gap: 6rpx;
	}
	.pay-bar-cs::after {
		border: none;
	}
	.pay-bar-cs-icon {
		width: 36rpx;
		height: 28rpx;
		border: 4rpx solid #64748B;
		border-bottom: none;
		border-radius: 20rpx 20rpx 0 0;
		position: relative;
	}
	.pay-bar-cs-icon::before,
	.pay-bar-cs-icon::after {
		content: '';
		position: absolute;
		bottom: -1rpx;
		width: 8rpx;
		height: 12rpx;
		background: #64748B;
		border-radius: 2rpx;
	}
	.pay-bar-cs-icon::before {
		left: -4rpx;
	}
	.pay-bar-cs-icon::after {
		right: -4rpx;
	}
	.pay-bar-cs-text {
		font-size: 22rpx;
		color: #64748B;
		text-align: center;
		line-height: 1.2;
	}
	
	/* 竖分隔线 */
	.pay-bar-divider {
		width: 1rpx;
		height: 56rpx;
		background: #E2E8F0;
		margin: 0 20rpx;
		flex-shrink: 0;
	}

	/* 中间：价格 */
	.pay-bar-amount {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.pay-bar-label {
		font-size: 22rpx;
		color: #94A3B8;
		line-height: 1;
		margin-bottom: 4rpx;
	}
	.pay-bar-price {
		display: flex;
		align-items: baseline;
	}
	.pay-bar-symbol {
		font-size: 24rpx;
		font-weight: 700;
		color: #EF4444;
	}
	.pay-bar-value {
		font-size: 40rpx;
		font-weight: 700;
		color: #EF4444;
		line-height: 1;
	}
	.pay-bar-placeholder-value {
		font-size: 26rpx;
		font-weight: 500;
		color: #94A3B8;
		line-height: 1.4;
	}

	/* 右侧：提交按钮 */
	.pay-bar-btn {
		background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
		color: #fff;
		height: 84rpx;
		padding: 0 52rpx;
		border-radius: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		font-weight: 700;
		letter-spacing: 2rpx;
		box-shadow: 0 8rpx 24rpx -4rpx rgba(37,99,235,0.55);
		flex-shrink: 0;
	}
	.pay-bar-btn:active { transform: scale(0.97); opacity: 0.92; }

	/* 移除旧 FAB 样式（已不再使用） */

	/* 收货地址弹窗 */
	.addr-mask {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		z-index: 200;
		display: flex;
		align-items: flex-end;
	}
	.addr-dialog {
		width: 100%;
		background: #fff;
		border-radius: 28rpx 28rpx 0 0;
		padding: 36rpx 28rpx 0;
		box-sizing: border-box;
	}
	.addr-dialog-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #1E293B;
		text-align: center;
		margin-bottom: 30rpx;
	}
	.addr-form { margin-bottom: 8rpx; }
	.addr-row {
		display: flex;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #F1F5F9;
	}
	.addr-label {
		width: 130rpx;
		font-size: 28rpx;
		color: #334155;
		flex-shrink: 0;
	}
	.addr-input {
		flex: 1;
		font-size: 28rpx;
		color: #1E293B;
		height: 56rpx;
		line-height: 56rpx;
	}
	.addr-picker {
		flex: 1;
		height: 56rpx;
		display: flex;
		align-items: center;
	}
	.addr-placeholder { color: #CBD5E1; font-size: 28rpx; }
	.addr-btns {
		display: flex;
		gap: 20rpx;
		padding: 28rpx 0;
		/* 真机底部安全区：基础内边距 + 安全区，避免按钮贴边（模拟器与真机差异） */
		padding-bottom: calc(28rpx + env(safe-area-inset-bottom, 40rpx));
	}
	.addr-btn-cancel {
		flex: 1;
		height: 88rpx;
		border-radius: 44rpx;
		background: #F1F5F9;
		color: #64748B;
		font-size: 30rpx;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.addr-btn-confirm {
		flex: 2;
		height: 88rpx;
		border-radius: 44rpx;
		background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
		color: #fff;
		font-size: 30rpx;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 6rpx 20rpx -4rpx rgba(37,99,235,0.45);
	}

	/* 地址列表 */
	.addr-list {
		max-height: 480rpx;
		overflow-y: auto;
		margin-bottom: 4rpx;
	}
	.addr-item {
		display: flex;
		align-items: center;
		padding: 24rpx 0;
		border-bottom: 1rpx solid #F1F5F9;
		gap: 16rpx;
	}
	.addr-item-check {
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		border: 2rpx solid #CBD5E1;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.addr-item.selected .addr-item-check {
		border-color: #3B82F6;
		background: #EFF6FF;
	}
	.addr-check-dot {
		width: 20rpx;
		height: 20rpx;
		border-radius: 50%;
		background: #3B82F6;
	}
	.addr-item-content {
		flex: 1;
		min-width: 0;
	}
	.addr-item-top {
		display: flex;
		align-items: center;
		gap: 16rpx;
		margin-bottom: 6rpx;
	}
	.addr-item-name {
		font-size: 28rpx;
		font-weight: 600;
		color: #1E293B;
	}
	.addr-item-phone {
		font-size: 26rpx;
		color: #64748B;
	}
	.addr-item-detail {
		font-size: 24rpx;
		color: #94A3B8;
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* 使用新地址按钮 */
	.addr-new-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		padding: 24rpx 0 16rpx;
		color: #3B82F6;
		font-size: 28rpx;
		font-weight: 500;
	}
	.addr-new-icon {
		font-size: 32rpx;
		font-weight: 700;
		line-height: 1;
	}

	/* 员工内购入口卡片 */
	.employee-entry-card { cursor: pointer; }
	.employee-entry-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.employee-entry-left {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}
	.employee-entry-desc {
		display: block;
		font-size: 24rpx;
		color: #64748B;
		margin-top: 4rpx;
	}
	.employee-entry-arrow {
		font-size: 40rpx;
		color: #94A3B8;
	}
	.employee-verified-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.employee-verified-left { display: flex; align-items: center; gap: 16rpx; }
	.employee-verified-name {
		display: block;
		font-size: 28rpx;
		font-weight: 600;
		color: #16A34A;
	}
	.employee-verified-quota {
		display: block;
		font-size: 24rpx;
		color: #64748B;
		margin-top: 4rpx;
	}
	.employee-exit-btn {
		font-size: 26rpx;
		color: #EF4444;
		padding: 8rpx 16rpx;
	}

	/* 员工内购 - 低调入口 */
	.employee-mini-entry {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 8rpx;
		padding: 16rpx 32rpx 0;
	}
	.employee-mini-text {
		font-size: 24rpx;
		color: #94A3B8;
	}
	.employee-mini-arrow {
		font-size: 28rpx;
		color: #CBD5E1;
	}

	/* 员工内购 - 激活状态卡片 */
	.employee-active-card {
		padding: 20rpx 30rpx;
		margin-top: 12rpx;
	}

	/* 邀请码重置按钮 */
	.invite-reset-btn {
		font-size: 24rpx;
		color: #94A3B8;
		padding: 8rpx 0 8rpx 20rpx;
		flex-shrink: 0;
	}


	/* 支付方式选择 */
	.payment-card {}
	.payment-options {
		display: flex;
		gap: 20rpx;
	}
	.payment-option {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 14rpx;
		padding: 20rpx 24rpx;
		border-radius: 20rpx;
		border: 1.5rpx solid #E2E8F0;
		font-size: 28rpx;
		color: #475569;
		background: #F8FAFC;
	}
	.payment-option.active {
		border-color: #3B82F6;
		background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
		color: #1D4ED8;
		box-shadow: 0 2rpx 12rpx rgba(59,130,246,0.15);
	}
	.payment-radio {
		width: 36rpx;
		height: 36rpx;
		border-radius: 50%;
		border: 3rpx solid #CBD5E1;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.payment-option.active .payment-radio { border-color: #3B82F6; }
	.payment-radio-dot {
		width: 20rpx;
		height: 20rpx;
		border-radius: 50%;
		background: #3B82F6;
	}

	/* 通用弹窗 */
	.modal-mask {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
	}
	.modal-box {
		background: #fff;
		border-radius: 24rpx;
		width: 640rpx;
		overflow: hidden;
	}
	.modal-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #1E293B;
		padding: 40rpx 40rpx 24rpx;
	}
	.modal-body {
		padding: 0 40rpx 32rpx;
	}
	.modal-row {
		margin-bottom: 20rpx;
	}
	.modal-input {
		width: 100%;
		height: 80rpx;
		border: 2rpx solid #E2E8F0;
		border-radius: 14rpx;
		padding: 0 24rpx;
		font-size: 28rpx;
		color: #1E293B;
		background: #F8FAFC;
		box-sizing: border-box;
	}
	.modal-code-row {
		display: flex;
		gap: 16rpx;
	}
	.modal-input-code {
		flex: 1;
	}
	.modal-send-btn {
		height: 80rpx;
		padding: 0 24rpx;
		background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
		color: #fff;
		border-radius: 14rpx;
		font-size: 26rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		white-space: nowrap;
		flex-shrink: 0;
		box-shadow: 0 4rpx 12rpx rgba(59,130,246,0.35);
	}
	.modal-send-btn.disabled { background: #CBD5E1; box-shadow: none; }
	.modal-footer {
		display: flex;
		border-top: 1rpx solid #F1F5F9;
	}
	.modal-btn-cancel {
		flex: 1;
		height: 100rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		color: #64748B;
		border-right: 1rpx solid #F1F5F9;
	}
	.modal-btn-confirm {
		flex: 1;
		height: 100rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		font-weight: 600;
		color: #3B82F6;
	}
	.invite-code-price-hint {
		display: flex;
		flex-direction: column;
		margin-top: 8rpx;
		gap: 4rpx;
	}
	.ic-price-label {
		font-size: 26rpx;
		color: #3B82F6;
		font-weight: 600;
	}
	.ic-price-min {
		font-size: 24rpx;
		color: #F59E0B;
	}

	/* 已选规格列表 */
	.selected-item-row {
		display: flex;
		align-items: center;
		padding: 18rpx 0;
		border-bottom: 1rpx solid #F1F5F9;
		gap: 12rpx;
	}
	.selected-item-row:last-of-type {
		border-bottom: none;
	}
	.selected-item-name {
		flex: 1;
		font-size: 26rpx;
		color: #334155;
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.selected-item-qty {
		display: flex;
		align-items: center;
		background: #F8FAFC;
		border-radius: 10rpx;
		border: 1.5rpx solid #E2E8F0;
		overflow: hidden;
	}
	.qty-btn-sm {
		width: 56rpx;
		height: 52rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.qty-btn-sm.disabled { opacity: 0.3; }
	.icon-minus-sm {
		width: 16rpx;
		height: 2.5rpx;
		background: #475569;
		border-radius: 2rpx;
	}
	.icon-plus-sm {
		width: 16rpx;
		height: 2.5rpx;
		background: #475569;
		border-radius: 2rpx;
		position: relative;
	}
	.icon-plus-sm::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 2.5rpx;
		height: 16rpx;
		background: #475569;
		border-radius: 2rpx;
	}
	.qty-value-sm {
		width: 72rpx;
		text-align: center;
		font-size: 26rpx;
		font-weight: 600;
		color: #1E293B;
		height: 52rpx;
		background: #fff;
		border-left: 1.5rpx solid #E2E8F0;
		border-right: 1.5rpx solid #E2E8F0;
		padding: 0 8rpx;
		box-sizing: border-box;
	}
	.selected-item-price {
		font-size: 26rpx;
		font-weight: 600;
		color: #EF4444;
		min-width: 100rpx;
		text-align: right;
	}
	.selected-item-del {
		font-size: 28rpx;
		color: #CBD5E1;
		padding: 4rpx 8rpx;
	}
	.selected-add-btn {
		margin-top: 20rpx;
		padding: 20rpx 0;
		text-align: center;
		font-size: 28rpx;
		color: #3B82F6;
		border: 1.5rpx dashed #93C5FD;
		border-radius: 14rpx;
		background: #F0F9FF;
	}
</style>
