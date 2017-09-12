var mongoose = require('mongoose');
var async = require('async')
var Block = require('./BI_Block')

//initalize ip
class blockdb {

    constructor(opt, callback){

          this.ip = 'localhost';
          this.port = 27017;


          if(opt != undefined){
            if(opt.ip != undefined)
              this.ip = opt.ip;

            if(opt.port != undefined)
              this.port = opt.port;
          }


          mongoose.connect('mongodb://localhost:27017/blockchain');

          var conn = mongoose.connection;

          conn.on('error', console.error.bind(console, 'connection error:'));
          conn.once('open', function(){

              callback(null, 'connect to block')
          })

          var blockSchema = mongoose.Schema({
              header : Object,
              innerPolicy : Array,
              outerPolicy : [{number : Number, devId : String, txType : Number, trgORop : String , action : Number}],
              Transactions: Array,
              txTrie : Object,
              _inBlockchain : Boolean
          })

          this.blockModel = mongoose.model('block', blockSchema);

    }

    setBlock(data){

          const self = this;

          var block = new this.blockModel(data)

          //console.log(block);

          block.save(function(err, block){
            if(err)
              return console.log('[mongodb][setBlock] cannot write client');

            console.log('[mongodb][setBlock] write block success,  block id: ' + block.header.Id)
            return block
          })

    }

    getBlockFromId(data ,callback){
      const self = this;

      var query = self.blockModel.findOne({ 'header.Id' : data.id});

      query.exec(function(err, block){
        if(err)
          return console.err('cannot read block')

          callback(err, block);
      })
    }


    //올림차순
    getBlockAllsorted(callback){
      const self = this;

      var query = self.blockModel.find().sort({ 'header.Id' : 1})
      var blocks_re = []

      query.exec(function(err, blocks){
        if(err)
          return console.err('cannot read blocks')

        blocks.forEach(function(block){

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

            var newBlock = new Block(data)
            //console.log(data)
            blocks_re.push(newBlock)
        })

        callback(err, blocks_re);
      })
    }

    getBlockCount(callback){
      const self = this;

      self.blockModel.count().exec(function( err, count){
        callback(err, count);
      });
    }

    deleteBlockFromindexToEnd(data, callback){
      const self = this;

      for ( var i = data.id ; i <= data.end ; ++i){
        console.log('[mongo][delete] id : ' + i)
        self.blockModel.deleteOne({ 'header.Id' : i }).exec();
       }


    }

    setBlocks(blocks, callback){
      const self = this
      async.eachSeries(blocks, function (block, done) {
        self.setBlock(block, done)
      }, callback)
    }

}
module.exports = blockdb
