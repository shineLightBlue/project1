<template>
	<view class="result-page">
		<!-- 成功状态 -->
		<view class="success-header">
			<view class="success-circle">
				<view class="icon-check-success"></view>
			</view>
			<text class="success-title">支付成功</text>
			<text class="success-desc">订单已提交，我们将尽快为你发货</text>
		</view>

		<!-- 加载中 -->
		<view v-if="loading" class="loading-wrap">
			<view class="loading-spinner"></view>
			<text class="loading-text">加载订单信息...</text>
		</view>

		<block v-else>
			<!-- 订单信息卡片 -->
			<view class="order-card">
				<view class="order-item">
					<text class="item-label">订单号</text>
					<text class="item-value mono">{{ orderNo }}</text>
				</view>
				<view class="order-item">
					<text class="item-label">商品</text>
					<text class="item-value bold">{{ productName }} x {{ quantity }}</text>
				</view>
				<view class="order-item">
					<text class="item-label">推荐人</text>
					<view class="distributor-tag">
						<text>{{ distributorName }}{{ distributorDept ? ' · ' + distributorDept : '' }}</text>
					</view>
				</view>
				<view v-if="inviteSchemeType" class="order-item">
					<text class="item-label">邀请码方案</text>
					<text class="item-value">{{ inviteSchemeTypeText }}</text>
				</view>
				<view v-if="tierDesc" class="order-item">
					<text class="item-label">邀请码优惠</text>
					<text class="item-value">{{ tierDesc }}</text>
				</view>
				<view class="order-item">
					<text class="item-label">单价</text>
					<text class="item-value">¥{{ unitPrice }}</text>
				</view>
				<view class="order-divider"></view>
				<view class="order-item">
					<text class="item-label total-label">实付总额</text>
					<view class="total-amount">
						<text class="total-symbol">¥</text>
						<text class="total-value">{{ totalAmount }}</text>
					</view>
				</view>
				<view v-if="payTime" class="order-item">
					<text class="item-label">支付时间</text>
					<text class="item-value">{{ payTime }}</text>
				</view>
			</view>

			<!-- 操作按钮 -->
			<view class="action-group">
				<view class="action-btn primary" @tap="viewOrderDetail">查看订单详情</view>
				<view class="action-btn outline" @tap="viewAllOrders">查看全部订单</view>
				<view class="action-btn text" @tap="backHome">继续购买</view>
			</view>

			<!-- 底部提示 -->
			<view class="footer-info">
				<view class="footer-row">
					<view class="icon-truck"></view>
					<text>预计3-5个工作日送达</text>
				</view>
				<view class="footer-row">
					<view class="icon-shield-sm"></view>
					<text>由微信支付提供安全保障</text>
				</view>
			</view>
		</block>

		<view class="bottom-placeholder"></view>
	</view>
</template>

<script>
	import { get } from '@/utils/miniRequest.js';

	export default {
		data() {
			return {
				loading: true,
				orderId: '',
				orderNo: '',
				productName: '',
				quantity: 0,
				unitPrice: '0',
				totalAmount: '0',
				distributorName: '',
				distributorDept: '',
				payTime: '',
				inviteSchemeType: null,
				inviteSchemeTypeText: '',
				tierDesc: ''
			};
		},
		onLoad(options) {
			if (options.orderId) {
				this.orderId = options.orderId;
				this.loadOrderDetail();
			} else {
				this.loading = false;
				uni.showToast({ title: '订单信息异常，请返回重试', icon: 'none' });
				setTimeout(() => uni.navigateBack(), 1500);
			}
		},
		methods: {
			async loadOrderDetail() {
				try {
					const res = await get(`/api/distribution/marketing/order/${this.orderId}`);
					const d = res.data;
					this.orderNo = d.orderNo || '';
					this.productName = d.productName || '';
					this.quantity = d.quantity || 0;
					this.unitPrice = d.unitPrice ? parseFloat(d.unitPrice).toFixed(2) : '0.00';
					this.totalAmount = d.totalAmount ? parseFloat(d.totalAmount).toFixed(2) : '0.00';
					this.distributorName = d.distributorName || '';
					this.distributorDept = d.distributorDepartment || '';
					this.payTime = d.payTime ? this.formatTime(d.payTime) : '';
					this.inviteSchemeType = d.inviteSchemeType || null;
					this.inviteSchemeTypeText = d.inviteSchemeTypeText || '';
					this.tierDesc = d.tierDesc || '';
				} catch (e) {
					// error shown by interceptor
				} finally {
					this.loading = false;
				}
			},
			formatTime(t) {
				if (!t) return '';
				if (Array.isArray(t)) {
					const [y, mo, d, h, mi, s] = t;
					return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')} ${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}:${String(s||0).padStart(2,'0')}`;
				}
				return String(t).replace('T', ' ').substring(0, 19);
			},
			viewOrderDetail() {
				uni.navigateTo({
					url: `/packageOrder/pages/orderDetail/orderDetail?orderId=${this.orderId}`
				});
			},
			viewAllOrders() {
				uni.navigateTo({
					url: '/packageOrder/pages/order/order'
				});
			},
			backHome() {
				uni.reLaunch({ url: '/packageOrder/pages/product/product' });
			}
		}
	};
</script>

<style scoped>
	.result-page {
		min-height: 100vh;
		background: linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 40%, #F1F5F9 100%);
	}

	/* 成功头部 */
	.success-header {
		background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
		padding: 60rpx 32rpx 56rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		border-radius: 0 0 32rpx 32rpx;
	}
	.success-circle {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.25);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 20rpx;
		box-shadow: 0 0 0 16rpx rgba(255,255,255,0.12), 0 0 0 32rpx rgba(255,255,255,0.06);
	}
	.icon-check-success {
		width: 32rpx;
		height: 18rpx;
		border-left: 5rpx solid #fff;
		border-bottom: 5rpx solid #fff;
		transform: rotate(-45deg);
		margin-bottom: 6rpx;
	}
	.success-title {
		font-size: 40rpx;
		font-weight: 700;
		color: #fff;
		margin-bottom: 12rpx;
	}
	.success-desc {
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.85);
	}

	/* 加载中 */
	.loading-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 80rpx 0;
	}
	.loading-spinner {
		width: 48rpx;
		height: 48rpx;
		border: 4rpx solid #E2E8F0;
		border-top-color: #3B82F6;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: 16rpx;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	.loading-text {
		font-size: 26rpx;
		color: #94A3B8;
	}

	/* 订单卡片 */
	.order-card {
		background: #fff;
		margin: -20rpx 24rpx 0;
		border-radius: 20rpx;
		padding: 28rpx;
		border: 1.5rpx solid rgba(226,232,240,0.8);
		position: relative;
		z-index: 1;
		box-shadow: 0 4rpx 24rpx rgba(59,130,246,0.09);
	}
	.order-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16rpx 0;
	}
	.item-label {
		font-size: 26rpx;
		color: #94A3B8;
		flex-shrink: 0;
		margin-right: 24rpx;
	}
	.item-value {
		font-size: 26rpx;
		color: #334155;
		text-align: right;
	}
	.item-value.bold {
		font-weight: 600;
		color: #1E293B;
	}
	.item-value.mono {
		font-family: monospace;
		letter-spacing: 1rpx;
	}
	.distributor-tag {
		background: #F0FDF4;
		color: #15803D;
		padding: 8rpx 20rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		font-weight: 500;
	}
	.order-divider {
		height: 1rpx;
		background: #F1F5F9;
		margin: 8rpx 0;
	}
	.total-label {
		font-size: 28rpx;
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
		font-size: 40rpx;
		font-weight: 700;
		color: #EF4444;
		line-height: 1;
	}

	/* 操作按钮 */
	.action-group {
		padding: 28rpx 24rpx 0;
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}
	.action-btn {
		height: 88rpx;
		border-radius: 44rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		font-weight: 600;
	}
	.action-btn.primary {
		background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
		color: #fff;
		box-shadow: 0 8rpx 24rpx -4rpx rgba(37,99,235,0.55);
	}
	.action-btn.outline {
		background: #fff;
		color: #3B82F6;
		border: 1.5rpx solid #BFDBFE;
	}
	.action-btn.text {
		background: transparent;
		color: #3B82F6;
		height: 64rpx;
		font-weight: 500;
	}

	/* 底部提示 */
	.footer-info {
		padding: 40rpx 32rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16rpx;
	}
	.footer-row {
		display: flex;
		align-items: center;
		gap: 10rpx;
		font-size: 24rpx;
		color: #94A3B8;
	}
	.icon-truck {
		width: 28rpx;
		height: 18rpx;
		border: 2rpx solid #94A3B8;
		border-radius: 4rpx 8rpx 4rpx 4rpx;
		position: relative;
	}
	.icon-truck::after {
		content: '';
		position: absolute;
		right: -10rpx;
		bottom: 0;
		width: 10rpx;
		height: 14rpx;
		border: 2rpx solid #94A3B8;
		border-left: none;
		border-radius: 0 4rpx 4rpx 0;
	}
	.icon-shield-sm {
		width: 18rpx;
		height: 22rpx;
		border: 2rpx solid #94A3B8;
		border-radius: 3rpx 3rpx 50% 50%;
	}

	.bottom-placeholder {
		height: 40rpx;
	}
</style>
