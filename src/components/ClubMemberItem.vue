<template>
  <div>
    <div id='nft'>
      <div id='tid'>#{{nftData.tid == 0 ? 'id' : nftData.tid}}</div>
      <el-tooltip effect="dark" :content="nftData.bio" placement="top">
        <img id='img' :src='"https://ipfs.io/ipfs/"+(nftData.cid.length>0 ? nftData.cid : "QmeiJEqLynPN8c13ZQKdo8VMyK62whnn1DWQrEF6dZTzep")' />
      </el-tooltip>
      <span class='heart' v-if="nftData['h'] && nftData['h']>=5">
        <img src="../assets/heart.png" width="16" height="16" />
        <label class='h'>{{nftData['h']}}</label>
      </span>
      <el-tooltip effect="dark" content="Administrator" placement="top" v-if='bAdmin'>
        <i class="el-icon-s-custom admin"></i>
      </el-tooltip>
      <div class='name'>{{nftData.name}}</div>
      <div class='actbtns' v-if='act'>
        <el-button v-if='act==1' type="success" round size='mini' @click.stop='h(true, $event)'>Accept</el-button>
        <el-button v-if='act==1 || act==2' type="warning" round size='mini' @click.stop="h(false, $event)">{{act==1 ? "Decline" : "Cancel"}}</el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ClubMemberItem',
  props: ['nftData', 'act', 'bAdmin'],
  methods: {
    h(v, e) {
      this.$emit('click', v)
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#nft {
  border: 1px solid #ccc;
  border-radius: 8px;
  width: 168px;
  line-height: 18px;
  text-align: center;
  position: relative;
}
#img {
  width: 168px;
  height: 168px;
  border-radius: 84px;
}
#tid {
  font-size: 14px;
  color: #999;
  margin: 4px auto;
}
.name {
  font-size: 16px;
  margin: 4px auto;
}
.heart {
  position: absolute;
  top: 5px;
  left: 5px;
}
.h {
  vertical-align: top;
  margin-left: -2px;
}
.admin {
  position: absolute;
  right: 8px;
  top: 8px;
}
.actbtns {
  margin-bottom: 6px;
}

</style>
