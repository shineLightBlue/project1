import { ref } from 'vue'
import { defineStore } from 'pinia'

interface LoginData {
    isNewUserFlag: boolean
    refreshToken: string
    token: string
    userId: string
}

export const useLoginStore = defineStore('loginData', () => {
    const loginData = ref<LoginData>({
        isNewUserFlag:false,
        refreshToken:'',
        token:'',
        userId:'',
    })
    function setLoginStore(data: LoginData) {
        loginData.value = data
    }

    function logout() {
        loginData.value = {
            isNewUserFlag: false,
            refreshToken: '',
            token: '',
            userId: '',
        }
    }

    return { loginData, setLoginStore, logout }
},{
    persist: true
})
