import Vue from 'vue'
import AboutPage from './AboutPage'
// import ElementUI from 'element-ui' //
// import '../node_modules/element-ui/lib/theme-chalk/index.css'

Vue.config.productionTip = false
// Vue.use(ElementUI)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { AboutPage },
  template: '<AboutPage/>'
})
