<template>
  <div>
    <MenuBar menu='market'></MenuBar>

    <div id='main'>
      <div class='subTitle'>Marketplace</div>
      <div id="maincontent" v-loading='loadSummaryFlag==1'>
        <!-- search -->
        <div v-if="loadSummaryFlag==2" id='search'>
          <el-input placeholder="Input name or id" v-model="searchContent" maxlength="25" size="large" @change='onSearchName' clearable="true" class="input-with-select">
            <el-button slot="append" icon="el-icon-search"></el-button>
          </el-input>
        </div>
        <!-- tabs -->
        <el-tabs v-if="loadSummaryFlag==2" id='tabs' v-model="curTab" @tab-click="onClickTab">
          <el-tab-pane label="Recently list" name="list"></el-tab-pane>
          <el-tab-pane label="Recently sold" name="trade"></el-tab-pane>
          <el-tab-pane v-if='bSignedIn' label="Mine" name="mine"></el-tab-pane>
        </el-tabs>
        <!-- recent list -->
        <!-- v-if='loadSummaryFlag==2 && curTab=="list"' -->
        <div :style='{"display": (loadSummaryFlag==2 && curTab=="list") ? "block" : "none" }' v-infinite-scroll="loadRecentlyList" class='memberArea' style="overflow:auto">
          <button v-for="index of statListNftDataList.length" :key="index" class='member' @click="onClickListItem(index)">
            <MarketItem :nftData='statListNftDataList[index-1]' />
          </button>
        </div>
        <p v-if='loadSummaryFlag==2 && bLoadingStatList && curTab=="list"'>loading...</p>
        <p v-if='loadSummaryFlag==2 && bReachStatListEnd && curTab=="list"'>{{statListNftDataList.length>200 ? "The End" : (statListNftDataList.length==0 ? 'Empty' : '') }}</p>
        <!-- recent trade -->
        <!-- v-if='loadSummaryFlag==2 && curTab=="trade"' -->
        <div :style='{"display": (loadSummaryFlag==2 && curTab=="trade") ? "block" : "none" }' v-infinite-scroll="loadRecentlyTrade" class='memberArea' style="overflow:auto">
          <button v-for="index of statTradeNftDataList.length" :key="index" class='member' @click="onClickTradeItem(index)">
            <MarketItem :nftData='statTradeNftDataList[index-1]' bsold=true />
          </button>
        </div>
        <p v-if='loadSummaryFlag==2 && bLoadingStatTrade && curTab=="trade"'>loading...</p>
        <p v-if='loadSummaryFlag==2 && bReachStatTradeEnd && curTab=="trade"'>{{statTradeNftDataList.length>200 ? "The End" : (statTradeNftDataList.length==0 ? 'Empty' : '') }}</p>
        <!-- mine -->
        <div v-if='curTab=="mine"' v-loading='bLoadingMineBrief||bLoadingMineBids' id='mineArea'>
          <NftItem class="myNftItem" v-if='myNftData.name.length>0 && myNftPrice==0' :nftData='myNftData' />
          <MarketItem class="myNftItem" v-if='myNftData.name.length>0 && myNftPrice>0' :nftData='myNftData' />
          <div v-if='myTid==0&&myDeposit==0' id='mintDiv'>
            <div>Not has laser eyes nft yet.</div>
            <a href='mine.html?act=mint' target="_blank">
              <el-button id='mintBtn' type="primary" round>Mint</el-button>
            </a>
          </div>

          <div id='myActBtns'>
            <el-button v-if='myNftData.name.length>0 && myNftPrice==0' class='actBtn' type="primary" round @click="onClickMineList">List</el-button>
            <el-button v-if='myNftData.name.length>0 && myNftPrice>0' class='actBtn' type="primary" round @click="onClickMineUpdatePrice">Update price</el-button>
            <el-button v-if='myNftData.name.length>0 && myNftPrice>0' class='actBtn' type="info" round @click="onClickMineCancelList">Cancel list</el-button>
          </div>

          <el-card v-if='myTid>0 && myNftData.name.length>0' class="cardArea" :body-style="{padding:'1px 12px'}">
            <div slot="header"><div>Bidders: {{ myBidderList.length }}</div></div>
            <el-table
              v-if='myBidderList.length > 0'
              id='myBidderList'
              size='small'
              :data="myBidderList">
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
                label="Expiration"
                width="180">
                <template slot-scope="scope">
                  {{ scope.row.expStr }}
                </template>
              </el-table-column>
              <el-table-column
                label="Action">
                <template slot-scope="scope">
                  <el-button type="primary" plain size="mini" @click="onClickMineAccept(scope.$index, scope.row)">Accept</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <el-card v-if='myTid==0 || (myDeposit>0 && myBidList.length>0)' class="cardArea" :body-style="{padding:'1px 12px'}">
            <div slot="header">
              <div>My bids: {{ myBidList.length }}</div>
              <div id='bidDeposit'>Bid deposit: {{ myDeposit>0 ? (myDeposit/1000000 + " STX") : '0' }}  <el-button v-if='myDeposit>0' id='withdraw' type="info" plain size="mini" @click="onClickWithdraw()">Withdraw</el-button>  </div>
            </div>
            <el-table
              :data="myBidList"
              size='small'>
              <el-table-column label="Name" width="140">
                <template slot-scope="scope">
                  <el-button type="text" class="clickableCellContent" @click='startViewTid(scope.row.tid)'>{{ '#' + scope.row.tid  }}</el-button>
                </template>
              </el-table-column>
              <el-table-column
                label="Price (STX)"
                width="100">
                <template slot-scope="scope">
                  {{ scope.row.price / 1000000 }}
                </template>
              </el-table-column>
              <el-table-column
                label="Expiration"
                width="120">
                <template slot-scope="scope">
                  {{ scope.row.expStr }}
                </template>
              </el-table-column>
              <el-table-column
                label="Action">
                <template slot-scope="scope">
                  <el-button type="info" plain size="mini" @click="onClickCancelBid(scope.$index, scope.row)">Cancel</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
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
      <el-dialog :title='dialogNftData.name+" (#"+dialogNftData.tid+")"' :center='true' :visible.sync="bDialogVisible" width='700px' v-loading="bDialogLoading">
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
          </el-descriptions-item>
          <el-descriptions-item>
            <template slot="label">Bio</template>
            {{dialogNftData.bio}}
          </el-descriptions-item>
          <el-descriptions-item>
            <template slot="label">Register at</template>
            {{dialogRegisterStr}}
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
          max-height="240">
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
            label="Expiration"
            :width='bDialogIsSelf ? 140 : 330'>
            <template slot-scope="scope">
              {{ scope.row.expStr }}
            </template>
          </el-table-column>
          <el-table-column
            v-if='bDialogIsSelf'
            label="Action">
            <template slot-scope="scope">
              <el-button type="primary" plain size="mini" @click="onClickAcceptDialog(scope.$index, scope.row)">Accept</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div slot="footer" class="dialog-footer">
          <el-button v-if="!bDialogIsSelf && !bDialogForceHideBidBuy && dialogNftPrice>0" type="primary" round @click="buyDialog">Buy ({{dialogNftPrice/1000000}} STX)</el-button>
          <el-button v-if="!bDialogIsSelf && !bDialogForceHideBidBuy" type="primary" round @click="bidDialog">Bid</el-button>
          <el-button type="info" round @click="bDialogVisible=false">Close</el-button>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import { authenticate, getAppDetails, userSession, getAddress, getNetwork, getContractInfo, loginIn } from './stacks/auth'
import { callReadOnlyFunction, makeContractNonFungiblePostCondition, createAssetInfo, contractPrincipalCV, FungibleConditionCode, NonFungibleConditionCode, makeStandardSTXPostCondition, makeStandardNonFungiblePostCondition, makeContractSTXPostCondition, noneCV, cvToValue, bufferCVFromString, tupleCV,  uintCV, trueCV, falseCV, someCV, listCV, standardPrincipalCV } from '@stacks/transactions'
import { openContractCall } from '@stacks/connect';
import { checkImgExists, getIpfsUrl, buffer2Str, getLocalTime, tipError, tipInfo } from './utils/utils'
import BigNumCC from 'bn.js';
import Vue from 'vue'
import MenuBar from './components/MenuBar'
import NftItem from './components/NftItem'
import MarketItem from './components/MarketItem'

const { contractAddress, contractName, marketContractName, BNSContractAddress, BNSContractName }  = getContractInfo();
const senderAddress = contractAddress;
const network = getNetwork();

export default {
  name: 'MarketPage',
  components: {
    MenuBar: MenuBar,
    NftItem: NftItem,
    MarketItem: MarketItem,
  },
  data () {
    return {
      bSignedIn: userSession.isUserSignedIn(),
      //
      myBalance: 0,
      myDeposit: 0,
      myTid: 0,
      curBh: 0,
      config: {
        fee: 0,
        minPrice: 0,
        maxPrice: 0,
        minBidDays: 0,
        maxBidDays: 0,
      },
      // stat list
      pivot1: BigInt(1000000000000),
      pivot2: BigInt(1000000000000000000000000),
      bLoadingStatList: false,
      bReachStatListIndexEnd: false,
      bReachStatListEnd: false,
      initialStatListIndex: 0,
      curStatListIndex: 0,
      statListTidNote: {},
      statListPendingTidList: [],
      statListNftDataList: [],
      statListPriceMap: {},
      //
      bLoadingStatTrade: false,
      bReachStatTradeIndexEnd: false,
      bReachStatTradeEnd: false,
      initialStatTradeIndex: 0,
      curStatTradeIndex: 0,
      statTradeTidNote: {},
      statTradePendingTidList: [],
      statTradeNftDataList: [],
      statTradePriceMap: {},
      //
      curTab: 'list',
      loadSummaryFlag: 0,
      recentTrades: [],
      //
      bDialogVisible: false,
      bDialogLoading: false,
      bDialogIsSelf: false,
      bDialogForceHideBidBuy: false,
      dialogNftData: {
        name: '',
        minorName: '',
      },
      dialogNftPrice: 0,
      dialogBidList: [],
      dialogRegisterStr: '',
      dialogOwner: '',
      dialogBNS: '',
      addr2bnsMap: {},
      //
      toBidVisible: false,
      toBidPrice: 0,
      toBidDays: 0,
      //
      searchContent: '',
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
      bHasQueryMine: false,
      bLoadingMineBrief: false,
      bLoadingMineBids: false,
      myBidList: [],
      myBidderList: [],
      myNftPrice: 0,
      myNftData: {
        name: '',
        minorName: '',
        price: 0,
      },
      //
      TipAlreadyHave: 'current account already own 1 laser eyes NFT',
      TipBalanceUnenough: 'Balance not enough',
    }
  },
  async mounted() {
    this.loadSummary()
  },
  methods: {
    async loadSummary() {
      let paramPlayerOpt = this.bSignedIn ? someCV(standardPrincipalCV(getAddress())) : noneCV()
      const functionName = 'get_summary'
      const functionArgs = [paramPlayerOpt]
      const options = {
        contractAddress,
        contractName: marketContractName,
        functionName,
        functionArgs,
        network,
        senderAddress,
      };
      this.loadSummaryFlag = 1
      const summaryRsp = await callReadOnlyFunction(options);
      let serverData = cvToValue(summaryRsp)
      this.myBalance = serverData.balance.value
      this.curBh = serverData.bh.value
      const svrConfigV = serverData.config.value
      this.config = {
        fee : svrConfigV.fee.value,
        minPrice: svrConfigV.min_price.value,
        maxPrice: svrConfigV.max_price.value,
        minBidDays: svrConfigV.min_bid_days.value,
        maxBidDays: svrConfigV.max_bid_days.value,
      }
      // console.log('___this.config: ', this.config)
      this.myDeposit = serverData.deposit.value
      this.curStatListIndex = this.initialStatListIndex = serverData.stat_index.value
      this.myTid = serverData.tid.value
      this.curStatTradeIndex = this.initialStatTradeIndex = serverData.trade_index.value
      //
      this.loadRecentlyList()
    },
    onClickTab(tab, event) {
      if (this.curTab == 'trade') {
        if (!this.bLoadingStatTrade && this.statTradeNftDataList.length == 0) {
          this.loadRecentlyTrade()
        }
      } else if (this.curTab == 'mine') {
        if (!this.bHasQueryMine) {
          this.bHasQueryMine = true
          if (this.myTid > 0) {
            this.loadMineBrief()
          }
          if (this.myTid == 0 || this.myDeposit > 0) {
            this.loadMineBidData()
          }
        }
      }
    },
    async loadMineBrief() {
      const functionName = 'get_brief_mine'
      const functionArgs = [
        standardPrincipalCV(getAddress())
      ]
      const options = {
        contractAddress,
        contractName: marketContractName,
        functionName,
        functionArgs,
        network,
        senderAddress,
      };
      this.bLoadingMineBrief = true
      const summaryRsp = await callReadOnlyFunction(options);
      this.bLoadingMineBrief = false
      // console.log('___summaryRsp: ', summaryRsp)
      this.curBh = cvToValue(summaryRsp.data.bh)
      this.myBidderList.splice(0, this.myBidderList.length)
      this.myBidderList = this.parseBidderListData(summaryRsp.data.bid_list)
      if (this.myBidderList.length > 0) {
        Vue.set(this.myBidderList, 0, this.myBidderList[0])
      }
      this.myNftPrice = cvToValue(summaryRsp.data.list_price)
      let compData = null
      if (summaryRsp.data.meta.type != 9) {
        compData = {
          value: cvToValue(summaryRsp.data.meta)
        }
      }
      this.parseNftData(this.myNftData, compData)
      this.myNftData.tid = this.myTid
      this.myNftData.price = this.myNftPrice
    },
    async loadMineBidData() {
      const functionName = 'get_player_bid_data'
      const functionArgs = [
        standardPrincipalCV(getAddress())
      ]
      const options = {
        contractAddress,
        contractName: marketContractName,
        functionName,
        functionArgs,
        network,
        senderAddress,
      };
      const summaryRsp = await callReadOnlyFunction(options);
      this.myDeposit = cvToValue(summaryRsp.data.deposit)
      const svrBidList = cvToValue(summaryRsp.data.bids.data.r)
      this.myBidList.splice(0, this.myBidList.length)
      for (let sv of svrBidList) {
        let record = {
          tid: sv.value.tid.value,
          price: sv.value.price.value,
          at: sv.value.at.value,
          expiration: sv.value.expiration.value,
        }
        if (record.expiration <= this.curBh) {
          record.expStr = 'expired'
        } else {
          record.expStr = this.formatBlocksTime(record.expiration - this.curBh) + ' remaining'
        }
        this.myBidList.push(record)
      }
      if (this.myBidList.length > 0) {
        this.myBidList.sort(function(a, b) {
          return b.at - a.at
        })
        Vue.set(this.myBidList, 0, this.myBidList[0])
      }
    },
    async loadRecentlyList() {
      if (this.bReachStatListEnd || this.bLoadingStatList || this.curTab != 'list') {
        return
      }

      let outThis = this
      outThis.bLoadingStatList = true

      /// pending中的不够了，需要先加载tid到pending中
      if (this.statListPendingTidList.length < 10 && !this.bReachStatListIndexEnd) {
        let indexList = []
        for (let i = 0; i < 25; i++) {
          let targetIndex = this.safe1000(this.curStatListIndex--)
          if (this.safe1000(this.curStatListIndex) != this.initialStatListIndex) {
            indexList.push(targetIndex)
          } else {
            this.bReachStatListIndexEnd = true
            break
          }
        }

        // console.log('___indexList: ', indexList)
        if (indexList.length > 0) {
          let ll = listCV()
          ll.list = []
          for (let index of indexList) {
            ll.list.push(uintCV(index))
          }

          const functionName = 'get_stat_lists'
          const functionArgs = [ll]
          const options = {
            contractAddress,
            contractName: marketContractName,
            functionName,
            functionArgs,
            network,
            senderAddress,
          };
          const summaryRsp = await callReadOnlyFunction(options);
          // let serverData = cvToValue(summaryRsp)
          // console.log('___summaryRsp: ', summaryRsp)
          for (let sv of summaryRsp.list) {
            if (sv.type == 10) {
              const initStr = sv.value.value.toString(10)
              // console.log('___initStr: ', initStr)
              let v = BigInt(initStr)
              if (v > this.pivot2) {
                const t =  Math.floor(Number(v / this.pivot2))
                v = BigInt(initStr.substr(t.toString().length))
                const tid = t % 10000
                if (!(tid in this.statListTidNote)) {
                  const price = Math.floor(t / 10000) * 10000
                  this.statListTidNote[tid] = true
                  this.statListPriceMap[tid] = price
                  if (price > 0) {
                    this.statListPendingTidList.push(tid)
                  }
                }
              }
              if (v > this.pivot1) {
                const initStr2 = v.toString()
                const t = Math.floor(Number(v / this.pivot1))
                v = BigInt(initStr2.substring(t.toString().length))
                const tid = t % 10000
                if (!(tid in this.statListTidNote)) {
                  const price = Math.floor(t / 10000) * 10000
                  this.statListTidNote[tid] = true
                  this.statListPriceMap[tid] = price
                  if (price > 0) {
                    this.statListPendingTidList.push(tid)
                  }
                }
              }
              if (v > 0) {
                const t = Number(v)
                const tid = t % 10000
                if (!(tid in this.statListTidNote)) {
                  const price = Math.floor(t / 10000) * 10000
                  this.statListTidNote[tid] = true
                  this.statListPriceMap[tid] = price
                  if (price > 0) {
                    this.statListPendingTidList.push(tid)
                  }
                }
              }
            } else {
              this.bReachStatListIndexEnd = true
              break
            }
          }
        }
      }

      //
      if (this.statListPendingTidList.length == 0) {
        // console.log('___list statListPendingTidList.length==0')
        if (!this.bReachStatListIndexEnd) {
          // console.log('___not real end, continue ask below')
          this.loadRecentlyList()
        } else {
          // console.log('___real end')
          this.bLoadingStatList = false
          this.bReachStatListEnd = true
          this.loadSummaryFlag = 2
        }
        return
      }

      const tidList = this.statListPendingTidList.splice(0, Math.min(this.statListPendingTidList.length, 25))
      // console.log('___tidList: ', tidList)
      let ll = listCV()
      ll.list = []
      for (let tid of tidList) {
        ll.list.push(uintCV(tid))
      }

      const originNFTCount = this.statListNftDataList.length
      const functionName = 'get_members'
      const functionArgs = [ll]
      const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        network,
        senderAddress,
      };
      const summaryRsp = await callReadOnlyFunction(options);
      let serverData = cvToValue(summaryRsp)
      for (let i = 0; i < serverData.length; i++) {
        const sv = serverData[i]
        if (sv.value) {
          const vv = sv.value.value
          const tid = tidList[i]
          this.statListNftDataList.push({
            tid: tid,
            name: buffer2Str(vv.name),
            minorName: buffer2Str(vv.minor_name),
            cid: vv.cid.value,
            bio: buffer2Str(vv.bio),
            price: tid ? this.statListPriceMap[tid] : 0,
            h: Math.floor(vv.ud.value/1000000)%10000,
          })
        }
      }

      //
      this.loadSummaryFlag = 2
      if (this.bReachStatListIndexEnd && this.statListPendingTidList.length == 0) {
        // console.log('___real end after query')
        this.bLoadingStatList = false
        this.bReachStatListEnd = true
      } else if (this.statListNftDataList.length - originNFTCount < 14) {
        // console.log('___after query, add too little')
        this.loadRecentlyList()
      } else {
        this.bLoadingStatList = false
        // console.log('___after query, add many')
      }
    },
    async loadRecentlyTrade() {
      if (this.bReachStatTradeEnd || this.bLoadingStatTrade || this.curTab != 'trade') {
        return
      }

      let outThis = this
      outThis.bLoadingStatTrade = true

      /// pending中的不够了，需要先加载tid到pending中
      if (this.statTradePendingTidList.length < 10 && !this.bReachStatTradeIndexEnd) {
        let indexList = []
        for (let i = 0; i < 25; i++) {
          let targetIndex = this.safe1000(this.curStatTradeIndex--)
          if (this.safe1000(this.curStatTradeIndex) != this.initialStatTradeIndex) {
            indexList.push(targetIndex)
          } else {
            this.bReachStatTradeIndexEnd = true
            break
          }
        }

        // console.log('___indexList: ', indexList)
        if (indexList.length > 0) {
          let ll = listCV()
          ll.list = []
          for (let index of indexList) {
            ll.list.push(uintCV(index))
          }

          const functionName = 'get_stat_trades'
          const functionArgs = [ll]
          const options = {
            contractAddress,
            contractName: marketContractName,
            functionName,
            functionArgs,
            network,
            senderAddress,
          };
          const summaryRsp = await callReadOnlyFunction(options);
          // let serverData = cvToValue(summaryRsp)
          // console.log('___summaryRsp: ', summaryRsp)
          for (let sv of summaryRsp.list) {
            if (sv.type == 10) {
              const initStr = sv.value.value.toString(10)
              // console.log('___initStr: ', initStr)
              let v = BigInt(initStr)
              if (v > this.pivot2) {
                const t =  Math.floor(Number(v / this.pivot2))
                v = BigInt(initStr.substr(t.toString().length))
                const tid = t % 10000
                if (!(tid in this.statTradeTidNote)) {
                  const price = Math.floor(t / 10000) * 10000
                  this.statTradeTidNote[tid] = true
                  this.statTradePriceMap[tid] = price
                  if (price > 0) {
                    this.statTradePendingTidList.push(tid)
                  }
                }
              }
              if (v > this.pivot1) {
                const initStr2 = v.toString()
                const t = Math.floor(Number(v / this.pivot1))
                v = BigInt(initStr2.substring(t.toString().length))
                const tid = t % 10000
                if (!(tid in this.statTradeTidNote)) {
                  const price = Math.floor(t / 10000) * 10000
                  this.statTradeTidNote[tid] = true
                  this.statTradePriceMap[tid] = price
                  if (price > 0) {
                    this.statTradePendingTidList.push(tid)
                  }
                }
              }
              if (v > 0) {
                const t = Number(v)
                const tid = t % 10000
                if (!(tid in this.statTradeTidNote)) {
                  const price = Math.floor(t / 10000) * 10000
                  this.statTradeTidNote[tid] = true
                  this.statTradePriceMap[tid] = price
                  if (price > 0) {
                    this.statTradePendingTidList.push(tid)
                  }
                }
              }
            } else {
              this.bReachStatTradeIndexEnd = true
              break
            }
          }
        }
      }

      //
      if (this.statTradePendingTidList.length == 0) {
        // console.log('___list statTradePendingTidList.length==0')
        if (!this.bReachStatTradeIndexEnd) {
          // console.log('___not real end, continue ask below')
          this.loadRecentlyTrade()
        } else {
          // console.log('___real end')
          this.bLoadingStatTrade = false
          this.bReachStatTradeEnd = true
          this.loadSummaryFlag = 2
        }
        return
      }

      const tidList = this.statTradePendingTidList.splice(0, Math.min(this.statTradePendingTidList.length, 25))
      // console.log('___trade_tidList: ', tidList)
      let ll = listCV()
      ll.list = []
      for (let tid of tidList) {
        ll.list.push(uintCV(tid))
      }

      const originNFTCount = this.statTradeNftDataList.length
      const functionName = 'get_members'
      const functionArgs = [ll]
      const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        network,
        senderAddress,
      };
      const summaryRsp = await callReadOnlyFunction(options);
      let serverData = cvToValue(summaryRsp)
      for (let i = 0; i < serverData.length; i++) {
        const sv = serverData[i]
        if (sv.value) {
          const vv = sv.value.value
          const tid = tidList[i]
          this.statTradeNftDataList.push({
            tid: tid,
            name: buffer2Str(vv.name),
            minorName: buffer2Str(vv.minor_name),
            cid: vv.cid.value,
            bio: buffer2Str(vv.bio),
            price: tid ? this.statTradePriceMap[tid] : 0,
            h: Math.floor(vv.ud.value/1000000)%10000,
          })
        }
      }

      //
      this.loadSummaryFlag = 2
      if (this.bReachStatTradeIndexEnd && this.statTradePendingTidList.length == 0) {
        // console.log('___real end after query')
        this.bLoadingStatTrade = false
        this.bReachStatTradeEnd = true
      } else if (this.statTradeNftDataList.length - originNFTCount < 14) {
        // console.log('___after query, add too little')
        this.loadRecentlyTrade()
      } else {
        this.bLoadingStatTrade = false
        // console.log('___after query, add many')
      }
    },
    onClickListItem(index) {
      this.viewNftItem(this.statListNftDataList[index-1])
    },
    onClickTradeItem(index) {
      this.viewNftItem(this.statTradeNftDataList[index-1])
    },

    safe1000(i) {
      return (i > 0 ? i : (i + 1000))
    },
    /// dialog related
    createLoading(tips) {
      return this.$loading({
        lock: true,
        text: tips,
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.05)'
      });
    },
    //
    async viewNftItem(nftData, bDialogForceHideBidBuy) {
      if (!nftData) {
        return
      }
      this.bDialogVisible = true
      this.bDialogLoading = true
      this.bDialogForceHideBidBuy = bDialogForceHideBidBuy
      this.dialogNftPrice = 0
      this.dialogOwner = ''
      this.dialogBNS = ''
      this.dialogRegisterStr = ''
      this.dialogBidList.splice(0, this.dialogBidList.length)
      this.dialogNftData = nftData
      this.bDialogIsSelf = (this.dialogNftData.tid == this.myTid)
      //
      const functionName = 'get_token_brief'
      const functionArgs = [uintCV(this.dialogNftData.tid)]
      const options = {
        contractAddress,
        contractName: marketContractName,
        functionName,
        functionArgs,
        network,
        senderAddress,
      };
      const summaryRsp = await callReadOnlyFunction(options);
      this.bDialogLoading = false
      // if (loading) {
      //   loading.close()
      // }
      // let serverData = cvToValue(summaryRsp)
      const srvData = summaryRsp.data
      this.dialogNftPrice = srvData.list_info.type == 9 ? 0 : cvToValue(srvData.list_info.value.data.price)
      this.dialogRegisterStr = srvData.time.type==9 ? '' : getLocalTime(cvToValue(srvData.time).value)
      this.dialogOwner = srvData.player.type == 9 ? '' : cvToValue(srvData.player).value
      if (this.dialogOwner.length > 0) {
        if (this.dialogOwner in this.addr2bnsMap) {
          this.dialogBNS = this.addr2bnsMap[this.dialogOwner]
        } else {
          this.resolvePlayer(this.dialogOwner)
        }
      }
      const curBh = cvToValue(srvData.bh)
      // this.dialogBidList.splice(0, this.dialogBidList.length)
      this.dialogBidList = this.parseBidderListData(srvData.bid_list)
      if (this.dialogBidList.length > 0) {
        Vue.set(this.dialogBidList, 0, this.dialogBidList[0])
      }
    },
    async resolvePlayer(addr) {
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
        this.addr2bnsMap[addr] = ''
      } else {
        const fullName = buffer2Str(svrData.value.name)+'.'+buffer2Str(svrData.value.namespace)
        this.addr2bnsMap[addr] = fullName
        if (this.dialogOwner == addr) {
          this.dialogBNS = fullName
        }
      }
    },
    parseBidderListData(bidder_list) {
      const svrBidList = cvToValue(bidder_list)
      let resultBidList = []
      for (let svrBid of svrBidList) {
        let record = {
          player: svrBid.value.player.value,
          price: svrBid.value.price.value,
          expiration: svrBid.value.expiration.value,
        }
        if (record.expiration <= this.curBh) {
          record.expStr = 'expired'
        } else {
          record.expStr = this.formatBlocksTime(record.expiration - this.curBh) + ' remaining'
        }
        resultBidList.push(record)
      }
      return resultBidList
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
      if (this.myTid != 0) {
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
      if (this.myTid != 0) {
        tipError(this, this.TipAlreadyHave)
        return
      }
      this.toBidPrice = 100; // no mintPrice this.mintPrice / 1000000
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
    onClickAcceptDialog(index, row) {
      let bidInfo = this.dialogBidList[index]
      this.tryAcceptBid(bidInfo)
    },
    onClickMineAccept(index, row) {
      let bidInfo = this.myBidderList[index]
      this.tryAcceptBid(bidInfo)
    },
    async tryAcceptBid(bidInfo) {
      if (!bidInfo) {
        return
      }
      if (bidInfo.expiration <= this.curBh) {
        tipError(this, 'Bid expired')
        return
      }

      const functionName = 'get_pre_act_info'
      const functionArgs = [standardPrincipalCV(bidInfo.player)]
      const options = {
        contractAddress,
        contractName:marketContractName,
        functionName,
        functionArgs,
        network,
        senderAddress,
      };
      const loading = this.createLoading('checking');
      const summaryRsp = await callReadOnlyFunction(options);
      loading.close()
      let serverData = cvToValue(summaryRsp)
      if (serverData.tid.value) {
        tipError(this, 'The bidder already own one.')
        return
      }
      if (serverData.deposit.value < bidInfo.price) {
        tipError(this, "The bidder's deposit not enough.")
        return
      }
      this.acceptBid(this.myTid, bidInfo.price, bidInfo.player)
    },
    async acceptBid(tid, bidPrice, bidder) {
      const functionArgs = [
        uintCV(tid),
        standardPrincipalCV(bidder),
      ]

      const contractSTXPostCondition = makeContractSTXPostCondition(
        contractAddress,
        marketContractName,
        // FungibleConditionCode.Equal,
        // new BigNumCC(bidPrice)
        FungibleConditionCode.Greater, // care burn
        new BigNumCC(0),
      )

      const assetName = 'LaserEyes';
      const tokenAssetName = uintCV(tid);
      const nonFungibleAssetInfo = createAssetInfo(contractAddress, contractName, assetName);
      let postConditions = [contractSTXPostCondition]
      if (this.dialogNftPrice && this.dialogNftPrice > 0) {
        const contractNonFungiblePostCondition = makeContractNonFungiblePostCondition(
          contractAddress,
          marketContractName,
          NonFungibleConditionCode.DoesNotOwn,
          nonFungibleAssetInfo,
          tokenAssetName
        );
        postConditions.push(contractNonFungiblePostCondition)
      } else {
        const standardNonFungiblePostCondition = makeStandardNonFungiblePostCondition(
          getAddress(),
          NonFungibleConditionCode.DoesNotOwn,
          nonFungibleAssetInfo,
          tokenAssetName
        );
        postConditions.push(standardNonFungiblePostCondition)
      }

      let outThis = this
      const options = {
        contractAddress,
        contractName: marketContractName,
        functionName: 'accept_bid',
        functionArgs,
        network,
        appDetails: getAppDetails(),
        postConditions: postConditions,
        onFinish: data => {
          outThis.doNotify('Accept bid')
        },
      };
      openContractCall(options)
    },
    //
    async onSearchName() {
      let trimStr = this.searchContent.trim()
      if (trimStr.length <= 0) {
        return
      }
      let functionName = null
      let functionArgs = null
      this.searchTokenId = 0
      const tid = parseInt(trimStr)
      if (tid > 0 && tid.toString().length == trimStr.trim().length) {
        this.searchType = 1
        this.searchTokenId = tid
        functionName = 'get_member'
        functionArgs = [uintCV(tid)]
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
      const loading = this.createLoading()
      const summaryRsp = await callReadOnlyFunction(options);
      loading.close()
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
      if (this.searchNftData.name.length <= 0) {
        tipInfo(this, 'Not exist')
      } else {
        this.viewNftItem(this.searchNftData)
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
    //
    onClickMineList() {
      let outThis = this
      this.tipSetPrice(function(value) {
        outThis.doListInMarket(value)
      })
    },
    tipSetPrice(callback) {
      let priceRangeStr = '' + this.config.minPrice/1000000 + ' - ' + this.config.maxPrice/1000000 + ''
      let outThis = this
      this.$prompt(
        'Please enter the price(STX)',
        'List',
      {
        confirmButtonText: 'Ok',
        cancelButtonText: 'Cancel',
        inputPlaceholder: priceRangeStr,
      }).then(({ value }) => {
        let perferPrice = parseFloat(value)
        if (!perferPrice) {
          tipError(outThis, 'Invalid price')
          return
        }
        let microPrice = Math.floor(perferPrice * 100) * 10000
        if (microPrice < outThis.config.minPrice || microPrice > outThis.config.maxPrice) {
          tipError(outThis, 'Invalid price')
          return
        }
        if (callback) {
          callback(microPrice)
        }
      }).catch(() => {
        // pass
      });
    },
    doListInMarket(value) {
      const tid = this.myNftData.tid
      const functionArgs = [
        uintCV(tid),
        uintCV(value),
      ]

      const assetName = 'LaserEyes';
      const tokenAssetName = uintCV(tid);
      const nonFungibleAssetInfo = createAssetInfo(contractAddress, contractName, assetName);
      const standardNonFungiblePostCondition = makeStandardNonFungiblePostCondition(
        getAddress(),
        NonFungibleConditionCode.DoesNotOwn,
        nonFungibleAssetInfo,
        tokenAssetName
      );

      let outThis = this
      const options = {
        contractAddress,
        contractName: marketContractName,
        functionName: 'list_nft',
        functionArgs,
        network,
        appDetails: getAppDetails(),
        postConditions: [standardNonFungiblePostCondition],
        onFinish: data => {
          outThis.doNotify('List')
        },
      };
      openContractCall(options)
    },
    onClickMineUpdatePrice() {
      let outThis = this
      this.tipSetPrice(function(value) {
        outThis.doUpdatePrice(value)
      })
    },
    doUpdatePrice(value) {
      const tid = this.myNftData.tid
      const functionArgs = [
        uintCV(tid),
        uintCV(value),
      ]

      let outThis = this
      const options = {
        contractAddress,
        contractName: marketContractName,
        functionName: 'update_list_price',
        functionArgs,
        network,
        appDetails: getAppDetails(),
        postConditions: [],
        onFinish: data => {
          outThis.doNotify('Update list price')
        },
      };
      openContractCall(options)
    },
    onClickMineCancelList() {
      const tid = this.myNftData.tid
      const functionArgs = [
        uintCV(tid),
      ]

      const assetName = 'LaserEyes';
      const tokenAssetName = uintCV(tid);
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
        functionName: 'cancel_list',
        functionArgs,
        network,
        appDetails: getAppDetails(),
        postConditions: [contractNonFungiblePostCondition],
        onFinish: data => {
          outThis.doNotify('Cancel list')
        },
      };
      openContractCall(options)
    },
    //
    onClickWithdraw() {
      if (this.myTid > 0) {
        this.withdraw()
        return
      }
      let outThis = this
      this.$confirm('Withdraw deposit will remove all bids, are you sure?', 'Tips', {
        confirmButtonText: 'YES',
        cancelButtonText: 'No',
        type: 'warning',
        center: true,
      }).then(() => {
        outThis.withdraw()
      }).catch(() => {
        // pass
      });
    },
    withdraw() {
      const contractPostCondition = makeContractSTXPostCondition(
        contractAddress,
        marketContractName,
        FungibleConditionCode.GreaterEqual,
        new BigNumCC(0)
      )
      let outThis = this
      const options = {
        contractAddress,
        contractName: marketContractName,
        functionName: 'withdraw',
        functionArgs: [],
        network,
        appDetails: getAppDetails(),
        postConditions: [contractPostCondition],
        onFinish: data => {
          outThis.doNotify('Withdraw')
        },
      };
      openContractCall(options)
    },
    async startViewTid(tid) {
      const functionName = 'get_member'
      const functionArgs = [uintCV(tid)]
      const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        network,
        senderAddress,
      };
      const loading = this.createLoading()
      const summaryRsp = await callReadOnlyFunction(options);
      loading.close()
      let compData = null
      if (summaryRsp.type != 9) {
        compData = {
          value: cvToValue(summaryRsp)
        }
      }
      const curNftData = {}
      this.parseNftData(curNftData, compData)
      curNftData.tid = tid
      if (curNftData.name && curNftData.name.length <= 0) {
        tipInfo(this, 'Not exist')
      } else {
        this.viewNftItem(curNftData, true)
      }
    },
    onClickCancelBid(index) {
      let bidInfo = this.myBidList[index]
      if (this.myBidList.length == 1 && this.myDeposit > 0) {
        let outThis = this
        this.$confirm('Also withdraw bid deposit?', 'Tips', {
            confirmButtonText: 'YES',
            cancelButtonText: 'No',
            type: 'info',
            center: true,
          }).then(() => {
            outThis.withdraw()
          }).catch(() => {
            outThis.cancelBid(bidInfo.tid)
          });
      } else {
        this.cancelBid(bidInfo.tid)
      }
    },
    cancelBid(tid) {
      const functionArgs = [
        uintCV(tid),
      ]
      let outThis = this
      const options = {
        contractAddress,
        contractName: marketContractName,
        functionName: 'cancel_bid',
        functionArgs,
        network,
        appDetails: getAppDetails(),
        postConditions: [],
        onFinish: data => {
          outThis.doNotify('Cancel bid')
        },
      };
      openContractCall(options)
    },
    //
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
  },
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#main {
  margin: 92px 128px 32px 128px;
  text-align: center;
  min-height: 800px;
}
#maincontent {
  min-height: 300px;
}

.subTitle {
  font-size: 32px;
  font-weight: bold;
}

#search {
  width: 500px;
  margin: 16px auto;
}

#tabs {
  margin: auto;
  width: 60%;
}

.memberArea {
  /* margin: auto; */
  margin-top: 0px;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, 168px);
  grid-gap: 32px;
  justify-content: center;
  min-height: 100px;
}

.member {
  display: inline-block;
  margin: 10px;
  padding: 0;
  border: none;
  background: white;
}

#img {
  width: 80px;
  height: 80px;
  border-radius: 40px;
  display: block;
  margin: -20px auto 0 auto;
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

#mineArea {
  margin: 8px auto;
}
.myNftItem {
  width: 168px;
  margin: auto;
}
#myActBtns {
  margin-top: 16px;
}
.cardArea {
  text-align: left;
  margin: 16px auto;
  width: 600px;
}
#withdraw {
  margin-left: 2px;
}
#mintBtn {
  margin: 8px auto 16px auto;
  font-size: 20px;
}
#bidDeposit {
  margin-top: 4px;
}
#heart {
  margin-top: 8px;
  text-align: center;
}
#h {
  vertical-align: top;
  margin-left: -2px;
}

</style>
