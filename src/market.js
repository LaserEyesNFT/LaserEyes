import Vue from 'vue'
import MarketPage from './MarketPage'
// import ElementUI from 'element-ui'
// import '../node_modules/element-ui/lib/theme-chalk/index.css'

Vue.config.productionTip = false
// Vue.use(ElementUI)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { MarketPage },
  template: '<MarketPage/>'
})
