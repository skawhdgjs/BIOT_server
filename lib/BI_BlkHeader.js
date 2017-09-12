const _ = require('lodash')

class BlkHeader {

  constructor(data){

    this.Id = data.id;
    this.MinerId = data.MinerId;

    this.NumOfTransaction = data.NoT;
    this.prvBlockHV = data.prvBlockHV;
    //this.BlockHV = data.BlockHV;
    this.txTrie = data.txTrie;

    if(data.time !== undefined){

      this.time = data.time
    }else
      this.time = Date.now();

  }

  setBlockHV(blockHV){
    this.BlockHV = blockHV
  }

  hash(){
    return this.BlockHV
  }

  //prvBlockHV is null
  isGenesis(){
    return this.prvBlockHV  === "0"
  }

  validate(blockchain, cb){
    //console.log("[block header]header validate")
    const self = this


    //if genesis Block no need to validate
    if(self.isGenesis()){
      return cb(null, 'genesis validate')
    }

    //find parent block
    //1. create_time check
    //2. seq_id check
    //console.log(blockchain)
    var parent;

    blockchain.forEach(function(v){
       if(v.header.BlockHV == self.prvBlockHV){
           console.log('[block header] parent find : ' + v.header.Id)
           parent = v
       }
    })


    //console.log(parent)
    if(parent === undefined){
      return cb(this.Id +': could not find parent block', null)
    }else{
      if(self.time <= parent.header.time){
        return cb(this.Id + ': invalid timestamp', null)
      }

      if(self.id <= parent.header.id){
        return cb(this.Id + ': invalid id', null)
      }

      return cb(null, 'header validate')
    }
/*
    blockchain.getBlock(self.prvBlockHV, function(err, parentBlock){
       if(err)
          return cb('could not find parent block')

       if(self.time <= parentBlock.header.time){
         return cb('invalid timestamp')
       }

       if(self.id <= parentBlock.header.id){
         return cb('invalid id')
       }

       return cb()
    })
*/
  }

}


module.exports = BlkHeader;
