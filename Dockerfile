# Build backend binary file
FROM golang:1.23.4-alpine3.21 AS be-builder
ARG RELEASE_BUILD
ARG SKIP_TESTS
ENV RELEASE_BUILD=${RELEASE_BUILD}
ENV SKIP_TESTS=${SKIP_TESTS}
WORKDIR /go/src/github.com/mayswind/ezbookkeeping
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN apk add --no-cache git gcc g++ libc-dev \
    && docker/backend-build-pre-setup.sh \
    && go get .
RUN ./build.sh backend

# Build frontend files
FROM --platform=$BUILDPLATFORM node:22.12.0-alpine3.21 AS fe-builder
ARG RELEASE_BUILD
ENV RELEASE_BUILD=${RELEASE_BUILD}
WORKDIR /go/src/github.com/mayswind/ezbookkeeping
COPY . .
RUN apk add --no-cache git \
    && docker/frontend-build-pre-setup.sh \
    && npm install
RUN ./build.sh frontend

# Package docker image
FROM alpine:3.21.0
LABEL maintainer="MaysWind <i@mayswind.net>"
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN addgroup -S -g 1000 ezbookkeeping && adduser -S -G ezbookkeeping -u 1000 ezbookkeeping \
    && apk --no-cache add tzdata \
    && chmod +x /docker-entrypoint.sh \
    && mkdir -p /ezbookkeeping/data \
    && chown -R 1000:1000 /ezbookkeeping
WORKDIR /ezbookkeeping
COPY --from=be-builder --chown=1000:1000 /go/src/github.com/mayswind/ezbookkeeping/ezbookkeeping /ezbookkeeping/ezbookkeeping
COPY --from=fe-builder --chown=1000:1000 /go/src/github.com/mayswind/ezbookkeeping/dist /ezbookkeeping/public
COPY --chown=1000:1000 conf /ezbookkeeping/conf
COPY --chown=1000:1000 templates /ezbookkeeping/templates
COPY --chown=1000:1000 LICENSE /ezbookkeeping/LICENSE
USER 1000:1000
EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
