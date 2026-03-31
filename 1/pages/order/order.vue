<template>
	<view class="order-page">
		<!-- Tab 栏 -->
		<view class="tab-bar">
			<view
				v-for="(tab, idx) in tabs"
				:key="idx"
				class="tab-item"
				:class="{ active: currentTab === idx }"
				@tap="switchTab(idx)"
			>
				<text class="tab-text">{{ tab.name }}</text>
				<view v-if="tab.count > 0" class="tab-count" :class="{ active: currentTab === idx }">
					{{ tab.count }}
				</view>
				<view v-if="currentTab === idx" class="tab-indicator"></view>
			</view>
		</view>

		<!-- 订单列表 -->
		<view class="order-list-inner">
				<view
					v-for="item in filteredOrders"
					:key="item.orderId"
					class="order-card"
					@tap="viewDetail(item)"
				>
					<!-- 卡片头部：商品名 + 状态 -->
					<view class="card-header">
						<text class="card-product-name">{{ item.productName }}</text>
						<view class="status-tag" :class="{ pending: item.status === 0, paid: item.status === 1, cancelled: item.status === 2, completed: item.status === 3 }">
							{{ item.status === 0 ? '待支付' : item.status === 1 ? '已支付' : item.status === 2 ? '已取消' : '已完成' }}
						</view>
					</view>

					<!-- 订单号 -->
					<text class="card-order-no">{{ item.orderNo }}</text>
					<view v-if="item.inviteSchemeType" class="scheme-tag" :class="'scheme-' + item.inviteSchemeType">
						{{ item.inviteSchemeTypeText || schemeTypeText(item.inviteSchemeType) }}
					</view>

					<!-- 商品信息行 -->
					<view class="card-body">
						<view class="card-info">
							<view class="info-item">
								<text class="info-label">数量</text>
								<text class="info-value">{{ item.quantity }}件</text>
							</view>
							<view class="info-item">
								<text class="info-label">单价</text>
								<text class="info-value">¥{{ parseFloat(item.unitPrice).toFixed(2) }}</text>
							</view>
							<view class="info-item">
								<text class="info-label">推荐人</text>
								<text class="info-value highlight">{{ item.distributorName }}</text>
							</view>
						</view>
					</view>

					<!-- 卡片底部：金额 + 操作 -->
					<view class="card-footer">
						<view class="card-amount">
							<text class="amount-label">实付</text>
							<text class="amount-value">¥{{ parseFloat(item.totalAmount).toFixed(2) }}</text>
						</view>
						<view class="card-actions">
							<view class="btn-outline" @tap.stop="buyAgain(item)">再次购买</view>
							<view class="btn-primary" @tap.stop="viewDetail(item)">查看详情</view>
						</view>
					</view>
				</view>

				<!-- 空状态 -->
				<view v-if="filteredOrders.length === 0" class="empty-state">
					<view class="empty-icon">
						<view class="empty-box"></view>
						<view class="empty-line line1"></view>
						<view class="empty-line line2"></view>
					</view>
					<text class="empty-title">暂无订单</text>
					<text class="empty-desc">去选购商品，下单后这里会显示你的订单</text>
					<view class="empty-btn" @tap="goShopping">去选购</view>
				</view>
		</view>
		<!-- 客服悬浮按钮 -->
		<button class="float-cs-btn" open-type="contact">
			<view class="cs-icon"></view>
			<text class="cs-text">客服</text>
		</button>
	</view>
</template>

<script>
	import { get } from '@/utils/miniRequest.js';
	import { DISTRIBUTION_OPENID_KEY } from '@/config';

	const STATUS_MAP = {
		'0': { text: '待支付', cls: 'pending' },
		'1': { text: '已支付', cls: 'paid' },
		'2': { text: '已取消', cls: 'cancelled' },
		'3': { text: '已完成', cls: 'completed' }
	};

	export default {
		data() {
			return {
				currentTab: 0,
				tabs: [
					{ name: '全部', count: 0 },
					{ name: '待支付', count: 0 },
					{ name: '已支付', count: 0 },
					{ name: '已完成', count: 0 }
				],
				orders: []
			};
		},
		computed: {
			filteredOrders() {
				if (this.currentTab === 0) return this.orders;
				if (this.currentTab === 1) return this.orders.filter(o => o.status === 0);
				if (this.currentTab === 2) return this.orders.filter(o => o.status === 1);
				if (this.currentTab === 3) return this.orders.filter(o => o.status === 3);
				return this.orders;
			}
		},
		onShow() {
			this.loadOrders();
		},
		methods: {
			async loadOrders() {
				const openId = uni.getStorageSync(DISTRIBUTION_OPENID_KEY) || '';
				if (!openId) {
					uni.reLaunch({ url: '/packageOrder/pages/product/product' });
					return;
				}
				try {
					const res = await get('/api/distribution/marketing/orders', {
						userOpenid: openId,
						pageNum: 1,
						pageSize: 50
					});
					this.orders = res.data || [];
					this.updateTabCounts();
				} catch (e) {
					// error shown by interceptor
				}
			},
			updateTabCounts() {
				this.tabs[0].count = this.orders.length;
				this.tabs[1].count = this.orders.filter(o => o.status === 0).length;
				this.tabs[2].count = this.orders.filter(o => o.status === 1).length;
				this.tabs[3].count = this.orders.filter(o => o.status === 3).length;
			},
			statusText(status) {
				return (STATUS_MAP[String(status)] || STATUS_MAP['0']).text;
			},
			statusClass(status) {
				return (STATUS_MAP[String(status)] || STATUS_MAP['0']).cls;
			},
			schemeTypeText(schemeType) {
				if (schemeType === 1) return '员工内购';
				if (schemeType === 2) return '员工推荐';
				if (schemeType === 3) return '批量采购';
				return '';
			},
			switchTab(idx) {
				this.currentTab = idx;
			},
			viewDetail(item) {
				uni.navigateTo({
					url: `/packageOrder/pages/orderDetail/orderDetail?orderId=${item.orderId}`
				});
			},
			buyAgain() {
				uni.navigateTo({
					url: '/packageOrder/pages/product/product'
				});
			},
			goShopping() {
				uni.navigateTo({
					url: '/packageOrder/pages/product/product'
				});
			}
		}
	};
</script>

<style scoped>
	.order-page {
		min-height: 100vh;
		background: linear-gradient(180deg, #EFF6FF 0%, #F8FAFC 40%, #F1F5F9 100%);
		box-sizing: border-box;
	}

	/* Tab 栏 */
	.tab-bar {
		display: flex;
		background: rgba(255,255,255,0.96);
		backdrop-filter: blur(20rpx);
		padding: 0 16rpx;
		position: sticky;
		top: 0;
		z-index: 10;
		border-bottom: 1rpx solid rgba(59,130,246,0.1);
		box-shadow: 0 2rpx 16rpx rgba(59,130,246,0.08);
	}
	.tab-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 28rpx 0 24rpx;
		position: relative;
	}
	.tab-text {
		font-size: 28rpx;
		color: #94A3B8;
		font-weight: 500;
	}
	.tab-item.active .tab-text {
		color: #1E293B;
		font-weight: 600;
	}
	.tab-count {
		position: absolute;
		top: 14rpx;
		right: 16rpx;
		min-width: 32rpx;
		height: 32rpx;
		line-height: 32rpx;
		text-align: center;
		background: #E2E8F0;
		color: #64748B;
		font-size: 20rpx;
		font-weight: 600;
		border-radius: 16rpx;
		padding: 0 8rpx;
	}
	.tab-count.active {
		background: #3B82F6;
		color: #fff;
	}
	.tab-indicator {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 48rpx;
		height: 4rpx;
		background: linear-gradient(90deg, #3B82F6, #2563EB);
		border-radius: 2rpx;
	}

	/* 订单列表 */
	.order-list-inner {
		padding: 20rpx 24rpx;
	}

	/* 订单卡片 */
	.order-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 28rpx;
		margin-bottom: 16rpx;
		border: 1.5rpx solid #F1F5F9;
		box-shadow: 0 4rpx 20rpx rgba(59,130,246,0.07);
	}
	.order-card:active {
		box-shadow: 0 2rpx 8rpx rgba(59,130,246,0.05);
		transform: scale(0.99);
	}
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8rpx;
	}
	.card-product-name {
		font-size: 30rpx;
		font-weight: 600;
		color: #1E293B;
		flex: 1;
		margin-right: 16rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.status-tag {
		font-size: 24rpx;
		font-weight: 600;
		padding: 6rpx 18rpx;
		border-radius: 20rpx;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 8rpx;
	}
	.status-tag::before {
		content: '';
		display: inline-block;
		width: 10rpx;
		height: 10rpx;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.status-tag.paid,
	.status-tag.completed {
		background: #F0FDF4;
		color: #15803D;
	}
	.status-tag.paid::before,
	.status-tag.completed::before {
		background: #22C55E;
	}
	.status-tag.pending {
		background: #FFFBEB;
		color: #B45309;
	}
	.status-tag.pending::before {
		background: #F59E0B;
	}
	.status-tag.cancelled {
		background: #FEF2F2;
		color: #B91C1C;
	}
	.status-tag.cancelled::before {
		background: #EF4444;
	}
	.card-order-no {
		display: block;
		font-size: 24rpx;
		color: #94A3B8;
		margin-bottom: 20rpx;
	}
	.scheme-tag {
		display: inline-flex;
		align-items: center;
		margin-bottom: 20rpx;
		padding: 6rpx 16rpx;
		border-radius: 18rpx;
		font-size: 22rpx;
		font-weight: 600;
	}
	.scheme-tag.scheme-1 {
		background: #FEF3C7;
		color: #B45309;
	}
	.scheme-tag.scheme-2 {
		background: #DCFCE7;
		color: #15803D;
	}
	.scheme-tag.scheme-3 {
		background: #DBEAFE;
		color: #1D4ED8;
	}

	/* 信息行 */
	.card-body {
		padding: 20rpx 0;
		border-top: 1rpx solid #F8FAFC;
		border-bottom: 1rpx solid #F8FAFC;
	}
	.card-info {
		display: flex;
		gap: 32rpx;
	}
	.info-item {
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}
	.info-label {
		font-size: 22rpx;
		color: #94A3B8;
	}
	.info-value {
		font-size: 26rpx;
		font-weight: 600;
		color: #334155;
	}
	.info-value.highlight {
		color: #3B82F6;
	}

	/* 卡片底部 */
	.card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 20rpx;
	}
	.card-amount {
		display: flex;
		align-items: baseline;
		gap: 8rpx;
	}
	.amount-label {
		font-size: 24rpx;
		color: #94A3B8;
	}
	.amount-value {
		font-size: 36rpx;
		font-weight: 700;
		color: #0F172A;
	}
	.card-actions {
		display: flex;
		gap: 16rpx;
	}
	.btn-outline {
		padding: 12rpx 28rpx;
		border: 1rpx solid #E2E8F0;
		color: #64748B;
		font-size: 26rpx;
		border-radius: 32rpx;
		font-weight: 500;
	}
	.btn-primary {
		padding: 12rpx 28rpx;
		background: linear-gradient(135deg, #3B82F6, #2563EB);
		color: #fff;
		font-size: 26rpx;
		border-radius: 32rpx;
		font-weight: 600;
		box-shadow: 0 4rpx 12rpx rgba(59,130,246,0.35);
	}

	/* 空状态 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 120rpx 0 80rpx;
	}
	.empty-icon {
		width: 120rpx;
		height: 120rpx;
		position: relative;
		margin-bottom: 32rpx;
	}
	.empty-box {
		width: 80rpx;
		height: 60rpx;
		border: 4rpx solid #BFDBFE;
		border-radius: 8rpx;
		position: absolute;
		bottom: 20rpx;
		left: 50%;
		transform: translateX(-50%);
	}
	.empty-line {
		height: 4rpx;
		background: #BFDBFE;
		border-radius: 2rpx;
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}
	.empty-line.line1 {
		width: 40rpx;
		bottom: 48rpx;
	}
	.empty-line.line2 {
		width: 28rpx;
		bottom: 38rpx;
	}
	.empty-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #64748B;
		margin-bottom: 12rpx;
	}
	.empty-desc {
		font-size: 26rpx;
		color: #94A3B8;
		margin-bottom: 40rpx;
	}
	.empty-btn {
		padding: 16rpx 48rpx;
		background: linear-gradient(135deg, #3B82F6, #2563EB);
		color: #fff;
		font-size: 28rpx;
		font-weight: 600;
		border-radius: 32rpx;
		box-shadow: 0 6rpx 20rpx rgba(59,130,246,0.35);
	}

	/* 客服悬浮按钮 */
	.float-cs-btn {
		position: fixed;
		right: 32rpx;
		bottom: 160rpx;
		z-index: 999;
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		background: #ffffff;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.15);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		line-height: 1;
	}
	.float-cs-btn::after {
		border: none;
	}
	.cs-icon {
		width: 36rpx;
		height: 28rpx;
		border: 4rpx solid #3B82F6;
		border-bottom: none;
		border-radius: 20rpx 20rpx 0 0;
		position: relative;
		margin-bottom: 4rpx;
	}
	.cs-icon::before,
	.cs-icon::after {
		content: '';
		position: absolute;
		bottom: -1rpx;
		width: 8rpx;
		height: 12rpx;
		background: #3B82F6;
		border-radius: 2rpx;
	}
	.cs-icon::before {
		left: -4rpx;
	}
	.cs-icon::after {
		right: -4rpx;
	}
	.cs-text {
		font-size: 20rpx;
		color: #3B82F6;
		font-weight: 500;
	}
</style>
