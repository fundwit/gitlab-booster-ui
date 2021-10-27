FROM nginx:1.19.1-alpine

COPY dist /usr/share/nginx/html
COPY nginx.default.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80

COPY docker-entrypoint.sh /

# 容器启动时使用 sed 命令将 default.conf 文件中的 {{API_ENDPOINT}} 占位符替换为对应的环境变量值
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]