#!/bin/bash

sh /usr/desktop/mysqlbackup/mysqlbackup.sh
sh /usr/desktop/mysqlbackup/RunningProgram.sh
sh /usr/desktop/mysqlbackup/runpy.sh
cd /usr/desktop/Webdemo/Djangodemo/music-master/ &&python3 apps/Music/getToken.py
cd /usr/desktop/Webdemo/项目源码/ &&nohup python3 app.py 1>log.log 2>&1 &
cd /usr/desktop/Webdemo/项目源码/ &&python3 getToken.py
cd /usr/desktop/Webdemo/Djangodemo/music-master/ && python3 apps/DataElevator/conn.py
cd /usr/desktop/Webdemo/项目源码/ &&python3 setData.py
cd /usr/desktop/Webdemo/项目源码/ && python3 RequestSemiAnnualData.py

sh /root/runProject.sh
cd /usr/desktop/Webdemo/Djangodemo/music-master/ &&python3 apps/pake/getWeather.py

sh /root/runProject.sh

cd /usr/desktop/Webdemo/Djangodemo/music-master/apps/pake/ &&python3 precipitation.py

# 0 */22 * * * cd /usr/desktop/Webdemo/Djangodemo/music-master/apps/pake/ &&python3 setTokenData.py

sh /usr/desktop/mysqlbackup/check_and_run.sh

cd /usr/desktop/Webdemo/Djangodemo/music-master/ &&python3 dbUpdate.py

cd /usr/desktop/Webdemo/Djangodemo/music-master/&&python3 apps/pyth/tableTest.py

cd /usr/desktop/Webdemo/Djangodemo/music-master/&&python3 CreateTextLinkData.py

sh /usr/desktop/Webdemo/Djangodemo/music-master/static/js/js/download_unzip.sh

cd /usr/desktop/Webdemo/Djangodemo/music-master/ &&python3 apps/api/ElevatorData.py save_to_sqlite

cd /usr/desktop/Webdemo/Djangodemo/music-master/ &&python3 apps/api/ElevatorData.py get_elevator_data_json

sh /usr/desktop/Webdemo/packageBackup.sh



docker run --name mysql \
 -p 3306:3306 \
 -v /etc/localtime:/etc/localtime:ro \
 -v /etc/timezone:/etc/timezone:ro \
 -v /var/log/mysql:/var/log/mysql \
 -v /opt/mysql/mysql_data:/var/lib/mysql \
 -v /opt/mysql/mysql_file:/var/lib/mysql-files \
 -v /opt/mysql/my.cnf:/etc/mysql/my.cnf \
 -e MYSQL_ROOT_PASSWORD='Wqq@2580' \
 -e MYSQL_ALLOW_EMPTY_PASSWORD='yes' \
 -d mysql:8


cd /usr/desktop/music-master/&&nohup python3 manage.py runserver 0.0.0.0:8001 1>/usr/desktop/music-master/static/log/logout.log 2>&1 &