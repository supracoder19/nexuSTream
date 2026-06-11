nexus-video-vod/
├── infrastructure/
│   └── nginx/                 # Nginx config to route /api (Spring) vs /socket (Node)
│       └── nginx.conf
├── redis/
└── services/
    ├── core-service/     # SPRING BOOT: Auth, Metadata, Postgres Writer
    │   ├── src/main/java/com/nexus/
    │   │   ├── config/        # RedisConfig, SecurityConfig, KafkaProducerConfig
    │   │   ├── controller/    # AuthController, VideoMetadataController
    │   │   ├── model/         # User, Video (status: PENDING/READY)
    │   │   └── services/
    │   └── pom.xml
    │
    ├── notification-gateway/  # NODE.JS: WebSockets (Socket.io) & Kafka Consumer
    │   ├── src/
    │   │   ├── middleware/    # auth.middleware.js (Reads Redis to check JWT if invalid sends response for refreshing)
    │   │   ├── kafka/         # consumers/ (Listens for TRANSCODING_COMPLETE and sends notifications)
    │   │   └── transcoder.js       # Express + Socket.io Server
    │   └── package.json
    │
    └── web-client/            # REACT: Frontend UI
        ├── src/
        │   ├── components/    # VideoUploader, HLSVideoPlayer (Video.js)
        │   └── pages/     


[Client] ──(1) Upload Video 
   │
(2) POST Finished
   ▼
[Spring Backend] ──(3) Send Kafka Event ──> [Kafka Broker]
                                                   │
   ┌───────────────────────────────────────────────┘
   ▼
[Act VideoProcessor(NodeJS)] ──(4) Pulls Raw, Transcodes, Pushes ──> S3
   │
(5) Sends Finished Kafka Event
   ▼
[Kafka Broker] ──> [Spring Backend] (Updates Database)