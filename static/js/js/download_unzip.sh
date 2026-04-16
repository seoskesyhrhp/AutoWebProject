#!/bin/bash

# 指定要下载的文件的URL
file_url="https://www.yimenapp.com/doc/js/jsbridge-v$(date +%Y%m%d).zip"

# 指定下载文件的保存路径
download_dir="/tmp/"

# 指定解压后的文件保存路径
extract_dir="/usr/desktop/Webdemo/Djangodemo/music-master/static/js/js"

FILE_NAME=$(basename "$file_url")
LOCAL_FILE="$download_dir/$FILE_NAME"
# 下载文件
wget -O "$LOCAL_FILE" --no-check-certificate "$file_url" 

# 检查文件是否下载成功
if [ $? -eq 0 ]; then
    echo "文件下载成功"
else
    echo "文件下载失败"
    rm -rf "$LOCAL_FILE"
    exit 1
fi

exists="$extract_dir/jsbridge-mini.js"
echo "删除目录: $exists"
# 检查解压目录中是否已经存在相同的文件
if [ -d "$exists" ]; then
    echo "解压目录中已存在相同的文件，将删除并重新解压"
    rm -rf "$exists"
fi

# 解压文件
unzip "$LOCAL_FILE" -d "$extract_dir"

# 检查解压是否成功
if [ $? -eq 0 ]; then
    echo "文件解压成功"   
    rm -rf "$LOCAL_FILE"
else
    echo "文件解压失败"
    exit 1
fi

echo "文件下载并解压完成"
