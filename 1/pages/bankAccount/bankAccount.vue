<template>
	<view class="page">
		<!-- 顶部状态说明 -->
		<view class="status-card normal">
			<view class="status-icon-wrap">
				<text class="status-icon">✓</text>
			</view>
			<text class="status-title">订单已提交</text>
			<text class="status-desc">请按以下公司账户转账，备注中填写订单号，转账完成后等待确认（通常1-2个工作日）。</text>
			<text v-if="orderNo" class="status-orderno">订单号：{{ orderNo }}</text>
		</view>

		<!-- 公账信息卡片 -->
		<view class="section-card">
			<text class="section-title">对公账户信息</text>
			<view v-if="bankAccount" class="bank-info-list">
				<view class="bank-info-row">
					<text class="bank-info-label">账户名称</text>
					<text class="bank-info-value">{{ bankAccount.accountName }}</text>
				</view>
				<view class="bank-info-row">
					<text class="bank-info-label">开户银行</text>
					<text class="bank-info-value">{{ bankAccount.bankName }}</text>
				</view>
				<view class="bank-info-row">
					<text class="bank-info-label">支行名称</text>
					<text class="bank-info-value">{{ bankAccount.bankBranch }}</text>
				</view>
				<view class="bank-info-row account-row">
					<text class="bank-info-label">银行账号</text>
					<view class="bank-info-right">
						<text class="bank-info-value">{{ bankAccount.accountNumber }}</text>
						<view class="copy-btn" @tap="copyText(bankAccount.accountNumber, '账号')">复制</view>
					</view>
				</view>
				<view class="bank-info-row remark-row">
					<text class="bank-info-label">打款备注</text>
					<view class="bank-info-right">
						<text class="bank-info-value remark-text">{{ bankAccount.paymentRemark }}</text>
						<view class="copy-btn" @tap="copyText(bankAccount.paymentRemark, '备注')">复制</view>
					</view>
				</view>
			</view>
			<view v-else class="bank-empty">
				<text>暂无公账信息，请联系客服</text>
			</view>
		</view>

		<!-- 操作栏 -->
		<view class="action-card">
			<view class="action-btn primary" @tap="goToOrderDetail">查看订单详情</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				orderId: '',
				orderNo: '',
				bankAccount: null
			};
		},
		onLoad(options) {
			this.orderId = options.orderId || '';
			this.orderNo = options.orderNo ? decodeURIComponent(options.orderNo) : '';
			// 从 storage 读取公账信息（由 product.vue 下单成功后存入）
			try {
				const raw = uni.getStorageSync('_bankAccount');
				if (raw) {
					this.bankAccount = JSON.parse(raw);
					uni.removeStorageSync('_bankAccount');
				}
			} catch (e) {}
		},
		methods: {
			copyText(text, label) {
				uni.setClipboardData({
					data: text,
					success: () => {
						uni.showToast({ title: label + '已复制', icon: 'success' });
					}
				});
			},
			goToOrderDetail() {
				if (!this.orderId) {
					uni.navigateTo({ url: '/packageOrder/pages/order/order' });
					return;
				}
				uni.navigateTo({ url: `/packageOrder/pages/orderDetail/orderDetail?orderId=${this.orderId}` });
			}
		}
	};
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: #F0F4F8;
		padding-bottom: 40rpx;
	}

	/* 顶部状态卡 */
	.status-card {
		padding: 60rpx 40rpx 48rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	.status-card.normal { background: linear-gradient(135deg, #22C55E, #16A34A); }
	.status-icon-wrap {
		width: 100rpx;
		height: 100rpx;
		background: rgba(255,255,255,0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 24rpx;
	}
	.status-icon { font-size: 48rpx; }
	.status-title {
		font-size: 36rpx;
		font-weight: 700;
		color: #fff;
		margin-bottom: 16rpx;
	}
	.status-desc {
		font-size: 26rpx;
		color: rgba(255,255,255,0.85);
		line-height: 1.6;
		margin-bottom: 16rpx;
	}
	.status-orderno {
		font-size: 24rpx;
		color: rgba(255,255,255,0.7);
	}

	/* 通用卡片 */
	.section-card {
		background: #fff;
		border-radius: 20rpx;
		margin: 20rpx 20rpx 0;
		padding: 32rpx 28rpx;
		box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
	}
	.section-title {
		display: block;
		font-size: 30rpx;
		font-weight: 600;
		color: #1E293B;
		margin-bottom: 24rpx;
	}

	/* 银行信息列表 */
	.bank-info-list {}
	.bank-info-row {
		display: flex;
		align-items: flex-start;
		padding: 18rpx 0;
		border-bottom: 1rpx solid #F1F5F9;
	}
	.bank-info-row:last-child { border-bottom: none; }
	.bank-info-label {
		width: 160rpx;
		font-size: 26rpx;
		color: #64748B;
		flex-shrink: 0;
		padding-top: 4rpx;
	}
	.bank-info-value {
		font-size: 28rpx;
		color: #1E293B;
		flex: 1;
		line-height: 1.5;
	}
	.bank-info-right {
		flex: 1;
		display: flex;
		align-items: flex-start;
		gap: 16rpx;
	}
	.remark-text { flex: 1; }
	.copy-btn {
		background: #EFF6FF;
		color: #3B82F6;
		font-size: 24rpx;
		padding: 6rpx 20rpx;
		border-radius: 10rpx;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.bank-empty {
		font-size: 28rpx;
		color: #94A3B8;
		text-align: center;
		padding: 40rpx 0;
	}

	/* 操作栏 */
	.action-card {
		margin: 24rpx 20rpx 0;
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}
	.action-btn {
		height: 96rpx;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		font-weight: 600;
	}
	.action-btn.primary {
		background: #3B82F6;
		color: #fff;
	}
</style>
