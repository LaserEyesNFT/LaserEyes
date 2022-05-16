import Vue from 'vue'
import MinePage from './MinePage'
// import ElementUI from 'element-ui'
// import '../node_modules/element-ui/lib/theme-chalk/index.css'

Vue.config.productionTip = false
// Vue.use(ElementUI)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { MinePage },
  template: '<MinePage/>'
})
