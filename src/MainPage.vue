<template>
  <div>
    <MenuBar></MenuBar>

    <div id='main'>
      <div class='subTitle'>Members</div>
      <!--  -->
      <div id='search'>
        <el-input placeholder="Input name or id" v-model="searchContent" maxlength="25" size="large" @change='onSearchName' clearable="true" class="input-with-select">
          <el-button slot="append" icon="el-icon-search"></el-button>
        </el-input>
      </div>
      <!--  -->
      <button id='searchResult' v-if='bHasInit && searchType != 0' @click="onClickItem(0)">
        <div v-if="!bInReqSearch">
          <div v-if='searchNftData.bh==0'>Not found.</div>
          <NftItem v-if='searchNftData.bh>0' :nftData='searchNftData' :heart=200 />
        </div>
      </button>
      <div v-if='searchType==0' v-loading='bInReq' id='memberArea'>
        <button v-for="index of nftDataList.length" :key="index" class='member' @click="onClickItem(index)">
          <NftItem :nftData='nftDataList[index-1]' />
        </button>
      </div>
      <!--  -->
      <el-pagination
        v-if='searchType==0'
        id='pager'
        @current-change="onClickChangePage"
        :page-size="pageSize"
        layout="prev, pager, next"
        hide-on-single-page
        :current-page.sync='curPageIndex'
        :total="totalNftCount">
      </el-pagination>
      <!--  -->
      <div v-if='bHasInit&&myTokenId==0&&searchType==0&&totalNftCount<6400' id='mintDiv'>
        <a href='mine.html?act=mint' target="_blank">
          <el-button id='mintBtn' type="primary" round>Mint</el-button>
        </a>
      </div>

      <!-- bid dialog -->
      <el-dialog :center='true' title='Bid' :visible.sync="toBidVisible" width='400px'>
        <div><span style='display:inline-block;width:95px'>Price (STX):</span><el-input-number v-model="toBidPrice" :min='config.minPrice/1000000' :max='config.maxPrice/1000000' ></el-input-number></div>
        <div style='margin-top:10px'><span style='display:inline-block;width:95px'>Days:</span><el-input-number v-model="toBidDays" :min='config.minBidDays' :max='config.maxBidDays'></el-input-number></div>
        <div slot="footer" class="dialog-footer">
          <el-button @click='toBidVisible=false'>Cancel</el-button>
          <el-button type="primary" @click="onClickToBid">Bid</el-button>
        </div>
      </el-dialog>

      <!-- NFT detail dialog -->
      <el-dialog :title='dialogNftData.name+" (#"+dialogNftData.tid+")"' :center='true' :visible.sync="bDialogVisible" width='700px'> <!-- v-loading="bDialogLoading" -->
        <img id='img' :src='"https://ipfs.io/ipfs/"+(dialogNftData.cid && dialogNftData.cid.length>0 ? dialogNftData.cid : "QmeiJEqLynPN8c13ZQKdo8VMyK62whnn1DWQrEF6dZTzep")' />
        <div id='heart' v-if="dialogNftData.h && dialogNftData.h>0">
          <img src="./assets/heart.png" width="16" height="16" />
          <label id='h'>{{dialogNftData.h}}</label>
        </div>
        <el-descriptions id='descArea' title="" :column="1" border>
          <!-- <el-descriptions-item>
            <template slot="label">ID</template>
            #{{dialogNftData.tid}}
          </el-descriptions-item> -->
          <el-descriptions-item>
            <template slot="label">Minor name</template>
            {{dialogNftData.minorName.length > 0 ? dialogNftData.minorName : 'Not set'}}
          </el-descriptions-item>
          <el-descriptions-item>
            <template slot="label">Owner</template>
            <el-link :href="'https://explorer.stacks.co/address/'+dialogOwner+'?chain=mainnet'" target="_blank" style="padding:4px 0px;">{{dialogBNS.length>0 ? dialogBNS : dialogOwner}}</el-link>
            <i class="el-icon-loading" v-if='bDialogLoading || (! (dialogOwner in addr2bnsMap))'></i>
          </el-descriptions-item>
          <el-descriptions-item>
            <template slot="label">Bio</template>
            {{dialogNftData.bio}}
          </el-descriptions-item>
          <el-descriptions-item>
            <template slot="label">Register at</template>
            {{dialogRegisterStr}}
            <i class="el-icon-loading" v-if='bDialogLoading'></i>
          </el-descriptions-item>
          <el-descriptions-item>
            <template slot="label">Cid</template>
            {{dialogNftData.cid}}
          </el-descriptions-item>
        </el-descriptions>

        <el-table
          v-if='dialogBidList.length > 0'
          id='bidList'
          :data="dialogBidList"
          size="small"
          max-height="180">
          <el-table-column label="Bidder" width="122">
            <template slot-scope="scope">
              <el-link :href="'https://explorer.stacks.co/address/'+scope.row.player+'?chain=mainnet'" target="_blank" style="padding:4px 0px;">{{ wrapAddr(scope.row.player, true) }}</el-link>
            </template>
          </el-table-column>
          <el-table-column
            label="Price (STX)"
            width="110">
            <template slot-scope="scope">
              {{ scope.row.price / 1000000 }}
            </template>
          </el-table-column>
          <el-table-column
            label="Expiration">
            <template slot-scope="scope">
              {{ scope.row.expStr }}
            </template>
          </el-table-column>
        </el-table>

        <div slot="footer" class="dialog-footer">
          <el-button v-if="!bDialogIsSelf && bSignedIn && myNftData.tid!=0" type="primary" round @click="like">Like ({{likeCost/1000000}} STX)</el-button>
          <el-button v-if="!bDialogIsSelf && bSignedIn && myNftData.tid==0 && dialogNftPrice>0" type="primary" round @click="buyDialog">Buy ({{dialogNftPrice/1000000}} STX)</el-button>
          <el-button v-if="!bDialogIsSelf && bSignedIn && myNftData.tid==0" type="primary" round @click="bidDialog">Bid</el-button>
          <el-button type="info" round @click="bDialogVisible=false">Close</el-button>
        </div>
      </el-dialog>

      <!-- <el-button type="primary" round @click="test">Test</el-button> -->
    </div>
  </div>
</template>

<script>
import { authenticate, getAppDetails, userSession, getAddress, getNetwork, getContractInfo, loginIn } from './stacks/auth'
import { callReadOnlyFunction, makeContractNonFungiblePostCondition, createAssetInfo, contractPrincipalCV, FungibleConditionCode, NonFungibleConditionCode, makeStandardSTXPostCondition, makeStandardNonFungiblePostCondition, makeContractSTXPostCondition, noneCV, cvToValue, bufferCVFromString, tupleCV,  uintCV, trueCV, falseCV, someCV, listCV, standardPrincipalCV } from '@stacks/transactions'
import { openContractCall } from '@stacks/connect';
import { checkImgExists, getIpfsUrl, buffer2Str, getLocalTime, tipError } from './utils/utils'
import BigNumCC from 'bn.js';
import Vue from 'vue'
import MenuBar from './components/MenuBar'
import NftItem from './components/NftItem'

const { contractAddress, contractName, marketContractName, BNSContractAddress, BNSContractName, likeContractName }  = getContractInfo();
const senderAddress = contractAddress;
const network = getNetwork();

export default {
  name: 'MainPage',
  components: {
    MenuBar: MenuBar,
    NftItem: NftItem,
  },
  data () {
    return {
      bSignedIn: userSession.isUserSignedIn(),
      bHasInit: false,
      bInReq: false,
      searchType: 0,  // 0 no search，1 search by id，2 search by name
      searchContent: '',
      totalNftCount: 0,
      myBalance: 0,
      myDeposit: 0,
      mintPrice: 0,
      curPageIndex: 1,
      totalPageCount: 1,
      pageSize: 25,
      nftDataList: [],
      pageDataList: [],
      myTokenId: 0,
      myNftData: {
        tid: 0,
        name: '',
        minorName: '',
        cid: '',
        bio: '',
      },
      searchTokenId: 0,
      searchNftData: {
        tid: 0,
        name: '',
        minorName: '',
        cid: '',
        bio: '',
        bh: 0,
      },
      //
      bDialogVisible: false,
      bDialogLoading: false,
      bDialogIsSelf: false,
      dialogNftData: {
        name: '',
        minorName: '',
      },
      dialogNftPrice: 0,
      dialogBidList: [],
      dialogRegisterStr: '',
      dialogOwner: '',
      dialogBNS: '',
      likeCost: 500000,
      addr2bnsMap: {},
      tid2BriefMap: {},
      //
      toBidVisible: false,
      toBidPrice: 0,
      toBidDays: 0,
      config: {
        minPrice: 0,
        maxPrice: 0,
        minBidDays: 0,
        maxBidDays: 0,
      },
      //
      TipAlreadyHave: 'current account already own 1 laser eyes NFT',
      TipBalanceUnenough: 'Balance not enough',
    }
  },
  async mounted() {
    this.loadSummary()
    this.curPageIndex = 1
    this.loadPage()
    this.loadMarketSummary()
  },
  methods: {
    async loadSummary() {
      let paramPlayerOpt = null
      if (userSession.isUserSignedIn()) {
        const addr = getAddress()
        paramPlayerOpt = someCV(standardPrincipalCV(addr))
      } else {
        paramPlayerOpt = noneCV()
      }

      let paramNameOpt = noneCV()
      let paramTokenId = uintCV(0)
      this.searchTokenId = 0
      var url = window.location.href
      var paramName = url.split("id=")[1]
      if (paramName && paramName.length > 0) {
        paramName = decodeURIComponent(paramName)
        this.searchContent = paramName
        const tokenId = parseInt(paramName)
        if (tokenId > 0 && tokenId.toString().length == paramName.trim().length) {
          this.searchType = 1
          this.searchTokenId = tokenId
          paramTokenId = uintCV(tokenId)
        } else {
          this.searchType = 2
          paramNameOpt = someCV(bufferCVFromString(paramName.toLowerCase()))
        }
      } else {
        this.searchType = 0
      }

      const functionName = 'get_summary'
      const functionArgs = [paramPlayerOpt, paramNameOpt, paramTokenId]
      const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        network,
        senderAddress,
      };
      let loading = null
      if (this.searchType != 0) {
        loading = this.createLoading('searching')
      }
      const summaryRsp = await callReadOnlyFunction(options);
      if (loading) {
        loading.close()
      }
      let serverData = cvToValue(summaryRsp)
      this.totalNftCount = serverData.last_id.value
      this.mintPrice = serverData.mp.value
      this.myTokenId = serverData.ptid.value
      this.parseNftData(this.myNftData, serverData.pmeta)
      this.myNftData.tid = this.myTokenId
      if (this.searchType == 1) {
        this.parseNftData(this.searchNftData, serverData.tmeta)
        this.searchNftData.tid = this.searchTokenId
      } else if (this.searchType == 2) {
        this.parseNftData(this.searchNftData, serverData.nmeta)
        this.searchTokenId = serverData.ntid.value
        this.searchNftData.tid = this.searchTokenId
        // console.log('___loadSummary this.searchTokenId: ', this.searchTokenId)
      }
      //
      this.bHasInit = true
    },
    async loadMarketSummary() {
      if (!userSession.isUserSignedIn()) {
        return
      }
      const paramPlayer = standardPrincipalCV(getAddress())
      const functionName = 'get_brief_summary'
      const functionArgs = [paramPlayer]
      const options = {
        contractAddress,
        contractName: marketContractName,
        functionName,
        functionArgs,
        network,
        senderAddress,
      };
      const summaryRsp = await callReadOnlyFunction(options);
      let serverData = cvToValue(summaryRsp)
      this.myBalance = serverData.balance.value
      this.myDeposit = serverData.deposit.value
      this.config = {
        minPrice: serverData.config.value.min_price.value,
        maxPrice: serverData.config.value.max_price.value,
        minBidDays: serverData.config.value.min_bid_days.value,
        maxBidDays: serverData.config.value.max_bid_days.value,
      }
    },
    parseNftData(nativeNftData, serverNftData) {
      const sv = serverNftData ? (serverNftData.value ? serverNftData.value.value : null) : null
      nativeNftData.name = sv ? buffer2Str(sv.name) : ''
      nativeNftData.minorName = sv ? buffer2Str(sv.minor_name) : ''
      nativeNftData.cid = sv ? sv.cid.value : ''
      nativeNftData.bio = sv ? buffer2Str(sv.bio) : ''
      nativeNftData.bh = sv ? sv.ud.value % 1000000 : 0
      nativeNftData.h = sv ? Math.floor(sv.ud.value/1000000)%10000 : 0
    },
    async loadPage() {
      this.bInReq = true
      const functionName = 'get_members';
      let ll = listCV()
      ll.list = []
      for (let i = (this.curPageIndex-1)*this.pageSize+1; i <= this.curPageIndex*this.pageSize; i++) {
        ll.list.push(uintCV(i))
      }
      const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs: [ll],
        network,
        senderAddress,
      };
      const summaryRsp = await callReadOnlyFunction(options);
      this.bInReq = false
      let serverData = cvToValue(summaryRsp)
      // console.log('___serverData: ', serverData)
      let arr = []
      const startTid = (this.curPageIndex - 1) * this.pageSize + 1
      for (let index = 0; index < this.pageSize; index++) {
        const memberData = serverData[index]
        if (memberData.value) {
          const mv = memberData.value.value
          arr.push({
            tid: startTid + index,
            name: buffer2Str(mv.name),
            minorName: buffer2Str(mv.minor_name),
            cid: mv.cid.value,
            bio: buffer2Str(mv.bio),
            bh: mv.ud.value % 1000000,
            h: Math.floor(mv.ud.value / 1000000) % 10000,
          })
        }
      }
      // console.log('___arr: ', arr)
      //
      this.pageDataList = arr
      if (this.searchType == 0) {
        if (arr.length > 0) {
          this.nftDataList = this.pageDataList
          Vue.set(this.nftDataList, 0, this.nftDataList[0])
        } else {
          this.nftDataList.splice(0, this.nftDataList.length)
        }
      }
    },
    onClickChangePage() {
      this.loadPage()
    },
    async onSearchName() {
      let trimStr = this.searchContent.trim()
      if (this.searchType == 0) {
        if (trimStr.length <= 0) {
          var url = window.location.href
          var hostUrl = url.split("?")[0]
          window.history.replaceState({}, 0, hostUrl)
          return
        }
      } else {
        if (trimStr.length <= 0) {
          this.searchType = 0
          this.nftDataList = this.pageDataList
          if (this.nftDataList.length > 0) {
            Vue.set(this.nftDataList, 0, this.nftDataList[0])
          } else {
            this.nftDataList.splice(0, this.nftDataList.length)
          }
          var url = window.location.href
          var hostUrl = url.split("?")[0]
          window.history.replaceState({}, 0, hostUrl)
          return
        }
      }
      //
      let functionName = null
      let functionArgs = null
      this.searchTokenId = 0
      const tokenId = parseInt(trimStr)
      if (tokenId > 0 && tokenId.toString().length == trimStr.trim().length) {
        this.searchType = 1
        this.searchTokenId = tokenId
        functionName = 'get_member'
        functionArgs = [uintCV(tokenId)]
      } else {
        this.searchType = 2
        functionName = 'resolve_name'
        functionArgs = [bufferCVFromString(trimStr.toLowerCase())]
      }
      //
      const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        network,
        senderAddress,
      };
      this.bInReqSearch = true
      const loading = this.createLoading()
      const summaryRsp = await callReadOnlyFunction(options);
      loading.close()
      this.bInReqSearch = false
      this.$forceUpdate()
      if (this.searchType == 1) {
        let compData = null
        if (summaryRsp.type != 9) {
          compData = {
            value: cvToValue(summaryRsp)
          }
        }
        this.parseNftData(this.searchNftData, compData)
        this.searchNftData.tid = this.searchTokenId
      } else if (this.searchType == 2) {
        let serverData = cvToValue(summaryRsp)
        this.searchTokenId = serverData.tid.value
        // console.log('___onSearchName: this.searchTokenId: ', this.searchTokenId)
        this.parseNftData(this.searchNftData, serverData.meta)
        this.searchNftData.tid = this.searchTokenId
      } else {
        console.assert(false)
      }
      //
      var url = window.location.href
      var hostUrl = url.split("?")[0]
      window.history.replaceState({}, 0, hostUrl + '?id=' + encodeURIComponent(trimStr))
    },
    createLoading(tips) {
      return this.$loading({
        lock: true,
        text: tips,
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.05)'
      });
    },
    //
    async onClickItem(index) {
      this.bDialogVisible = true
      this.bDialogLoading = true
      this.dialogNftPrice = 0
      this.dialogOwner = ''
      this.dialogBNS = ''
      this.dialogRegisterStr = ''
      this.dialogBidList.splice(0, this.dialogBidList.length)
      if (this.searchType == 0) {
        this.dialogNftData = this.nftDataList[index-1]
      } else {
        this.dialogNftData = this.searchNftData
      }
      this.bDialogIsSelf = (this.dialogNftData.tid == this.myNftData.tid)
      //
      const functionName = 'get_token_brief'
      let srvData = null
      if (this.dialogNftData.tid in this.tid2BriefMap) {
        const cacheData = this.tid2BriefMap[this.dialogNftData.tid]
        if (Date.parse(new Date()) - cacheData.ts <= 300000) {
          srvData = cacheData.srvData
        }
      }
      if (srvData == null) {
        const queryTid = this.dialogNftData.tid
        const functionArgs = [uintCV(queryTid)]
        const options = {
          contractAddress,
          contractName: marketContractName,
          functionName,
          functionArgs,
          network,
          senderAddress,
        };
        const summaryRsp = await callReadOnlyFunction(options);
        srvData = summaryRsp.data
        this.tid2BriefMap[queryTid] = {
          ts: Date.parse(new Date()),
          srvData: srvData,
        }
        if (queryTid != this.dialogNftData.tid) {
          return
        }
      }

      this.bDialogLoading = false
      this.dialogNftPrice = srvData.list_info.type == 9 ? 0 : cvToValue(srvData.list_info.value.data.price)
      this.dialogRegisterStr = srvData.time.type==9 ? '' : getLocalTime(cvToValue(srvData.time).value)
      this.dialogOwner = srvData.player.type == 9 ? '' : cvToValue(srvData.player).value
      if (this.dialogOwner.length > 0) {
        if (this.dialogOwner in this.addr2bnsMap) {
          this.dialogBNS = this.addr2bnsMap[this.dialogOwner]
        } else {
          this.resolvePlayer(this.dialogNftData.tid, this.dialogOwner)
        }
      }
      const curBh = cvToValue(srvData.bh)
      // this.dialogBidList.splice(0, this.dialogBidList.length)
      const svrBidList = cvToValue(srvData.bid_list)
      let resultBidList = []
      for (let svrBid of svrBidList) {
        let record = {
          player: svrBid.value.player.value,
          price: svrBid.value.price.value,
          expiration: svrBid.value.expiration.value,
        }
        if (record.expiration <= curBh) {
          record.expStr = 'expired'
        } else {
          record.expStr = this.formatBlocksTime(record.expiration - curBh) + ' remaining'
        }
        resultBidList.push(record)
      }
      this.dialogBidList = resultBidList
      if (this.dialogBidList.length > 0) {
        Vue.set(this.dialogBidList, 0, this.dialogBidList[0])
      }
    },
    async resolvePlayer(tid, addr) {
      const functionName = 'resolve-principal'
      const functionArgs = [standardPrincipalCV(addr)]
      const options = {
        contractAddress: BNSContractAddress,
        contractName: BNSContractName,
        functionName,
        functionArgs,
        network,
        senderAddress,
      };
      const summaryRsp = await callReadOnlyFunction(options);
      const svrData = cvToValue(summaryRsp)
      if (svrData.type.includes('none')) {
        Vue.set(this.addr2bnsMap, addr, '')
      } else {
        const fullName = buffer2Str(svrData.value.name)+'.'+buffer2Str(svrData.value.namespace)
        this.addr2bnsMap[addr] = fullName
        if (tid == this.dialogNftData.tid && this.dialogOwner == addr) {
          this.dialogBNS = fullName
        }
      }
    },
    wrapAddr(address, bAbbr) {
      if (!address) { return '--' }
      let addr2 = bAbbr ? (address.substr(0, 3) + '..' + address.substr(address.length-3, 3)) : address
      if (userSession.isUserSignedIn() && address == getAddress()) {
        return addr2 + ' (me)'
      }
      return addr2
    },
    formatBlocksTime(blocks) {
      let remainTimeDesc = ''
      if (blocks <= 0) {
        return 'expired'
      } else if (blocks < 6) {
        remainTimeDesc = (blocks * 10) + ' minutes'
      } else if (blocks < 144) {
        let hours = Math.floor(blocks/6)
        remainTimeDesc = hours + ' hour' + (hours > 1 ? 's' : '')
      } else {
        const days = Math.floor(blocks/144)
        remainTimeDesc = days + ' day' + (days > 1 ? 's' : '')
      }
      return remainTimeDesc
    },
    buyDialog() {
      if (!this.bSignedIn) {
        loginIn()
        return
      }
      if (this.myNftData.tid != 0) {
        tipError(this, this.TipAlreadyHave)
        return
      }
      if (this.dialogNftPrice > this.myBalance + 10000) {
        tipError(this, this.TipBalanceUnenough)
        return
      }

      let playerAddr = getAddress()
      const standardSTXPostCondition = makeStandardSTXPostCondition(
        playerAddr,
        FungibleConditionCode.LessEqual,
        new BigNumCC(this.dialogNftPrice),
      );
      const assetName = 'LaserEyes';
      const tokenAssetName = uintCV(this.dialogNftData.tid);
      const nonFungibleAssetInfo = createAssetInfo(contractAddress, contractName, assetName);
      const contractNonFungiblePostCondition = makeContractNonFungiblePostCondition(
        contractAddress,
        marketContractName,
        NonFungibleConditionCode.DoesNotOwn,
        nonFungibleAssetInfo,
        tokenAssetName
      );

      let outThis = this
      const options = {
        contractAddress,
        contractName: marketContractName,
        functionName: 'buy',
        functionArgs: [uintCV(this.dialogNftData.tid)],
        network,
        appDetails: getAppDetails(),
        postConditions: [standardSTXPostCondition, contractNonFungiblePostCondition],
        onFinish: data => {
          outThis.doNotify('Buy')
        },
      };
      openContractCall(options)
    },
    bidDialog() {
      if (!this.bSignedIn) {
        loginIn()
        return
      }
      if (this.myNftData.tid != 0) {
        tipError(this, this.TipAlreadyHave)
        return
      }
      this.toBidPrice = 100;// this.mintPrice / 1000000
      this.toBidDays = this.config.maxBidDays
      this.toBidVisible = true
    },
    onClickToBid() {
      let toBidPrice = Math.floor(this.toBidPrice * 100)  * 10000;
      let toBidDays = this.toBidDays
      if (toBidPrice < this.config.minPrice || toBidPrice > this.config.maxPrice) {
        tipError(this, 'price not right')
        return
      }
      if (toBidDays < this.config.minBidDays || toBidDays > this.config.maxBidDays) {
        tipError(this, 'days not right')
        return
      }
      if (toBidPrice >= this.myBalance + this.myDeposit) {
        tipError(this, this.TipBalanceUnenough)
        return
      }
      const functionArgs = [
        uintCV(this.dialogNftData.tid),
        uintCV(toBidPrice),
        uintCV(toBidDays),
      ]

      let playerAddr = getAddress()
      const standardSTXPostCondition = makeStandardSTXPostCondition(
        playerAddr,
        FungibleConditionCode.LessEqual,
        new BigNumCC(toBidPrice),
      );

      let outThis = this
      const options = {
        contractAddress,
        contractName: marketContractName,
        functionName: 'bid',
        functionArgs,
        network,
        appDetails: getAppDetails(),
        postConditions: [standardSTXPostCondition],
        onFinish: data => {
          outThis.toBidVisible = false
          outThis.doNotify('Bid')
        },
      };
      openContractCall(options)
    },
    tipError(msg) {
      this.$message({message: msg, type: 'error'});
    },
    doNotify(title) {
      this.$notify({
        title: title,
        message: 'Transaction has been sent, wait a while to be finished.',
        duration: 8000,
      });
    },
    async like() {
      if (!this.bSignedIn || this.myNftData.tid == 0) {
        return
      }
      let loading = this.createLoading('loading')
      {
        const functionName = 'has_like'
        const functionArgs = [uintCV(this.myNftData.tid), uintCV(this.dialogNftData.tid)]
        const options = {
          contractAddress,
          contractName: likeContractName,
          functionName,
          functionArgs,
          network,
          senderAddress,
        };
        const summaryRsp = await callReadOnlyFunction(options);
        if (loading) {
          loading.close()
        }
        const svrData = cvToValue(summaryRsp)
        // console.log('___svrData: ', svrData)
        if (svrData) {
          tipError(this, 'Already liked')
          return
        }
      }
      //
      if (this.myBalance <= this.likeCost) {
        tipError(this, this.TipBalanceUnenough)
        return
      }
      //
      {

        let playerAddr = getAddress()
        const standardSTXPostCondition = makeStandardSTXPostCondition(
          playerAddr,
          FungibleConditionCode.LessEqual,
          new BigNumCC(this.likeCost),
        );

        let outThis = this
        const options = {
          contractAddress,
          contractName: likeContractName,
          functionName: 'like',
          functionArgs: [uintCV(this.dialogNftData.tid)],
          network,
          appDetails: getAppDetails(),
          postConditions: [standardSTXPostCondition],
          onFinish: data => {
            outThis.doNotify('Like')
          },
        };
        openContractCall(options)
      }
    },
    // test
    async test() {

    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

#img {
  width: 80px;
  height: 80px;
  border-radius: 40px;
  display: block;
  margin: -20px auto 0 auto;
}
#heart {
  margin-top: 8px;
  text-align: center;
}
#h {
  vertical-align: top;
  margin-left: -2px;
}
#descArea {
  padding-top: 16px;
  width: 650px;
  margin: auto;
}
.dialog-footer {
  margin-top: -20px;
}
#bidList {
  margin-top: 16px;
}

#main {
  margin: 92px 168px 32px 168px;
  text-align: center;
  min-height: 600px;
}

.subTitle {
  font-size: 32px;
  font-weight: bold;
}

#search {
  width: 500px;
  margin: 16px auto;
}

#memberArea {
  /* margin: auto; */
  margin-top: 32px;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, 168px);
  grid-gap: 32px;
  justify-content: center;
  min-height: 100px;
}

.member {
  display: inline-block;
  /* margin: 16px; */
  padding: 0;
  border: none;
  background: white;
}

#pager {
  margin-top: 32px;
  text-align: center;
}

#mintDiv {
  margin-top: 32px;
}
#mintBtn {
  font-size: 20px;
}
#notfound {
  margin: auto;
  text-align: center;
}
#searchResult {
  margin: 32px auto auto auto;
  width: 168px;
  border: none;
  background: white;
}

</style>
