import Vue from 'vue'
import ClubPage from './ClubPage'
// import ElementUI from 'element-ui'
// import '../node_modules/element-ui/lib/theme-chalk/index.css'
import InfiniteLoading from 'vue-infinite-loading';

Vue.config.productionTip = false
// Vue.use(ElementUI)

Vue.use(InfiniteLoading, { /*  */ });

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { ClubPage },
  template: '<ClubPage/>'
})
