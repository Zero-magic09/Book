// pages/farmer/account/account.js
const app = getApp();
const { get, post, del } = require('../../../utils/request.js');

Page({
    data: {
        accounts: [],
        farmerId: null,
        balance: '0.00',
        showWithdrawModal: false,
        withdrawAmount: '',
        selectedAccountIndex: 0,
        showAddAccountModal: false,
        newAccount: {
            bankName: '',
            accountNumber: '',
            accountHolder: ''
        }
    },

    onLoad() {
        const storedUser = wx.getStorageSync('userInfo') || app.globalData.userInfo;
        const farmerId = storedUser ? storedUser.farmerId : null;
        if (farmerId) {
            this.setData({ farmerId });
            this.fetchAccounts();
            this.fetchBalance();
        }
    },

    fetchBalance() {
        get(`/farmer/${this.data.farmerId}/balance`).then(res => {
            if (res.code === 200) {
                this.setData({ balance: res.data.balance });
            }
        });
    },

    fetchAccounts() {
        get(`/farmer/${this.data.farmerId}/accounts`).then(res => {
            if (res.code === 200) {
                this.setData({ accounts: res.data });
            }
        });
    },


    handleAddAccount() {
        const storedUser = wx.getStorageSync('userInfo') || app.globalData.userInfo;
        this.setData({
            showAddAccountModal: true,
            newAccount: {
                bankName: '',
                accountNumber: '',
                accountHolder: storedUser ? storedUser.realName || '' : ''
            }
        });
    },

    closeAddAccountModal() {
        this.setData({ showAddAccountModal: false });
    },

    onAccountInput(e) {
        const field = e.currentTarget.dataset.field;
        this.setData({
            [`newAccount.${field}`]: e.detail.value
        });
    },

    submitAddAccount() {
        const { bankName, accountNumber, accountHolder } = this.data.newAccount;
        if (!bankName || !accountNumber || !accountHolder) {
            wx.showToast({ title: '请填写完整信息', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '保存中' });
        post(`/farmer/${this.data.farmerId}/accounts`, this.data.newAccount).then(res => {
            wx.hideLoading();
            if (res.code === 200) {
                wx.showToast({ title: '添加成功', icon: 'success' });
                this.setData({ showAddAccountModal: false });
                this.fetchAccounts();
            } else {
                wx.showToast({ title: res.message || '添加失败', icon: 'none' });
            }
        }).catch(() => {
            wx.hideLoading();
        });
    },

    handleWithdraw() {
        if (parseFloat(this.data.balance) <= 0) {
            wx.showToast({ title: '余额不足', icon: 'none' });
            return;
        }
        if (this.data.accounts.length === 0) {
            wx.showToast({ title: '请先添加结算账户', icon: 'none' });
            return;
        }
        this.setData({
            showWithdrawModal: true,
            withdrawAmount: ''
        });
    },

    closeWithdrawModal() {
        this.setData({ showWithdrawModal: false });
    },

    preventStop() {
        // Prevent modal click from propagating to overlay
    },

    onWithdrawInput(e) {
        let val = e.detail.value;
        this.setData({ withdrawAmount: val });
    },

    onAccountChange(e) {
        this.setData({
            selectedAccountIndex: e.detail.value
        });
    },

    handleWithdrawAll() {
        this.setData({ withdrawAmount: this.data.balance });
    },

    submitWithdraw() {
        const amount = parseFloat(this.data.withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            wx.showToast({ title: '请输入金额', icon: 'none' });
            return;
        }
        if (amount > parseFloat(this.data.balance)) {
            wx.showToast({ title: '余额不足', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '提交中' });
        post(`/farmer/${this.data.farmerId}/withdraw`, { amount }).then(res => {
            wx.hideLoading();
            if (res.code === 200) {
                wx.showToast({ title: '申请已提交', icon: 'success' });
                this.setData({ showWithdrawModal: false });
                this.fetchBalance(); // Refresh balance
            } else {
                wx.showToast({ title: res.message || '提现失败', icon: 'none' });
            }
        }).catch(() => {
            wx.hideLoading();
        });
    },

    handleDelete(e) {
        const id = e.currentTarget.dataset.id;
        del(`/farmer/${this.data.farmerId}/accounts/${id}`).then(res => {
            if (res.code === 200) {
                wx.showToast({ title: '已删除' });
                this.fetchAccounts();
            }
        });
    }
})
