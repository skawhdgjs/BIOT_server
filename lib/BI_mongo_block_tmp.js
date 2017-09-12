var mongoose = require('mongoose');


//initalize ip
var mongodb = function(opt, callback){

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
        header : String,
        innerPolicy : Array,
        outperPolicy : Array,
        transacitons: Array
    })

    this.blockModel = mongoose.model('block', blockSchema);

  //  console.log(this.blockModel)

}

mongodb.prototype.getLaskBlock = function(data){

}

mongodb.prototype.setBlock = function(data){
/*
    const self = this;

    var block = new this.blockModel(data)

    block.save(function(err, block){
      if(err)
        return console.err('cannot write client');
    })
    */
}

mongodb.prototype.getBlockFromId = function(data, callback){
    const self = this;

    var query = self.blockModel.findOne({ 'header.id' : data.id});

    query.exec(function(err, block){
      if(err)
        return console.err('cannot read block')

        callback(err, blcok);
    })
}

mongodb.prototype.getBlockFromHV = function(data, callback){
  const self = this;

  var query = self.blockModel.findOne({ 'header.BlockHV' : data.id});

  query.exec(function(err, block){
    if(err)
      return console.err('cannot read block')

      callback(err, blcok);
  })
}

mongodb.prototype.getBlcokAllSoted = function(callback){
  const self = this;

  var query = self.blockModel.find().sort({ 'heaer.id' : -1})

  query.exec(function(err, blocks){
    if(err)
      return console.err('cannot read blocks')

    callback(err, blocks);
  })
}

mongodb.prototype.delBlockFromHV = function(data, callback){

}

module.exports = mongodb
