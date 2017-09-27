# BIOT_server
blockchain for iot security -server side

If you want to see client link : https://github.com/skawhdgjs/BIOT_client

### why make this project
IoT devices are decentralized, scalable, low power so It is hard to apply
security method which used in now. Since , centralized and demend high power
So, This project aim to make security system fit in IoT Network

### about this project
 **IoT security system base on blockchain and vpn**. This project is compose of server and client.

### feature

 - Using vpn , erease pow of blockcahin and RSA encrypt in Network. Increase effecient and performance
 - Easily update security policy via web page. just add Policy, delete Policy
 - Transaction protection using user's public key
 - All data safely store in blockchain
 
### Before start 
 
#### Install openVPN

- ubuntu


    apt-get install openvpn
    
    
- mac osx


    brew openvpn
    
	
#### Setting and start openVPN

- follow this guide

https://www.digitalocean.com/community/tutorials/how-to-set-up-an-openvpn-server-on-ubuntu-16-04

#### Install mongodb

ubuntu

    apt-get install mongodb
    
mac osx

    brew install mongodb

### Install this project


    git clone https://github.com/skawhdgjs/BIOT_server.git

### config
before you start, you modify config file

config define in **/lib/serverConfig.json**

properties     | descrption
-------- | ---
p2pPort | p2p server listening port ( client role don't care)
p2pServerUrl    | p2p server url ( server role don't care)
p2pRole | "client" or "server"
webSocket     | web page port what for command
devPort | For devcie connection, listening port
minerId | this server identifier


### start

	npm start

### More Info
refer wiki : https://github.com/skawhdgjs/BIOT_server/wiki

### contributor

Nam Jong Heon skawhdgjs@naver.com

Jong Dong won dongwonism@naver.com

Yun Na Hae pqlove0256@gmail.com

### License

MIT
