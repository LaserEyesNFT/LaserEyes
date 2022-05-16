<template>
  <div>
    <div id='nft'>
      <div id='tid'>#{{nftData.tid == 0 ? 'id' : nftData.tid}}</div>
      <el-tooltip effect="dark" :content="nftData.bio" placement="top">
        <img id='img' :src='"https://ipfs.io/ipfs/"+(nftData.cid.length>0 ? nftData.cid : "QmeiJEqLynPN8c13ZQKdo8VMyK62whnn1DWQrEF6dZTzep")' />
      </el-tooltip>
      <span id='heart' v-if="nftData['h'] && nftData['h']>=5">
        <img src="../assets/heart.png" width="16" height="16" />
        <label id='h'>{{nftData['h']}}</label>
      </span>
      <div id='name'>{{nftData.name}}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NftItem',
  props: ['nftData'],
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#nft {
  border: 1px solid #ccc;
  border-radius: 8px;
  width: 168px;
  height: 224px;
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
#name {
  font-size: 16px;
  margin-top: 4px;
}
#heart {
  position: absolute;
  top: 5px;
  left: 5px;
}
#h {
  vertical-align: top;
  margin-left: -2px;
}

</style>
