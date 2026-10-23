FROM golang:1.25.6-alpine AS build

WORKDIR /src

COPY go.mod ./
COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /analytics .

FROM alpine

# Root CAs for TLS connections to managed Postgres (Neon).
RUN apk add --no-cache ca-certificates

COPY --from=build /analytics /analytics

EXPOSE 8080

ENTRYPOINT ["/analytics"]
