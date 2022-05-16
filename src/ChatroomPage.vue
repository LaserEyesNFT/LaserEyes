<template>
  <div>
    <MenuBar menu='chatroom'></MenuBar>
    <div id='main'>
      <div id='chatdialog'>
        <el-table
          size='small'
          :height="chatHeight"
          ref='multipleTable'
          border
          empty-text=' '
          :data="chatList">
          <el-table-column
            label="Chatroom">
            <template slot-scope="scope">
              <div v-if='!scope.row.bSelf'>
                <button class="avatarBtn" @click='onClickChatAvatar(scope.row.tid)' v-loading='scope.row.bNeedReq'>
                  <img :src='"https://ipfs.io/ipfs/"+scope.row.cid' class='avatar' />
                </button>
                <div class="commonnametimecontent">
                  <span class="commonnametime">{{ scope.row.name }}&nbsp;&nbsp;{{ scope.row.dateStr }}</span>
                  <br />
                  <span class="contentonly">
                    {{ scope.row.content }}
                  </span>
                </div>
              </div>
              <div v-else>
                <button class='avatarBtn fright' @click='onClickChatAvatar(scope.row.tid)'>
                  <img :src='"https://ipfs.io/ipfs/"+scope.row.cid' class="avatar" />
                </button>
                <div class="commonnametimecontent fright">
                  <span class="commonnametime fright">{{ scope.row.dateStr }}&nbsp;&nbsp;{{ scope.row.name }}</span>
                  <br />
                  <span class="contentonly fright">
                    {{ scope.row.content }}
                    <i v-if='scope.row.bPending' class="el-icon-loading"></i>
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>

          <infinite-loading
            slot="append"
            direction="top"
            ref='infWidgetRef'
            @infinite="infiniteHandler"
            force-use-infinite-wrapper=".el-table__body-wrapper">
            <template slot='no-more'><div style="height:0px">&nbsp;</div></template>
            
          </infinite-loading>
        </el-table>
        <div id='sendMsgArea'>
          <div class="chatIcon">
            <el-popover placement="top-start" width="400" trigger="click" class="emoBox">
              <div class="emotionList">
                <a href="javascript:void(0);" @click="onClickEmoji(index)" v-for="(item,index) in chatEmojiList" :key="index" class="emotionItem">{{item}}</a>
              </div>
              <el-button class="popupslot" slot="reference">😀</el-button>
            </el-popover>
          </div>
          <el-input
            v-model="chatWriteMsg"
            @input='onChangeWriteMsg'
            :maxlength='chatMsgMaxLen'
            :placeholder='"Max " + chatMsgMaxLen + " characters"'
            resize="none"
            type="textarea"
            id='chatWriteMsgInput'
            :autosize="{ minRows: 3, maxRows: 6}">
          </el-input>
          <div id='sendmsgbtndiv'>
            <el-button class="fright" :disabled='chatWriteMsg.length<=0 || chatExceedTip.length>0' type="primary" size="mini" @click='onClickSendMsg'>Send</el-button>
            <span class='fright exceedTip' style="margin-top:6px" v-if='chatExceedTip.length>0'>{{chatExceedTip}}</span>
          </div>
        </div>
      </div>
      <div id='feeTip'>(Recommend set custom fee &lt; 0.1 STX)</div>
    </div>

    <!-- Member detail dialog -->
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

      <div slot="footer" class="dialog-footer">
        <el-button v-if="!bDialogIsSelf && myTid>0" type="primary" round @click="onClickLike">Like ({{likeCost/1000000}} STX)</el-button>
        <el-button type="info" round @click="bDialogVisible=false">Close</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import MenuBar from './components/MenuBar'
import { authenticate, getAppDetails, userSession, getAddress, getNetwork, getContractInfo, loginIn } from './stacks/auth'
import { checkImgExists, getIpfsUrl, buffer2Str, getLocalTime, tipError, parseRspArray, uintArr2CvArr, formatBlocksTime, getDurationAgo } from './utils/utils'
import { callReadOnlyFunction, listCV, makeContractNonFungiblePostCondition, createAssetInfo, contractPrincipalCV, FungibleConditionCode, NonFungibleConditionCode, makeStandardSTXPostCondition, makeStandardNonFungiblePostCondition, makeContractSTXPostCondition, noneCV, cvToValue, stringAsciiCV, bufferCVFromString, tupleCV,  uintCV, trueCV, falseCV, someCV, standardPrincipalCV } from '@stacks/transactions'
import { openContractCall } from '@stacks/connect';
import BigNumCC from 'bn.js';
import Vue from 'vue'
const emojiList = require("./assets/emoji.json");

const { contractAddress, contractName, marketContractName, chatroomContractName, likeContractName, BNSContractAddress, BNSContractName }  = getContractInfo();
const senderAddress = contractAddress;
const network = getNetwork();

export default {
  name: 'ChatroomPage',
  components: {
    MenuBar: MenuBar,
  },
  data () {
    return {
      bSignedIn: userSession.isUserSignedIn(),
      //
      myTid: 0,
      myNftData: {},
      chatInitialIndex: 0,
      chatHeadIndex: 0,
      chatTailIndex: 0,
      maxChatMsgCount: 100000,
      initialLoadMsgCount: 12,
      chatEmojiList: [],
      chatWriteMsg: '',
      bHasReqChat: false,
      chatExceedTip: '',
      chatMsgMaxLen: 120,
      chatList: [],
      bChatTickFlag: false,
      chatHeight: 560,
      tid2NftMap: {},
      refreshInterval: 30000,
      lastSavedChatStamp: 0,
      // member dialog
      bDialogVisible: false,
      bDialogLoading: false,
      bDialogIsSelf: false,
      dialogNftData: {
        name: '',
        minorName: '',
      },
      dialogNftPrice: 0,
      dialogRegisterStr: '',
      dialogOwner: '',
      dialogBNS: '',
      likeCost: 500000,
      addr2bnsMap: {},
      tid2BriefMap: {},
      //
      waitReqTidList: [],
      inReqTidSet: {},
      /// Common
      POW4: BigInt(10000),
      POW8:  BigInt(100000000),
      POW10: BigInt(10000000000),
      POW12:  BigInt(1000000000000),
      POW16:  BigInt(10000000000000000),
      POW20:  BigInt(100000000000000000000),
      defaultAvatarCid: 'QmeiJEqLynPN8c13ZQKdo8VMyK62whnn1DWQrEF6dZTzep',
      alreadyLiked: 'Already liked',
      notExist: 'Not exist',
    }
  },
  async mounted() {
    this.chatEmojiList.push(...emojiList)
  },
  methods: {
    async viewMember(memberData) {
      this.bDialogVisible = true
      this.bDialogLoading = true
      this.dialogNftPrice = 0
      this.dialogOwner = ''
      this.dialogBNS = ''
      this.dialogRegisterStr = ''
      this.dialogNftData = memberData
      this.bDialogIsSelf = (this.dialogNftData.tid == this.myTid)
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

    async onClickLike() {
      if (!this.bSignedIn || this.myTid == 0) {
        return
      }
      let outThis = this
      let loading = this.createLoading('loading')
      const functionArgs = [uintCV(this.myTid), uintCV(this.dialogNftData.tid)]
      await this.callReadonly(likeContractName, 'has_like', functionArgs, null, function(summaryRsp) {
        loading.close()
        if (cvToValue(summaryRsp)) {
          tipError(outThis, outThis.alreadyLiked)
          return
        }
        if (outThis.curBalance <= outThis.likeCost) {
          tipError(outThis, outThis.balanceUnenough)
          return
        }
        const standardSTXPostCondition = makeStandardSTXPostCondition(
          getAddress(),
          FungibleConditionCode.LessEqual,
          new BigNumCC(outThis.likeCost),
        );
        outThis.callPublic(likeContractName, 'like', [uintCV(outThis.dialogNftData.tid)], [standardSTXPostCondition], 'Like')
      })
    },
    /// chat
    onChangeWriteMsg() {
      const trimMsg = this.chatWriteMsg.trim()
      let buffLen = 0
      if (trimMsg.length > 30) {
        buffLen = bufferCVFromString(trimMsg).buffer.byteLength
      }
      this.chatExceedTip = buffLen > this.chatMsgMaxLen ? (buffLen + '/' + this.chatMsgMaxLen) : ''
    },

    infiniteHandler($state) {
      // console.log('___infiniteHandler')
      if (!this.bHasReqChat) {
        let functionArgs = []
          if (this.bSignedIn) {
            functionArgs.push(someCV(standardPrincipalCV(getAddress())))
          } else {
            functionArgs.push(noneCV())
          }
          const loading = this.createLoading('loading')
          let outThis = this
          this.callReadonly(
            chatroomContractName,
            'get_summary', 
            functionArgs,
            null,
            function(rsp) {
              loading.close()
              const rspd = rsp.data
              // console.log('___rspd: ', rspd)
              outThis.bHasReqChat = true
              outThis.chatInitialIndex = outThis.chatTailIndex = cvToValue(rspd.index)
              //
              let serverData = cvToValue(rspd.p)
              outThis.myTid = serverData.tid.value
              outThis.parseNftData(outThis.myNftData, serverData.meta)
              outThis.myNftData.tid = outThis.myTid
              outThis.tid2NftMap[outThis.myTid] = outThis.myNftData
              //
              let rspList = []
              if (rspd.latest.list.length > 0) {
                const tmpSvrList = cvToValue(rspd.latest)
                for (const tmpSvr of tmpSvrList) {
                  const tid = tmpSvr.value.ud.value % 10000
                  const stamp = Math.floor(tmpSvr.value.ud.value/10000)
                  const cacheNftData = outThis.tid2NftMap[tid]
                  rspList.push({
                    bNeedReq: (cacheNftData == null),
                    bSelf: (outThis.myTid == tid),
                    tid: tid,
                    name: cacheNftData ? cacheNftData.name : '#'+tid,
                    cid: cacheNftData ? cacheNftData.cid : outThis.defaultAvatarCid,
                    dateStr: getLocalTime(stamp),
                    content: buffer2Str(tmpSvr.value.msg),
                  })
                  outThis.lastSavedChatStamp = stamp
                  if (cacheNftData == null) {
                    outThis.waitReqTidList.push(tid)
                  }
                }
              }
              outThis.chatList = rspList.reverse()
              if (outThis.chatList.length > 0) {
                Vue.set(outThis.chatList, 0, outThis.chatList[0])
              }
              outThis.chatHeadIndex = outThis.chatInitialIndex - rspList.length + 1
              if (outThis.chatHeadIndex < 1) {
                outThis.chatHeadIndex += outThis.maxChatMsgCount
              }
              //
              $state.loaded();
              if (outThis.chatList.length < outThis.initialLoadMsgCount) {
                $state.complete();
              }
              outThis.jumpToChatListEnd()
              //
              setInterval(() => {
                outThis.refreshChat()
              }, outThis.refreshInterval);
              //
              outThis.reqWaitSummaryList()
              // console.log('___parse_end', {
              //   myTid: outThis.myTid,
              //   chatInitialIndex: outThis.chatInitialIndex,
              //   chatHeadIndex: outThis.chatHeadIndex,
              //   chatTailIndex: outThis.chatTailIndex,
              //   chatList: outThis.chatList,
              //   nftData: outThis.myNftData,
              // })
            }
          )
      } else {
        let outThis = this
        let ll = listCV()
        ll.list = []
        let bCompleteFlag = false
        for (let i = 1; i <= 25; i++) {
          let tmpIndex = this.chatHeadIndex - i
          if (tmpIndex < 1) {
            tmpIndex += this.maxChatMsgCount
          }
          if (tmpIndex == this.chatInitialIndex) {
            bCompleteFlag = true
            break
          }
          ll.list.push(uintCV(tmpIndex))
        }
        this.chatHeadIndex -= ll.list.length
        if (this.chatHeadIndex < 1) {
          this.chatHeadIndex += this.maxChatMsgCount
        }
        if (ll.list.length <= 0) {
          $state.loaded();
          $state.complete();
          return
        }
        const loading = this.createLoading('loading')
        this.callReadonly(chatroomContractName, 'get_chats', [ll], null, function(rsp) {
          loading.close()
          let resultList = []
          const tmpArr = cvToValue(rsp)
          for (const tmpData of tmpArr) {
            if (tmpData.value && tmpData.value.value) {
              const vv = tmpData.value.value
              const ud = vv.ud.value
              const tid = ud % 10000
              const stamp = Math.floor(ud / 10000)
              const nftData = outThis.tid2NftMap[tid]
              resultList.push({
                bNeedReq: (nftData == null),
                bSelf: (tid == outThis.myTid),
                tid: tid,
                name: nftData ? nftData.name : '#' + tid,
                cid: nftData ? nftData.cid : outThis.defaultAvatarCid,
                dateStr: getLocalTime(stamp),
                stamp: stamp,
                content: buffer2Str(vv.msg),
              })
              if (nftData == null) {
                outThis.waitReqTidList.push(tid)
              }
            } else {
              bCompleteFlag = true
              break
            }
          }
          // console.log('___resultList: ', resultList)
          outThis.chatList.unshift(...resultList.reverse())
          $state.loaded();
          if (bCompleteFlag) {
            $state.complete();
          }
          outThis.reqWaitSummaryList()
        })
      }
    },
    jumpToChatListEnd() {
      let containerList = this.$el.querySelectorAll('.el-table__body-wrapper');
      for (let container of containerList) {
        if (container.offsetParent != null && container.offsetParent.offsetHeight == this.chatHeight) {
          setTimeout(() => {
            container.scrollTop = container.scrollHeight;
          }, 0);
          break
        }
      }
    },
    onClickSendMsg() {
      if (!this.bSignedIn) {
        loginIn()
        return
      }
      if (this.myTid <= 0) {
        this.$confirm('Need own laser eyes NFT first, go to mint?', 'tips', {
          confirmButtonText: 'Ok',
          cancelButtonText: 'Cancel',
          type: 'info'
        }).then(() => {
          window.open('mine.html?act=mint', '_blank').focus()
        }).catch(() => {
          // pass
        });
        return
      }
      
      const functionArgs = [
        bufferCVFromString(this.chatWriteMsg)
      ]
      let outThis = this
      this.callPublic(chatroomContractName, 'chat', functionArgs, [], 'Chat', function(rsp) {
        const nftData = outThis.myNftData
        outThis.chatList.push({
          bNeedReq: false,
          bSelf: true,
          bPending: true,
          tid: outThis.myTid,
          name: nftData.name,
          cid: nftData.cid,
          dateStr: getLocalTime(Math.floor(Date.now()/1000)),
          content: outThis.chatWriteMsg,
        })
        outThis.chatWriteMsg = ''
        outThis.jumpToChatListEnd()
      })
    },
    onClickEmoji(index){
      var textArea = document.getElementById('chatWriteMsgInput');
      function changeSelectedText(obj, str) {
        textArea.setRangeText(str);
        textArea.selectionStart += str.length;
        textArea.focus()
      }
      changeSelectedText(textArea, this.chatEmojiList[index]);
      this.chatWriteMsg = textArea.value;
      this.onChangeWriteMsg()
      return;
    },
    onClickChatAvatar(tid) {
      if (tid in this.tid2NftMap) {
        const memberData = this.tid2NftMap[tid]
        this.viewMember(memberData)
      }
    },
    refreshChat() {
      let ll = listCV()
      ll.list = []
      let lastIndex = 0
      for (let i = 1; i <= 10; i++) {
        lastIndex = this.chatTailIndex + i
        if (lastIndex > this.maxChatMsgCount) {
          lastIndex -= this.maxChatMsgCount
        }
        ll.list.push(uintCV(lastIndex))
      }
      // console.log('___refresh before req: ', {
      //   chatTailIndex: this.chatTailIndex,
      //   lastIndex: lastIndex,
      //   ll_count: ll.list.length,
      // })
      let outThis = this
      this.callReadonly(chatroomContractName, 'get_chats', [ll], null, function(rsp) {
        const rspVal = cvToValue(rsp)
        // console.log('___refreshChat_rspVal: ', rspVal)
        let resultList = []
        for (const v of rspVal) {
          if (v.value) {
            const ud = v.value.value.ud.value
            const stamp = Math.floor(ud / 10000)
            resultList.push({
              content: buffer2Str(v.value.value.msg),
              tid: ud % 10000,
              stamp: stamp,
              dateStr: getLocalTime(stamp),
            })
          } else {
            break
          }
        }
        //
        if (resultList.length > 0) {
          // console.log('___refresh resultList: ', resultList)
          for (let i = 0; i < resultList.length; i++) {
            if (resultList[i].stamp <= outThis.lastSavedChatStamp) {
              resultList.splice(i)
              break
            }
          }
          if (resultList.length <= 0) {
            return
          }
          outThis.lastSavedChatStamp = resultList[resultList.length-1].stamp
          outThis.chatTailIndex = outThis.chatTailIndex + resultList.length
          if (outThis.chatTailIndex > outThis.maxChatMsgCount) {
            outThis.chatTailIndex -= outThis.maxChatMsgCount
          }
          // console.log('___setTail: ', outThis.chatTailIndex)
          //
          let pendingList = []
          const originLen = outThis.chatList.length
          for (let i = 1; i <= Math.min(10, originLen); i++) {
            const realIndex = originLen - i
            const item = outThis.chatList[realIndex]
            if (item.bPending) {
              let jresult = null
              for (let j = 0; j < resultList.length; j++) {
                if (resultList[j].content == item.content && resultList[j].tid == item.tid) {
                  jresult = j
                  break
                }
              }
              if (jresult == null) {
                pendingList.unshift(item)
              }
              outThis.chatList.splice(realIndex, 1)
            }
          }
          //
          for (const v of resultList) {
            const nftData = outThis.tid2NftMap[v.tid]
            outThis.chatList.push({
              bNeedReq: (nftData==null),
              bSelf: (v.tid == outThis.myTid),
              tid: v.tid,
              name: nftData ? nftData.name : '#' + v.tid,
              cid: nftData ? nftData.cid : outThis.defaultAvatarCid,
              dateStr: v.dateStr,
              content: v.content,
            })
            if (nftData == null) {
              outThis.waitReqTidList.push(v.tid)
            }
          }
          if (pendingList.length > 0) {
            outThis.chatList.push(...pendingList)  
          }
          outThis.jumpToChatListEnd()
          //
          outThis.reqWaitSummaryList()
        }
      })
    },
    reqWaitSummaryList() {
      // console.log('___reqTids begin')
      if (this.waitReqTidList.length <= 0) {
        return
      }
      let preTidList = this.waitReqTidList.splice(0, 25)
      for (let i = preTidList.length; i >= 0; i--) {
        if ((preTidList[i] in this.inReqTidSet) || this.tid2NftMap[preTidList[i]]) {
          preTidList.splice(i, 1)
        } else {
          this.inReqTidSet[preTidList[i]] = true
        }
      }
      if (preTidList.length <= 0) {
        this.reqWaitSummaryList()
        return
      }
      let ll = listCV()
      ll.list = []
      for (const v of preTidList) {
        ll.list.push(uintCV(v))
      }
      // console.log('___reqTids list: ', preTidList)
      let outThis = this
      this.callReadonly(contractName, 'get_members', [ll], null, function(rsp) {
        const result = outThis.parseSvrMemberList(preTidList, rsp, true)
        console.assert(preTidList.length == result.length, 'error: not same')
        for (let i = 0; i < preTidList.length; i++) {
          const tid = preTidList[i]
          outThis.inReqTidSet[tid] = null
          const nftData = result[i]
          outThis.tid2NftMap[tid] = nftData
        }
        //
        const leftEndIndex = Math.min(100, outThis.chatList.length-1)
        for (let i = 0; i <= leftEndIndex; i++) {
          const chatData = outThis.chatList[i]
          if (chatData.bNeedReq && (chatData.tid in outThis.tid2NftMap)) {
            chatData.bNeedReq = false
            const nftData = outThis.tid2NftMap[chatData.tid]
            chatData.cid = nftData.cid
            chatData.name = nftData.name
          }
        }
        //
        Vue.set(outThis.chatList, 0, outThis.chatList[0])
      })
      //
      outThis.reqWaitSummaryList()
    },
    parseSvrMemberList(tidList, summaryRsp, bIncludeBurned) {
      let serverData = cvToValue(summaryRsp)
      let arr = []
      for (let index = 0; index < tidList.length; index++) {
        const memberData = serverData[index]
        if (memberData.value) {
          const mv = memberData.value.value
          arr.push({
            tid: tidList[index],
            name: buffer2Str(mv.name),
            minorName: buffer2Str(mv.minor_name),
            cid: mv.cid.value,
            bio: buffer2Str(mv.bio),
            bh: mv.ud.value % 1000000,
            h: Math.floor(mv.ud.value / 1000000) % 10000,
          })
        } else {
          if (bIncludeBurned) {
            arr.push({
              tid: tidList[index],
              name: '#' + tidList[index] + '(Burned)',
              minorName: '',
              cid: '',
              bio: '',
              bh: 0,
              h: 0,
            })
          }
        }
      }
      return arr
    },    
    /// common
    parseNftData(nativeNftData, serverNftData) {
      const sv = serverNftData ? (serverNftData.value ? serverNftData.value.value : null) : null
      nativeNftData.name = sv ? buffer2Str(sv.name) : ''
      nativeNftData.minorName = sv ? buffer2Str(sv.minor_name) : ''
      nativeNftData.cid = sv ? sv.cid.value : ''
      nativeNftData.bio = sv ? buffer2Str(sv.bio) : ''
      nativeNftData.bh = sv ? sv.ud.value % 1000000 : 0
      nativeNftData.h = sv ? Math.floor(sv.ud.value/1000000)%10000 : 0
    },    
    async callReadonly(contractName, functionName, functionArgs, preCallback, postCallback) {
      const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        network,
        senderAddress,
      };
      if (preCallback) {
        preCallback()
      }
      // await new Promise(resolve => setTimeout(resolve, 2000));
      const summaryRsp = await callReadOnlyFunction(options)
      if (postCallback) {
        postCallback(summaryRsp)
      }
    },
    callPublic(contractName, functionName, functionArgs, postConditions, tip, onFinishCallback, onCancelCallback) {
      let outThis = this
      const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        network,
        appDetails: getAppDetails(),
        postConditions,
        onFinish: data => {
          outThis.doNotify(tip)
          if (onFinishCallback) {
            onFinishCallback(data)
          }
        },
        onCancel: onCancelCallback
      };
      openContractCall(options)
    },
    getLocalTime(nS) {  
      let dateStr = new Date(parseInt(nS) * 1000).toLocaleDateString('en-US')
      const index = dateStr.lastIndexOf('/')
      if (index) {
        dateStr = dateStr.substr(0, index)
      }
      return dateStr
    },
    doNotify(title) {
      this.$notify({
        title: title,
        message: 'Transaction has been sent, wait a while to be finished.',
        duration: 8000,
      });
    },
    fmtBlock(blocks) {
      return formatBlocksTime(blocks)
    },
    createLoading(tips) {
      return this.$loading({
        lock: true,
        text: tips,
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.05)'
      });
    },
  },
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

.elink {
  vertical-align: top;
}
.exceedTip {
  color: red;
  text-align: left;
  line-height: 18px;
}

#main {
  margin: 52px 128px 32px 128px;
  text-align: center;
  min-height: 400px;
}

.exceedTip {
  color: red;
  text-align: left;
  line-height: 18px;
  margin: 2px 8px 2px auto;
}

#chatdialog {
  width: 600px;
  margin: 100px auto 0 auto;
}
#feeTip {
  color: #ccc;
  font-size: 12px;
  margin: 4px auto;
  text-align: center;
}
#sendMsgArea {
  background: #f2f2f2;
  text-align: left;
  padding: 0px 2px;
}
.chatIcon {
  padding: 0;
  font-size: 25px;
}
.emotionList{
  display: flex;
  flex-wrap: wrap;
  padding:2px;
}
.emotionItem{
  width:10%;
  font-size:20px;
  text-align:center;
  text-decoration: none;
}
.popupslot {
  padding: 8px;
}
#sendmsgbtndiv {
  margin-top: 4px;
  height: 32px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 18px;
}
.commonnametimecontent {
  vertical-align: top;
  width: 330px;
  display: inline-block;
}
.commonnametime {
  color: #999;
  font-size: 14px;
  vertical-align: top;
}
.fright {
  float: right;
}
.contentonly {
  font-size: 17px;
}
.avatarBtn {
  background: transparent;
  padding: 0;
  border: none;
  margin: auto 4px;
}

</style>
