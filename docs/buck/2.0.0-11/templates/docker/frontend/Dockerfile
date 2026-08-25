# Buck 业务前端镜像模板。
ARG BRICK_NGINX_IMAGE=nginx:1.27-alpine
FROM ${BRICK_NGINX_IMAGE}

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/

EXPOSE 80
