#!/bin/bash

#grap master code 
git checkout master
git fetch origin master
#shutdown staging server
#find sql script
#	backup database
#	run sql script
#reboot server 
#./startup.sh
#run test script
#test failed
#	rollback database
#	rollback code base
#	send failed report email
#test success
#	merge into staging
git checkout staging
git merge master
git push origin staging
#	auto publish to production when config on
./deployProduction.sh
