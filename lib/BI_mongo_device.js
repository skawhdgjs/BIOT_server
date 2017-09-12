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


    mongoose.connect('mongodb://localhost:27017/client');

    var conn = mongoose.connection;

    conn.on('error', console.error.bind(console, 'connection error:'));
    conn.once('open', function(){
        //console.log('connected')

        callback('connect')
    })

    var clientSchema = mongoose.Schema({
       clientId : 'String',
       ip : 'String',
       shk : 'String'
    })

    this.clientModel = mongoose.model('client', clientSchema);
    console.log(this.clientModel)

  //  console.log(this.clientModel)

}

/*asyn
*@param JOSN
*/
mongodb.prototype.setClient = function(data){

    const self = this;

    if(data.clientId == null || data.ip == null || data.shk == null){
      return console.err('cannot bind client')
    }


    var client = new this.clientModel(data)

    client.save(function(err, client){
      if(err)
        return console.err('cannot write client');
    })
}

/*sync
*@param JOSN
*/
mongodb.prototype.getAllclient = function(callback){
   const self = this;

   this.clientModel.find(function(err, clients){

     if(err)
       return console.err('cannot read all client');

     callback(err, clients);
   })
}


/*sync
*@param JOSN
*/
mongodb.prototype.getShkFromCI = function(data, callback){
   const self = this;

   if(data.clientId == null)
      return console.err('input clientId');

   var query = self.clientModel.findOne({clientId : data.clientId});

     query.exec(function(err, client){
       if(err)
         return console.err('cannot read client');


         callback(err, client);
     });

}


/*asyn
*@param JOSN
*/
mongodb.prototype.updateClientInfo = function(data){
   const self = this;

   self.clientModel.findOne({ clientId : data.clientId} , function(err, client){
       if(err)
         return console.err('cannot find id')

        if(data.ip != null)
          client.ip = data.ip;
        if(data.shk != null)
          client.shk = data.shk;

        client.save(function(err, client){
            if(err)
              return console.err('cannot update')
        })
   })

}

/*asyn
*@param JOSN
*/
mongodb.prototype.deleteClient = function(data){
    const self = this;

    self.clientModel.deleteOne({ clientId : data.clientId}, function(err, client){
       if(err)
        return console.err('delete id err')
    })
}

module.exports = mongodb
