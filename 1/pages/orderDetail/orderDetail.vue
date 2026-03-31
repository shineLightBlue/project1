<template>
	<view class="detail-page">
		<!-- 状态头部 -->
		<view class="status-header" :class="{ pending: status === 0, paid: status === 1, cancelled: status === 2, completed: status === 3 }">
			<view class="status-content">
				<view class="status-icon-wrap" :class="{ pending: status === 0, paid: status === 1, cancelled: status === 2, completed: status === 3 }">
					<view v-if="status === 1 || status === 3" class="icon-check-lg"></view>
					<view v-else-if="status === 0" class="icon-clock"></view>
					<view v-else class="icon-close"></view>
				</view>
				<text class="status-text">{{ statusText }}</text>
				<text v-if="status === 0 && paymentType !== 2" class="status-hint">请尽快完成支付</text>
				<text v-if="status === 0 && paymentType === 2" class="status-hint">待确认线下收款</text>
			</view>
		</view>

		<!-- 订单信息 -->
		<view class="info-card">
			<text class="card-title">订单信息</text>
			<view class="info-row">
				<text class="info-label">订单号</text>
				<text class="info-value mono">{{ orderNo }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">订单类型</text>
				<view class="order-type-badge" :class="'type-' + orderType">{{ orderTypeText }}</view>
			</view>
			<view v-if="inviteSchemeType" class="info-row">
				<text class="info-label">邀请码方案</text>
				<view class="order-type-badge" :class="'type-' + inviteSchemeType">{{ inviteSchemeTypeText }}</view>
			</view>
			<view class="info-row">
				<text class="info-label">支付方式</text>
				<text class="info-value">{{ paymentTypeText }}</text>
			</view>
			<!-- 线下打款状态 -->
			<view v-if="paymentType === 2" class="info-row">
				<text class="info-label">收款状态</text>
				<view v-if="offlineConfirmTime" class="offline-status confirmed">已确认收款 {{ offlineConfirmTime }}</view>
				<view v-else class="offline-status pending-payment">待确认收款</view>
			</view>
			<view v-if="payTime" class="info-row">
				<text class="info-label">支付时间</text>
				<text class="info-value">{{ payTime }}</text>
			</view>
		</view>

		<!-- 推荐人信息 -->
		<view class="info-card">
			<text class="card-title">推荐人</text>
			<view class="distributor-row">
				<view class="distributor-avatar">
					<view class="icon-person"></view>
				</view>
				<view class="distributor-info">
					<text class="distributor-name">{{ distributorName }}</text>
					<text v-if="distributorDept" class="distributor-dept">{{ distributorDept }}</text>
				</view>
			</view>
		</view>

		<!-- 商品信息 -->
		<view class="info-card">
			<text class="card-title">商品信息</text>
			<view class="product-row">
				<view class="product-thumb">
					<view class="icon-product"></view>
				</view>
				<view class="product-detail">
					<text class="product-name">{{ productName }}</text>
					<text v-if="tierNote" class="product-note">{{ tierNote }}</text>
					<text class="product-price-info">
						{{ (orderType === 3 && parseFloat(unitPrice) === 0) ? '单价：待定' : ('¥' + unitPrice + ' x ' + quantity) }}
					</text>
				</view>
				<text class="product-total">{{ (orderType === 3 && parseFloat(totalAmount) === 0) ? '待定' : ('¥' + totalAmount) }}</text>
			</view>
			<!-- 多SKU明细列表 -->
			<view v-if="orderItems.length > 1" class="sku-items-wrap">
				<view v-for="(item, idx) in orderItems" :key="idx" class="sku-item-row">
					<text class="sku-item-name">{{ item.skuName }}</text>
					<text class="sku-item-qty">x{{ item.quantity }}</text>
					<text class="sku-item-price">¥{{ item.subTotal }}</text>
				</view>
			</view>
			<view class="price-divider"></view>
			<view class="price-row">
				<text class="price-label">商品总额</text>
				<text class="price-val">{{ (orderType === 3 && parseFloat(totalAmount) === 0) ? '待定' : ('¥' + totalAmount) }}</text>
			</view>
			<view class="price-row total">
				<text class="price-label">实付金额</text>
				<view class="price-highlight">
					<text v-if="orderType === 3 && parseFloat(totalAmount) === 0" class="price-amount pending-price">待定</text>
					<view v-else style="display:flex;align-items:baseline">
						<text class="price-symbol">¥</text>
						<text class="price-amount">{{ totalAmount }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 收货地址 -->
		<view v-if="receiverName" class="info-card">
			<text class="card-title">收货信息</text>
			<view class="info-row">
				<text class="info-label">收货人</text>
				<text class="info-value">{{ receiverName }} {{ receiverPhone }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">收货地址</text>
				<text class="info-value addr-text">{{ receiverProvince }}{{ receiverCity }}{{ receiverDistrict }} {{ receiverAddress }}</text>
			</view>
		</view>

		<!-- 发货信息 -->
		<view class="info-card">
			<text class="card-title">发货信息</text>
			<view class="info-row">
				<text class="info-label">发货状态</text>
				<view class="ship-badge" :class="shipStatusClass">{{ shipStatusText }}</view>
			</view>
			<view v-if="expressCompanyName" class="info-row">
				<text class="info-label">快递公司</text>
				<text class="info-value">{{ expressCompanyName }}</text>
			</view>
			<view v-if="trackingNo" class="info-row">
				<text class="info-label">快递单号</text>
				<text class="info-value mono">{{ trackingNo }}</text>
			</view>
			<view v-if="shipTimeStr" class="info-row">
				<text class="info-label">发货时间</text>
				<text class="info-value">{{ shipTimeStr }}</text>
			</view>
			<!-- 查看物流按钮 -->
			<view v-if="shipStatus === 1" class="logistics-btn-wrap">
				<view class="logistics-btn" @tap="viewLogistics">
					<text class="logistics-btn-text">查看物流</text>
				</view>
			</view>
		</view>

		<!-- 操作按钮 -->
		<view class="action-bar">
			<view v-if="status === 0 && paymentType !== 2" class="action-btn primary" @tap="pay">立即支付</view>
			<view class="action-btn secondary" @tap="buyAgain">再次购买</view>
			<view class="action-btn secondary" @tap="goToOrders">查看全部订单</view>
		</view>

		<view class="bottom-space"></view>

		<!-- 客服悬浮按钮 -->
		<button class="float-cs-btn" open-type="contact">
			<view class="cs-icon"></view>
			<text class="cs-text">客服</text>
		</button>

		<!-- 物流弹窗 -->
		<view v-if="showLogisticsPopup" class="logistics-mask" @tap="closeLogistics">
			<view class="logistics-popup" @tap.stop>
				<view class="logistics-header">
					<text class="logistics-title">物流信息</text>
					<view class="logistics-close" @tap="closeLogistics">
						<text class="close-icon">×</text>
					</view>
				</view>
				
				<!-- 物流状态头部 -->
				<view class="logistics-status" v-if="logisticsData.status">
					<view class="status-icon-wrap" :class="logisticsStatusClass">
						<view v-if="logisticsData.isSigned" class="icon-signed"></view>
						<view v-else class="icon-shipping"></view>
					</view>
					<view class="status-info">
						<text class="status-text-lg">{{ logisticsData.statusDesc || '运输中' }}</text>
						<text class="status-sub">{{ logisticsData.expressCompanyName }} {{ logisticsData.trackingNo }}</text>
					</view>
				</view>
				
				<!-- 物流轨迹列表 -->
				<scroll-view scroll-y class="logistics-traces">
					<view v-if="logisticsLoading" class="logistics-loading">
						<text>加载中...</text>
					</view>
					<view v-else-if="!logisticsData.traces || logisticsData.traces.length === 0" class="logistics-empty">
						<text>暂无物流轨迹</text>
					</view>
					<view v-else class="trace-list">
						<view v-for="(item, index) in logisticsData.traces" :key="index" class="trace-item" :class="{ first: index === 0 }">
							<view class="trace-line">
								<view class="trace-dot" :class="{ active: index === 0 }"></view>
								<view v-if="index < logisticsData.traces.length - 1" class="trace-vertical-line"></view>
							</view>
							<view class="trace-content">
								<text class="trace-desc" :class="{ active: index === 0 }">{{ item.desc }}</text>
								<text class="trace-time">{{ item.time }}</text>
								<text v-if="item.location" class="trace-location">{{ item.location }}</text>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
	import { get } from '@/utils/miniRequest.js';

	const STATUS_MAP = {
		'0': { text: '待支付', cls: 'pending' },
		'1': { text: '已支付', cls: 'paid' },
		'2': { text: '已取消', cls: 'cancelled' },
		'3': { text: '已完成', cls: 'completed' }
	};

	export default {
		data() {
			return {
				orderId: '',
				orderNo: '',
				orderItems: [],
				productName: '',
				quantity: 0,
				unitPrice: '0',
				totalAmount: '0',
				tierNote: '',
				distributorName: '',
				distributorDept: '',
				payTime: null,
				status: 0,
				paymentParams: null,
				receiverName: '',
				receiverPhone: '',
				receiverProvince: '',
				receiverCity: '',
				receiverDistrict: '',
				receiverAddress: '',
				shipStatus: 0,
				trackingNo: '',
				expressCompanyName: '',
				shipTimeStr: '',
				// 物流相关
				showLogisticsPopup: false,
				logisticsLoading: false,
				logisticsData: {},
				// 全员营销方案新增字段
				orderType: 1,
				orderTypeText: '',
				inviteSchemeType: null,
				inviteSchemeTypeText: '',
				paymentType: 1,
				paymentTypeText: '',
				offlineConfirmTime: null,
				purchaseBlocked: false,
				purchaseBlockReason: ''
			};
		},
		computed: {
			statusInfo() {
				return STATUS_MAP[String(this.status)] || STATUS_MAP['0'];
			},
			statusText() {
				return this.statusInfo.text;
			},
			orderStatus() {
				return this.statusInfo.cls;
			},
			shipStatusText() {
				const map = { 0: '未发货', 1: '已发货', 2: '发货超时', 3: '发货取消', 4: '已退货' };
				return map[this.shipStatus] || '未发货';
			},
			shipStatusClass() {
				const map = { 0: 'ship-pending', 1: 'ship-done', 2: 'ship-timeout', 3: 'ship-cancel' };
				return map[this.shipStatus] || 'ship-pending';
			},
			logisticsStatusClass() {
				if (this.logisticsData.isSigned) return 'status-signed';
				const map = { 1: 'status-collected', 2: 'status-shipping', 3: 'status-delivering', 4: 'status-signed', 5: 'status-exception' };
				return map[this.logisticsData.status] || 'status-shipping';
			}
		},
		onLoad(options) {
			if (options.orderId) {
				this.orderId = options.orderId;
				this.loadOrderDetail();
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
					this.unitPrice = d.unitPrice || '0';
					this.totalAmount = d.totalAmount || '0';
					this.tierNote = d.tierDesc || '';
					this.distributorName = d.distributorName || '';
					this.distributorDept = d.distributorDepartment || '';
					this.payTime = d.payTime ? this.formatTime(d.payTime) : '';
					this.status = d.status != null ? d.status : 0;
					this.paymentParams = d.paymentParams || null;
					this.receiverName = d.receiverName || '';
					this.receiverPhone = d.receiverPhone || '';
					this.receiverProvince = d.receiverProvince || '';
					this.receiverCity = d.receiverCity || '';
					this.receiverDistrict = d.receiverDistrict || '';
					this.receiverAddress = d.receiverAddress || '';
					this.shipStatus = d.shipStatus != null ? d.shipStatus : 0;
					this.trackingNo = d.trackingNo || '';
					this.expressCompanyName = d.expressCompanyName || '';
					this.shipTimeStr = d.shipTime ? this.formatTime(d.shipTime) : '';
					// 全员营销新字段
					this.orderType = d.orderType || 1;
					this.orderTypeText = d.orderTypeText || '普通订单';
					this.inviteSchemeType = d.inviteSchemeType || null;
					this.inviteSchemeTypeText = d.inviteSchemeTypeText || '';
					this.paymentType = d.paymentType || 1;
					this.paymentTypeText = d.paymentTypeText || '微信支付';
					this.offlineConfirmTime = d.offlineConfirmTime ? this.formatTime(d.offlineConfirmTime) : null;
					this.orderItems = (d.items && d.items.length > 1) ? d.items : [];
				} catch (e) {
					// error shown by interceptor
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
			pay() {
				if (!this.paymentParams) {
					uni.showToast({ title: '支付参数获取失败，请重试', icon: 'none' });
					return;
				}
				const p = this.paymentParams;
				uni.requestPayment({
					provider: 'wxpay',
					timeStamp: p.timeStamp,
					nonceStr: p.nonceStr,
					package: p.packageValue,
					signType: p.signType || 'RSA',
					paySign: p.paySign,
					success: () => {
						uni.showToast({ title: '支付成功', icon: 'success' });
						this.loadOrderDetail();
					},
					fail: (err) => {
						if (err.errMsg && err.errMsg.includes('cancel')) return;
						uni.showToast({ title: '支付失败，请重试', icon: 'none' });
					}
				});
			},
			buyAgain() {
				uni.navigateTo({ url: '/packageOrder/pages/product/product' });
			},
			goToOrders() {
				uni.navigateTo({ url: '/packageOrder/pages/order/order' });
			},
			// 查看物流
			async viewLogistics() {
				if (!this.orderId) {
					uni.showToast({ title: '订单信息异常', icon: 'none' });
					return;
				}
				this.logisticsLoading = true;
				this.logisticsData = {};
				this.showLogisticsPopup = true;
				
				try {
					const res = await get(`/api/distribution/marketing/logistics/${this.orderId}`);
					this.logisticsData = res.data || {};
				} catch (e) {
					console.error('查询物流失败:', e);
					uni.showToast({ title: '查询物流失败', icon: 'none' });
				} finally {
					this.logisticsLoading = false;
				}
			},
			// 关闭物流弹窗
			closeLogistics() {
				this.showLogisticsPopup = false;
			}
		}
	};
</script>

<style scoped>
	.detail-page {
		min-height: 100vh;
		background: linear-gradient(180deg, #EFF6FF 0%, #F8FAFC 40%, #F1F5F9 100%);
		padding-bottom: 120rpx;
	}

	/* 状态头部 */
	.status-header {
		padding: 48rpx 32rpx 48rpx;
		background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
		border-radius: 0 0 28rpx 28rpx;
	}
	.status-header.paid,
	.status-header.completed {
		background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
	}
	.status-header.pending {
		background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
	}
	.status-header.cancelled {
		background: linear-gradient(135deg, #94A3B8 0%, #64748B 100%);
	}
	.status-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;
	}
	.status-icon-wrap {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 8rpx;
	}
	.icon-check-lg {
		width: 28rpx;
		height: 16rpx;
		border-left: 5rpx solid #fff;
		border-bottom: 5rpx solid #fff;
		transform: rotate(-45deg);
		margin-bottom: 6rpx;
	}
	.icon-clock {
		width: 28rpx;
		height: 28rpx;
		border: 4rpx solid #fff;
		border-radius: 50%;
		position: relative;
	}
	.icon-clock::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 4rpx;
		width: 3rpx;
		height: 12rpx;
		background: #fff;
		transform-origin: bottom;
		transform: translateX(-50%) rotate(30deg);
	}
	.icon-close {
		width: 24rpx;
		height: 24rpx;
		position: relative;
	}
	.icon-close::before,
	.icon-close::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		width: 28rpx;
		height: 4rpx;
		background: #fff;
		border-radius: 2rpx;
	}
	.icon-close::before {
		transform: translate(-50%, -50%) rotate(45deg);
	}
	.icon-close::after {
		transform: translate(-50%, -50%) rotate(-45deg);
	}
	.status-text {
		font-size: 36rpx;
		font-weight: 700;
		color: #fff;
	}
	.status-hint {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	/* 信息卡片 */
	.info-card {
		background: #fff;
		margin: 16rpx 24rpx 0;
		border-radius: 20rpx;
		padding: 28rpx;
		border: 1.5rpx solid rgba(226,232,240,0.8);
		box-shadow: 0 4rpx 20rpx rgba(59,130,246,0.07);
	}
	.card-title {
		display: block;
		font-size: 28rpx;
		font-weight: 600;
		color: #0F172A;
		margin-bottom: 20rpx;
		padding-bottom: 16rpx;
		border-bottom: 1rpx solid #F1F5F9;
		padding-left: 16rpx;
		border-left: 4rpx solid #3B82F6;
	}
	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 14rpx 0;
	}
	.info-label {
		color: #94A3B8;
		font-size: 26rpx;
		flex-shrink: 0;
		min-width: 140rpx;
		padding-top: 2rpx;
	}
	.info-value {
		font-weight: 500;
		color: #334155;
		font-size: 26rpx;
		text-align: right;
		flex: 1;
	}
	.info-value.mono {
		font-family: monospace;
		letter-spacing: 1rpx;
	}

	/* 推荐人 */
	.distributor-row {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}
	.distributor-avatar {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		background: #EFF6FF;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.icon-person {
		width: 24rpx;
		height: 24rpx;
		border-radius: 50%;
		background: #3B82F6;
		position: relative;
	}
	.icon-person::after {
		content: '';
		position: absolute;
		bottom: -14rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 36rpx;
		height: 18rpx;
		border-radius: 18rpx 18rpx 0 0;
		background: #3B82F6;
	}
	.distributor-info {
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}
	.distributor-name {
		font-size: 30rpx;
		font-weight: 600;
		color: #1E293B;
	}
	.distributor-dept {
		font-size: 24rpx;
		color: #94A3B8;
	}

	/* 商品信息 */
	.product-row {
		display: flex;
		align-items: center;
		gap: 20rpx;
		padding-bottom: 20rpx;
	}
	.product-thumb {
		width: 88rpx;
		height: 88rpx;
		background: #F1F5F9;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.icon-product {
		width: 40rpx;
		height: 48rpx;
		border: 3rpx solid #94A3B8;
		border-radius: 6rpx 6rpx 2rpx 2rpx;
		position: relative;
	}
	.icon-product::after {
		content: '';
		position: absolute;
		top: -8rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 20rpx;
		height: 10rpx;
		border: 3rpx solid #94A3B8;
		border-bottom: none;
		border-radius: 10rpx 10rpx 0 0;
	}
	.product-detail {
		flex: 1;
		min-width: 0;
	}
	.product-name {
		display: block;
		font-size: 28rpx;
		font-weight: 600;
		color: #1E293B;
		margin-bottom: 6rpx;
	}
	.product-note {
		display: block;
		font-size: 24rpx;
		color: #94A3B8;
		margin-bottom: 4rpx;
	}
	.product-price-info {
		display: block;
		font-size: 24rpx;
		color: #64748B;
	}
	.product-total {
		font-size: 30rpx;
		font-weight: 700;
		color: #1E293B;
		flex-shrink: 0;
	}

	/* 价格汇总 */
	.price-divider {
		height: 1rpx;
		background: #F1F5F9;
		margin-bottom: 12rpx;
	}
	.price-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10rpx 0;
	}
	.price-label {
		font-size: 26rpx;
		color: #64748B;
	}
	.price-val {
		font-size: 26rpx;
		color: #334155;
	}
	.price-row.total {
		padding-top: 16rpx;
		margin-top: 8rpx;
		border-top: 1rpx dashed #E2E8F0;
	}
	.price-row.total .price-label {
		font-size: 28rpx;
		font-weight: 600;
		color: #1E293B;
	}
	.price-highlight {
		display: flex;
		align-items: baseline;
	}
	.price-symbol {
		font-size: 26rpx;
		font-weight: 700;
		color: #EF4444;
	}
	.price-amount {
		font-size: 40rpx;
		font-weight: 700;
		color: #EF4444;
		line-height: 1;
	}

	/* 操作按钮 */
	.action-bar {
		padding: 32rpx 24rpx;
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
	.action-btn.secondary {
		background: #fff;
		color: #334155;
		border: 1rpx solid #E2E8F0;
	}

	.bottom-space {
		height: 40rpx;
	}

	/* 地址换行 */
	.addr-text { word-break: break-all; line-height: 1.6; text-align: right; }

	/* 发货状态标签 */
	.ship-badge {
		font-size: 24rpx;
		font-weight: 600;
		padding: 6rpx 20rpx;
		border-radius: 20rpx;
	}
	.ship-pending  { background: #FEF9C3; color: #CA8A04; }
	.ship-done     { background: #DCFCE7; color: #16A34A; }
	.ship-timeout  { background: #FEE2E2; color: #DC2626; }
	.ship-cancel   { background: #F1F5F9; color: #64748B; }

	/* 查看物流按钮 */
	.logistics-btn-wrap {
		margin-top: 24rpx;
		padding-top: 20rpx;
		border-top: 1rpx solid #F1F5F9;
	}
	.logistics-btn {
		height: 72rpx;
		border-radius: 36rpx;
		background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.logistics-btn-text {
		font-size: 28rpx;
		font-weight: 600;
		color: #fff;
	}

	/* 物流弹窗 */
	.logistics-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}
	.logistics-popup {
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		border-radius: 32rpx 32rpx 0 0;
		overflow: hidden;
		background: #fff;
	}
	.logistics-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 28rpx 32rpx;
		border-bottom: 1rpx solid #F1F5F9;
		flex-shrink: 0;
	}
	.logistics-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #1E293B;
	}
	.logistics-close {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		background: #F1F5F9;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.close-icon {
		font-size: 40rpx;
		color: #64748B;
		line-height: 1;
	}

	/* 物流状态头部 */
	.logistics-status {
		display: flex;
		align-items: center;
		gap: 20rpx;
		padding: 28rpx 32rpx;
		background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
		flex-shrink: 0;
	}
	.status-icon-wrap {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.icon-signed {
		width: 24rpx;
		height: 14rpx;
		border-left: 4rpx solid #fff;
		border-bottom: 4rpx solid #fff;
		transform: rotate(-45deg);
		margin-bottom: 4rpx;
	}
	.icon-shipping {
		width: 28rpx;
		height: 20rpx;
		border: 3rpx solid #fff;
		border-radius: 4rpx;
		position: relative;
	}
	.icon-shipping::after {
		content: '';
		position: absolute;
		left: 4rpx;
		top: 50%;
		transform: translateY(-50%);
		width: 6rpx;
		height: 6rpx;
		border-radius: 50%;
		background: #fff;
	}
	.status-info {
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}
	.status-text-lg {
		font-size: 32rpx;
		font-weight: 700;
		color: #fff;
	}
	.status-sub {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	/* 物流轨迹 */
	.logistics-traces {
		flex: 1;
		overflow-y: auto;
		padding: 24rpx 32rpx;
	}
	.logistics-loading, .logistics-empty {
		padding: 60rpx 0;
		text-align: center;
		color: #94A3B8;
		font-size: 28rpx;
	}
	.trace-list {
		padding-left: 20rpx;
	}
	.trace-item {
		display: flex;
		gap: 24rpx;
		padding-bottom: 32rpx;
	}
	.trace-item.first .trace-desc {
		color: #3B82F6;
		font-weight: 600;
	}
	.trace-line {
		position: relative;
		width: 24rpx;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.trace-dot {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		background: #CBD5E1;
		border: 2rpx solid #E2E8F0;
		flex-shrink: 0;
	}
	.trace-dot.active {
		width: 20rpx;
		height: 20rpx;
		background: #3B82F6;
		border-color: #3B82F6;
		box-shadow: 0 0 0 6rpx rgba(59, 130, 246, 0.2);
	}
	.trace-vertical-line {
		width: 2rpx;
		flex: 1;
		background: #BFDBFE;
		margin-top: 8rpx;
	}
	.trace-content {
		flex: 1;
		padding-bottom: 8rpx;
	}
	.trace-desc {
		display: block;
		font-size: 26rpx;
		color: #64748B;
		line-height: 1.6;
		margin-bottom: 8rpx;
	}
	.trace-desc.active {
		color: #3B82F6;
		font-weight: 600;
	}
	.trace-time {
		display: block;
		font-size: 22rpx;
		color: #94A3B8;
		margin-bottom: 4rpx;
	}
	.trace-location {
		display: block;
		font-size: 22rpx;
		color: #94A3B8;
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

	/* 订单类型标签 */
	.order-type-badge {
		font-size: 24rpx;
		font-weight: 600;
		padding: 4rpx 18rpx;
		border-radius: 20rpx;
	}
	.type-1 { background: #F1F5F9; color: #475569; }
	.type-2 { background: #F0FDF4; color: #16A34A; }
	.type-3 { background: #EFF6FF; color: #1D4ED8; }
	.type-4 { background: #FFF7ED; color: #EA580C; }

	/* 线下打款状态 */
	.offline-status {
		font-size: 26rpx;
		font-weight: 600;
		padding: 4rpx 18rpx;
		border-radius: 20rpx;
	}
	.offline-status.confirmed { background: #F0FDF4; color: #16A34A; }
	.offline-status.pending-payment { background: #FFF7ED; color: #EA580C; }

	/* 员工奖金 */
	.commission-text { color: #16A34A; font-weight: 600; }

	/* 多SKU明细 */
	.sku-items-wrap {
		margin-top: 16rpx;
		padding: 12rpx 0;
		border-top: 1rpx solid #F1F5F9;
	}
	.sku-item-row {
		display: flex;
		align-items: center;
		padding: 10rpx 0;
		gap: 12rpx;
	}
	.sku-item-name {
		flex: 1;
		font-size: 24rpx;
		color: #475569;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.sku-item-qty {
		font-size: 24rpx;
		color: #94A3B8;
		min-width: 48rpx;
		text-align: center;
	}
	.sku-item-price {
		font-size: 24rpx;
		font-weight: 600;
		color: #1E293B;
		min-width: 90rpx;
		text-align: right;
	}

</style>
