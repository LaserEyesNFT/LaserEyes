<template>
  <div>
    <MenuBar menu='club'></MenuBar>
    <div id='main' v-loading='loadingClubCbFlag!=2'>
      <div id='clubArea' v-if='loadingClubCbFlag==2'>
        <ClubItem id='clubitem' :clubData='clubData' :act='bSignedIn&&!bIsMember?3:0' @click="onClickApply" />
        <el-card id='noticeArea'>
          <div slot="header" id='noticeTitle'>
            <span style="color:#333">Notice:</span>
            <el-button v-if='myAdminCtid==curCtid' size="mini" style="padding:2px 2px" circle icon="el-icon-edit" @click="onClickEditNotice"></el-button>
            <el-button v-if='!bNoticeReadonly' type="info" size="mini" style="float:right" round @click='onClickCancelUpdateNotice'>Cancel</el-button>
            <el-button v-if='!bNoticeReadonly' :disabled='noticeExceedTip.length>0' type="primary" size="mini" style="float:right" round @click='onClickUpdateNotice'>Update</el-button>
          </div>
          <el-input id='ta' type="textarea" resize='none' :autosize="{ minRows: 4, maxRows: 10}" ref='notice' @input='onChangeNotice' :maxlength='maxNoticeLen' v-model='clubNotice' :readonly='bNoticeReadonly' :placeholder='"Not set."'></el-input>
          <div class='exceedTip' v-if='noticeExceedTip.length>0'>{{noticeExceedTip}}</div>
        </el-card>
      </div>
      <el-tabs v-if='loadingClubCbFlag==2' id='tabs' v-model="curTab" @tab-click="onClickTab">
        <!-- Members -->
        <el-tab-pane :label='"Members" + (memberCount>0 ? " ("+ memberCount+")" : "")' class="tp" name="members">
          <div class='myclubsdiv' v-loading='bInreqAllMembers'>
            <button v-for="index of memberNftDataList.length" :key="index" class='member' @click="onClickMember(index)">
              <ClubMemberItem :nftData='memberNftDataList[index-1]' :bAdmin='index==1' />
            </button>
          </div>
        </el-tab-pane>
        <!-- Chat -->
        <el-tab-pane :label='"Chat (" + lastChatTimeStr + ")"' class="tp" name="chat" v-loading='reqChatFlag==1'>
          <div class='myclubsdiv'>
            <div id='chatdialog'>
              <el-table
                size='small'
                :height="chatHeight"
                ref='multipleTable'
                border
                :empty-text='reqChatFlag==2?"Empty":" "'
                :data="chatList">
                <el-table-column
                  label="Chat">
                  <template slot-scope="scope">
                    <div v-if='!scope.row.bSelf'>
                      <button class="avatarBtn" @click='onClickChatAvatar(scope.row.tid)'>
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
                  :autosize="{ minRows: 2, maxRows: 6}">
                </el-input>
                <div id='sendmsgbtndiv'>
                  <el-button class="fright" :disabled='chatWriteMsg.length<=0 || chatExceedTip.length>0' type="primary" size="mini" @click='onClickSendMsg'>Send</el-button>
                  <span class='fright exceedTip' style="margin-top:6px" v-if='chatExceedTip.length>0'>{{chatExceedTip}}</span>
                </div>
              </div>
            </div>
            <div id='feeTip'>(Recommend set custom fee &lt; 0.15 STX)</div>
          </div>
        </el-tab-pane>
        <!-- Vote -->
        <el-tab-pane :label='"Vote ("+voteCount+")"' class="tp" name="vote" v-loading='voteCount>0&&reqVoteFlag==1'>
          <div class='myclubsdiv'>
            <div class='contentTip' v-if='voteCount==0'>Empty</div>
            <div id='launchVote' class="fcenter">
              <el-button type="primary" plain round size="small" @click='onClickLaunchVote'>Launch vote</el-button>
            </div>
            <div style="width:750px;margin:16px auto" v-if='voteCount>0'>
              <el-table :data="voteDataList" border>
                <el-table-column type="expand">
                  <template slot-scope="props">
                    <div v-if='props.row.endBh>curBh&&props.row.selfChoice==0' class='votedetail'> <!-- can vote -->
                      <div v-for='index of props.row.choices.length' :key='index' class='canvoteitem'>
                        <el-button type='text' class='votebtn canvotebtn' @click='onClickVoteItem(props.row.key, index)'>{{ props.row.choices[index-1] }}</el-button>
                      </div>
                    </div>
                    <div v-else class='votedetail'>  <!-- cannot vote -->
                      <div v-for='index of props.row.choices.length' :key='index' class='cannotevoteitem'>
                        <div class='progbarouter'>
                          <el-progress :stroke-width="26" :show-text='false' :percentage="props.row.percentList[index-1]" :color='props.row.winIndex==index?"#409eff":"#ccc"'></el-progress>
                        </div>
                        <div class='progtext'>{{props.row.percentStrList[index-1]}}%</div>
                        <div class='cannotvotef'>
                          {{ props.row.choices[index-1] }}
                          <!-- <i v-if='props.row.selfChoice==index' class="el-icon-circle-check"></i> -->
                        </div>
                      </div>
                    </div>
                    <div class="votedetail voteStat">
                      {{ props.row.totalVote }} votes · {{ props.row.endBh>curBh ? fmtBlock(props.row.endBh - curBh) + ' left' : "Final results" }}
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="Title" width="580">
                  <template slot-scope="scope">
                    <span style="font-size:16px">
                      {{ scope.row.title }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="Status">
                <template slot-scope="scope">
                  <span :style='{color: scope.row.endBh>curBh ? "#67C23A" : "#999"}'>{{ scope.row.endBh>curBh ? 'live' : 'finished' }}</span>
                </template>
                </el-table-column>
              </el-table>
              <div class='tip25' v-if='voteCount>25'>(Only show latest 25 votes.)</div>
            </div>
          </div>
        </el-tab-pane>
        <!-- Apply -->
        <el-tab-pane :label='"Apply ("+applyCount+")"' class="tp" name="apply" v-loading='applyCount>0&&reqApplyFlag==1'>
          <div class='myclubsdiv'>
            <div class='contentTip' v-if='applyCount==0'>Empty</div>
            <button v-for="index of applyNftDataList.length" :key="index" class='member' @click="onClickApplyMember(index)">
              <ClubMemberItem :nftData='applyNftDataList[index-1]' :act='curCtid==myAdminCtid?1:0' @click="onClickRespondApply(index, $event)" />
            </button>
          </div>
        </el-tab-pane>
        <!-- Invite -->
        <el-tab-pane v-if='curCtid==myAdminCtid' :label='"Invite("+inviteCount+")"' class="tp" name="invite" v-loading='inviteCount>0&&reqInviteFlag==1'>
          <div class='myclubsdiv'>
            <div class='contentTip' v-if='inviteCount==0'>Empty</div>
            <button v-for="index of inviteNftDataList.length" :key="index" class='member' @click="onClickInviteMember(index)">
              <ClubMemberItem :nftData='inviteNftDataList[index-1]' act=2 @click="onClickCancelInvite(index, $event)" />
            </button>
            <div id='inviteBtn'>
              <el-button v-if='myAdminCtid==curCtid&&memberTidList.length<100' type="primary" round @click="onClickInvite">Invite</el-button>
            </div>
          </div>
        </el-tab-pane>
        <!-- Events -->
        <el-tab-pane :label='"Events ("+eventCount+")"' class="tp" name="events" v-loading='eventCount>0&&reqEventFlag==1'>
          <div class='myclubsdiv'>
            <div class='contentTip' v-if='eventCount==0'>Empty</div>
            <el-table
              v-if='eventDataList.length > 0'
              id='eventPanel'
              stripe
              border
              size="medium"
              max-height="620"
              :data="eventDataList">
              <el-table-column label="Time" width="230">
                <template slot-scope="scope">
                  {{ scope.row.timeStr }}
                </template>
              </el-table-column>
              <el-table-column
                label="Content">
                <template slot-scope="scope">
                  {{ scope.row.content }}
                </template>
              </el-table-column>
            </el-table>
            <div class='tip25' v-if='eventCount>25'>(Only show latest 25 events.)</div>
          </div>
        </el-tab-pane>
        <!-- Settings -->
        <el-tab-pane label='Settings' class="tp" name="settings" v-if='bIsMember'>
          <div id='settingdiv'>
            <el-button v-if='myAdminCtid==curCtid' type="primary" round @click="onClickEditClub">Edit ({{updateClubPrice/1000000}} STX)</el-button>
            <el-button v-if='bIsMember && myAdminCtid!=curCtid' type="danger" round @click="onClickExit">Exit club</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- create vote dialog -->
    <el-dialog :center='true' title='Launch vote' :visible.sync="bInCreateVote" width='800px'>
      <el-form class="fcenter" ref="form" :model="createVoteData" label-width="80px">
        <el-form-item label="Title">
          <el-input v-model="createVoteData.title" @input='onChangeVoteTitle' :maxlength='maxVoteTitleLen' :placeholder='"max " + maxVoteTitleLen + " characters"'>
            <label slot="suffix" class='exceedTip' v-if='createVoteData.titleExceedTip.length>0'>{{createVoteData.titleExceedTip}}</label>
          </el-input>
        </el-form-item>
        <el-form-item v-for='index of createVoteData.choiceList.length' :key='index' :label='"Choice " + index'>
          <el-input v-model="createVoteData.choiceList[index-1]" @input='onChangeVoteChoice(index)' :maxlength='maxVoteChoiceLen' :placeholder='(index>2 ? "optional, " : "") + "max " + maxVoteChoiceLen + " characters"'>
            <label slot="suffix" class='exceedTip' v-if='createVoteData.choiceExceedTip[index-1].length>0'>{{createVoteData.choiceExceedTip[index-1]}}</label>
          </el-input>
        </el-form-item>
        <el-form-item label="Days" style="text-align:left">
          <el-input-number v-model="createVoteData.days" :min='1' :max='30' ></el-input-number>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :disabled='!createVoteData.bAllChoiceValid || createVoteData.title.trim().length==0 || createVoteData.titleExceedTip.length>0' @click="onClickSureCreateVote">{{ votePrice>0 ? 'Launch (' + votePrice/1000000 + ' STX)' : 'Create' }}</el-button>
          <el-button @click="bInCreateVote=false">Cancel</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- change clubs dialog -->
    <el-dialog :center='true' title='Edit club' :visible.sync="bEditClubFlag" width='800px'>
      <el-form id='nftForm' ref="form" :model="editClubData" label-width="80px">
        <el-form-item label="Name">
          <el-input v-model="editClubData.name" @input='onChangeName' :maxlength='maxNameLen' :placeholder='"Max " + maxNameLen + " characters"'>
            <label slot="suffix" class='exceedTip' v-if='nameExceedTip.length>0'>{{nameExceedTip}}</label>
          </el-input>
        </el-form-item>

        <el-form-item label="Logo CID">
          <el-input v-model="editClubData.cid" maxlength=64 placeholder='IPFS content id, like QmdUXVtRxKhdVhjPXCUxZGyXNHn5e2oS6pt8enPXo7X4Hk'></el-input>
          <div class='tipFormItem'>
            Step 1: compress your club logo
            <el-link class='elink' type="primary" href='https://tinypng.com/' target="_blank">here</el-link>
            (the smaller size it is, the quicker it shows).
          </div>
          <div class='tipFormItem'>
            Step 2: upload compressed picture to
            <el-link class='elink' type="primary" href='https://app.pinata.cloud/pinmanager' target="_blank">Pinta</el-link>(or others)
            , copy generated CID to upper input box.
          </div>
          <div class='tipFormItem'>
            Wait several seconds, the image will show in the preview area below.
          </div>
        </el-form-item>

        <el-form-item label="Bio">
          <el-input type="textarea" @input='onChangeBio' :maxlength='maxBioLen' v-model="editClubData.bio" :placeholder='"Hover mouse on image to show, max " + maxBioLen + " characters"'>
          </el-input>
          <div class='exceedTip' v-if='bioExceedTip.length>0'>{{bioExceedTip}}</div>
        </el-form-item>
        <el-form-item label="Preview">
          <ClubItem :clubData='editClubData' />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :disabled='nameExceedTip.length>0 || bioExceedTip.length>0 || editClubData.cid.trim().length<40' @click="onClickSureEditClub">{{ 'Update (' + this.updateClubPrice/1000000 + ' STX)' }}</el-button>
          <el-button @click="bEditClubFlag=false">Cancel</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

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
        <el-button v-if="!bDialogIsSelf && !bDialogForInvite && myTid>0" type="primary" round @click="onClickLike">Like ({{likeCost/1000000}} STX)</el-button>
        <el-button v-if="bDialogForInvite" type="primary" round @click="onClickDialogInvite">Invite</el-button>
        <el-button type="info" round @click="bDialogVisible=false">Close</el-button>
        <el-button v-if="!bDialogIsSelf && !bDialogForInvite && myAdminCtid==curCtid && (dialogNftData.tid in memberTid2NftDataMap) " type="warning" round @click="onClickTransfer">Transfer</el-button>
        <el-button v-if="!bDialogIsSelf && !bDialogForInvite && myAdminCtid==curCtid && (dialogNftData.tid in memberTid2NftDataMap)" type="warning" round @click="onClickKickout">Kick out</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import MenuBar from './components/MenuBar'
import ClubItem from './components/ClubItem'
import ClubMemberItem from './components/ClubMemberItem'
import { authenticate, getAppDetails, userSession, getAddress, getNetwork, getContractInfo, loginIn } from './stacks/auth'
import { checkImgExists, getIpfsUrl, buffer2Str, getLocalTime, tipError, parseRspArray, uintArr2CvArr, formatBlocksTime, getDurationAgo } from './utils/utils'
import { callReadOnlyFunction, listCV, makeContractNonFungiblePostCondition, createAssetInfo, contractPrincipalCV, FungibleConditionCode, NonFungibleConditionCode, makeStandardSTXPostCondition, makeStandardNonFungiblePostCondition, makeContractSTXPostCondition, noneCV, cvToValue, stringAsciiCV, bufferCVFromString, tupleCV,  uintCV, trueCV, falseCV, someCV, standardPrincipalCV } from '@stacks/transactions'
import { openContractCall } from '@stacks/connect';
import BigNumCC from 'bn.js';
import Vue from 'vue'
const emojiList = require("./assets/emoji.json");

const { contractAddress, contractName, clubContractName, marketContractName, likeContractName, BNSContractAddress, BNSContractName }  = getContractInfo();
const senderAddress = contractAddress;
const network = getNetwork();

export default {
  name: 'ClubPage',
  components: {
    MenuBar: MenuBar,
    ClubItem: ClubItem,
    ClubMemberItem: ClubMemberItem,
  },
  data () {
    return {
      bSignedIn: userSession.isUserSignedIn(),
      loadingClubCbFlag: 0,
      curCtid: 0,
      curBh: 0,
      votePrice: 0,
      curBalance: 0,
      //
      myTid: 0,
      myAdminCtid: 0,
      myApplyCtidList: [],
      myJoinCtidList: [],
      bIsMember: false,
      //
      clubNotice: '',
      clubData: {},
      maxNameLen: 25,
      maxNoticeLen: 200,
      bNoticeReadonly: true,
      noticeExceedTip: '',
      /// 编辑club
      bEditClubFlag: false,
      maxBioLen: 80,
      nameExceedTip: '',
      bioExceedTip: '',
      updateClubPrice: 4000000,
      editClubData: {
        name: '',
        cid: '',
        bio: '',
      },
      //////
      curTab: 'members',
      /// members 会员
      bInreqAllMembers: false,
      memberCount: 0,
      memberTidList: [],
      memberNftDataList: [],
      memberTid2NftDataMap: {},
      /// chat 聊天
      chatCount: 0,
      curChatMsgIndex: 0,
      chatEmojiList: [],
      chatWriteMsg: '',
      lastChatTimeStr: '',
      reqChatFlag: 0,
      chatExceedTip: '',
      chatMsgMaxLen: 200,
      chatList: [],
      bChatTickFlag: false,
      chatHeight: 450,
      /// vote 投票
      voteCount: 0,
      votePrice: 0,
      reqVoteFlag: 0,
      bInCreateVote: false,
      maxVoteTitleLen: 100,
      maxVoteChoiceLen: 25,
      createVoteData: {
        days: 7,
        title: '',
        choiceList: ['','','',''],
        bAllChoiceValid: false,
        titleExceedTip: '',
        choiceExceedTip: ['','','',''],
      },
      voteDataList: [],
      /// Apply
      applyCount: 0,
      reqApplyFlag: 0,
      applyTidList: [],
      applyNftDataList: [],
      /// Invite
      inviteCount: 0,
      inviteTidList: [],
      reqInviteFlag: 0,
      inviteNftDataList: [],
      inviteNFTData: {},
      /// Events
      eventCount: 0,
      reqEventFlag: 0,
      eventDataList: [],
      // member dialog
      bDialogVisible: false,
      bDialogLoading: false,
      bDialogIsSelf: false,
      bDialogForInvite: false,
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
      /// Common
      POW4: BigInt(10000),
      POW8:  BigInt(100000000),
      POW10: BigInt(10000000000),
      POW12:  BigInt(1000000000000),
      POW16:  BigInt(10000000000000000),
      POW20:  BigInt(100000000000000000000),
      defaultAvatarCid: 'QmeiJEqLynPN8c13ZQKdo8VMyK62whnn1DWQrEF6dZTzep',
      notMemberTip: 'Not join current club yet',
      alreadyMemberTip: 'Already in club',
      alreadyApply: 'Already applied',
      clubApplyedFull: 'The club has been applied too much, please wait',
      memberFull: 'Members full',
      balanceUnenough: 'Balance not enough',
      nameTaken: 'name already taken',
      alreadyLiked: 'Already liked',
      notExist: 'Not exist',
      alreadyInvite: 'Already invite',
      memeberInvitedFull: 'The member has been invited too much, please wait',
    }
  },
  async mounted() {
    var url = window.location.href
    var paramName = url.split("id=")[1]
    this.curCtid = parseInt(paramName)
    if (this.curCtid <= 0) {
      return
    }
    this.loadSummary()
    this.chatEmojiList.push(...emojiList)
    //
  },
  methods: {
    loadSummary() {
      let outThis = this
      let functionArgs = [uintCV(this.curCtid)]
      if (this.bSignedIn) {
        functionArgs.push(someCV(standardPrincipalCV(getAddress())))
      } else {
        functionArgs.push(noneCV())
      }
      this.callReadonly(
        clubContractName,
        'get_club_cb',
        functionArgs,
        function() {
          outThis.loadingClubCbFlag = 1
        },
        function(rsp) {
          const rspd = rsp.data
          // console.log('___rspd: ', rspd)
          outThis.curBh = cvToValue(rspd.bh)
          outThis.curBalance = cvToValue(rspd.b)
          outThis.myAdminCtid = cvToValue(rspd.actid)
          outThis.votePrice = (outThis.myAdminCtid == outThis.curCtid ? 0 : 2000000)
          outThis.myApplyCtidList = parseRspArray(rspd.apply)
          outThis.applyTidList = parseRspArray(rspd.applyed)
          outThis.applyCount = outThis.applyTidList.length
          const initStr = rspd.chat_ext.value.toString(10)
          let vv = BigInt(initStr)
          const param2 =  Math.floor(Number(vv / outThis.POW10))
          vv = BigInt(initStr.substr(param2.toString().length))
          outThis.chatCount = Number(param2)
          outThis.curChatMsgIndex = outThis.chatCount
          let lastModify = Number(vv)
          outThis.lastChatTimeStr = lastModify > 0 ? getDurationAgo(lastModify) : '0'
          outThis.memberCount = cvToValue(rspd.detail.value.data.count)
          outThis.memberTidList = outThis.parseMemberTidList(rspd.detail.value.data.members)
          outThis.eventCount = cvToValue(rspd.event_count)
          outThis.inviteTidList = parseRspArray(rspd.invite)
          outThis.inviteCount = outThis.inviteTidList.length
          outThis.myJoinCtidList = parseRspArray(rspd.joins)
          outThis.clubNotice = rspd.notice.type==9 ? '' : buffer2Str(cvToValue(rspd.notice))
          const summaryV = cvToValue(rspd.summary).value
          outThis.clubData = {
            name: buffer2Str({value: summaryV.name.value}),
            bio: buffer2Str({value: summaryV.bio.value}),
            cid: summaryV.cid.value,
            adminTid: summaryV.ud.value % 10000,
            createTimeStr: getLocalTime(Math.floor(summaryV.ud.value/10000))
          }
          outThis.myTid = cvToValue(rspd.tid)
          outThis.voteCount = cvToValue(rspd.vote_count)
          outThis.bIsMember = outThis.myJoinCtidList.includes(outThis.curCtid)
          outThis.loadingClubCbFlag = 2
          // console.log('___parseRes: ', {curBh: outThis.curBh, myAdminCtid : outThis.myAdminCtid, myApplyCtidList : outThis.myApplyCtidList, applyTidList : outThis.applyTidList, applyCount: outThis.applyCount, chatCount : outThis.chatCount, lastChatTimeStr : outThis.lastChatTimeStr, memberCount : outThis.memberCount, memberTidList : outThis.memberTidList, eventCount : outThis.eventCount, inviteTidList : outThis.inviteTidList, inviteCount: outThis.inviteCount, myJoinCtidList : outThis.myJoinCtidList, clubNotice : outThis.clubNotice, clubData : outThis.clubData, myTid : outThis.myTid, voteCount : outThis.voteCount,})
          //
          if (outThis.memberCount != outThis.memberTidList.length) {
            tipError(outThis, 'members count inconsistent')
          }
          outThis.reqAllMembers()
        }
      )
    },
    parseMemberTidList(srvMembers) {
      let tmpList = []
      for (let v of srvMembers.list) {
        let vv = BigInt(v.value.toString(10))
        while (vv > 0) {
          const tid = Number(vv % this.POW4)
          if (tid > 0) {
            tmpList.push(tid)
          }
          const vvStr = vv.toString()
          if (vvStr.length > 4) {
            vv = BigInt(vvStr.substr(0, vvStr.length-4))
          } else {
            break
          }
        }
      }
      return tmpList
    },
    /// 顶部clubArea
    onChangeNotice() {
      const trimNotice = this.clubNotice.trim()
      let buffLen = 0
      if (trimNotice.length > 8) {
        buffLen = bufferCVFromString(trimNotice).buffer.byteLength
      }
      this.noticeExceedTip = buffLen > this.maxNoticeLen ? (buffLen + '/' + this.maxNoticeLen) : ''
    },
    async onClickApply() {
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
      let functionArgs = [uintCV(this.myTid), uintCV(this.curCtid)]
      let outThis = this
      const loading = this.createLoading('checking')
      this.callReadonly(clubContractName, 'get_apply_check_info', functionArgs, null, function(rsp) {
        loading.close()
        if (cvToValue(rsp.data.mflag) > 0) { tipError(outThis, outThis.alreadyMemberTip);return}
        const applyCtids = parseRspArray(rsp.data.applys)
        if (applyCtids.indexOf(outThis.curCtid) != -1) {tipError(outThis, outThis.alreadyApply);return;}
        if (cvToValue(rsp.data.applyed_count) >= 10) {tipError(outThis, outThis.clubApplyedFull);return}
        if (cvToValue(rsp.data.member_count) >= 100) {tipError(outThis, outThis.memberFull);return}
        outThis.callPublic(clubContractName, 'member_apply', [functionArgs[1]], [], 'Apply')
      })
    },
    onClickEditNotice() {
      this.bNoticeReadonly = false
      this.originNotice = this.clubNotice
      this.$refs.notice.focus();
    },
    onClickUpdateNotice() {
      let outThis = this
      let functionArgs = [ bufferCVFromString(this.clubNotice)]
      this.callPublic(clubContractName, 'update_notice', functionArgs, [], 'Update notice',
        function() {
          outThis.bNoticeReadonly = true
        },
        function() {
          outThis.clubNotice = this.originNotice
          outThis.bNoticeReadonly = true
        }
      )
    },
    onClickCancelUpdateNotice() {
      this.clubNotice = this.originNotice
      this.bNoticeReadonly = true
    },
    onClickInvite() {
      let outThis = this
      this.$prompt('Input id or name', 'Invite', {
          confirmButtonText: 'Ok',
          cancelButtonText: 'Cancel',
        }).then(({ value }) => {
          outThis.tryInvite(value)
        });
    },
    tryInvite(val) {
      let trimStr = val.trim()
      if (trimStr.length <= 0) {
        return
      }
      let num = 0
      if (trimStr.substr(0, 1) == '#') {
        num = parseInt(trimStr.substr(1))
        if (num == 0 || num.toString().length != trimStr.length-1) {
          num = 0
        }
      } else {
        num = parseInt(trimStr)
        if (num == 0 || num.toString().length != trimStr.length) {
          num = 0
        }
      }
      let functionName = null
      let functionArgs = null
      this.inviteTid = 0
      if (num > 0) {
        if (this.memberTid2NftDataMap[num]) {
          tipError(this, this.alreadyMemberTip)
          return
        }
        this.inviteTid = num
        functionName = 'get_member'
        functionArgs = [uintCV(num)]
      } else {
        functionName = 'resolve_name'
        functionArgs = [bufferCVFromString(trimStr.toLowerCase())]
      }

      let outThis = this
      const loading = this.createLoading('searching')
      this.callReadonly(contractName, functionName, functionArgs, null, function(summaryRsp) {
        loading.close()
        if (num > 0) {
          let compData = null
          if (summaryRsp.type != 9) {
            compData = {
              value: cvToValue(summaryRsp)
            }
          }
          outThis.parseNftData(outThis.inviteNFTData, compData)
          outThis.inviteNFTData.tid = num
        } else {
          let serverData = cvToValue(summaryRsp)
          outThis.parseNftData(outThis.inviteNFTData, serverData.meta)
          outThis.inviteNFTData.tid = serverData.tid.value
        }
        if (outThis.inviteNFTData.name == null || outThis.inviteNFTData.name.length == 0) {
          tipError(outThis, outThis.notExist)
          return
        }
        if (outThis.memberTid2NftDataMap[outThis.inviteNFTData.tid]) {
          tipError(outThis, outThis.alreadyMemberTip)
          return
        }
        outThis.viewMember(outThis.inviteNFTData, true)
      })
    },
    onClickExit() {
      let outThis = this
      const tip = "Are you sure want to exit current club ?"
      this.$confirm(tip, 'Warnings', {
          confirmButtonText: "Sure",
          cancelButtonText: 'Cancel',
          type: 'warning',
        }).then(() => {
          const functionArguments = [
            uintCV(outThis.curCtid)
          ]
          outThis.callPublic(clubContractName, 'exit', functionArguments, [], 'Exit club')
        }).catch(() => {
        });
    },
    onClickEditClub() {
      this.bEditClubFlag = true
      if (this.editClubData.name.length == 0) {
        this.editClubData.name = this.clubData.name
        this.editClubData.cid = this.clubData.cid
        this.editClubData.bio = this.clubData.bio
      }
    },
    onChangeName() {
      const trimName = this.editClubData.name.trim()
      let buffLen = 0
      if (trimName.length > 8) {
        buffLen = bufferCVFromString(trimName).buffer.byteLength
      }
      this.nameExceedTip = buffLen > this.maxNameLen ? (buffLen + '/' + this.maxNameLen) : ''
    },
    onChangeBio() {
      const trimBio = this.editClubData.bio.trim()
      let buffLen = 0
      if (trimBio.length > 8) {
        buffLen = bufferCVFromString(trimBio).buffer.byteLength
      }
      this.bioExceedTip = buffLen > this.maxBioLen ? (buffLen + '/' + this.maxBioLen) : ''
    },
    onClickSureEditClub() {
      let outThis = this
      const loading = this.createLoading('checking')
      const nameCv = bufferCVFromString(this.editClubData.name)
      this.callReadonly(clubContractName, 'get_edit_club_check_info', [nameCv, standardPrincipalCV(getAddress())], null, function(rsp) {
        loading.close()
        outThis.curBh = cvToValue(rsp.data.bh)
        outThis.curBalance = cvToValue(rsp.data.balance)
        if (outThis.editClubData.name != outThis.clubData.name && cvToValue(rsp.data.taken)) {
          tipError(outThis, outThis.nameTaken)
          return
        }
        if (outThis.curBalance <= outThis.updateClubPrice + 10000) {
          tipError(outThis, outThis.balanceUnenough)
          return
        }
        const functionArgs = [
          nameCv,
          stringAsciiCV(outThis.editClubData.cid),
          bufferCVFromString(outThis.editClubData.bio)
        ]
        const standardSTXPostCondition = makeStandardSTXPostCondition(
          getAddress(),
          FungibleConditionCode.LessEqual,
          new BigNumCC(outThis.updateClubPrice),
        );
        outThis.callPublic(clubContractName, 'update_summary', functionArgs, [standardSTXPostCondition], 'Update club')
      })
    },
    /// tab
    onClickTab(tab, event) {
      if (this.curTab == 'members') {
        // pass
      } else if (this.curTab == 'chat') {
        if (this.chatCount <= 0) {
          this.reqChatFlag = 2
        } else if (this.reqChatFlag == 0) {
          const stateChanger = this.$refs.infWidgetRef ? this.$refs.infWidgetRef.$vnode.componentInstance.stateChanger : null
          this.infiniteHandler(stateChanger)
        }
        if (!this.bChatTickFlag) {
          this.bChatTickFlag = true
          let outThis = this
          setInterval(() => {
            outThis.refreshChat()
          }, 30000);
        }
      } else if (this.curTab == 'vote') {
        if (this.voteCount <= 0) {
          this.reqVoteFlag = 2
        } else if (this.reqVoteFlag == 0) {
          this.reqVoteList()
        }
      } else if (this.curTab == 'apply') {
        if (this.applyCount <= 0) {
          this.reqApplyFlag = 2
        } else if (this.reqApplyFlag == 0) {
          this.reqApplyList()
        }
      } else if (this.curTab == 'invite') {
        if (this.inviteCount <= 0) {
          this.reqInviteFlag = 2
        } else if (this.reqInviteFlag == 0) {
          this.reqInviteList()
        }
      } else if (this.curTab == 'events') {
        if (this.eventCount <= 0) {
          this.reqEventFlag = 2
        } else if (this.reqEventFlag == 0) {
          this.reqEventList()
        }
      } else if (this.curTab == 'settings') {
        // pass
      } else {
        console.assert(false)
      }
    },
    /// members
    onClickMember(index) {
      const memberData = this.memberNftDataList[index-1]
      this.viewMember(memberData)
    },
    async viewMember(memberData, bForInvite) {
      this.bDialogForInvite = bForInvite
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
    async onClickTransfer() {
      let outThis = this
      const tip = "Are you sure transfer club to " + this.dialogNftData.name + " ?"
      this.$confirm(tip, 'Warnings', {
          confirmButtonText: "Sure",
          cancelButtonText: 'Cancel',
          type: 'warning',
          // center: true,
        }).then(() => {
          const functionArguments = [
            uintCV(outThis.dialogNftData.tid),
          ]
          outThis.callPublic(clubContractName, 'transfer', functionArguments, [], 'Transfer')
        }).catch(() => {
        });
    },
    async onClickKickout() {
      let outThis = this
      const tip = "Are you sure kick out " + this.dialogNftData.name + " ?"
      this.$confirm(tip, 'Warnings', {
          confirmButtonText: "I'm sure",
          cancelButtonText: 'Cancel',
          type: 'warning',
          // center: true,
        }).then(() => {
          const functionArguments = [
            uintCV(outThis.dialogNftData.tid)
          ]
          outThis.callPublic(clubContractName, 'kick_out', functionArguments, [], 'Kick out')
        }).catch(() => {
        });
    },
    async onClickDialogInvite() {
      let functionArgs = [uintCV(this.dialogNftData.tid), uintCV(this.curCtid)]
      let outThis = this
      const loading = this.createLoading('checking')
      this.callReadonly(clubContractName, 'get_invite_check_info', functionArgs, null, function(rsp) {
        loading.close()
        if (cvToValue(rsp.data.mflag) > 0) { tipError(outThis, outThis.alreadyMemberTip);return}
        const inviteCtids = parseRspArray(rsp.data.invites)
        if (inviteCtids.indexOf(outThis.dialogNftData.tid) != -1) {tipError(outThis, outThis.alreadyInvite);return;}
        if (cvToValue(rsp.data.invited_count) >= 5) {tipError(outThis, outThis.memeberInvitedFull);return}
        if (cvToValue(rsp.data.member_count) >= 100) {tipError(outThis, outThis.memberFull);return}
        let functionArgs2 = [uintCV(outThis.dialogNftData.tid)]
        outThis.callPublic(clubContractName, 'club_invite', functionArgs2, [], 'Invite')
      })
    },
    reqAllMembers() {
      this.bInreqAllMembers = true
      let outThis = this
      let bunch1 = this.memberTidList.slice(0, 25)
      let bunch2 = this.memberCount > 25 ? this.memberTidList.slice(25, 50) : []
      let bunch3 = this.memberCount > 50 ? this.memberTidList.slice(50, 75) : []
      let bunch4 = this.memberCount > 75 ? this.memberTidList.slice(75, 100) : []
      let b1 = false, b2 = false || bunch2.length==0, b3 = false||bunch3.length==0, b4 = false||bunch4.length==0
      let result1 = [], result2 = [], result3 = [], result4 = []
      //
      let checkAllFinish = function() {
        if (b1 && b2 && b3 && b4) {
          outThis.memberNftDataList = result1.concat(result2).concat(result3).concat(result4)
          const curAdminTid = outThis.clubData.adminTid
          const selfTid = outThis.myTid
          outThis.memberNftDataList.sort(function(a, b) {
            if (a.tid == curAdminTid || b.tid == curAdminTid) {
              return a.tid == curAdminTid ? -1 : 1
            }
            if (selfTid > 0 && (a.tid == selfTid || b.tid == selfTid)) {
              return a.tid == selfTid ? -1 : 1
            }
            return a.tid < b.tid ? -1 : 1
          })
          for (let v of outThis.memberNftDataList) {
            outThis.memberTid2NftDataMap[v.tid] = v
          }
          // console.log('___allFinish: ', outThis.memberNftDataList, outThis.memberTid2NftDataMap)
          outThis.bInreqAllMembers = false
        }
      }
      //
      {
        const arr1 = uintArr2CvArr(bunch1)
        this.callReadonly(contractName, 'get_members', [arr1], null, function(rsp) {
          result1 = outThis.parseSvrMemberList(bunch1, rsp)
          b1 = true
          checkAllFinish()
        })
      }
      if (!b2) {
        const arr2 = uintArr2CvArr(bunch2)
        this.callReadonly(contractName, 'get_members', [arr2], null, function(rsp) {
          result2 = outThis.parseSvrMemberList(bunch2, rsp)
          b2 = true
          checkAllFinish()
        })
      }
      if (!b3) {
        const arr3 = uintArr2CvArr(bunch3)
        this.callReadonly(contractName, 'get_members', [arr3], null, function(rsp) {
          result3 = outThis.parseSvrMemberList(bunch3, rsp)
          b3 = true
          checkAllFinish()
        })
      }
      if (!b4) {
        const arr4 = uintArr2CvArr(bunch4)
        this.callReadonly(contractName, 'get_members', [arr4], null, function(rsp) {
          result4 = outThis.parseSvrMemberList(bunch4, rsp)
          b4 = true
          checkAllFinish()
        })
      }
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
    /// chat
    onChangeWriteMsg() {
      const trimMsg = this.chatWriteMsg.trim()
      let buffLen = 0
      if (trimMsg.length > 50) {
        buffLen = bufferCVFromString(trimMsg).buffer.byteLength
      }
      this.chatExceedTip = buffLen > this.chatMsgMaxLen ? (buffLen + '/' + this.chatMsgMaxLen) : ''
    },

    infiniteHandler($state) {
      if (this.chatCount <= 0 || this.curChatMsgIndex < 1) {
        if ($state) {
          $state.loaded();
          $state.complete();
        }
        return
      }

      let ll = listCV()
      ll.list = []
      for (let i = 1; i <= 20; i++) {
        ll.list.push(uintCV(this.curCtid + 10000 * this.curChatMsgIndex--))
        if (this.curChatMsgIndex <= 0) {
          break
        }
      }
      let outThis = this
      const loading = this.createLoading('loading')
      this.callReadonly(clubContractName, 'get_chats', [ll], null, function(rsp) {
        loading.close()
        const rspVal = cvToValue(rsp)
        let resultList = []
        for (const v of rspVal) {
          if (v.value) {
            const ud = v.value.value.ud.value
            const tid = ud % 10000
            const stamp = Math.floor(ud/10000)
            const nftData = outThis.memberTid2NftDataMap[tid]
            resultList.push({
              bSelf: (outThis.myTid == tid),
              tid: tid,
              name: nftData ? nftData.name : '#' + outThis.myTid,
              cid: nftData ? nftData.cid : outThis.defaultAvatarCid,
              dateStr: getLocalTime(stamp),
              content: buffer2Str(v.value.value.msg),
            })
          } else {
            break
          }
        }
        outThis.chatList.unshift(...resultList.reverse())
        if (outThis.chatList.length) {
          Vue.set(outThis.chatList, 0, outThis.chatList[0])
        }
        if ($state) {
          $state.loaded();
          if (outThis.curChatMsgIndex < 1) {
            $state.complete();
          }
        }
        //
        if (outThis.reqChatFlag != 2) {
          outThis.reqChatFlag = 2
          outThis.jumpToChatListEnd()
        }
      })
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
      if (!this.bIsMember) {
        tipError(this, this.notMemberTip)
        return
      }
      const functionArgs = [
        uintCV(this.curCtid),
        bufferCVFromString(this.chatWriteMsg)
      ]
      let outThis = this
      this.callPublic(clubContractName, 'chat', functionArgs, [], 'Chat', function(rsp) {
        const nftData = outThis.memberTid2NftDataMap[outThis.myTid]
        outThis.chatList.push({
          bSelf: true,
          bPending: true,
          tid: outThis.myTid,
          name: nftData ? nftData.name : '#' + outThis.myTid,
          cid: nftData ? nftData.cid : outThis.defaultAvatarCid,
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
      if (tid in this.memberTid2NftDataMap) {
        const memberData = this.memberTid2NftDataMap[tid]
        this.viewMember(memberData)
        return
      }
      let functionArgs = [uintCV(tid)]
      let outThis = this
      const loading = this.createLoading('loading')
      this.callReadonly(contractName, 'get_member', functionArgs, null, function(summaryRsp) {
        loading.close()
        let compData = null
        if (summaryRsp.type != 9) {
          compData = {
            value: cvToValue(summaryRsp)
          }
        }
        const nftData = {}
        outThis.parseNftData(nftData, compData)
        if (nftData.name.length <= 0) {
          tipError(outThis, 'Burned')
          return
        }
        nftData.tid = tid
        outThis.viewMember(nftData)
      })
    },
    refreshChat() {
      // console.log('___refreshChat_chatList ')
      let ll = listCV()
      ll.list = []
      for (let i = 1; i <= 10; i++) {
        ll.list.push(uintCV(this.curCtid + 10000 * (this.chatCount + i)))
      }
      let outThis = this
      let resultList = []
      this.callReadonly(clubContractName, 'get_chats', [ll], null, function(rsp) {
        const rspVal = cvToValue(rsp)
        // console.log('___rspVal: ', rspVal)
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
          outThis.chatCount += resultList.length
          outThis.lastChatTimeStr = getDurationAgo(resultList[resultList.length-1].stamp)
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
            const nftData = outThis.memberTid2NftDataMap[v.tid]
            outThis.chatList.push({
              bSelf: (v.tid == outThis.myTid),
              tid: v.tid,
              name: nftData ? nftData.name : '#' + v.tid,
              cid: nftData ? nftData.cid : outThis.defaultAvatarCid,
              dateStr: v.dateStr,
              content: v.content,
            })
          }
          if (pendingList.length > 0) {
            outThis.chatList.push(...pendingList)
          }
          outThis.jumpToChatListEnd()
        }
      })
    },
    /// vote
    reqVoteList() {
      const myTidCv = uintCV(this.myTid)
      let ll = listCV()
      ll.list = []
      for (let i = 0; i < 25; i++) {
        const tmpIndex = this.voteCount - i
        if (tmpIndex > 0) {
          ll.list.push(tupleCV({
            k: uintCV(this.curCtid + 10000 * tmpIndex),
            tid: myTidCv,
          }))
        } else {
          break
        }
      }
      //
      let outThis = this
      this.callReadonly(clubContractName, 'get_votes', [ll],
        function() {
          outThis.reqVoteFlag = 1
        },
        function(rsp) {
          // console.log('___rsp: ', rsp)
          let resultList = []
          for (const v of rsp.list) {
            const selfChoice = cvToValue(v.data.c)
            const info = v.data.info.value.data
            const stat = v.data.stat
            //
            let choices = []
            let startBh = 0
            let startTime = 0
            {
              const initStr = info.start_at.value.toString(10)
              let vv = BigInt(initStr)
              startBh =  Math.floor(Number(vv / outThis.POW10))
              startTime = Number(initStr.substr(startBh.toString().length))
              const choicesOri = cvToValue(info.choices)
              for (const c of choicesOri) {
                choices.push(buffer2Str(c))
              }
            }
            //
            let totalVote = 0
            let stats = []
            let percentList = []
            let percentStrList = []
            let mostIndex = 0, mostVal = 0, bMostDumplicate = false
            {
              const initStr = stat.value.toString(10)
              let vv = BigInt(initStr)
              for (let i = 0; i < choices.length; i++) {
                const voteCount = Number(vv % outThis.POW4)
                stats.push(voteCount)
                totalVote += voteCount
                if (voteCount > mostVal) {
                  mostIndex = i + 1
                  mostVal = voteCount
                  bMostDumplicate = false
                } else if (voteCount > 0 && voteCount == mostVal) {
                  bMostDumplicate = true
                }
                let vvlen = vv.toString().length
                vv = vvlen > 4 ? BigInt(vv.toString().substr(0, vvlen-4)) : BigInt(0)
              }
            }
            const endBh = cvToValue(info.end_at)
            let winIndex = ((outThis.curBh > endBh && mostVal>0 && !bMostDumplicate) ? mostIndex : 0)
            for (let i = 0; i < stats.length; i++) {
              let p = totalVote > 0 ? (stats[i]/totalVote*100) : 0
              let pstr = p.toString()
              let idx = pstr.indexOf('.')
              if (idx && idx > 0) {
                pstr = pstr.substr(0, idx+2)
              }
              percentList.push(p)
              percentStrList.push(pstr)
            }
            // console.log('___stats: ', stats)
            const tmpV = {
              key: cvToValue(info.key),
              startBh: startBh,
              startTime: getLocalTime(startTime),
              title: buffer2Str({value:cvToValue(info.title)}),
              launcherTid: cvToValue(info.launcher),
              endBh: endBh,
              choices: choices,
              selfChoice: selfChoice,
              stats: stats,
              percentList: percentList,
              percentStrList: percentStrList,
              totalVote: totalVote,
              winIndex: winIndex,
            }
            // console.log('___tmpV: ', tmpV)
            outThis.voteDataList.push(tmpV)
          }
          outThis.reqVoteFlag = 2
        }
      )
    },
    onClickLaunchVote() {
      if (!this.bSignedIn) { loginIn(); return; }
      if (!this.bIsMember) { tipError(this, this.notMemberTip); return; }
      this.bInCreateVote = true
    },
    onChangeVoteTitle() {
      const trimTitle = this.createVoteData.title.trim()
      let buffLen = 0
      if (trimTitle.length > this.maxVoteTitleLen/3) {
        buffLen = bufferCVFromString(trimTitle).buffer.byteLength
      }
      this.createVoteData.titleExceedTip = buffLen > this.maxVoteTitleLen ? (buffLen + '/' + this.maxVoteTitleLen) : ''
    },
    onChangeVoteChoice(index) {
      let bAllChoiceValid = true
      let choice3 = ''
      for (let i = 0; i < this.createVoteData.choiceList.length; i++) {
        const choice = this.createVoteData.choiceList[i].trim()
        if (i < 2 && choice.length <= 0) {
          bAllChoiceValid = false
        } else if (i == 2) {
          choice3 = choice
        } else if (i == 3 && choice.length > 0 && choice3.length == 0) {
          bAllChoiceValid = false
        }
        const buffLen = choice.length > this.maxVoteChoiceLen/3 ? bufferCVFromString(choice).buffer.byteLength : 0
        const bExceed = (buffLen > this.maxVoteChoiceLen)
        this.createVoteData.choiceExceedTip[i] = bExceed ? (buffLen + '/' + this.maxVoteChoiceLen) : ''
        if (bExceed) {
          bAllChoiceValid = false
        }
      }
      this.createVoteData.bAllChoiceValid = bAllChoiceValid
    },
    onClickSureCreateVote() {
      // 如为member创建，最好先判定stx是否足够
      let ll = listCV()
      ll.list = []
      for (const choice of this.createVoteData.choiceList) {
        const trimmedChoice = choice.trim()
        if (trimmedChoice.length > 0) {
          ll.list.push(bufferCVFromString(trimmedChoice))
        } else {
          break
        }
      }
      const functionArgs = [
        uintCV(this.curCtid),
        uintCV(this.createVoteData.days),
        bufferCVFromString(this.createVoteData.title),
        ll
      ]
      if (this.curAdminTid != this.myTid) {
        const standardSTXPostCondition = makeStandardSTXPostCondition(
          getAddress(),
          FungibleConditionCode.LessEqual,
          new BigNumCC(this.votePrice),
        );
        this.callPublic(clubContractName, 'launch_vote', functionArgs, [standardSTXPostCondition], 'Launch vote')
      } else {
        this.callPublic(clubContractName, 'launch_vote', functionArgs, [], 'Launch vote')
      }
    },
    onClickVoteItem(voteKey, choice) {
      if (!this.bSignedIn) {
        loginIn()
        return
      }
      if (!this.bIsMember) {
        tipError(this, this.notMemberTip)
        return
      }
      const voteIndex = Math.floor(voteKey / 10000)
      const functionArgs = [
        uintCV(this.curCtid),
        uintCV(voteIndex),
        uintCV(choice)
      ]
      this.callPublic(clubContractName, 'vote', functionArgs, [], 'Vote')
    },
    /// apply
    reqApplyList() {
      if (this.applyTidList.length <= 0) {
        return
      }
      const arr = uintArr2CvArr(this.applyTidList)
      let outThis = this
      this.callReadonly(contractName, 'get_members', [arr],
        function() {
          outThis.reqApplyFlag = 1
        },
        function(rsp) {
          outThis.reqApplyFlag = 2
          outThis.applyNftDataList = outThis.parseSvrMemberList(outThis.applyTidList, rsp)
          if (outThis.applyNftDataList.length > 0) {
            Vue.set(outThis.applyNftDataList, 0, outThis.applyNftDataList[0])
          }
        })
    },
    onClickApplyMember(index) {
      const nftData = this.applyNftDataList[index-1]
      this.viewMember(nftData)
    },
    onClickRespondApply(index, bAccept) {
      // console.log('___onClickRespondApply: ', index, bAccept)
      const functionName = bAccept ? 'accept_member_apply' : 'decline_member_apply'
      const tip = bAccept ? 'Accept apply' : 'Decline apply'
      const nftData = this.applyNftDataList[index-1]
      const functionArgs = [uintCV(nftData.tid)]
      this.callPublic(clubContractName, functionName, functionArgs, [], tip)
    },
    /// invite
    reqInviteList() {
      if (this.inviteTidList.length <= 0) {
        return
      }
      const arr = uintArr2CvArr(this.inviteTidList)
      let outThis = this
      this.callReadonly(contractName, 'get_members', [arr],
        function() {
          outThis.reqInviteFlag = 1
        },
        function(rsp) {
          outThis.reqInviteFlag = 2
          outThis.inviteNftDataList = outThis.parseSvrMemberList(outThis.inviteTidList, rsp)
          if (outThis.inviteNftDataList.length > 0) {
            Vue.set(outThis.inviteNftDataList, 0, outThis.inviteNftDataList[0])
          }
        })
    },
    onClickInviteMember(index) {
      const nftData = this.inviteNftDataList[index-1]
      this.viewMember(nftData)
    },
    onClickCancelInvite(index) {
      const nftData = this.inviteNftDataList[index-1]
      const functionArgs = [uintCV(nftData.tid)]
      this.callPublic(clubContractName, 'club_cancel_invite', functionArgs, [], 'Cancel invite')
    },
    /// events
    async reqEventList() {
      if (this.eventCount <= 0) {
        return
      }
      this.reqEventFlag = 1
      //
      let tidList = []
      let eventDataList = []
      //
      {
        let ll = listCV()
        ll.list = []
        for (let i = 0; i < 25; i++) {
          const v = this.eventCount - i
          if (v > 0) {
            ll.list.push(uintCV(this.curCtid + 10000 * v))
          } else {
            break
          }
        }
        //
        let outSummaryRsp = null
        await this.callReadonly(clubContractName, 'get_club_events', [ll], null, function(rsp) {
          outSummaryRsp = rsp
        })
        // console.log('___get_member_events_summaryRsp: ', outSummaryRsp)
        for (const v of outSummaryRsp.list) {
          const initStr = v.value.toString(10)
          let vv = BigInt(initStr)
          const param2 =  Math.floor(Number(vv / this.POW20))
          vv = BigInt(initStr.substr(param2.toString().length))
          const param1 =  Math.floor(Number(vv / this.POW16))
          vv = BigInt(vv.toString().substr(param1.toString().length))
          const eventType =  Math.floor(Number(vv / this.POW12))
          const stamp = Number(vv%this.POW12)
          eventDataList.push({
            timeStr: getLocalTime(stamp),
            eventType: eventType,
          })
          tidList.push(param1)
        }
        // console.log('___eventDataList: ', eventDataList)
        //
        const arr = uintArr2CvArr(tidList)
        let outThis = this
        this.callReadonly(contractName, 'get_members', [arr], null, function(rsp) {
          const eventNftDataList = outThis.parseSvrMemberList(tidList, rsp, true)
          // console.log('___eventNftDataList: ', eventNftDataList)
          if (eventDataList.length != eventNftDataList.length) {
            tipError(outThis, 'events inconsistent')
          }
          for (let i = 0; i < eventDataList.length; i++) {
            const memberName = (eventNftDataList.length>i ? eventNftDataList[i].name : '?')
            if (eventDataList[i].eventType == 1001) {
              eventDataList[i].content = memberName + ' accepts invite.'
            } else if (eventDataList[i].eventType == 1002) {
              eventDataList[i].content = memberName + ' declines invite.'
            } else if (eventDataList[i].eventType == 1003) {
              eventDataList[i].content = memberName + ' exits.'
            } else if (eventDataList[i].eventType == 2003) {
              eventDataList[i].content = 'club is transferred to ' + memberName + '.'
            } else if (eventDataList[i].eventType == 2001) {
              eventDataList[i].content = 'administrator accepts ' + memberName + '\'s apply.'
            } else if (eventDataList[i].eventType == 2004) {
              eventDataList[i].content = 'administrator kicks out ' + memberName + '.'
            } else {
              console.assert(false)
            }
          }
          //
          outThis.eventDataList = eventDataList
          if (outThis.eventDataList.length > 0) {
            Vue.set(outThis.eventDataList, 0, outThis.eventDataList[0])
          }
          // console.log('___eventDataList_final: ', eventDataList)
          outThis.reqEventFlag = 2
        })
      }
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
      // await new Promise(resolve => setTimeout(resolve, 1000));
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
#inviteBtn {
  text-align: center;
  margin-top: 16px;
}
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

#nftForm {
  width: 700px;
  margin: auto;
  text-align: center;
}
.tipFormItem {
  text-align: left;
  line-height: 18px;
  margin-top: 2px;
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
#clubArea {
  position: relative;
}
#clubitem {
  display: inline-block;
  transform: scale(0.9);
}
#noticeArea {
  position: absolute;
  right: 0px;
  bottom: 8px;
  width: 300px;
}
#noticeTitle {
  text-align: left;
}
#ta {
  border: none;
  padding: 0;
  margin: 0;
}
.exceedTip {
  color: red;
  text-align: left;
  line-height: 18px;
  margin: 2px 8px 2px auto;
}
.myclubsdiv {
  margin-top: 16px;
  text-align: left;
  padding: auto;
  min-height: 200px;
}
.contentTip {
  margin-top: 20px;
  text-align: center;
}

.tp {
  min-height: 150px; /* 189px;*/
}
.member {
  display: inline-block;
  margin-right: 16px;
  border: none;
  background: white;
}
#eventPanel {
  padding: 0;
  width: 700px;
  margin: auto;
  font-size: 16px;
}
.tip25 {
  margin-top: 16px;
  font-size: 14px;
  color: #666;
  text-align: center;
}
.fcenter {
  text-align: center;
}
#launchVote {
  margin-top: 8px;
}
.votedetail {
  margin-left: 50px;
}
.canvoteitem {
  padding: 0px;
  margin: 8px auto;
}
.cannotevoteitem {
  width: 412px;
  padding: 0px;
  margin-top: 8px;
  margin-bottom: 8px;
  position: relative;
}
.votebtn {
  line-height: 4px;
  text-align: center;
  width: 320px;
  border-radius: 12px;
}
.canvotebtn {
  border: 1px solid #1d9bf0;
}
.cannotvotef {
  padding: 0px;
  margin: 0px;
  position: absolute;
  left:16px;
  top:4px;
  color:black;
  font-size: 16px;
}
.voteStat {
  margin-bottom: 20px;
}
.progbarouter {
  width: 300px;
  display: inline-block;
}
.progtext {
  display: inline-block;
  vertical-align: top;
  margin-top: 4px;
  margin-left: 8px;
}

#settingdiv {
  margin-top: 32px;
}
#chatdialog {
  width: 600px;
  margin: auto;
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
