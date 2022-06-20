require('dotenv').config();

class Wallet {
    constructor(address) {
        this.address = address
    }
    getApi() {
        return `https://api.bscscan.com/api?module=account&action=tokentx&address=${this.address}&page=1&offset=1&startblock=0&endblock=999999999&sort=desc&apikey=${Wallet.getAPIKey()}`
    }
    static getAPIKey() {
        return process.env.apiKey
    }
}

module.exports = Wallet;