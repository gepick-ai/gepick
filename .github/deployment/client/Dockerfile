# 部署app
FROM nginx:stable-alpine

USER root

COPY ./apps/client/dist /usr/share/nginx/html
# COPY ./.github/deployment/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
