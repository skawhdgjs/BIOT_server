const transaction = require('./BI_Tx')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const _ = require('lodash')
const io = require('socket.io-client')
const EventEmitter = require('events');
class Emitter extends EventEmitter {}
const emitter = new Emitter();

const config = require('./deviceConfig.json')

const val= {
   validate : 1,
   deny : 2
}

class deviceI{
  constructor(){
      const self = this



      this.devId = config.Id
      this.socket
      this.oplist = []

      self.addOp(1,1,'1')
      self.addOp(2,2,'2')

      self._initConnection()
      self._initCommandServer()
      self._initEmitter()
  }

  _initEmitter(){
     const self = this

     emitter.on('operation', function(data){
        if(data == 1){
          console.log('[device] operation valid : ' + data.txType + ' _ ' + data.trgORop)
          self.operation(data.txType, data.trgORop)
        }else{
          console.log('[device][operation deny] :' + data.txType + ' _ ' + data.trgORop )
        }
     })
  }

  operation(txType, trgORop){
      console.log('operation')
  }


  _initConnection(){
      const self = this

      self.socket = io.connect(config.server)
      self.socket.on('validateClient', function(data){
          emitter.emit('operation', data)
      })
  }

  _initCommandServer(){
    const self = this

    app.get('/', function(req, res){
       res.render('device.html', {oplist : self.oplist})
    })

    app.get('/sendTx', function(req, res){

       var data = {
         devId : self.devId,
         txType : req.query.txType,
         trgORop : req.query.trgORop,
         content : req.query.content
       }

       var newTx = new transaction(data)

       console.log('[device][createTx] _devId :' +newTx.devId + '_txType : ' + newTx.txType + '_trgORop : ' + newTx.trgORop +'_Content :' + newTx.content)

       self.socket.emit('sendTx', newTx)

       res.render('device.html', {oplist : self.oplist})
    })

    app.get('/add', function(req, res){
       console.log(req.query.txType)
       self.addOp(req.query.txType, req.query.trgORop, req.query.content)
       res.render('device.html', {oplist : self.oplist})
    })


    app.set('views', __dirname + '/../views');
    app.set('view engine', 'ejs');
    app.engine('html', require('ejs').renderFile);

    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(express.static('public'));

    app.listen(config.webSocket , function(){
      console.log('[app][device] start')
    })
  }



  addOp(txType, trgORop, content){
    const self = this


     var op = {
       txType : txType,
       trgORop : trgORop,
       content : content
     }

     self.oplist.push(op)
  }



}

module.exports = deviceI;

var device = new deviceI()
