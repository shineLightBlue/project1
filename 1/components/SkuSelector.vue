<template>
	<view v-if="visible" class="sku-mask" @tap="$emit('close')">
		<view class="sku-panel" @tap.stop>
			<!-- 顶部：SKU图片 + 已选信息 -->
			<view class="sku-header">
				<image
					class="sku-thumb"
					:src="headerImg"
					mode="aspectFill"
				/>
				<view class="sku-header-info">
					<text class="sku-selected-name">{{ selectedSkuName || '请选择规格' }}</text>
					<view class="sku-price-row" v-if="currentUnitPrice">
						<text class="sku-price-symbol">¥</text>
						<text class="sku-price-value">{{ currentUnitPrice }}</text>
						<text class="sku-price-unit">/件</text>
					</view>
				</view>
				<view class="sku-close" @tap="$emit('close')">
					<text class="sku-close-icon">✕</text>
				</view>
			</view>

			<!-- 规格选择区 -->
			<scroll-view class="sku-scroll" scroll-y>
				<view v-for="dim in dimensions" :key="dim.id" class="dim-section">
					<text class="dim-title">{{ dim.dimName }}</text>
					<view class="option-list">
						<view
							v-for="opt in getDimOptions(dim)"
							:key="opt.id"
							class="option-chip"
							:class="{ selected: selectedMap[dim.id] === opt.id }"
							@tap="selectOption(dim.id, opt.id)"
						>
							<image
								v-if="dim.showImage === 1 && opt.optionImage"
								class="option-img"
								:src="opt.optionImage"
								mode="aspectFill"
							/>
							<text class="option-name">{{ opt.optionName }}</text>
							<view v-if="opt.isHot === 1" class="hot-badge">热销</view>
						</view>
					</view>
				</view>

				<!-- 数量选择 -->
				<view class="qty-section">
					<text class="dim-title">购买数量</text>
					<view class="qty-row">
						<view class="qty-btn" :class="{ disabled: quantity <= (minQuantity || 1) }" @tap="changeQty(-1)">
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

				<!-- 邀请码阶梯价（方案三 ladder，优先显示） -->
				<view v-if="inviteCodeLadderTiers && inviteCodeLadderTiers.length > 0" class="tier-section">
					<text class="dim-title">阶梯价格</text>
					<view class="tier-list">
						<view
							v-for="(tier, idx) in inviteCodeLadderTiers"
							:key="idx"
							class="tier-chip"
							:class="{ active: isActiveTier(tier) }"
						>
							<text class="tier-range">{{ tierLabel(tier) }}件</text>
							<text class="tier-price">¥{{ parseFloat(tier.unitPrice).toFixed(2) }}</text>
						</view>
					</view>
				</view>
			</scroll-view>

			<!-- 确认按钮 -->
			<view class="sku-footer">
				<view
					class="sku-confirm-btn"
					:class="{ disabled: !canConfirm }"
					@tap="handleConfirm"
				>
					<text>{{ canConfirm ? (mode === 'multi' ? '加入订单' : '确认选择') : '请选择完整规格' }}</text>
				</view>
				<view class="sku-footer-safe" :style="{ height: safeAreaBottom + 'px' }"></view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'SkuSelector',
	props: {
		visible: {
			type: Boolean,
			default: false
		},
		dimensions: {
			type: Array,
			default: () => []
		},
		skus: {
			type: Array,
			default: () => []
		},
		productImg: {
			type: String,
			default: ''
		},
		initialQuantity: {
			type: Number,
			default: 1
		},
		// 上次选择的 { dimId: optId } 映射，用于重新打开时恢复选项
		initialSelectedMap: {
			type: Object,
			default: () => ({})
		},
		// 邀请码专属价格：有值时不显示阶梯价，直接用此价格
		inviteCodePrice: {
			type: [Number, String],
			default: null
		},
		// 数量上限（员工内购时为剩余限购数量）
		maxQuantity: {
			type: Number,
			default: 999
		},
		// 数量下限（邀请码 minQuantity，方案三有效）
		minQuantity: {
			type: Number,
			default: 1
		},
		// 当前已选总数量（多SKU继续添加时，用于方案三阶梯价按整单合计命中）
		existingQuantity: {
			type: Number,
			default: 0
		},
		// 邀请码阶梯价档位（方案三 ladder 模式）
		inviteCodeLadderTiers: {
			type: Array,
			default: null
		},
		// 选择模式：'single' 确认后直接下单；'multi' 加入购物车支持多SKU
		mode: {
			type: String,
			default: 'single'
		}
	},
	data() {
		return {
			selectedMap: {},   // { dimensionId: optionId }
			quantity: this.initialQuantity || 1,
			safeAreaBottom: 0
		};
	},
	computed: {
		// 将 selectedMap 中的 optionId 按维度 sortOrder 排序后拼成逗号分隔字符串
		selectedOptionIdsStr() {
			const sorted = [...this.dimensions]
				.sort((a, b) => a.sortOrder - b.sortOrder)
				.map(d => this.selectedMap[d.id])
				.filter(Boolean);
			if (sorted.length !== this.dimensions.length) return null;
			return sorted.join(',');
		},
		// 匹配到的 SKU
		// 后端 optionIds 为 List<String> → JSON 数组，需转为逗号字符串后再比对
		matchedSku() {
			if (!this.selectedOptionIdsStr) return null;
			return this.skus.find(s => {
				const ids = Array.isArray(s.optionIds)
					? s.optionIds.join(',')
					: (s.optionIds || '');
				return ids === this.selectedOptionIdsStr;
			}) || null;
		},
		// 邀请码阶梯价：按当前数量命中的档位
		currentLadderTier() {
			if (!this.inviteCodeLadderTiers) return null;
			return this.inviteCodeLadderTiers.find(t =>
				this.previewTotalQuantity >= t.minQuantity &&
				(t.maxQuantity === null || this.previewTotalQuantity <= t.maxQuantity)
			) || null;
		},
		previewTotalQuantity() {
			return (this.existingQuantity || 0) + (this.quantity || 0);
		},
		currentUnitPrice() {
			if (this.inviteCodePrice != null) {
				return parseFloat(this.inviteCodePrice).toFixed(2);
			}
			// 方案三阶梯价：按当前数量命中档位显示单价
			if (this.inviteCodeLadderTiers) {
				return this.currentLadderTier ? parseFloat(this.currentLadderTier.unitPrice).toFixed(2) : null;
			}
			return null;
		},
		selectedSkuName() {
			return this.matchedSku ? this.matchedSku.skuName : null;
		},
		headerImg() {
			return (this.matchedSku && this.matchedSku.skuImg) ? this.matchedSku.skuImg : (this.productImg || '/static/product.jpg');
		},
		canConfirm() {
			return !!this.matchedSku && this.currentUnitPrice != null && this.maxQuantity > 0;
		}
	},
	watch: {
			visible(val) {
			if (val) {
				this.quantity = Math.min(
					Math.max(this.initialQuantity || 1, this.minQuantity || 1),
					this.maxQuantity
				);
				// 恢复上次选择的规格
				this.selectedMap = Object.assign({}, this.initialSelectedMap || {});
				try {
					const info = uni.getWindowInfo();
					this.safeAreaBottom = (info.safeAreaInsets && info.safeAreaInsets.bottom) ? info.safeAreaInsets.bottom : 0;
				} catch (e) {}
			}
		}
	},
	methods: {
		getDimOptions(dim) {
			return (dim && dim.options) ? dim.options : [];
		},
		selectOption(dimId, optId) {
			this.$set(this.selectedMap, dimId, optId);
		},
		changeQty(delta) {
			const minQty = this.minQuantity || 1;
			const next = this.quantity + delta;
			if (next < minQty) {
				if (minQty > 1) uni.showToast({ title: '最低购买 ' + minQty + ' 件', icon: 'none' });
				return;
			}
			if (next > this.maxQuantity) {
				const remainingQty = Math.max(0, this.maxQuantity - this.quantity);
				uni.showToast({ title: '超出年度限购，剩余 ' + remainingQty + ' 件', icon: 'none' });
				return;
			}
			this.quantity = next;
		},
		onQtyInput(e) {
			const minQty = this.minQuantity || 1;
			const val = parseInt(e.detail.value);
			if (!isNaN(val) && val >= minQty) this.quantity = val;
		},
		onQtyBlur(e) {
			const minQty = this.minQuantity || 1;
			const val = parseInt(e.detail.value);
			const clamped = (!isNaN(val) && val >= minQty) ? val : minQty;
			this.quantity = Math.min(clamped, this.maxQuantity);
		},
		isActiveTier(tier) {
			return this.previewTotalQuantity >= tier.minQuantity &&
				(tier.maxQuantity === null || this.previewTotalQuantity <= tier.maxQuantity);
		},
		tierLabel(tier) {
			return tier.maxQuantity === null
				? tier.minQuantity + '+'
				: tier.minQuantity + '-' + tier.maxQuantity;
		},
		handleConfirm() {
			if (!this.canConfirm) {
				if (this.currentUnitPrice == null) {
					uni.showToast({ title: '请先输入邀请码后查看价格', icon: 'none' });
					return;
				}
				const unselected = this.dimensions.find(d => !this.selectedMap[d.id]);
				uni.showToast({ title: '请选择' + (unselected ? unselected.dimName : '完整规格'), icon: 'none' });
				return;
			}
			const payload = {
				skuId: this.matchedSku.skuId,
				skuName: this.matchedSku.skuName,
				quantity: this.quantity,
				selectedMap: Object.assign({}, this.selectedMap),
				unitPrice: this.currentUnitPrice != null ? parseFloat(this.currentUnitPrice) : null
			};
			if (this.mode === 'multi') {
				// 多SKU模式：加入购物车后重置数量，不关闭弹窗
				this.$emit('add-to-cart', payload);
				this.quantity = 1;
				uni.showToast({ title: '已加入订单', icon: 'success', duration: 800 });
			} else {
				this.$emit('confirm', payload);
			}
		}
	}
};
</script>

<style scoped>
.sku-mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.45);
	z-index: 300;
	display: flex;
	align-items: flex-end;
}
.sku-panel {
	width: 100%;
	background: #fff;
	border-radius: 32rpx 32rpx 0 0;
	display: flex;
	flex-direction: column;
	max-height: 85vh;
}
.sku-panel::before {
	content: '';
	display: block;
	width: 64rpx;
	height: 6rpx;
	border-radius: 3rpx;
	background: #E2E8F0;
	margin: 16rpx auto 4rpx;
	flex-shrink: 0;
}

/* 顶部 */
.sku-header {
	display: flex;
	align-items: center;
	padding: 28rpx 28rpx 20rpx;
	border-bottom: 1rpx solid #F1F5F9;
	gap: 20rpx;
	position: relative;
}
.sku-thumb {
	width: 120rpx;
	height: 120rpx;
	border-radius: 16rpx;
	flex-shrink: 0;
	background: #F8FAFC;
}
.sku-header-info {
	flex: 1;
	min-width: 0;
}
.sku-selected-name {
	font-size: 28rpx;
	font-weight: 600;
	color: #1E293B;
	display: block;
	margin-bottom: 8rpx;
}
.sku-price-row {
	display: flex;
	align-items: baseline;
}
.sku-price-symbol {
	font-size: 24rpx;
	font-weight: 700;
	color: #EF4444;
}
.sku-price-value {
	font-size: 44rpx;
	font-weight: 700;
	color: #EF4444;
	line-height: 1;
}
.sku-price-unit {
	font-size: 22rpx;
	color: #94A3B8;
	margin-left: 4rpx;
}
.sku-close {
	position: absolute;
	top: 24rpx;
	right: 24rpx;
	width: 52rpx;
	height: 52rpx;
	border-radius: 50%;
	background: #F1F5F9;
	display: flex;
	align-items: center;
	justify-content: center;
}
.sku-close-icon {
	font-size: 26rpx;
	color: #94A3B8;
	line-height: 1;
}

/* 滚动区 */
.sku-scroll {
	flex: 1;
	overflow: hidden;
	padding: 0 28rpx;
}

/* 维度 */
.dim-section {
	padding: 24rpx 0 8rpx;
	border-bottom: 1rpx solid #F8FAFC;
}
.dim-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #334155;
	display: block;
	margin-bottom: 16rpx;
}
.option-list {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;
}
.option-chip {
	position: relative;
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 14rpx 28rpx;
	border-radius: 16rpx;
	border: 1.5rpx solid #E2E8F0;
	background: #fff;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.option-chip.selected {
	border-color: #3B82F6;
	background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
	box-shadow: 0 2rpx 12rpx rgba(59,130,246,0.2);
}
.option-img {
	width: 40rpx;
	height: 40rpx;
	border-radius: 6rpx;
}
.option-name {
	font-size: 28rpx;
	color: #334155;
}
.option-chip.selected .option-name {
	color: #2563EB;
	font-weight: 600;
}
.hot-badge {
	position: absolute;
	top: -12rpx;
	right: -12rpx;
	font-size: 18rpx;
	color: #fff;
	background: #ef4444;
	border-radius: 8rpx 8rpx 8rpx 0;
	padding: 2rpx 8rpx;
	line-height: 1.4;
	white-space: nowrap;
}

/* 数量 */
.qty-section {
	padding: 24rpx 0;
}
.qty-row {
	display: flex;
	align-items: center;
}
.qty-btn {
	width: 72rpx;
	height: 64rpx;
	border: 2rpx solid #E2E8F0;
	border-radius: 10rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #F8FAFC;
}
.qty-btn.disabled { opacity: 0.3; }
.icon-minus {
	width: 20rpx;
	height: 3rpx;
	background: #475569;
	border-radius: 2rpx;
}
.icon-plus {
	width: 20rpx;
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
	height: 20rpx;
	background: #475569;
	border-radius: 2rpx;
}
.qty-value {
	width: 100rpx;
	text-align: center;
	font-size: 30rpx;
	font-weight: 600;
	color: #1E293B;
	height: 64rpx;
	line-height: 64rpx;
	border-top: 2rpx solid #E2E8F0;
	border-bottom: 2rpx solid #E2E8F0;
}

/* 阶梯价 */
.tier-section {
	padding: 0 0 24rpx;
}
.tier-list {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}
.tier-chip {
	flex: 1;
	min-width: 120rpx;
	text-align: center;
	padding: 14rpx 8rpx;
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
.tier-range {
	display: block;
	font-size: 22rpx;
	color: #94A3B8;
	margin-bottom: 6rpx;
}
.tier-chip.active .tier-range { color: #3B82F6; }
.tier-price {
	display: block;
	font-size: 26rpx;
	font-weight: 700;
	color: #1E293B;
}
.tier-chip.active .tier-price { color: #2563EB; }

/* 底部确认 */
.sku-footer {
	padding: 20rpx 28rpx 0;
	border-top: 1rpx solid #F1F5F9;
}
.sku-confirm-btn {
	height: 88rpx;
	border-radius: 48rpx;
	background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
	color: #fff;
	font-size: 30rpx;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	letter-spacing: 2rpx;
	box-shadow: 0 8rpx 24rpx -4rpx rgba(37,99,235,0.55);
}
.sku-confirm-btn.disabled {
	background: #CBD5E1;
	box-shadow: none;
}
.sku-confirm-btn:active:not(.disabled) { transform: scale(0.97); opacity: 0.92; }
.sku-footer-safe {
	min-height: 20rpx;
}
</style>
