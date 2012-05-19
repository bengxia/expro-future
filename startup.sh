AppName=ExproFutureServer.js
pkill -9 -f $AppName

cp app.js $AppName
mkdir -p log
mv log/app.log log/app`date +%Y%m%d%H%M%S`.log
node $AppName > log/app.log 2>&1 &
sleep 3
netstat -nl

