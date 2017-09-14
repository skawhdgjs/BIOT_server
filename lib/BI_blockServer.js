const blockchain = require('./BI_blockchain')
const transaction = require('./BI_Tx')
const EventEmitter = require('events');
class Emitter extends EventEmitter {}
const emitter = new Emitter();
const _ = require('lodash')
const express = require('express')
const app = express()
const cron = require('node-cron')
const config = require('./serverConfig.json')

const bh = require('./BI_BlkHeader')
const inp = require('./BI_innerPolicy')
const otp = require('./BI_outerPolicy')
const Block = require('./BI_Block')

const io = require('socket.io')(config.devPort)

const server = require('http').createServer()
const p2pio = require('socket.io')(server)
const p2p = require('socket.io-p2p-server').Server

const p2pclient = require('socket.io-client')

const RSA = require('node-rsa')
const fs = require('fs')

const semaphore = require('semaphore')

let publickey
let privatekey



const TxType = {
    operation : 1,
    access : 2,
    monitor : 3,
    remove : 4
}

const actionType ={
    allow : 1,
    deny : 2
}

const catagory = {
   innerPolicy : 1,
   outerPolicy : 2
}

const pol_command = {
  add : 1,
  delete : 2
}

class BlockServer{

  constructor(){
    const self = this;


    this.MinerId = config.minerId
    this.pool = [];
    this.innerPolicy = [];
    this.outerPolicy = [];

    this.socket_ids = []
    this.socket_ips = []
    this.devConnected = 0

    this.p2p_socket_ids = []
    this.p2p_socket_ips = []
    this.connected = 0
    this.posCount = 0;

    this.eventCount = 0;
    this.bcManage = new blockchain(function(err, result){
      if(!err)
        self._initPolicy()
    });


    self._initCommandServer()
    //self._initPoolserver()
    self._initEmmiter()
    self._initHandler()

    if(config.p2pRole == 'server'){
        self._initP2Pserver()
        self._initkey()
    }else if(config.p2pRole == 'client'){
        self._initP2P()
    }else{
      console.log(new Error('[blocserver][p2p] init p2p error'))
    }

  }

  _initkey(){

    fs.readFile(__dirname+'/public.pem','utf-8', function(err ,result){
       if(err)
         console.log(new Error('publickey read fails'))

       publickey = new RSA(result)
       console.log('[blockserver][publickey] init public key complete ')
    })

    fs.readFile(__dirname+'/private.pem','utf-8', function(err ,result){
       if(err)
         console.log(new Error('private read fails'))

        privatekey= new RSA(result)
        console.log('[blockserver][privatekey] init public key complete ')
    })

  }

  _initP2P(){
    const self = this

    self.p2psocket =  p2pclient.connect(config.p2pServerUrl)



    self.p2psocket.on('connect', function(){
        console.log('[blockserver][p2p] connected : ', self.p2psocket.id)
        console.log('[blockserver][p2p] init blocks loading..')
        self.bcManage.hash_verify()
        self.p2psocket.emit('init_blocks', self.bcManage.getLastBlock().header.Id)
    })

    self.p2psocket.on('send_blocks', function(blocks){

       _.forEach(blocks, function(block){
         var data = {
            id : block.header.Id,
            time : block.header.time,
            MinerId : block.header.MinerId,
            NoT : block.header.NumberOfTransaction,
            prvBlockHV : block.header.prvBlockHV,
            BlockHV : block.header.BlockHV,
            rootTxTrie : block.header.txTrie,
            txTrie : block.txTrie,
            Transactions : block.Transactions,
            innerPolicy : block.innerPolicy,
            outerPolicy : block.outerPolicy
         }

          var tmpblock = new Block(data)
          self.bcManage.putBlock(tmpblock, function(err, result){})
       })
       console.log('[blcoserver][p2p] init blocks complete : '  + blocks.length )
    })

    //when role for validate
    self.p2psocket.on('server-msg', function(data){
       console.log('[blockserver][p2p] server-msg get')
       self.handleTx(data.data, function(err, tx_result){
          self.p2psocket.emit('valid', {data : tx_result, socketId : data.socketId})
       })
    })

    //when role for send to device
    //result =1 or 0
    self.p2psocket.on('validateComplete', function(result){
        console.log('[blockserver][p2p] validateComplete get : ' + result,result)
        io.to(result.socketId).emit('validateClient', result.result)
    })

    self.p2psocket.on('makeblockTo', function(block){
      var block = {
         id : block.header.Id,
         time : block.header.time,
         MinerId : block.header.MinerId,
         NoT : block.header.NumberOfTransaction,
         prvBlockHV : block.header.prvBlockHV,
         BlockHV : block.header.BlockHV,
         rootTxTrie : block.header.txTrie,
         txTrie : block.txTrie,
         Transactions : block.Transactions,
         innerPolicy : block.innerPolicy,
         outerPolicy : block.outerPolicy
      }

       var tmpblock = new Blokc(block)
       console.log('[blockserver][p2p] getblock : ' + tmpblock.header.Id)
       self.bcManage.putBlock(tmpblock, function(err, result){})
    })

    console.log('[blockserver] init p2pClient complete')
  }

  _initP2Pserver(){
    const self = this

    server.listen(config.p2pPort , function(){console.log('[blockserver][p2p] listening *:'+config.p2pPort)})
    p2pio.use(p2p)

    p2pio.on('connection' , function(socket){
      //make blockchain
      // 처음에 클라이언트에서 블록 몇개 있는지 보냄 -> verify 후 남은 블럭을 보냄
      self.p2p_socket_ids[self.connected] = socket.id
      self.p2p_socket_ips[self.connected] = socket.request.connection.remoteAddress

      //console.log('p2psocket' , socket)
      self.connected++
      console.log('[blockserver][p2p]connction :' + socket.id)
      self.p2psocket = socket

      //data - 마지막 블록의 header id값
      self.p2psocket.on('init_blocks', function(data){
         console.log('[blockserver][p2p] prepare send block  id ' + data)
         self.bcManage.hash_verify()
         var blocks = self.bcManage.getBlocksFoSend(data + 1)
         console.log('[blcoserver][p2p] send blocks number: ' + blocks.length)
         self.p2psocket.emit('send_blocks', blocks)
      })


      self.p2psocket.on('device-msg', function(data){
        console.log('[blockserver][p2p] device-msg get')
        self.handleTx(data.data, function(err, re_tx){
              emitter.emit('validate', {tx : re_tx, socketId : socket.id})
        })

        self.p2psocket.broadcast.emit('server-msg',data)
      })

      self.p2psocket.on('valid',function(result){
         console.log('[blockserver][p2p] from ' + socket.id + ' valid result :  ' + result.toString())
         emitter.emit('validate', {tx: result.data, socketId : result.socketId})
      })

      self.p2psocket.on('disconnect' , function(){
        _.remove(self.p2p_socket_ids, function(sokid){
           return sokid == self.p2psocket.id
        })

        _.remove(self.p2p_ocket_ips, function(sokip){
           return sokip == self.p2psocket.request.connection.remoteAddress
        })

        self.connected--
        console.log('[blokserver][p2p] disconnect : ' + socket.id)
      })
    })

    console.log('[blockserver] initP2Pserver complete')

  }

  _initHandler(){
     const self = this

      io.on('connection', (socket) => {
        self.socket_ids[self.devConnected] = socket.id
        self.socket_ips[self.devConnected] = socket.request.connection.remoteAddress
        self.devConnected++
        console.log('[blockserver] device connect : ' + socket.id + ' ip : ' + socket.request.connection.remoteAddress)

        socket.on('sendTx', function(data){
          console.log('[socket recieve] requester : ' + data.devId)

          ////////
          if(config.p2pRole == "server" && self.connected != 0){
            console.log('[blockserver][p2p] server emit server-msg')
            self.p2psocket.broadcast.emit('server-msg', {data : data, socketId : socket.id})
          }else if(config.p2pRole == "client"){
            console.log('[blockserver][p2p] client emit device-msg')
            self.p2psocket.emit('device-msg',{data : data, socketId : socket.id})
          }
          ////////

          self.handleTx(data, function(err, re_tx){
                emitter.emit('validate', {tx : re_tx, socketId : socket.id})
          })
        })


        socket.on('disconnect', function(){
          console.log('[blockserver] device disconnect : ' + socket.id)

          _.remove(self.socket_ids, function(sokid){
             return sokid == socket.id
          })

          _.remove(self.socket_ips, function(sokip){
             return sokip == socket.request.connection.remoteAddress
          })

          self.devConnected--
        })
      })

      console.log('[blockserver] initHandler compelete')
  }

  //p2p server only use

  _initEmmiter(){
    const self = this

    emitter.on('makeblock', function(block){
        if(config.p2pRole == 'server' && self.connected != 0){
          self.p2psocket.emit('makeblockTo', block)
          self.p2psocket.broadcast.emit('makeblockTo', block)
        }
    })

    //data { tx : transaction , socketId : socketId}
    emitter.on('validate', function(data){
        console.log('[blockserver][p2p][validate agreement] validate event start')
        self.eventCount++


        if(data.tx.result == actionType.allow ){
            self.posCount++;
        }else if(data.tx.result == actionType.deny){

        }

        //call end
        if(self.eventCount == self.connected || self.connected == 0){
           console.log('[blockserver][validate agreement] start: evnetCount : ' + self.eventCount + ' connected : ' + self.connected + ' posCount : ' + self.posCount)

          if(self.connected == 0 || self.posCount >= (self.connected+1)/2) {
              console.log('[blockserver][p2p][validate agreement] allow')
              data.tx.result = 1
          }else{
             console.log('[blockserver][validate agreement] deny')
             data.tx.result = 2
          }


          var targ_socket = _.find(self.socket_ids , function(sok){
              return sok == data.socketId
          })

          if(targ_socket !== undefined){
            console.log('[blockserver][validate agreement] server side : ' + JSON.stringify(data.tx))
            io.to(data.socketId).emit('validateClient', data.tx)
          }else if(self.connected != 0){
            console.log('[blockserver][validate agreement] send to client :' + JSON.stringify(data.tx) + "  socketId :  " + data.socketId)
            self.p2psocket.emit('validateComplete', {result : data.tx , socketId : data.socketId})
          }
          //init
          self.posCount = 0
          self.eventCount = 0
        }
    })

    console.log('[blockserver] initEmitter compelete')
  }

  _initPolicy(){
     const self = this
     let lastblock = self.bcManage.getLastBlock()

     if(lastblock != undefined){
     _.forEach(lastblock.innerPolicy, function(inn){
       self.innerPolicy.push(inn)
     })

     _.forEach(lastblock.outerPolicy, function(out){
       self.outerPolicy.push(out)
     })

     }
     console.log('[blockServer] initPolicy compelete')
  }


  //받는부분
  //받아서 -> parsing -> handleTx 호출
  _initCommandServer(){
    const self = this;

    app.get('/', function(req, res){
      console.log('[blockserver][command app] request path  : / ')

      var lastblock = self.bcManage.getLastBlock()
      var blockchain = self.bcManage.getBlockchain()
      //console.log(privatekey)
      res.render('index.html', {blockchain : blockchain})
    })

    app.get('/main', function(req,res){
      console.log('[blockserver][command app] request path  : /main ')

      var lastblock = self.bcManage.getLastBlock()
      var blockchain = self.bcManage.getBlockchain()
      res.render('index.html', {blockchain : blockchain})
    })

    app.get('/connected' , function(req, res){
      console.log('[blockserver][command app] request path  : /connected ')
      if(config.p2pRole == 'client')
        res.render('connected.html', {socket_ids : self.socket_ids , socket_ips : self.socket_ips})
      else if(config.p2pRole == 'server')
        res.render('connected.html', {socket_ids : self.socket_ids , socket_ips : self.socket_ips , p2p_socket_ids : self.p2p_socket_ids , p2p_socket_ips : self.p2p_socket_ips})
    })

    app.get('/controller' , function(req, res){
      console.log('[blockserver][command app] request path  : /controller ')
      res.render('controller.html')
    })

    app.get('/decrypt', function(req ,res){
      var blockchain = self.bcManage.getBlockchain()
      _.forEach(blockchain, function(blk){
         if(blk.Transactions.length !== 0){
            var decrypt = []
            _.forEach(blk.Transactions, function(tx){
               //console.log(privatekey.decrypt(tx, 'utf-8'))
               decrypt.push(privatekey.decrypt(tx, 'utf-8'))

            })
            blk.Transactions = decrypt
         }
      })
      res.render('index.html', {blockchain : blockchain})
    })

    app.get('/encrypt', function(req, res){
      var blockchain = self.bcManage.getBlockchain()
      _.forEach(blockchain, function(blk){
         if(blk.Transactions.length !== 0){
            var encryted = []
            _.forEach(blk.Transactions, function(tx){
               //console.log(publickey.encrypt(tx, 'base64'))
               encryted.push(publickey.encrypt(tx, 'base64'))
            })
            blk.Transactions = encryted
         }
      })
      res.render('index.html', {blockchain : blockchain})
    })

    app.get('/show', function(req, res){
       self.bcManage.printBlockchain()
       res.send('<h1>show</h1>')
    })

    app.get('/delete', function(req, res){
      self.bcManage.deleteBlocks(5)
    })

    app.get('/outAddPolicy', function(req, res){

        var outdata = {
            devId : req.query.devId,
            txType : Number(req.query.txType),
            trgORop : req.query.trgORop,
            action : Number(req.query.action)
          }
      self.addOuter(outdata)
          console.log('[app][command app]outAddPolicy success : ' + req.query.devId + ' ' + req.query.txType)
      res.render('controller.html')
    })

    app.get('/test_add' , function(req, res){
       var outdata = {
         devId : 'client1',
         txType : 1,
         trgORop : 1,
         action : 1
       }

       self.addOuter(outdata)
           //console.log('[app][command app]outAddPolicy success : ' + req.query.devId + ' ' + req.query.txType)
       res.render('controller.html')
    })

    app.get('/outDeletePolicy', function(req, res){

      self.deleteOuter(req.query.index)
      console.log('[app][command app] outDeletePolicy success : ' + req.query.index)
      res.render('controller.html')
    })


    app.get('/innAddPolicy', function(req, res){

         var inndata = {
            policyType : Number(req.query.policyType),
            action : Number(req.query.action)
          }
        self.addInner(inndata)
        console.log('[app][command app] innAddPolicy success : ' + req.query.policyType + ' ' + req.query.action)
        res.render('controller.html')
    })

    app.get('/innDeletePolicy', function(req, res){

      self.deleteInner(req.query.index)
        console.log('[app][command app] innDeletePolicy success : ' + req.query.index)
      res.render('controller.html')
    })

    app.get('/verify', function(req, res){
      self.bcManage.hash_verify()
      console.log('[app][command app] verify complete')
      res.render('controller.html')
    })

    app.get('/test', function(req,res){
      console.log('[app] request path  : /test ')

      var txdata1 = {
         devId : 'client1',
         txType : 1,
         trgORop : 1,
         content : 'testtx'
      }

      var tx1 = new transaction(txdata1)
      self.handleTx(tx1, function(err, result){

         if(err)
          res.send(err)

         res.send(result)

      })


    })

    app.get('/makeblock', function(req,res){
      console.log('[app] request path  : /makeblock ')

      var outdata = {
      number : 1,
      devId : 'client1',
      txType : 1,
      trgORop : 1,
      action : 1
    }

    var out1 = new otp(outdata)


    var intdata = {
        number : 1,
        policyType : 1,
        action : 1
    }

    var int1 = new inp(intdata)

    var txdata1 = {
       devId : 'client1',
       txType : 1,
       trgORop : 1,
       content : 'testtdddx'
    }

    var txdata2 = {
       devId : 'client1',
       txType : 1,
       trgORop : 2,
       content : 'testtxxcxcxxdkfjdkfjdlkfjdl'
    }

    var tx1 = new transaction(txdata1)
    var tx2 = new transaction(txdata2)

    var parentBlockHV = self.bcManage.getParentHV()
    var Id = self.bcManage.getValidId()

    var data = {
      id : Id,
      MinerId : self.MinerId,
      NoT : 2,
      prvBlockHV : parentBlockHV,
      Transactions : [tx1, tx2],
      innerPolicy : [int1],
      outerPolicy : [out1]
    }

     var newBlock = new Block(data)

     console.log('[app][/makeblock] blockinfo : '  + newBlock.header.BlockHV)

     self.bcManage.putBlock(newBlock , function(err, result){})


      res.send('<h1>header</h1>')
    })

    app.set('views', __dirname + '/../views');
    app.set('view engine', 'ejs');
    app.engine('html', require('ejs').renderFile);

    app.use(express.static(__dirname+'/../public'));

    app.listen(config.webPort, function(){
      console.log('[blockserver][app] start')
    })

    console.log('[blockServer] ininCommandserver compelete')
  }


  //transcation controller
  //Tx : transaction
  //brodcast also use handleTx
  handleTx(Tx, cb){
    const self = this;

    console.log('Tx.devId ' + Tx.devId )
    const verift_outer = self.bcManage.findOuter(Tx.devId, Number(Tx.txType), Tx.trgORop)

    //다른 blockserver에 brodcast
    //console.log(verift_outer.action + " : "+ actionType.allow)
    //tx없을때
    if(verift_outer.action == actionType.allow){
      console.log('[BlockServer][handleTx] allow')
      //결과를 포함하고 풀에 넣는다.
      _.assignIn(Tx , {result : actionType.allow})
      self.pool.push(Tx);

      //self.testhandler()

       cb(null, Tx)
    }else{
      console.log('[BlockServer][handleTx] deny')
      console.log('why reject : ' + verift_outer)
      _.assignIn(Tx , {result : actionType.deny})
      self.pool.push(Tx);

      //self.testhandler()

      cb(null, Tx)
    }
    //broadcast
    /* emit */

  }

  //가정한다
  //Txhandler 에서 boradcast 하고 그에대한 답이 왔을때의 상황
  testhandler(){
      const self = this

      emitter.emit('agreement', 'ok')
  }

  makeBlock(){
    const self = this

    console.log('[blockServer][makeBlock] make block')
    console.log('[blockServer][makeBlock] pool size : ' + self.pool.length)
    var encryptTx = [] ;
    _.forEach(self.pool, function(tx){

       var encrypted = publickey.encrypt(tx, 'base64');
       encryptTx.push(encrypted)
    })

    self.pool = []

    var parentBlockHV = self.bcManage.getParentHV()
    var Id = self.bcManage.getValidId()
    var NoT = encryptTx.length
    const inner = self.innerPolicy

    var outer = []
    _.forEach(self.outerPolicy, function(out){
      outer.push(out)
    })

    var inne = []
    _.forEach(self.innerPolicy, function(inn){
      inne.push(inn)
    })

    var data = {
       id : Id,
       MinerId : self.MinerId,
       NoT : NoT,
       prvBlockHV : parentBlockHV,
       Transactions : encryptTx,
       innerPolicy : inne,
       outerPolicy : outer
    }

    var newBlock = new Block(data)
    self.bcManage.putBlock(newBlock , function(err, result){})
    emitter.emit('makeblock',newBlock)
    console.log('[blockServer][makeBlock] compelete make block')
  }

  _initPoolserver(){
    const self = this

    if(config.p2pRole == 'server'){
      cron.schedule('*/30 * * * * *', function(){
        console.log('[blockServer][cron] make block on sechedule')
        self.makeBlock()
      });
    }else if(config.p2pRole == 'client'){
      cron.schedule('*/60 * * * * *', function(){
         console.log('[blockServer][cron] empty pool')
        self.pool = []
      });
    }


    console.log('[blockServer] initPoolServer complete')
  }

  deleteBlock(id){
      const self = this

      self.bcManage.deleteBlocks(id)
  }

  //update 하면 바로 make block 실행
  updatePolicy(cat, command, data){
      const self = this

      if(cat == catagory.innerPolicy){
          if(command == pol_command.add){
            var inner = new inp(data)
            self.innerPolicy.push(inner)
            self.makeBlock()
          }
      }else if( cat == catagory.outerPolicy){
          if(command == pol_command.add){
            var outer = new otp(data)
            self.outerPolicy.push(outer)
            self.makeBlock()
          }
      }
  }

  addOuter(data){
     const self = this
     self.bcManage.getOuterValidId(function (err, id){
       var outdata = {
          number : id,
          devId : data.devId,
          txType : data.txType,
          trgORop : data.trgORop,
          action : data.action
       }

       var outer = new otp(outdata)
       console.log('[blockserver] new outer policy : ' + JSON.stringify(outer))
       self.outerPolicy.push(outer)
       self.makeBlock()

     })
  }

  deleteOuter(number){
     const self = this
     _.remove(self.outerPolicy, function(out){
            return out.number == number
     })
     console.log('[blockserver] delete outer policy : ' + number)
     self.makeBlock()
  }


  addInner(data){
    const self = this
    self.bcManage.getInnerValidId(function (err, id){
       var inndata = {
         number : id,
         policyType : data.policyType,
         action : data.action
       }

       var inner = new inp(inndata)
       console.log('[blockserver] new inner policy : ' + JSON.stringify(inner))
       self.innerPolicy.push(inner)
       self.makeBlock()
    })
  }

  deleteInner(number){
    const self = this
    _.remove(self.innerPolicy, function(inn){
        return inn.number == number
    })
    console.log('[blockserver] delete inner policy ' + number)
    self.makeBlock()
  }

}

Blockserver = new BlockServer()
