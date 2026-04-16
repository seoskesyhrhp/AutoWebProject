FROM python:3.11-slim-bookworm

# 安装 wget
# RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*


# 安装谷歌浏览器
RUN curl -O https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    dpkg -i google-chrome-stable_current_amd64.deb && \
    apt-get install -f && \
    rm google-chrome-stable_current_amd64.deb

RUN pip3 config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple/

# 复制代码
WORKDIR /app
COPY . .

# 安装Python依赖
RUN pip3 install --no-cache-dir -r requirements.txt

# 非root用户运行
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]