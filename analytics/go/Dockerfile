FROM golang:1.25.6-alpine AS build

WORKDIR /src

COPY go.mod ./
COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /analytics .

FROM scratch

COPY --from=build /analytics /analytics

EXPOSE 8080

ENTRYPOINT ["/analytics"]
