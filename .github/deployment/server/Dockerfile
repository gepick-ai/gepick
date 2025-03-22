FROM node:22.11.0

WORKDIR /gepick

COPY ./package.json .
# COPY ./yarn.lock .
COPY ./.yarn  ./.yarn
COPY ./.yarnrc.yml .

COPY ./apps/server/dist ./apps/server/dist
COPY ./apps/server/scripts ./apps/server/scripts
COPY ./apps/server/package.json ./apps/server

COPY ./tools/cli/lib ./tools/cli/lib
COPY ./tools/cli/package.json ./tools/cli
# 拷贝必备的包文件到容器中，然后安装依赖，并构建,目前有[ "auth", "copilot", "omikuji", "paypay", "pricing","shared","wallpaper", "astro", "user"]
COPY ./packages/auth/lib ./packages/auth/lib
COPY ./packages/auth/package.json ./packages/auth

COPY ./packages/copilot/lib ./packages/copilot/lib
COPY ./packages/copilot/package.json ./packages/copilot

COPY ./packages/omikuji/lib ./packages/omikuji/lib
COPY ./packages/omikuji/package.json ./packages/omikuji

COPY ./packages/paypay/lib ./packages/paypay/lib
COPY ./packages/paypay/package.json ./packages/paypay

COPY ./packages/pricing/lib ./packages/pricing/lib
COPY ./packages/pricing/package.json ./packages/pricing

COPY ./packages/shared/lib ./packages/shared/lib
COPY ./packages/shared/package.json ./packages/shared

COPY ./packages/wallpaper/lib ./packages/wallpaper/lib
COPY ./packages/wallpaper/package.json ./packages/wallpaper

COPY ./packages/astro/lib ./packages/astro/lib
COPY ./packages/astro/package.json ./packages/astro

COPY ./packages/user/lib ./packages/user/lib
COPY ./packages/user/package.json ./packages/user

RUN yarn

WORKDIR /gepick/apps/server

EXPOSE 5173

CMD ["node", "--import", "./scripts/register.js", "./dist/index.js"]
